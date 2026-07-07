"use client";

import { useEffect, useRef } from "react";

type PixelBurstProps = {
  /** Пока true, волна проигрывается по кругу; false очищает канвас */
  active: boolean;
  /** Фирменный цвет, подмешивается к белому как в TierDither */
  accentColor?: string;
  className?: string;
};

/* Тот же пиксельный словарь, что у эффекта в tier-dither:
   квадратные точки на фиксированной сетке с hash-порогами */
const CELL_PITCH_X = 3;
const CELL_PITCH_Y = 4;
const DOT_SIZE = 2.25;
const BRIGHTNESS_LEVELS = 4;
const BRAND_MIX = 0.38;

/* Хореография «пульс из ядра» — единая причинная цепочка:
   1. Ядро в центре постоянно дышит (медленный вдох-выдох).
   2. Перед выбросом ядро накапливает энергию и разгорается.
   3. На пике волна рождается ИЗ ядра и радиально расходится к краям.
   4. Искатели — разведчики на периферии: тем тише, чем дальше от ядра,
      внутри каждого свет обходит квадрат по периметру. */
const CORE_RADIUS_CELLS = 3.2;
const BREATH_MS = 2600;

const CHARGE_MS = 700;
const WAVE_MS = 1000;
const REST_MS = 1500;
const CYCLE_MS = CHARGE_MS + WAVE_MS + REST_MS;

const SEEKER_WINDOW_MS = 1300;
const SEEKER_SHARE = 0.12;
const ORBIT_MS = 1600;
const ORBIT_RADIUS = 0.75;

const FRONT_CELLS = 6;
const JITTER_CELLS = 3;
const FADE_TAIL = 0.5;

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
       метрику, чтобы ядро и волна были геометрически круглыми */
    const rowAspect = CELL_PITCH_Y / CELL_PITCH_X;
    const halfSpan =
      Math.hypot(centerCol, centerRow * rowAspect) +
      FRONT_CELLS +
      JITTER_CELLS;

    let frameId = 0;
    let startTimeMs = -1;

    function drawFrame(elapsedMs: number) {
      if (!context) {
        return;
      }
      context.clearRect(0, 0, width, height);

      /* Фазы цикла: накопление -> выброс волны -> покой */
      const cycleMs = elapsedMs % CYCLE_MS;
      const chargeProgress =
        cycleMs < CHARGE_MS ? cycleMs / CHARGE_MS : -1;
      const waveProgress =
        cycleMs >= CHARGE_MS && cycleMs < CHARGE_MS + WAVE_MS
          ? (cycleMs - CHARGE_MS) / WAVE_MS
          : -1;

      /* Медленное дыхание ядра; при накоплении оно разгорается,
         в момент выброса резко отдаёт энергию и затем восстанавливается */
      const breath =
        0.5 + 0.5 * Math.sin((elapsedMs / BREATH_MS) * Math.PI * 2);
      let coreEnergy = 0.45 + 0.2 * breath;
      if (chargeProgress >= 0) {
        coreEnergy += chargeProgress ** 1.6 * 0.55;
      } else if (waveProgress >= 0) {
        coreEnergy += Math.max(0, 0.55 * (1 - waveProgress * 3));
      }

      const eased =
        waveProgress >= 0 ? 1 - (1 - waveProgress) ** 2.6 : 0;
      const frontDistance = eased * halfSpan;
      const waveFade =
        waveProgress > 1 - FADE_TAIL
          ? 1 - (waveProgress - (1 - FADE_TAIL)) / FADE_TAIL
          : 1;

      const seekerSlice = Math.floor(elapsedMs / SEEKER_WINDOW_MS);
      const seekerPhase =
        (elapsedMs % SEEKER_WINDOW_MS) / SEEKER_WINDOW_MS;

      for (let col = 0; col < columns; col++) {
        for (let row = 0; row < rows; row++) {
          /* Радиальная дистанция от ядра в выровненной метрике */
          const distance = Math.hypot(
            col - centerCol,
            (row - centerRow) * rowAspect,
          );

          /* --- Слой 1: дышащее ядро --- */
          let coreAlpha = 0;
          if (distance < CORE_RADIUS_CELLS + 1.5) {
            const falloff = Math.max(
              0,
              1 - distance / (CORE_RADIUS_CELLS + coreEnergy),
            );
            /* Лёгкое мерцание внутри ядра, чтобы оно жило */
            const shimmer =
              0.75 +
              0.25 *
                Math.sin(
                  elapsedMs / 320 + cellHash(col, row) * Math.PI * 2,
                );
            coreAlpha = falloff ** 1.6 * coreEnergy * shimmer * 0.7;
          }

          /* --- Слой 2: искатели на периферии, тише вдали от ядра --- */
          let seekerAlpha = 0;
          let orbitX = 0;
          let orbitY = 0;
          const pick = cellHash(col * 29 + seekerSlice * 3, row * 23 + 5);
          if (pick > 1 - SEEKER_SHARE && distance > CORE_RADIUS_CELLS) {
            const envelope = Math.sin(Math.PI * seekerPhase);
            /* Иерархия: чем дальше разведчик от ядра, тем он тише */
            const hierarchy = Math.max(0.25, 1 - distance / halfSpan);
            seekerAlpha =
              envelope *
              hierarchy *
              (0.08 + 0.18 * cellHash(col + 5, row + 9));

            /* Свет обходит квадрат по периметру внутри ячейки */
            const spin = cellHash(col * 7, row * 3) > 0.5 ? 1 : -1;
            const orbit =
              (((elapsedMs / ORBIT_MS) * spin + cellHash(col, row * 11)) %
                1 +
                1) %
              1;
            const segment = Math.floor(orbit * 4);
            const along = orbit * 4 - segment;
            const r = ORBIT_RADIUS * envelope;
            if (segment === 0) {
              orbitX = -r + along * 2 * r;
              orbitY = -r;
            } else if (segment === 1) {
              orbitX = r;
              orbitY = -r + along * 2 * r;
            } else if (segment === 2) {
              orbitX = r - along * 2 * r;
              orbitY = r;
            } else {
              orbitX = -r;
              orbitY = r - along * 2 * r;
            }
          }

          /* --- Слой 3: волна, рождённая ядром --- */
          let waveAlpha = 0;
          if (waveProgress >= 0) {
            const jitter =
              cellHash(col * 13 + 7, row * 17 + 11) * JITTER_CELLS;
            const cellFront = distance + jitter;
            if (cellFront <= frontDistance) {
              const behind = frontDistance - cellFront;
              const frontStrength = Math.max(0, 1 - behind / FRONT_CELLS);
              const threshold = cellHash(col, row);
              const energy = 0.2 + frontStrength * 0.8;
              if (energy > threshold) {
                const overshoot = Math.min(1, (energy - threshold) / 0.6);
                const level = Math.ceil(overshoot * BRIGHTNESS_LEVELS);
                waveAlpha =
                  (0.12 + (level / BRIGHTNESS_LEVELS) * 0.55) * waveFade;
              }
            }
          }

          const alpha = Math.min(0.8, coreAlpha + seekerAlpha + waveAlpha);
          if (alpha < 0.02) {
            continue;
          }

          context.fillStyle = `rgb(${tint.r} ${tint.g} ${tint.b} / ${alpha.toFixed(3)})`;
          context.fillRect(
            offsetX +
              col * CELL_PITCH_X +
              (CELL_PITCH_X - DOT_SIZE) / 2 +
              orbitX,
            offsetY +
              row * CELL_PITCH_Y +
              (CELL_PITCH_Y - DOT_SIZE) / 2 +
              orbitY,
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

function cellHash(col: number, row: number): number {
  const value = Math.sin(col * 127.1 + row * 311.7) * 43758.5453;
  return value - Math.floor(value);
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
