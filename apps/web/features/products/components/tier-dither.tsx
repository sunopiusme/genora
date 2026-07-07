"use client";

import { useEffect, useRef } from "react";
import styles from "./tier-slider.module.css";

type TierDitherProps = {
  isActive: boolean;
  brandColor: string;
};

/* Геометрия точечной сетки */
const CELL_PITCH_X = 3;
const CELL_PITCH_Y = 4;
const DOT_SIZE = 2.25;
const QUIET_LEFT_RATIO = 0.25;
const BRAND_MIX = 0.38;

/* Дискретная шкала яркости — как у сегментных индикаторов:
   никакой плавной интерполяции, только фиксированные ступени */
const BRIGHTNESS_LEVELS = 5;
const ALPHA_MIN = 0.14;
const ALPHA_SPAN = 0.7;

/* Матрица Байера 4x4 — упорядоченный дизеринг вместо случайного шума.
   Каждая клетка имеет фиксированный порог включения, поэтому поле
   всегда собирается в один и тот же регулярный узор без «мушек» */
const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/* Проявление: каретка пишет поле справа налево, колонка за колонкой */
const REVEAL_STEP_MS = 12;
const REVEAL_PEN_CELLS = 6;
const REVEAL_PEN_BOOST = 0.4;

/* Два слоя движения:
   1) Шейдерная волна: гладкий гребень рождается в центре активной
      зоны и плавно расходится к границам полосы. Дистанция мерится
      суперэллипсом, поэтому фронт повторяет форму поля и достигает
      всех краёв одновременно — как ripple-шейдер на пиксельной сетке.
   2) Мерцание-перебегание — тонкая подложка: каждой клетке хэш
      назначает личный слот, в который она гаснет или вспыхивает.
      Выглядит случайно, но полностью детерминировано. */
const STEP_MS = 90;
const WAVE_PERIOD_MS = 2200;
const WAVE_BOOST = 0.5;
const WAVE_SHARPNESS = 5;
const SUPERELLIPSE_POWER = 3;

const TWINKLE_PERIOD_STEPS = 9;
const TWINKLE_OFF_DROP = 0.22;
const TWINKLE_ON_BOOST = 0.18;

/* Волна-эхо: отражённый от границ фронт бежит обратно к центру,
   интерферируя с прямой волной */
const ECHO_BOOST = 0.26;
const ECHO_SHARPNESS = 6;

/* Фосфорное послесвечение: клетка гаснет ступенями, как люминофор
   ЭЛТ — за гребнем тянется угасающий след */
const PHOSPHOR_DECAY = 0.86;
const PHOSPHOR_FLOOR = 0.06;

/* Bloom: самые яркие клетки получают мягкий ореол вокруг точки */
const HALO_SPREAD = 5;
const HALO_ALPHA = 0.1;

/* Порог включения: половина порядка Байера + половина хэша клетки —
   узор органичный, как россыпь, но пространственно ровный */
const BAYER_SHARE = 0.5;

/* Плавный запуск: волновое поле разгорается smoothstep-конвертом
   после проявления, эхо подключается лишь после первого касания
   границы первой волной */
const INTRO_MS = 1200;
const ECHO_RAMP_WAVES = 0.6;

const TWO_PI = Math.PI * 2;

/* Классический smoothstep: плавные производные на обоих концах */
function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

export function TierDither({ isActive, brandColor }: TierDitherProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const tint = mixWithWhite(parseHexColor(brandColor), BRAND_MIX);

    let frameId = 0;
    let cssWidth = 0;
    let cssHeight = 0;

    /* Буфер люминофора: яркость клеток между кадрами.
       Пересоздаётся лениво при изменении размеров сетки */
    let phosphor = new Float32Array(0);

    function syncCanvasSize() {
      if (!canvas) {
        return;
      }
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      const dpr = window.devicePixelRatio || 1;
      const nextWidth = Math.max(1, Math.round(width * dpr));
      const nextHeight = Math.max(1, Math.round(height * dpr));
      cssWidth = width;
      cssHeight = height;
      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
      }
      context?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawFrame(timeMs: number, staticMode: boolean) {
      if (!context || cssWidth === 0 || cssHeight === 0) {
        return;
      }
      context.clearRect(0, 0, cssWidth, cssHeight);

      const columns = Math.max(1, Math.floor(cssWidth / CELL_PITCH_X));
      const rows = Math.max(1, Math.floor(cssHeight / CELL_PITCH_Y));
      const offsetX = (cssWidth - columns * CELL_PITCH_X) / 2;
      const offsetY = (cssHeight - rows * CELL_PITCH_Y) / 2;
      const quietCols = Math.floor(columns * QUIET_LEFT_RATIO);

      if (phosphor.length !== columns * rows) {
        phosphor = new Float32Array(columns * rows);
      }

      /* --- Фаза 1: проявление. Каретка идёт справа налево,
         открывая по колонке за шаг — как самописец --- */
      const revealSteps = columns - quietCols;
      const revealStep = staticMode
        ? revealSteps
        : Math.min(revealSteps, Math.floor(timeMs / REVEAL_STEP_MS));
      const revealFrontCol = columns - revealStep;
      const isRevealing = revealStep < revealSteps;

      /* --- Фаза 2: волновое поле. Мерцание идёт по шаговому такту,
         гребень волны — по непрерывному времени, как в шейдере.
         Отсчёт волны начинается после проявления поля --- */
      const revealDoneMs = revealSteps * REVEAL_STEP_MS;
      const waveClockMs = Math.max(0, timeMs - revealDoneMs);
      const step = staticMode ? 0 : Math.floor(timeMs / STEP_MS);
      const waveTime = staticMode ? 0 : waveClockMs / WAVE_PERIOD_MS;
      const intro = staticMode ? 0 : smoothstep(waveClockMs / INTRO_MS);
      const echoGain = staticMode
        ? 0
        : smoothstep((waveTime - 1) / ECHO_RAMP_WAVES);

      /* Центр и полуоси активной зоны — для нормировки суперэллипсной
         дистанции: 0 в центре поля, ровно 1 на его границах */
      const rowAspect = CELL_PITCH_Y / CELL_PITCH_X;
      const centerCol = quietCols + (columns - 1 - quietCols) / 2;
      const centerRow = (rows - 1) / 2;
      const halfCols = Math.max(1, (columns - 1 - quietCols) / 2);
      const halfRows = Math.max(1, centerRow * rowAspect);

      for (let col = 0; col < columns; col++) {
        if (col < revealFrontCol) {
          continue;
        }
        const xRatio = col / Math.max(1, columns - 1);
        const density = densityProfile(xRatio);
        if (density <= 0) {
          continue;
        }
        const presence = Math.min(1, density / 0.12);

        let penBoost = 0;
        if (isRevealing) {
          const penDistance = col - revealFrontCol;
          if (penDistance >= 0 && penDistance < REVEAL_PEN_CELLS) {
            penBoost = REVEAL_PEN_BOOST * (1 - penDistance / REVEAL_PEN_CELLS);
          }
        }

        for (let row = 0; row < rows; row++) {
          /* Шейдерная волна из центра активной зоны: суперэллипсная
             дистанция повторяет форму поля, гребень — приподнятый
             косинус в степени: узкий яркий фронт с плавным хвостом */
          let waveBoost = 0;
          if (!staticMode) {
            const nx = Math.abs(col - centerCol) / halfCols;
            const ny = Math.abs((row - centerRow) * rowAspect) / halfRows;
            const shapeDistance =
              (nx ** SUPERELLIPSE_POWER + ny ** SUPERELLIPSE_POWER) **
              (1 / SUPERELLIPSE_POWER);
            /* Причинность: волна существует только там, куда уже
               дошла — до клетки на дистанции d первый гребень
               добирается в момент waveTime = d */
            const attenuation = 1 - 0.35 * Math.min(1, shapeDistance);
            if (waveTime >= shapeDistance) {
              const wavePhase = shapeDistance - waveTime;
              const cyclePhase = wavePhase - Math.floor(wavePhase);
              const crest = ((Math.cos(TWO_PI * cyclePhase) + 1) / 2) **
                WAVE_SHARPNESS;
              waveBoost = WAVE_BOOST * crest * attenuation;
            }

            /* Эхо: отражённый фронт бежит обратно к центру, появляясь
               лишь после первого касания границы прямой волной */
            if (echoGain > 0) {
              const echoPhase = shapeDistance + waveTime;
              const echoCycle = echoPhase - Math.floor(echoPhase);
              const echoCrest = ((Math.cos(TWO_PI * echoCycle) + 1) / 2) **
                ECHO_SHARPNESS;
              waveBoost += ECHO_BOOST * echoGain * echoCrest * attenuation;
            }
          }

          /* Мерцание-перебегание: личный слот клетки внутри цикла.
             В слот «выкл» клетка проседает, в противофазе — вспыхивает.
             Рассеяние по хэшу равномерное: за такт мигает ~1/9 поля */
          const hash = cellHash(col, row);
          let twinkleBoost = 0;
          if (!staticMode) {
            const slot =
              (step + (hash % TWINKLE_PERIOD_STEPS)) % TWINKLE_PERIOD_STEPS;
            if (slot === 0) {
              twinkleBoost = -TWINKLE_OFF_DROP * intro;
            } else if (slot === Math.floor(TWINKLE_PERIOD_STEPS / 2)) {
              twinkleBoost = TWINKLE_ON_BOOST * intro;
            }
          }

          const energy =
            density + (waveBoost + twinkleBoost + penBoost) * presence;

          /* Порог — смесь порядка Байера и хэша клетки: россыпь
             выглядит органично, но каждый порог фиксирован навсегда */
          const bayer = (BAYER_4[row % 4][col % 4] + 0.5) / 16;
          const jitter = ((hash >>> 8) & 0xffff) / 0x10000;
          const threshold = bayer * BAYER_SHARE + jitter * (1 - BAYER_SHARE);

          /* Мгновенная яркость клет��и в этом кадре */
          let intensity = 0;
          if (energy > threshold) {
            const overshoot = Math.min(1, (energy - threshold) / 0.5);
            intensity =
              Math.max(1, Math.ceil(overshoot * BRIGHTNESS_LEVELS)) /
              BRIGHTNESS_LEVELS;
          }

          /* Фосфор: свежая яркость зажигает люминофор, старая гаснет
             экспоненциально — за фронтом остаётся угасающий след */
          const cellIndex = col * rows + row;
          const remembered = phosphor[cellIndex] * PHOSPHOR_DECAY;
          const lit = staticMode ? intensity : Math.max(intensity, remembered);
          phosphor[cellIndex] = lit;
          if (lit < PHOSPHOR_FLOOR) {
            continue;
          }

          /* Квантуем итог в ступени — послесвечение тоже дискретное */
          const level = Math.max(1, Math.round(lit * BRIGHTNESS_LEVELS));
          const alpha = ALPHA_MIN + (level / BRIGHTNESS_LEVELS) * ALPHA_SPAN;

          const dotX =
            offsetX + col * CELL_PITCH_X + (CELL_PITCH_X - DOT_SIZE) / 2;
          const dotY =
            offsetY + row * CELL_PITCH_Y + (CELL_PITCH_Y - DOT_SIZE) / 2;

          /* Bloom: максимально яркие клетки светятся ореолом */
          if (level >= BRIGHTNESS_LEVELS) {
            context.fillStyle = `rgb(${tint.r} ${tint.g} ${tint.b} / ${HALO_ALPHA})`;
            context.fillRect(
              dotX - (HALO_SPREAD - DOT_SIZE) / 2,
              dotY - (HALO_SPREAD - DOT_SIZE) / 2,
              HALO_SPREAD,
              HALO_SPREAD,
            );
          }

          context.fillStyle = `rgb(${tint.r} ${tint.g} ${tint.b} / ${alpha.toFixed(3)})`;
          context.fillRect(dotX, dotY, DOT_SIZE, DOT_SIZE);
        }
      }
    }

    let startTimeMs = -1;

    function loop(timeMs: number) {
      if (startTimeMs < 0) {
        startTimeMs = timeMs;
      }
      drawFrame(timeMs - startTimeMs, false);
      frameId = requestAnimationFrame(loop);
    }

    let resizeFrameId = 0;
    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrameId);
      resizeFrameId = requestAnimationFrame(() => {
        syncCanvasSize();
        if (isActive && reducedMotion.matches) {
          drawFrame(0, true);
        }
      });
    });
    resizeObserver.observe(canvas);
    syncCanvasSize();

    if (isActive) {
      if (reducedMotion.matches) {
        drawFrame(0, true);
      } else {
        frameId = requestAnimationFrame(loop);
      }
    } else {
      context.clearRect(0, 0, cssWidth, cssHeight);
    }

    return () => {
      cancelAnimationFrame(frameId);
      cancelAnimationFrame(resizeFrameId);
      resizeObserver.disconnect();
    };
  }, [isActive, brandColor]);

  return (
    <canvas ref={canvasRef} className={styles.tierDither} aria-hidden="true" />
  );
}

function densityProfile(xRatio: number): number {
  if (xRatio < QUIET_LEFT_RATIO) {
    return 0;
  }
  if (xRatio < 0.45) {
    const t = (xRatio - QUIET_LEFT_RATIO) / (0.45 - QUIET_LEFT_RATIO);
    return t * t * 0.3;
  }
  if (xRatio < 0.72) {
    return 0.3 + ((xRatio - 0.45) / 0.27) * 0.32;
  }
  if (xRatio < 0.92) {
    return 0.62 - ((xRatio - 0.72) / 0.2) * 0.4;
  }
  return 0.22 * (1 - (xRatio - 0.92) / 0.08);
}

/* Целочисленный хэш клетки: стабилен между кадрами, поэтому мерцание
   детерминировано — никаких «мушек», у каждой клетки свой характер */
function cellHash(col: number, row: number): number {
  let h = (col * 374761393 + row * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

type Rgb = { r: number; g: number; b: number };

function parseHexColor(hex: string): Rgb {
  const normalized = hex.trim().replace("#", "");
  if (normalized.length === 3) {
    return {
      r: Number.parseInt(normalized.charAt(0).repeat(2), 16),
      g: Number.parseInt(normalized.charAt(1).repeat(2), 16),
      b: Number.parseInt(normalized.charAt(2).repeat(2), 16),
    };
  }
  if (normalized.length === 6) {
    return {
      r: Number.parseInt(normalized.slice(0, 2), 16),
      g: Number.parseInt(normalized.slice(2, 4), 16),
      b: Number.parseInt(normalized.slice(4, 6), 16),
    };
  }
  return { r: 255, g: 255, b: 255 };
}

function mixWithWhite(color: Rgb, brandShare: number): Rgb {
  return {
    r: Math.round(color.r * brandShare + 255 * (1 - brandShare)),
    g: Math.round(color.g * brandShare + 255 * (1 - brandShare)),
    b: Math.round(color.b * brandShare + 255 * (1 - brandShare)),
  };
}
