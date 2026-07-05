"use client";

import { useEffect, useRef } from "react";
import styles from "./product-detail.module.css";

type TierDitherProps = {
	active: boolean;
	brandColor: string;
};

const CELL_PITCH_X = 3;
const CELL_PITCH_Y = 4;
const DOT_SIZE = 2.25;
const QUIET_LEFT_RATIO = 0.25;
const BRIGHTNESS_LEVELS = 4;
const WAVE_PERIOD_MS = 3600;
const WAVE_FRONT_CELLS = 9;
const BRAND_MIX = 0.38;
const REVEAL_MS = 1200;
const REVEAL_JITTER_CELLS = 8;
const REVEAL_PEN_CELLS = 6;
const WAVE_STEP_MS = 96;
const WAVE_DELAY_MS = 400;

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

			const columns = Math.max(1, Math.floor(cssWidth / CELL_PITCH_X));
			const rows = Math.max(1, Math.floor(cssHeight / CELL_PITCH_Y));
			const offsetX = (cssWidth - columns * CELL_PITCH_X) / 2;
			const offsetY = (cssHeight - rows * CELL_PITCH_Y) / 2;

			const revealProgress = Math.min(1, timeMs / REVEAL_MS);
			const eased = 1 - (1 - revealProgress) ** 2.2;
			const revealFrontCol = columns - eased * (columns + REVEAL_JITTER_CELLS);
			const revealing = revealProgress < 1;

			const waveTimeMs = Math.max(0, timeMs - REVEAL_MS - WAVE_DELAY_MS);
			const steppedTime =
				Math.floor(waveTimeMs / WAVE_STEP_MS) * WAVE_STEP_MS;
			const travelCells = columns + WAVE_FRONT_CELLS * 2;
			const waveProgress = (steppedTime % WAVE_PERIOD_MS) / WAVE_PERIOD_MS;
			const waveFrontCol = Math.floor(
				columns + WAVE_FRONT_CELLS - waveProgress * travelCells,
			);

			for (let col = 0; col < columns; col++) {
				const xRatio = col / Math.max(1, columns - 1);
				const density = densityProfile(xRatio);
				if (density <= 0) {
					continue;
				}
				const presence = Math.min(1, density / 0.12);
				const distance = Math.abs(col - waveFrontCol);

				for (let row = 0; row < rows; row++) {
					const revealJitter =
						cellHash(col * 13 + 7, row * 17 + 11) * REVEAL_JITTER_CELLS;
					if (col < revealFrontCol + revealJitter) {
						continue;
					}

					const threshold = cellHash(col, row);
					const twinklePhase = cellHash(col * 3 + 1, row * 7 + 3);
					const twinkleSpeed = 0.5 + cellHash(col * 5 + 2, row * 11 + 5) * 0.8;
					const twinkle =
						0.11 *
						Math.sin(
							(timeMs / 1000) * twinkleSpeed * Math.PI * 2 +
								twinklePhase * Math.PI * 2,
						);

					let waveBoost = 0;
					if (!revealing && distance < WAVE_FRONT_CELLS) {
						const frontStrength = (1 - distance / WAVE_FRONT_CELLS) ** 2;
						const lottery = cellHash(col * 19 + 3, row * 23 + 13);
						if (lottery < frontStrength) {
							waveBoost = 0.75 * frontStrength;
						}
					}

					let penBoost = 0;
					if (revealing) {
						const penDistance = col - revealJitter - revealFrontCol;
						if (penDistance >= 0 && penDistance < REVEAL_PEN_CELLS) {
							penBoost = (1 - penDistance / REVEAL_PEN_CELLS) ** 2 * 0.3;
						}
					}

					const energy = density + (waveBoost + penBoost + twinkle) * presence;
					if (energy <= threshold) {
						continue;
					}

					const overshoot = Math.min(1, (energy - threshold) / 0.6);
					const level = Math.ceil(overshoot * BRIGHTNESS_LEVELS);
					const alpha = 0.16 + (level / BRIGHTNESS_LEVELS) * 0.72;

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
			drawFrame(timeMs - startTimeMs);
			frameId = requestAnimationFrame(loop);
		}

		let resizeFrameId = 0;
		const resizeObserver = new ResizeObserver(() => {
			cancelAnimationFrame(resizeFrameId);
			resizeFrameId = requestAnimationFrame(() => {
				syncCanvasSize();
				if (active && reducedMotion.matches) {
					drawFrame(REVEAL_MS);
				}
			});
		});
		resizeObserver.observe(canvas);
		syncCanvasSize();

		if (active) {
			if (reducedMotion.matches) {
				drawFrame(REVEAL_MS);
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
	}, [active, brandColor]);

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
