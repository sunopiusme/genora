"use client";

import { useEffect, useRef } from "react";

type PixelBurstProps = {
  /** Пока true, цикл проигрывается по кругу; false очищает канвас */
  active: boolean;
  /** Фирменный цвет, подмешивается к белому как в TierDither */
  accentColor?: string;
  className?: string;
};

/* Тот же пиксельный словарь, что у эффекта в tier-dither:
   квадратные точки на фиксированной сетке */
const CELL_PITCH_X = 3;
const CELL_PITCH_Y = 4;
const DOT_SIZE = 2.25;
const BRAND_MIX = 0.38;

/* Дискретная шкала яркости — фиксированные ступени,
   без плавной интерполяции, как у сегментных индикаторов */
const BRIGHTNESS_LEVELS = 5;
const ALPHA_MIN = 0.12;
const ALPHA_SPAN = 0.62;

/* Матрица Байера 4x4 — упорядоченный дизеринг вместо случайного шума.
   Порог каждой клетки фиксирован в пределах такта, поэтому узор
   всегда собирается в одном и том же порядке, без «мушек» */
const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/* Хореография — три слоя:
   1) Ядро в центре ровно светится и дышит ступенями (дежурная лампа).
   2) Шейдерная волна: гладкий гребень рождается в центре и плавно
      расходится к границам. Дистанция измеряется суперэллипсом,
      поэтому фронт повторяет контур пилюли и достигает всех краёв
      одновременно — как ripple-шейдер, наложенный на пиксельную сетку.
   3) Мерцание-перебегание — тонкая подложка: хэш назначает каждой
      клетке личный слот, в который она гаснет или вспыхивает. */
const STEP_MS = 90;

const CORE_RADIUS_RINGS = 3.2;
const CORE_BASE = 0.42;
const CORE_PULSE = 0.1;
const CORE_PULSE_PERIOD_STEPS = 8;

/* Волна: период — время пути гребня от центра до границы;
   резкость поднимает косинус в степень, сужая гребень до чёткого
   светового фронта; хвост тянется за гребнем внутрь */
const WAVE_PERIOD_MS = 2200;
const WAVE_BOOST = 0.55;
const WAVE_SHARPNESS = 5;
/* Показатель суперэллипса: 2 — эллипс, выше — ближе к прямоугольнику
   со скруглениями, то есть к реальной форме пилюли */
const SUPERELLIPSE_POWER = 3;

const TWINKLE_PERIOD_STEPS = 9;
const TWINKLE_OFF_DROP = 0.2;
const TWINKLE_ON_BOOST = 0.16;

/* Порог включения: половина порядка Байера + половина хэша клетки */
const BAYER_SHARE = 0.5;

const TWO_PI = Math.PI * 2;

export function PixelBurst({ active, accentColor, className }: PixelBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const tint = mixWithWhite(
      parseHexColor(accentColor ?? "#ffffff"),
      accentColor ? BRAND_MIX : 0,
    );

    const columns = Math.max(1, Math.floor(width / CELL_PITCH_X));
    const rows = Math.max(1, Math.floor(height / CELL_PITCH_Y));
    const offsetX = (width - columns * CELL_PITCH_X) / 2;
    const offsetY = (height - rows * CELL_PITCH_Y) / 2;
    const centerCol = (columns - 1) / 2;
    const centerRow = (rows - 1) / 2;
    /* Вертикальный шаг сетки больше горизонтального — выравниваем
       метрику, чтобы кольца волн были геометрически круглыми */
    const rowAspect = CELL_PITCH_Y / CELL_PITCH_X;

    /* Полуоси поля в клетках — для нормировки суперэллипсной
       дистанции: 0 в центре, ровно 1 на границе пилюли */
    const halfCols = Math.max(1, centerCol);
    const halfRows = Math.max(1, centerRow * rowAspect);

    let frameId = 0;
    let startTimeMs = -1;

    function drawFrame(elapsedMs: number) {
      if (!context) {
        return;
      }
      context.clearRect(0, 0, width, height);

      const step = Math.floor(elapsedMs / STEP_MS);
      /* Непрерывное время волны: гладкий ход гребня, как в шейдере */
      const waveTime = elapsedMs / WAVE_PERIOD_MS;

      /* Ядро дышит ступенями: два уровня, как контрольная лампа */
      const corePulse =
        Math.floor(step / CORE_PULSE_PERIOD_STEPS) % 2 === 0 ? 0 : CORE_PULSE;
      const coreEnergy = CORE_BASE + corePulse;

      for (let col = 0; col < columns; col++) {
        for (let row = 0; row < rows; row++) {
          let energy = 0;

          /* --- Слой 1: дежурное ядро с плавным спадом --- */
          const coreDistance = Math.hypot(
            col - centerCol,
            (row - centerRow) * rowAspect,
          );
          if (coreDistance < CORE_RADIUS_RINGS + 1.5) {
            const falloff = Math.max(
              0,
              1 - coreDistance / (CORE_RADIUS_RINGS + 1),
            );
            energy += falloff ** 1.4 * coreEnergy;
          }

          /* --- Слой 2: шейдерная волна из центра. Дистанция —
             суперэллипс, повторяющий контур пилюли: фронт рождается
             в центре и одновременно достигает всех границ кнопки.
             Профиль гребня — приподнятый косинус в степени:
             узкий яркий фронт с плавным хвостом позади --- */
          const nx = Math.abs(col - centerCol) / halfCols;
          const ny = Math.abs((row - centerRow) * rowAspect) / halfRows;
          const shapeDistance =
            (nx ** SUPERELLIPSE_POWER + ny ** SUPERELLIPSE_POWER) **
            (1 / SUPERELLIPSE_POWER);
          const wavePhase = shapeDistance - waveTime;
          const cyclePhase = wavePhase - Math.floor(wavePhase);
          const crest = ((Math.cos(TWO_PI * cyclePhase) + 1) / 2) **
            WAVE_SHARPNESS;
          /* Лёгкое затухание к границе — энергия волны рассеивается */
          const attenuation = 1 - 0.35 * Math.min(1, shapeDistance);
          energy += WAVE_BOOST * crest * attenuation;

          /* --- Слой 3: мерцание-перебегание. Личный слот клетки:
             в слот «выкл» проседает, в противофазе — вспыхивает.
             За такт мигает ~1/9 поля, рассеянная по хэшу --- */
          const hash = cellHash(col, row);
          const slot =
            (step + (hash % TWINKLE_PERIOD_STEPS)) % TWINKLE_PERIOD_STEPS;
          if (slot === 0) {
            energy -= TWINKLE_OFF_DROP;
          } else if (slot === Math.floor(TWINKLE_PERIOD_STEPS / 2)) {
            energy += TWINKLE_ON_BOOST;
          }

          if (energy <= 0) {
            continue;
          }

          /* Порог — смесь порядка Байера и хэша клетки: россыпь
             выглядит органично, но каждый порог фиксирован навсегда */
          const bayer = (BAYER_4[row % 4][col % 4] + 0.5) / 16;
          const jitter = ((hash >>> 8) & 0xffff) / 0x10000;
          const threshold = bayer * BAYER_SHARE + jitter * (1 - BAYER_SHARE);
          if (energy <= threshold) {
            continue;
          }

          /* Ступенчатая яркость по порядку включения */
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

    function loop(timeMs: number) {
      if (startTimeMs < 0) {
        startTimeMs = timeMs;
      }
      drawFrame(timeMs - startTimeMs);
      frameId = requestAnimationFrame(loop);
    }

    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
      context.clearRect(0, 0, width, height);
    };
  }, [active, accentColor]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
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
