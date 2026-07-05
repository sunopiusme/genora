"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/lib/icon";
import { useComposerStore } from "@/stores/composer-store";
import type { Product } from "../types";
import styles from "./product-detail.module.css";
import { useMobileViewport } from "./use-mobile-viewport";

const SURFACE_ELEMENT_ID = "dashboardSurface";
const COPIED_RESET_DELAY_MS = 1500;
const SWIPE_START_THRESHOLD_PX = 8;
const SWIPE_DISMISS_DISTANCE_RATIO = 0.25;
const SWIPE_DISMISS_VELOCITY_PX_PER_MS = 0.6;
const CLOSE_ANIMATION_MOBILE_MS = 280;
const SETTLE_DURATION_MS = 380;

type ProductDetailProps = {
	product: Product | null;
	onClose: () => void;
};

export function ProductDetail({ product, onClose }: ProductDetailProps) {
	/* Portal to document.body (как у ProfileSheet): шит анимируется в
	   fixed-слое поверх всего, а не внутри трансформируемой поверхности —
	   на iOS это убирает дёрганое открытие. */
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	if (!product || !isMounted) {
		return null;
	}

	return createPortal(
		<ProductDetailModal product={product} onClose={onClose} />,
		document.body,
	);
}

type ProductDetailModalProps = {
	product: Product;
	onClose: () => void;
};

function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
	const panelRef = useRef<HTMLDivElement>(null);
	const bodyRef = useRef<HTMLDivElement>(null);
	const attachProduct = useComposerStore((state) => state.attach);
	const isMobile = useMobileViewport();
	const requestClose = useDelayedClose(
		onClose,
		isMobile ? CLOSE_ANIMATION_MOBILE_MS : 0,
	);
	const swipe = useSwipeToDismiss(panelRef, bodyRef, requestClose.begin, isMobile);
	const isScrolled = usePanelScrolled(bodyRef, isMobile);

	useEscapeKey(requestClose.begin);
	useInitialFocus(panelRef);
	useSurfaceFocus(SURFACE_ELEMENT_ID);
	useBodyScrollLock();

	function handleAskAssistant() {
		attachProduct(product);
		requestClose.begin();
	}

	function stopBackdropClose(event: React.MouseEvent<HTMLDivElement>) {
		event.stopPropagation();
	}

	const overlayClassName = requestClose.isClosing
		? `${styles.overlay} ${styles.overlayClosing}`
		: styles.overlay;
	const panelClassName = requestClose.isClosing
		? styles.panelClosing
		: swipe.isDragging
			? styles.panelDragging
			: swipe.isSettling
				? styles.panelSettling
				: swipe.isRested
					? styles.panelRested
					: styles.panel;
	const controlsClassName = isScrolled
		? `${styles.controls} ${styles.controlsScrolled}`
		: styles.controls;

	return (
		<div className={overlayClassName} onClick={requestClose.begin}>
			<div
				ref={panelRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby="product-detail-title"
				tabIndex={-1}
				className={panelClassName}
				onClick={stopBackdropClose}
			>
				<span className={styles.grabber} aria-hidden="true" />
				<div className={controlsClassName}>
					<ShareMenu product={product} />
					<button
						type="button"
						className={styles.iconButton}
						onClick={requestClose.begin}
						aria-label="Закрыть"
						title="Закрыть"
					>
						<Icon icon="solar:close-linear" aria-hidden="true" />
					</button>
				</div>

				<div ref={bodyRef} className={styles.body}>
					<div className={styles.layout}>
						<ProductHero product={product} />
						<ProductPanel
							product={product}
							onAskAssistant={handleAskAssistant}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

type ProductHeroProps = {
	product: Product;
};

function ProductHero({ product }: ProductHeroProps) {
	return (
		<div
			className={styles.hero}
			style={
				{
					"--logo-url": `url(/brands/${product.logoSlug}.svg)`,
					"--brand": product.brandColor,
					"--brand-glow": product.brandGlow,
				} as React.CSSProperties
			}
		>
			<span className={styles.heroLogoTile}>
				<span
					className={styles.heroLogo}
					role="img"
					aria-label={product.provider}
				/>
				<span className={styles.heroReflection} aria-hidden="true" />
			</span>
		</div>
	);
}

type ProductPanelProps = {
	product: Product;
	onAskAssistant: () => void;
};

function ProductPanel({ product, onAskAssistant }: ProductPanelProps) {
	const [tierIndex, setTierIndex] = useState(product.defaultTierIndex);
	const tier = product.tiers[tierIndex] ?? product.tiers[0];
	const hasTiers = product.tiers.length > 1;

	return (
		<div className={styles.content}>
			<div className={styles.heading}>
				<p className={styles.eyebrow}>{product.provider}</p>
				<h2 id="product-detail-title" className={styles.name}>
					{product.name}
					{tier ? ` ${tier.name}` : ""}
				</h2>
			</div>

			{hasTiers && tier && (
				<TierSelector
					product={product}
					tierIndex={tierIndex}
					onTierChange={setTierIndex}
				/>
			)}

			<div className={styles.priceCard}>
				<span className={styles.priceCaption}>Подписка</span>
				<p className={styles.priceRow}>
					<span className={styles.amount}>
						{tier?.priceLabel ?? product.priceLabel}
					</span>
					<span className={styles.period}>{product.periodLabel}</span>
				</p>
			</div>

			<div className={styles.actions}>
				<button type="button" className={styles.primaryAction}>
					Купить подписку
				</button>
				<button
					type="button"
					className={styles.secondaryAction}
					onClick={onAskAssistant}
				>
					<Icon icon="solar:chat-round-line-linear" aria-hidden="true" />
					Обсудить товар
				</button>
			</div>
		</div>
	);
}

type TierSelectorProps = {
	product: Product;
	tierIndex: number;
	onTierChange: (index: number) => void;
};

/* Селектор уровня подписки: компактная строка со значением, по нажатию
   раскрывается меню со слайдером. Слайдер не занимает место в модалке
   постоянно и появляется только когда пользователь выбирает уровень. */
function TierSelector({ product, tierIndex, onTierChange }: TierSelectorProps) {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const tier = product.tiers[tierIndex];

	const close = useCallback(() => setIsOpen(false), []);
	useClickOutside(containerRef, isOpen, close);

	useEffect(() => {
		if (!isOpen) {
			return;
		}
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				/* Гасим Escape локально, чтобы не закрылась вся модалка. */
				event.stopPropagation();
				close();
			}
		}
		window.addEventListener("keydown", handleKeyDown, { capture: true });
		return () =>
			window.removeEventListener("keydown", handleKeyDown, { capture: true });
	}, [isOpen, close]);

	return (
		<div className={styles.tierSelector} ref={containerRef}>
			<button
				type="button"
				className={isOpen ? styles.tierTriggerOpen : styles.tierTrigger}
				onClick={() => setIsOpen((prev) => !prev)}
				aria-haspopup="true"
				aria-expanded={isOpen}
			>
				<span className={styles.tierTriggerCaption}>Уровень</span>
				<span className={styles.tierTriggerValue}>
					{tier?.name}
					<Icon
						icon={
							isOpen ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"
						}
						className={styles.tierTriggerChevron}
						aria-hidden="true"
					/>
				</span>
			</button>
			{isOpen && (
				<div className={styles.tierMenu}>
					<TierSlider
						product={product}
						tierIndex={tierIndex}
						onTierChange={onTierChange}
					/>
				</div>
			)}
		</div>
	);
}

type TierSliderProps = {
	product: Product;
	tierIndex: number;
	onTierChange: (index: number) => void;
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
function TierSlider({ product, tierIndex, onTierChange }: TierSliderProps) {
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
		trackRef.current?.releasePointerCapture(event.pointerId);
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
			className={styles.tierSlider}
			data-sheet-drag-ignore="true"
			data-maxed={isMaxed || undefined}
			style={{ "--brand": product.brandColor } as React.CSSProperties}
		>
			<div className={styles.tierEdges} aria-hidden="true">
				<span>Базовый</span>
				<span className={styles.tierEdgeMax}>Максимум</span>
			</div>
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
				onKeyDown={handleKeyDown}
			>
				<div className={styles.tierTrackInner}>
					<div className={styles.tierFill} />
					<span className={styles.tierDither} />
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

type ShareMenuProps = {
	product: Product;
};

function ShareMenu({ product }: ShareMenuProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isCopied, setIsCopied] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const copiedResetTimerRef = useRef<number | undefined>(undefined);
	const isMobile = useMobileViewport();

	useClickOutside(menuRef, isOpen, closeMenu);

	useEffect(() => {
		return () => window.clearTimeout(copiedResetTimerRef.current);
	}, []);

	function closeMenu() {
		setIsOpen(false);
	}

	function toggleMenu() {
		setIsOpen((prev) => !prev);
	}

	function handleShareButtonClick() {
		if (isMobile && canUseSystemShare()) {
			void openSystemShare(product);
			return;
		}
		toggleMenu();
	}

	async function handleCopyLink() {
		try {
			await navigator.clipboard.writeText(buildProductShareUrl(product.id));
			setIsCopied(true);
			copiedResetTimerRef.current = window.setTimeout(() => {
				setIsCopied(false);
				closeMenu();
			}, COPIED_RESET_DELAY_MS);
		} catch {
			closeMenu();
		}
	}

	function handleShareTelegram() {
		window.open(buildTelegramShareUrl(product), "_blank", "noopener,noreferrer");
		closeMenu();
	}

	const shareButtonClassName = isOpen
		? styles.iconButtonActive
		: styles.iconButton;

	return (
		<div className={styles.actionGroup} ref={menuRef}>
			<button
				type="button"
				className={shareButtonClassName}
				onClick={handleShareButtonClick}
				aria-label="Под��литься"
				title="Поделиться"
				aria-haspopup="true"
				aria-expanded={isOpen}
			>
				<Icon icon="solar:square-share-line-linear" aria-hidden="true" />
			</button>
			{isOpen && (
				<div className={styles.shareMenu} role="menu">
					<button
						type="button"
						className={styles.shareItem}
						onClick={handleCopyLink}
						role="menuitem"
					>
						<CopyLinkItem isCopied={isCopied} />
					</button>
					<button
						type="button"
						className={styles.shareItem}
						onClick={handleShareTelegram}
						role="menuitem"
					>
						<span className={styles.shareItemGlyph}>
							<Icon icon="solar:plain-linear" aria-hidden="true" />
						</span>
						<span className={styles.shareItemLabel}>Telegram</span>
					</button>
				</div>
			)}
		</div>
	);
}

type CopyLinkItemProps = {
	isCopied: boolean;
};

function CopyLinkItem({ isCopied }: CopyLinkItemProps) {
	const iconName = isCopied ? "solar:check-read-linear" : "solar:link-linear";
	const label = isCopied ? "Скопировано" : "Ссылка";
	const glyphClassName = isCopied
		? styles.shareItemGlyphSuccess
		: styles.shareItemGlyph;

	return (
		<>
			<span className={glyphClassName}>
				<Icon icon={iconName} aria-hidden="true" />
			</span>
			<span className={styles.shareItemLabel}>{label}</span>
		</>
	);
}

function useDelayedClose(onClose: () => void, durationMs: number) {
	const [isClosing, setIsClosing] = useState(false);
	const closeTimerRef = useRef<number | undefined>(undefined);
	const isClosingRef = useRef(false);
	const durationRef = useRef(durationMs);
	durationRef.current = durationMs;

	useEffect(() => {
		return () => window.clearTimeout(closeTimerRef.current);
	}, []);

	const begin = useCallback(() => {
		if (isClosingRef.current) {
			return;
		}
		isClosingRef.current = true;
		if (durationRef.current === 0) {
			onClose();
			return;
		}
		setIsClosing(true);
		closeTimerRef.current = window.setTimeout(onClose, durationRef.current);
	}, [onClose]);

	return { isClosing, begin };
}

function useSwipeToDismiss(
	panelRef: React.RefObject<HTMLDivElement | null>,
	bodyRef: React.RefObject<HTMLDivElement | null>,
	onDismiss: () => void,
	isEnabled: boolean,
) {
	const [isDragging, setIsDragging] = useState(false);
	/* Фаза «settling» — короткое окно после отпущенного незавершённого
	   свайпа, когда включается transition для плавного возврата шита.
	   Вне этого окна transition отсутствует, чтобы не конфликтовать
	   с entry-анимацией открытия (источник рывков на iOS). */
	const [isSettling, setIsSettling] = useState(false);
	/* После первого перетаскивания панель навсегда переходит в «спокойное»
	   состояние (isRested): возврат к базовому классу .panel заново
	   проигрывал бы entry-анимацию sheetIn — шит повторно «выезжал» снизу. */
	const [isRested, setIsRested] = useState(false);
	const settleTimerRef = useRef<number | undefined>(undefined);

	useEffect(() => {
		return () => window.clearTimeout(settleTimerRef.current);
	}, []);

	useEffect(() => {
		if (!isEnabled) {
			return;
		}
		const panelElement = panelRef.current;
		if (!panelElement) {
			return;
		}
		const panel: HTMLDivElement = panelElement;
		const getScrollTop = () => bodyRef.current?.scrollTop ?? 0;

		let activePointerId: number | null = null;
		let startY = 0;
		let lastY = 0;
		let lastTime = 0;
		let velocity = 0;
		let dragOffset = 0;

		function handlePointerDown(event: PointerEvent) {
			if (activePointerId !== null || getScrollTop() > 0) {
				return;
			}
			/* Жесты внутри слайдера тиров принадлежат слайдеру: шит не
			   должен ехать вниз, пока пользователь двигает ручку. */
			const target = event.target as HTMLElement | null;
			if (target?.closest("[data-sheet-drag-ignore]")) {
				return;
			}
			activePointerId = event.pointerId;
			startY = event.clientY;
			lastY = event.clientY;
			lastTime = event.timeStamp;
			velocity = 0;
			dragOffset = 0;
		}

		function handlePointerMove(event: PointerEvent) {
			if (event.pointerId !== activePointerId) {
				return;
			}
			const elapsed = event.timeStamp - lastTime;
			if (elapsed > 0) {
				velocity = (event.clientY - lastY) / elapsed;
			}
			lastY = event.clientY;
			lastTime = event.timeStamp;

			const deltaY = event.clientY - startY;
			if (dragOffset === 0 && deltaY < SWIPE_START_THRESHOLD_PX) {
				return;
			}
			if (dragOffset === 0 && getScrollTop() > 0) {
				activePointerId = null;
				return;
			}
			dragOffset = Math.max(deltaY, 0);
			if (!panel.hasPointerCapture(event.pointerId)) {
				capturePointerSafely(panel, event.pointerId);
				setIsDragging(true);
				setIsRested(true);
			}
			/* Панель просто следует за пальцем — без растягивания обложки. */
			panel.style.transform =
				dragOffset > 0 ? `translateY(${dragOffset}px)` : "";
		}

		function handlePointerEnd(event: PointerEvent) {
			if (event.pointerId !== activePointerId) {
				return;
			}
			const shouldDismiss =
				dragOffset > panel.offsetHeight * SWIPE_DISMISS_DISTANCE_RATIO ||
				(dragOffset > 0 && velocity > SWIPE_DISMISS_VELOCITY_PX_PER_MS);
			const wasDragged = dragOffset > 0;
			activePointerId = null;
			dragOffset = 0;
			setIsDragging(false);
			if (shouldDismiss) {
				onDismiss();
				return;
			}
			if (!wasDragged) {
				return;
			}
			/* Плавный возврат: включаем transition на один такт settling,
			   сбрасываем смещение и выключаем его по завершении. */
			setIsSettling(true);
			panel.style.transform = "";
			window.clearTimeout(settleTimerRef.current);
			settleTimerRef.current = window.setTimeout(() => {
				setIsSettling(false);
			}, SETTLE_DURATION_MS);
		}

		function handleTouchMove(event: TouchEvent) {
			if (dragOffset > 0) {
				event.preventDefault();
			}
		}

		panel.addEventListener("pointerdown", handlePointerDown);
		panel.addEventListener("pointermove", handlePointerMove);
		panel.addEventListener("pointerup", handlePointerEnd);
		panel.addEventListener("pointercancel", handlePointerEnd);
		panel.addEventListener("touchmove", handleTouchMove, { passive: false });

		return () => {
			panel.removeEventListener("pointerdown", handlePointerDown);
			panel.removeEventListener("pointermove", handlePointerMove);
			panel.removeEventListener("pointerup", handlePointerEnd);
			panel.removeEventListener("pointercancel", handlePointerEnd);
			panel.removeEventListener("touchmove", handleTouchMove);
			panel.style.transform = "";
		};
	}, [isEnabled, onDismiss, panelRef, bodyRef]);

	return { isDragging, isSettling, isRested };
}

function usePanelScrolled(
	bodyRef: React.RefObject<HTMLDivElement | null>,
	isEnabled: boolean,
) {
	const [isScrolled, setIsScrolled] = useState(false);

	useEffect(() => {
		if (!isEnabled) {
			setIsScrolled(false);
			return;
		}
		const body = bodyRef.current;
		if (!body) {
			return;
		}

		function handleScroll() {
			setIsScrolled((body?.scrollTop ?? 0) > 4);
		}

		handleScroll();
		body.addEventListener("scroll", handleScroll, { passive: true });
		return () => body.removeEventListener("scroll", handleScroll);
	}, [isEnabled, bodyRef]);

	return isScrolled;
}

function capturePointerSafely(element: HTMLElement, pointerId: number) {
	try {
		element.setPointerCapture(pointerId);
	} catch {
		return;
	}
}

function useSurfaceFocus(elementId: string) {
	useEffect(() => {
		const surface = document.getElementById(elementId);
		surface?.setAttribute("data-detail-open", "true");
		return () => surface?.removeAttribute("data-detail-open");
	}, [elementId]);
}

/* Блокируем прокрутку страницы за шитом, пока он от��рыт. */
function useBodyScrollLock() {
	useEffect(() => {
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, []);
}

function useEscapeKey(onEscape: () => void) {
	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				onEscape();
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onEscape]);
}

function useInitialFocus(targetRef: React.RefObject<HTMLElement | null>) {
	useEffect(() => {
		const frameId = requestAnimationFrame(() => {
			/* preventScroll: без него iOS Safari скроллит панель в зону
			   видимости прямо во время entry-анимации — визуальный рывок. */
			targetRef.current?.focus({ preventScroll: true });
		});
		return () => cancelAnimationFrame(frameId);
	}, [targetRef]);
}

function useClickOutside(
	containerRef: React.RefObject<HTMLElement | null>,
	isActive: boolean,
	onOutsideClick: () => void,
) {
	useEffect(() => {
		if (!isActive) {
			return;
		}

		function handleMouseDown(event: MouseEvent) {
			const target = event.target as Node;
			const container = containerRef.current;
			if (container && !container.contains(target)) {
				onOutsideClick();
			}
		}

		document.addEventListener("mousedown", handleMouseDown);
		return () => document.removeEventListener("mousedown", handleMouseDown);
	}, [containerRef, isActive, onOutsideClick]);
}

function canUseSystemShare() {
	return (
		typeof navigator !== "undefined" &&
		typeof navigator.share === "function"
	);
}

async function openSystemShare(product: Product) {
	try {
		await navigator.share({
			title: product.name,
			text: buildShareText(product),
			url: buildProductShareUrl(product.id),
		});
	} catch {
		return;
	}
}

function buildShareText(product: Product) {
	return `${product.name} — ${product.priceLabel}/${product.periodLabel}`;
}

function buildProductShareUrl(productId: Product["id"]) {
	if (typeof window === "undefined") {
		return "";
	}
	return `${window.location.origin}/products?id=${productId}`;
}

function buildTelegramShareUrl(product: Product) {
	const shareUrl = buildProductShareUrl(product.id);
	const shareText = buildShareText(product);
	const encodedUrl = encodeURIComponent(shareUrl);
	const encodedText = encodeURIComponent(shareText);
	const telegramShareBaseUrl = "https://t.me/share/url";
	return `${telegramShareBaseUrl}?url=${encodedUrl}&text=${encodedText}`;
}
