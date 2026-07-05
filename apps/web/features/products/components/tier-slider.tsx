"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { Product } from "../types";
import { TierDither } from "./tier-dither";
import styles from "./tier-slider.module.css";

type TierSliderProps = {
	product: Product;
	tierIndex: number;
	onTierChange: (index: number) => void;
	/* Компактный режим для карточек в витрине: без строки
	   «Базовый/Максимум» и без внутренних отступов — геометрию задаёт
	   родитель. */
	compact?: boolean;
};

/* Дискретный слайдер уровня подписки (по мотивам Effort-слайдера
   Claude Code), построенный по канону производительных drag-жестов:

   - Pointer Events + setPointerCapture: один код-путь для мыши, пальца
     и стилуса; жест не теряется при выходе за границы трека.
   - Геометрия трека кэшируется один раз на pointerdown — ноль forced
     reflow в per-move обработчике.
   - pointermove пишет позицию в ref и коалесцируется через
     requestAnimationFrame: DOM обновляется максимум раз за кадр
     прямой записью CSS-переменной, без setState и без ре-рендеров.
   - React state (уровень подписки) коммитится только когда дискретный
     индекс реально изменился — пара раз за весь жест.
   - touch-action: none на треке отдаёт жест слайдеру, а не скроллу. */
export function TierSlider({
	product,
	tierIndex,
	onTierChange,
	compact = false,
}: TierSliderProps) {
	const maxIndex = product.tiers.length - 1;
	const isMaxed = tierIndex === maxIndex;
	const currentTier = product.tiers[tierIndex];

	const rootRef = useRef<HTMLDivElement>(null);
	const trackRef = useRef<HTMLDivElement>(null);
	/* Живая геометрия жеста — вне React, чтобы не рендерить на каждый
	   pointermove (60–120 событий/с). */
	const gestureRef = useRef({
		rect: null as DOMRect | null,
		ratio: 0,
		rafId: 0,
		dragging: false,
	});
	/* Последний закоммиченный индекс — коммитим setState только при
	   реальной смене уровня. */
	const committedIndexRef = useRef(tierIndex);
	committedIndexRef.current = tierIndex;

	/* Единственная точка записи позиции в DOM: CSS-переменная --fill
	   на корне слайдера. Транзишены управляются data-dragging. */
	const applyFill = useCallback((ratio: number) => {
		rootRef.current?.style.setProperty("--fill", `${ratio * 100}%`);
	}, []);

	/* Синхронизация с внешним состоянием (клик по метке, клавиатура,
	   снап после отпускания): вне активного жеста позиция ручки всегда
	   следует за tierIndex. --fill НЕ входит в JSX-стиль, иначе React
	   при ре-рендере затирал бы прямые записи во время жеста.
	   useLayoutEffect — чтобы первая отрисовка была уже с позицией. */
	useLayoutEffect(() => {
		if (!gestureRef.current.dragging) {
			applyFill(maxIndex > 0 ? tierIndex / maxIndex : 0);
		}
	}, [tierIndex, maxIndex, applyFill]);

	/* Отмена запланированного кадра при размонтировании. */
	useEffect(() => {
		return () => cancelAnimationFrame(gestureRef.current.rafId);
	}, []);

	const commitNearestTier = useCallback(
		(ratio: number) => {
			let nearest = Math.round(ratio * maxIndex);
			/* Максимум во время жеста включается только когда ползунок
			   ФИЗИЧЕСКИ стукнулся о правый край (>= 98.5% трека) — до
			   этого держим предыдущий уровень. Заранее ничего не
			   вспыхивает; при отпускании рядом с краем ручка магнитно
			   дотягивается сама, и эффект стартует по прибытии. */
			if (
				gestureRef.current.dragging &&
				nearest === maxIndex &&
				ratio < 0.985
			) {
				nearest = maxIndex - 1;
			}
			if (nearest !== committedIndexRef.current) {
				onTierChange(nearest);
			}
		},
		[maxIndex, onTierChange],
	);

	/* Кадр отрисовки: одна запись в DOM за кадр, сколько бы событий
	   pointermove ни пришло между кадрами. */
	const renderFrame = useCallback(() => {
		const gesture = gestureRef.current;
		gesture.rafId = 0;
		applyFill(gesture.ratio);
		commitNearestTier(gesture.ratio);
	}, [applyFill, commitNearestTier]);

	const ratioFromClientX = useCallback((clientX: number) => {
		const rect = gestureRef.current.rect;
		if (!rect || rect.width === 0) {
			return 0;
		}
		const ratio = (clientX - rect.left) / rect.width;
		return Math.min(1, Math.max(0, ratio));
	}, []);

	function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
		const track = trackRef.current;
		if (!track) {
			return;
		}
		/* Геометрия читается ровно один раз за жест. */
		const gesture = gestureRef.current;
		gesture.rect = track.getBoundingClientRect();
		gesture.dragging = true;
		gesture.ratio = ratioFromClientX(event.clientX);
		track.setPointerCapture(event.pointerId);
		/* Атрибут ставится напрямую — отключает транзишены позиции без
		   участия React. */
		rootRef.current?.setAttribute("data-dragging", "true");
		applyFill(gesture.ratio);
		commitNearestTier(gesture.ratio);
	}

	function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
		const gesture = gestureRef.current;
		if (!gesture.dragging) {
			return;
		}
		/* Страховка от «прилипания»: если pointerup потерялся (кнопка
		   отпущена вне окна, alt-tab, потеря capture), у мыши уже нет
		   зажатых кнопок — завершаем жест, иначе ручка ездит за
		   курсором без нажатия. */
		if (event.pointerType === "mouse" && event.buttons === 0) {
			handlePointerEnd(event);
			return;
		}
		gesture.ratio = ratioFromClientX(event.clientX);
		if (gesture.rafId === 0) {
			gesture.rafId = requestAnimationFrame(renderFrame);
		}
	}

	function handlePointerEnd(event: React.PointerEvent<HTMLDivElement>) {
		const gesture = gestureRef.current;
		if (!gesture.dragging) {
			return;
		}
		gesture.dragging = false;
		cancelAnimationFrame(gesture.rafId);
		gesture.rafId = 0;
		/* releasePointerCapture бросает исключение, если capture уже
		   потерян (lostpointercapture) — проверяем перед снятием. */
		const track = trackRef.current;
		if (track?.hasPointerCapture(event.pointerId)) {
			track.releasePointerCapture(event.pointerId);
		}
		/* Возвращаем транзишены и примагничиваем ручку к уровню. */
		rootRef.current?.removeAttribute("data-dragging");
		const nearest = Math.round(gesture.ratio * maxIndex);
		applyFill(maxIndex > 0 ? nearest / maxIndex : 0);
		if (nearest !== committedIndexRef.current) {
			onTierChange(nearest);
		}
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
		let next = tierIndex;
		switch (event.key) {
			case "ArrowRight":
			case "ArrowUp":
				next = Math.min(maxIndex, tierIndex + 1);
				break;
			case "ArrowLeft":
			case "ArrowDown":
				next = Math.max(0, tierIndex - 1);
				break;
			case "Home":
				next = 0;
				break;
			case "End":
				next = maxIndex;
				break;
			default:
				return;
		}
		event.preventDefault();
		if (next !== tierIndex) {
			onTierChange(next);
		}
	}

	return (
		<div
			ref={rootRef}
			className={compact ? styles.tierSliderCompact : styles.tierSlider}
			data-sheet-drag-ignore="true"
			data-maxed={isMaxed || undefined}
			style={{ "--brand": product.brandColor } as React.CSSProperties}
		>
			{!compact && (
				<div className={styles.tierEdges} aria-hidden="true">
					<span>Базовый</span>
					<span className={styles.tierEdgeMax}>Максимум</span>
				</div>
			)}
			<div
				ref={trackRef}
				className={styles.tierTrack}
				role="slider"
				tabIndex={0}
				aria-label="Уровень подписки"
				aria-valuemin={0}
				aria-valuemax={maxIndex}
				aria-valuenow={tierIndex}
				aria-valuetext={currentTier?.name}
				aria-orientation="horizontal"
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerEnd}
				onPointerCancel={handlePointerEnd}
				onLostPointerCapture={handlePointerEnd}
				onKeyDown={handleKeyDown}
			>
				<div className={styles.tierTrackInner}>
					<div className={styles.tierFill}>
						<TierDither active={isMaxed} brandColor={product.brandColor} />
					</div>
					{product.tiers.map((productTier, index) => (
						<span
							key={productTier.id}
							className={styles.tierDot}
							style={
								{
									"--pos": `${maxIndex > 0 ? (index / maxIndex) * 100 : 0}%`,
								} as React.CSSProperties
							}
						/>
					))}
				</div>
				<span className={styles.tierThumb} />
			</div>
			<div className={styles.tierStops} aria-hidden="true">
				{product.tiers.map((productTier, index) => (
					<button
						key={productTier.id}
						type="button"
						tabIndex={-1}
						className={
							index === tierIndex ? styles.tierStopActive : styles.tierStop
						}
						onClick={() => onTierChange(index)}
					>
						{productTier.name}
					</button>
				))}
			</div>
		</div>
	);
}
