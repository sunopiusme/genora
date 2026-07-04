"use client";

import { useEffect, useRef, useState } from "react";
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

type ProductDetailProps = {
	product: Product | null;
	onClose: () => void;
};

export function ProductDetail({ product, onClose }: ProductDetailProps) {
	const surface = usePortalSurface(SURFACE_ELEMENT_ID);

	if (!product || !surface) {
		return null;
	}

	return createPortal(
		<ProductDetailModal product={product} onClose={onClose} />,
		surface,
	);
}

type ProductDetailModalProps = {
	product: Product;
	onClose: () => void;
};

function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
	const panelRef = useRef<HTMLDivElement>(null);
	const attachProduct = useComposerStore((state) => state.attach);
	const isMobile = useMobileViewport();
	const isDragging = useSwipeToDismiss(panelRef, onClose, isMobile);

	useEscapeKey(onClose);
	useInitialFocus(panelRef);
	useSurfaceFocus(SURFACE_ELEMENT_ID);

	function handleAskAssistant() {
		attachProduct(product);
		onClose();
	}

	function stopBackdropClose(event: React.MouseEvent<HTMLDivElement>) {
		event.stopPropagation();
	}

	const panelClassName = isDragging ? styles.panelDragging : styles.panel;

	return (
		<div className={styles.overlay} onClick={onClose}>
			<div
				ref={panelRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby="product-detail-title"
				tabIndex={-1}
				className={panelClassName}
				onClick={stopBackdropClose}
			>
				{isMobile && <div className={styles.grabber} aria-hidden="true" />}
				<div className={styles.controls}>
					<ShareMenu product={product} />
					<button
						type="button"
						className={styles.iconButton}
						onClick={onClose}
						aria-label="Закрыть"
						title="Закрыть"
					>
						<Icon icon="solar:close-linear" aria-hidden="true" />
					</button>
				</div>

				<div className={styles.layout}>
					<ProductHero product={product} />
					<ProductPanel product={product} onAskAssistant={handleAskAssistant} />
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
		<div className={styles.hero}>
			<div className={styles.heroGrid} aria-hidden="true" />
			<span
				className={styles.heroLogo}
				style={
					{
						"--logo-url": `url(/brands/${product.logoSlug}.svg)`,
					} as React.CSSProperties
				}
				role="img"
				aria-label={product.provider}
			/>
		</div>
	);
}

type ProductPanelProps = {
	product: Product;
	onAskAssistant: () => void;
};

function ProductPanel({ product, onAskAssistant }: ProductPanelProps) {
	return (
		<div className={styles.content}>
			<p className={styles.eyebrow}>{product.provider}</p>
			<h2 id="product-detail-title" className={styles.name}>
				{product.name}
			</h2>
			<p className={styles.description}>{product.description}</p>

			<div className={styles.divider} />

			<p className={styles.priceRow}>
				<span className={styles.amount}>{product.priceLabel}</span>
				<span className={styles.separator} aria-hidden="true">
					/
				</span>
				<span className={styles.period}>{product.periodLabel}</span>
			</p>

			<div className={styles.actions}>
				<button type="button" className={styles.primaryAction}>
					Купить подписку
				</button>
				<button
					type="button"
					className={styles.secondaryAction}
					onClick={onAskAssistant}
				>
					<Icon icon="solar:paperclip-linear" aria-hidden="true" />
					Спросить ассистента
				</button>
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
				aria-label="Поделиться"
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

function useSwipeToDismiss(
	panelRef: React.RefObject<HTMLDivElement | null>,
	onDismiss: () => void,
	isEnabled: boolean,
) {
	const [isDragging, setIsDragging] = useState(false);

	useEffect(() => {
		if (!isEnabled) {
			return;
		}
		const panelElement = panelRef.current;
		if (!panelElement) {
			return;
		}
		const panel: HTMLDivElement = panelElement;

		let activePointerId: number | null = null;
		let startY = 0;
		let lastY = 0;
		let lastTime = 0;
		let velocity = 0;
		let dragOffset = 0;

		function handlePointerDown(event: PointerEvent) {
			if (activePointerId !== null || panel.scrollTop > 0) {
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
			if (dragOffset === 0 && panel.scrollTop > 0) {
				activePointerId = null;
				return;
			}
			dragOffset = Math.max(deltaY, 0);
			if (!panel.hasPointerCapture(event.pointerId)) {
				capturePointerSafely(panel, event.pointerId);
				setIsDragging(true);
			}
			panel.style.transform = `translateY(${dragOffset}px)`;
		}

		function handlePointerEnd(event: PointerEvent) {
			if (event.pointerId !== activePointerId) {
				return;
			}
			const shouldDismiss =
				dragOffset > panel.offsetHeight * SWIPE_DISMISS_DISTANCE_RATIO ||
				(dragOffset > 0 && velocity > SWIPE_DISMISS_VELOCITY_PX_PER_MS);
			activePointerId = null;
			dragOffset = 0;
			setIsDragging(false);
			if (shouldDismiss) {
				onDismiss();
				return;
			}
			panel.style.transform = "";
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
	}, [isEnabled, onDismiss, panelRef]);

	return isDragging;
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

function usePortalSurface(elementId: string) {
	const [surface, setSurface] = useState<HTMLElement | null>(null);

	useEffect(() => {
		setSurface(document.getElementById(elementId));
	}, [elementId]);

	return surface;
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
			targetRef.current?.focus();
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
