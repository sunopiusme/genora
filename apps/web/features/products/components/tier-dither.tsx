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
   1) Тихая подложка — широкие кольца от центра и углов. Усиление
      малое, фронт размыт: волны лишь «дышат» плотностью, не рисуя
      полос — их видно как медленное перекатывание яркости.
   2) Мерцание-перебегание — каждой клетке хэш назначает личный слот
      внутри цикла тактов: в свой слот клетка гаснет, в противофазе —
      вспыхивает. За такт «перебегает» лишь доля клеток, рассеянных
      по полю. Выглядит случайно, но полностью детерминировано. */
const STEP_MS = 90;
const WAVELENGTH_RINGS = 20;
const FRONT_RINGS = 8;
const CENTER_WAVE_BOOST = 0.2;
const CORNER_WAVE_BOOST = 0.13;

const TWINKLE_PERIOD_STEPS = 9;
const TWINKLE_OFF_DROP = 0.3;
const TWINKLE_ON_BOOST = 0.24;

/* Порог включения: половина порядка Байера + половина хэша клетки —
   узор органичный, как россыпь, но пространственно ровный */
const BAYER_SHARE = 0.5;

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

      /* --- Фаза 1: проявление. Каретка идёт справа налево,
         открывая по колонке за шаг — как самописец --- */
      const revealSteps = columns - quietCols;
      const revealStep = staticMode
        ? revealSteps
        : Math.min(revealSteps, Math.floor(timeMs / REVEAL_STEP_MS));
      const revealFrontCol = columns - revealStep;
      const isRevealing = revealStep < revealSteps;

      /* --- Фаза 2: непрерывное волновое поле на шаговом такте --- */
      const step = staticMode ? 0 : Math.floor(timeMs / STEP_MS);

      /* Источники волн: центр активной зоны и четыре угла полосы.
         Метрика выровнена по шагу сетки, чтобы кольца были круглыми */
      const rowAspect = CELL_PITCH_Y / CELL_PITCH_X;
      const centerCol = quietCols + (columns - 1 - quietCols) / 2;
      const centerRow = (rows - 1) / 2;
      const sources = [
        { col: centerCol, row: centerRow, boost: CENTER_WAVE_BOOST, phase: 0 },
        {
          col: quietCols,
          row: 0,
          boost: CORNER_WAVE_BOOST,
          phase: WAVELENGTH_RINGS / 2,
        },
        {
          col: columns - 1,
          row: 0,
          boost: CORNER_WAVE_BOOST,
          phase: WAVELENGTH_RINGS / 2,
        },
        {
          col: quietCols,
          row: rows - 1,
          boost: CORNER_WAVE_BOOST,
          phase: WAVELENGTH_RINGS / 2,
        },
        {
          col: columns - 1,
          row: rows - 1,
          boost: CORNER_WAVE_BOOST,
          phase: WAVELENGTH_RINGS / 2,
        },
      ];

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
          /* Тихая подложка: широкие кольцевые фронты от источников,
             уходящие наружу на одно кольцо за такт */
          let waveBoost = 0;
          if (!staticMode) {
            for (const source of sources) {
              const ring = Math.round(
                Math.hypot(col - source.col, (row - source.row) * rowAspect),
              );
              const phase =
                (((ring - step + source.phase) % WAVELENGTH_RINGS) +
                  WAVELENGTH_RINGS) %
                WAVELENGTH_RINGS;
              if (phase < FRONT_RINGS) {
                const strength = 1 - phase / FRONT_RINGS;
                waveBoost += source.boost * strength * strength;
              }
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
              twinkleBoost = -TWINKLE_OFF_DROP;
            } else if (slot === Math.floor(TWINKLE_PERIOD_STEPS / 2)) {
              twinkleBoost = TWINKLE_ON_BOOST;
            }
          }

          const energy =
            density + (waveBoost + twinkleBoost + penBoost) * presence;

          /* Порог — смесь порядка Байера и хэша клетки: россыпь
             выглядит органично, но каждый порог фиксирован навсегда */
          const bayer = (BAYER_4[row % 4][col % 4] + 0.5) / 16;
          const jitter = ((hash >>> 8) & 0xffff) / 0x10000;
          const threshold = bayer * BAYER_SHARE + jitter * (1 - BAYER_SHARE);
          if (energy <= threshold) {
            continue;
          }

          /* Яркость ступенчатая: чем раньше клетка включилась
             по порядку Байера, тем выше её уровень */
          const overshoot = Math.min(1, (energy - threshold) / 0.5);
          const level = Math.max(1, Math.ceil(overshoot * BRIGHTNESS_LEVELS));
          const alpha = ALPHA_MIN + (level / BRIGHTNESS_LEVELS) * ALPHA_SPAN;

          context.fillStyle = `rgb(${tint.r} ${tint.g} ${tint.b} / ${alpha.toFixed(3)})`;
          context.fillRect(
            offsetX + col * CELL_PITCH_X + (CELL_PITCH_X - DOT_SIZE) / 2,
            offsetY + row * CELL_PITCH_Y + (CELL_PITCH_Y - DOT_SIZE) / 2,
            DOT_SIZE,
            DOT_SIZE,
          );
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
