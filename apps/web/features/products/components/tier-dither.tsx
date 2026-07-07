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

/* Скан-волна: строгий фронт идёт слева направо к отметке «Максимум»,
   двигаясь дискретными шагами по одной колонке, синхронно по всей высоте */
const WAVE_DELAY_MS = 500;
const WAVE_STEP_MS = 42;
const WAVE_FRONT_CELLS = 9;
const WAVE_BOOST = 0.55;

/* Прибытие: дойдя до правого края, фронт «отдаёт заряд» —
   терминальные колонки вспыхивают и гаснут ступенями */
const TERMINAL_CELLS = 5;
const FLASH_STEPS = 8;
const FLASH_BOOST = 0.45;
const REST_STEPS = 22;

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

      /* --- Фаза 2: скан-цикл. Дискретный шаговый отсчёт:
         развёртка -> вспышка прибытия -> пауза --- */
      const revealDoneMs = revealSteps * REVEAL_STEP_MS;
      const waveTimeMs = timeMs - revealDoneMs - WAVE_DELAY_MS;
      const sweepSteps = columns - quietCols + WAVE_FRONT_CELLS;
      const cycleSteps = sweepSteps + FLASH_STEPS + REST_STEPS;

      let frontCol = -1;
      let flashPhase = -1;
      if (!staticMode && waveTimeMs >= 0) {
        const stepIndex = Math.floor(waveTimeMs / WAVE_STEP_MS) % cycleSteps;
        if (stepIndex < sweepSteps) {
          frontCol = quietCols + stepIndex;
        } else if (stepIndex < sweepSteps + FLASH_STEPS) {
          flashPhase = stepIndex - sweepSteps;
        }
      }

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

        /* Подсветка колонки единая по всей высоте — фронт
           воспринимается как вертикальная сканирующая линия */
        let columnBoost = 0;

        if (frontCol >= 0) {
          const behind = frontCol - col;
          if (behind >= 0 && behind < WAVE_FRONT_CELLS) {
            const strength = 1 - behind / WAVE_FRONT_CELLS;
            columnBoost += WAVE_BOOST * strength * strength;
          }
        }

        if (flashPhase >= 0 && col >= columns - TERMINAL_CELLS) {
          columnBoost += FLASH_BOOST * (1 - flashPhase / FLASH_STEPS);
        }

        if (isRevealing) {
          const penDistance = col - revealFrontCol;
          if (penDistance >= 0 && penDistance < REVEAL_PEN_CELLS) {
            columnBoost +=
              REVEAL_PEN_BOOST * (1 - penDistance / REVEAL_PEN_CELLS);
          }
        }

        const energy = density + columnBoost * presence;

        for (let row = 0; row < rows; row++) {
          /* Фиксированный порог Байера: клетки включаются всегда
             в одном и том же порядке — узор стабилен и регулярен */
          const threshold = (BAYER_4[row % 4][col % 4] + 0.5) / 16;
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
