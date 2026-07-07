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
   Порог каждой клетки фиксирован, поэтому узор всегда собирается
   одинаково и никакие точки не «летают» по полю */
const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/* Хореография — единая причинная цепочка на дискретном шаговом отсчёте:
   1. Ядро в центре накапливает заряд, разгораясь ступень за ступенью.
   2. На пике из ядра рождается волна и расходится радиально —
      ровно одно кольцо за один шаг, как развёртка радара.
   3. Ядро отдаёт энергию и возвращается к дежурному уровню.
   4. Покой: ядро ровно светится с редким синхронным миганием. */
const STEP_MS = 55;
const CORE_RADIUS_RINGS = 3.2;
const CHARGE_STEPS = 10;
const WAVE_FRONT_RINGS = 5;
const WAVE_BOOST = 0.85;
const REST_STEPS = 22;
const IDLE_BLINK_PERIOD_STEPS = 8;
const CORE_BASE = 0.5;
const CORE_CHARGE_GAIN = 0.5;

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
       метрику, чтобы ядро и кольца волны были геометрически круглыми */
    const rowAspect = CELL_PITCH_Y / CELL_PITCH_X;
    const maxRing = Math.ceil(Math.hypot(centerCol, centerRow * rowAspect));

    /* Полный цикл в шагах: заряд -> развёртка -> покой */
    const waveSteps = maxRing + WAVE_FRONT_RINGS;
    const cycleSteps = CHARGE_STEPS + waveSteps + REST_STEPS;

    let frameId = 0;
    let startTimeMs = -1;

    function drawFrame(elapsedMs: number) {
      if (!context) {
        return;
      }
      context.clearRect(0, 0, width, height);

      const stepIndex = Math.floor(elapsedMs / STEP_MS) % cycleSteps;

      /* Фаза заряда: ядро набирает уровень ступень за ступенью */
      let coreEnergy = CORE_BASE;
      let frontRing = -1;
      if (stepIndex < CHARGE_STEPS) {
        coreEnergy = CORE_BASE + CORE_CHARGE_GAIN * (stepIndex / CHARGE_STEPS);
      } else if (stepIndex < CHARGE_STEPS + waveSteps) {
        /* Фаза развёртки: фронт уходит от ядра на одно кольцо за шаг,
           ядро отдаёт заряд первые несколько шагов */
        const waveStep = stepIndex - CHARGE_STEPS;
        frontRing = waveStep;
        coreEnergy =
          CORE_BASE +
          Math.max(0, CORE_CHARGE_GAIN * (1 - waveStep / WAVE_FRONT_RINGS));
      } else {
        /* Покой: дежурный уровень с редким синхронным миганием —
           как контрольная лампа на пульте */
        const restStep = stepIndex - CHARGE_STEPS - waveSteps;
        const blink =
          Math.floor(restStep / IDLE_BLINK_PERIOD_STEPS) % 2 === 0 ? 0 : 0.08;
        coreEnergy = CORE_BASE + blink;
      }

      for (let col = 0; col < columns; col++) {
        for (let row = 0; row < rows; row++) {
          /* Радиальная дистанция от ядра в выровненной метрике */
          const distance = Math.hypot(
            col - centerCol,
            (row - centerRow) * rowAspect,
          );

          /* --- Слой 1: ядро с плавным спадом к границе --- */
          let energy = 0;
          if (distance < CORE_RADIUS_RINGS + 1.5) {
            const falloff = Math.max(
              0,
              1 - distance / (CORE_RADIUS_RINGS + 1),
            );
            energy = falloff ** 1.4 * coreEnergy;
          }

          /* --- Слой 2: радиальная волна. Кольцо дистанции квантовано,
             фронт и хвост считаются в целых кольцах — по всей
             окружности волна синхронна, без случайного дрожания --- */
          if (frontRing >= 0) {
            const ring = Math.round(distance);
            const behind = frontRing - ring;
            if (behind >= 0 && behind < WAVE_FRONT_RINGS) {
              const strength = 1 - behind / WAVE_FRONT_RINGS;
              energy += WAVE_BOOST * strength * strength;
            }
          }

          if (energy <= 0) {
            continue;
          }

          /* Фиксированный порог Байера: клетки внутри кольца
             включаются всегда в одном и том же порядке */
          const threshold = (BAYER_4[row % 4][col % 4] + 0.5) / 16;
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
