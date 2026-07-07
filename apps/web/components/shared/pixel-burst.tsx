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

/* Двухслойная хореография.
   Слой 1 — «сканирующая матрица»: разреженные пиксели-искатели
   мягко загораются, и внутри каждого свет обходит квадрат по периметру.
   Слой 2 — волна: периодически расходится от центра к краям поверх. */
const SEEKER_WINDOW_MS = 1100;
const SEEKER_SHARE = 0.16;
const ORBIT_MS = 1400;
const ORBIT_RADIUS = 0.75;

const WAVE_MS = 1100;
const REST_MS = 1700;
const CYCLE_MS = WAVE_MS + REST_MS;
const FRONT_CELLS = 7;
const JITTER_CELLS = 5;
const FADE_TAIL = 0.45;

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
    const halfSpan = centerCol + FRONT_CELLS + JITTER_CELLS;

    let frameId = 0;
    let startTimeMs = -1;

    function drawFrame(elapsedMs: number) {
      if (!context) {
        return;
      }
      context.clearRect(0, 0, width, height);

      /* Фаза волны: WAVE_MS расширения, затем REST_MS,
         когда работает только матрица искателей */
      const cycleMs = elapsedMs % CYCLE_MS;
      const waveProgress = cycleMs < WAVE_MS ? cycleMs / WAVE_MS : -1;
      const eased =
        waveProgress >= 0 ? 1 - (1 - waveProgress) ** 2.4 : 0;
      const frontDistance = eased * halfSpan;
      const waveFade =
        waveProgress > 1 - FADE_TAIL
          ? 1 - (waveProgress - (1 - FADE_TAIL)) / FADE_TAIL
          : 1;

      const seekerSlice = Math.floor(elapsedMs / SEEKER_WINDOW_MS);
      const seekerPhase =
        (elapsedMs % SEEKER_WINDOW_MS) / SEEKER_WINDOW_MS;

      for (let col = 0; col < columns; col++) {
        const distance = Math.abs(col - centerCol);
        for (let row = 0; row < rows; row++) {
          /* --- Слой 1: пиксель-искатель --- */
          let seekerAlpha = 0;
          let orbitX = 0;
          let orbitY = 0;
          const pick = cellHash(col * 29 + seekerSlice * 3, row * 23 + 5);
          if (pick > 1 - SEEKER_SHARE) {
            /* Мягкое появление и затухание в пределах окна */
            const envelope = Math.sin(Math.PI * seekerPhase);
            seekerAlpha =
              envelope * (0.1 + 0.2 * cellHash(col + 5, row + 9));

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

          /* --- Слой 2: волна от центра --- */
          let waveAlpha = 0;
          if (waveProgress >= 0) {
            const jitter =
              cellHash(col * 13 + 7, row * 17 + 11) * JITTER_CELLS;
            const cellFront = distance + jitter;
            if (cellFront <= frontDistance) {
              const behind = frontDistance - cellFront;
              const frontStrength = Math.max(0, 1 - behind / FRONT_CELLS);
              const threshold = cellHash(col, row);
              const energy = 0.25 + frontStrength * 0.75;
              if (energy > threshold) {
                const overshoot = Math.min(1, (energy - threshold) / 0.6);
                const level = Math.ceil(overshoot * BRIGHTNESS_LEVELS);
                waveAlpha =
                  (0.14 + (level / BRIGHTNESS_LEVELS) * 0.58) * waveFade;
              }
            }
          }

          const alpha = Math.min(0.8, seekerAlpha + waveAlpha);
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
