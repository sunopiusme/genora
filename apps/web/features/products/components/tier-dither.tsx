"use client";

import { useEffect, useRef } from "react";
import styles from "./product-detail.module.css";

/**
 * Пиксельный шиммер трека (референс — Effort-слайдер Ultracode).
 *
 * Вместо CSS-маски-полосы каждый пиксель считается индивидуально:
 * у каждой ячейки сетки свой детерминированный хеш → свой порог
 * включения, своя фаза и скорость мерцания. Волна энергии идёт от
 * ручки влево, и пиксели «прощёлкиваются» в порядке своих порогов
 * (упорядоченный дизеринг), а не колоннами. Яркость квантована на
 * дискретные уровни — ретро-пиксельный характер сохраняется.
 */

type TierDitherProps = {
	active: boolean;
	brandColor: string;
};

/** Шаг сетки в CSS-пикселях (расстояние между центрами точек). */
const CELL_PITCH = 4;
/** Размер самой точки в CSS-пикселях. */
const DOT_SIZE = 2;
/** Дискретные уровни яркости — пиксель «перещёлкивается», а не плывёт. */
const BRIGHTNESS_LEVELS = 4;
/** Длительность полного прохода волны, мс. */
const WAVE_PERIOD_MS = 2600;
/** Ширина фронта волны в ячейках. */
const WAVE_FRONT_CELLS = 9;
/** Доля брендового цвета в точке (остальное — белый). */
const BRAND_MIX = 0.38;

export function TierDither({ active, brandColor }: TierDitherProps) {
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

		const reducedMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		);
		const tint = mixWithWhite(parseHexColor(brandColor), BRAND_MIX);

		let frameId = 0;
		let cssWidth = 0;
		let cssHeight = 0;

		function syncCanvasSize() {
			if (!canvas) {
				return;
			}
			const rect = canvas.getBoundingClientRect();
			const dpr = window.devicePixelRatio || 1;
			cssWidth = rect.width;
			cssHeight = rect.height;
			canvas.width = Math.max(1, Math.round(rect.width * dpr));
			canvas.height = Math.max(1, Math.round(rect.height * dpr));
			context?.setTransform(dpr, 0, 0, dpr, 0, 0);
		}

		function drawFrame(timeMs: number) {
			if (!context || cssWidth === 0 || cssHeight === 0) {
				return;
			}
			context.clearRect(0, 0, cssWidth, cssHeight);

			const columns = Math.ceil(cssWidth / CELL_PITCH);
			const rows = Math.ceil(cssHeight / CELL_PITCH);

			/* Фронт волны в координатах колонок: едет от ручки (справа)
			   влево, шагами ровно по одной колонке — квантование сохраняет
			   блочный «перещёлкивающийся» ход. */
			const travelCells = columns + WAVE_FRONT_CELLS * 2;
			const waveProgress = (timeMs % WAVE_PERIOD_MS) / WAVE_PERIOD_MS;
			const waveFrontCol = Math.floor(
				columns + WAVE_FRONT_CELLS - waveProgress * travelCells,
			);

			for (let col = 0; col < columns; col++) {
				/* Базовая плотность повторяет прежний градиент маски:
				   слева редкие пиксели, к ~72% ширины плотнее всего,
				   у самой ручки гаснут — там сплошная светлая заливка. */
				const xRatio = col / Math.max(1, columns - 1);
				const density = densityProfile(xRatio);

				/* Вклад волны: мягкий импульс вокруг фронта. */
				const distance = Math.abs(col - waveFrontCol);
				const waveBoost =
					distance < WAVE_FRONT_CELLS
						? (1 - distance / WAVE_FRONT_CELLS) ** 2 * 0.75
						: 0;

				for (let row = 0; row < rows; row++) {
					const threshold = cellHash(col, row);
					/* Индивидуальное мерцание: у каждой ячейки своя фаза и
					   скорость — пиксели живут несинхронно даже вне фронта. */
					const twinklePhase = cellHash(col * 3 + 1, row * 7 + 3);
					const twinkleSpeed = 0.6 + cellHash(col * 5 + 2, row * 11 + 5);
					const twinkle =
						0.14 *
						Math.sin(
							(timeMs / 1000) * twinkleSpeed * Math.PI * 2 +
								twinklePhase * Math.PI * 2,
						);

					const energy = density + waveBoost + twinkle;
					if (energy <= threshold) {
						continue;
					}

					/* Квантованная яркость: чем сильнее ячейка «пробила» свой
					   порог, тем выше её дискретный уровень. */
					const overshoot = Math.min(1, (energy - threshold) / 0.6);
					const level = Math.ceil(overshoot * BRIGHTNESS_LEVELS);
					const alpha = 0.16 + (level / BRIGHTNESS_LEVELS) * 0.72;

					context.fillStyle = `rgb(${tint.r} ${tint.g} ${tint.b} / ${alpha.toFixed(3)})`;
					context.fillRect(
						col * CELL_PITCH + (CELL_PITCH - DOT_SIZE) / 2,
						row * CELL_PITCH + (CELL_PITCH - DOT_SIZE) / 2,
						DOT_SIZE,
						DOT_SIZE,
					);
				}
			}
		}

		function loop(timeMs: number) {
			drawFrame(timeMs);
			frameId = requestAnimationFrame(loop);
		}

		const resizeObserver = new ResizeObserver(() => {
			syncCanvasSize();
			if (!active || reducedMotion.matches) {
				drawFrame(0);
			}
		});
		resizeObserver.observe(canvas);
		syncCanvasSize();

		if (active && !reducedMotion.matches) {
			frameId = requestAnimationFrame(loop);
		} else {
			/* Статичный кадр: плотность и пороги видны, движения нет. */
			drawFrame(0);
		}

		return () => {
			cancelAnimationFrame(frameId);
			resizeObserver.disconnect();
		};
	}, [active, brandColor]);

	return (
		<canvas ref={canvasRef} className={styles.tierDither} aria-hidden="true" />
	);
}

/** Профиль плотности вдоль трека — повторяет прежний градиент маски. */
function densityProfile(xRatio: number): number {
	if (xRatio < 0.4) {
		/* 0 → 0.4: от 0.1 до 0.34 */
		return 0.1 + (xRatio / 0.4) * 0.24;
	}
	if (xRatio < 0.72) {
		/* 0.4 → 0.72: до пика 0.62 */
		return 0.34 + ((xRatio - 0.4) / 0.32) * 0.28;
	}
	if (xRatio < 0.92) {
		/* 0.72 → 0.92: спад до 0.22 */
		return 0.62 - ((xRatio - 0.72) / 0.2) * 0.4;
	}
	/* У ручки гаснем в ноль. */
	return 0.22 * (1 - (xRatio - 0.92) / 0.08);
}

/** Детерминированный хеш ячейки → [0, 1). Один и тот же пиксель всегда
    получает один и тот же порог — узор стабилен между кадрами. */
function cellHash(col: number, row: number): number {
	const value = Math.sin(col * 127.1 + row * 311.7) * 43758.5453;
	return value - Math.floor(value);
}

type Rgb = { r: number; g: number; b: number };

function parseHexColor(hex: string): Rgb {
	const normalized = hex.trim().replace("#", "");
	if (normalized.length === 3) {
		return {
			r: Number.parseInt(normalized[0] + normalized[0], 16),
			g: Number.parseInt(normalized[1] + normalized[1], 16),
			b: Number.parseInt(normalized[2] + normalized[2], 16),
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
