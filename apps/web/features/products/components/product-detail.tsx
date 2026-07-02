"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/lib/icon";
import { useComposerStore } from "@/stores/composer-store";
import type { Product } from "../types";
import styles from "./product-detail.module.css";

const SURFACE_ELEMENT_ID = "dashboardSurface";
const COPIED_RESET_DELAY_MS = 1500;

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

	useEscapeKey(onClose);
	useInitialFocus(panelRef);

	function handleAskAssistant() {
		attachProduct(product);
		onClose();
	}

	function stopBackdropClose(event: React.MouseEvent<HTMLDivElement>) {
		event.stopPropagation();
	}

	return (
		<div className={styles.overlay} onClick={onClose}>
			<div
				ref={panelRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby="product-detail-title"
				tabIndex={-1}
				className={styles.panel}
				onClick={stopBackdropClose}
			>
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
			<p className={styles.wordmark}>{product.provider}</p>
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
				onClick={toggleMenu}
				aria-label="Поделиться"
				title="Поделиться"
				aria-haspopup="true"
				aria-expanded={isOpen}
			>
				<Icon icon="solar:share-linear" aria-hidden="true" />
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
					<div className={styles.shareDivider} aria-hidden="true" />
					<button
						type="button"
						className={styles.shareItem}
						onClick={handleShareTelegram}
						role="menuitem"
					>
						<span className={styles.shareItemLabel}>Отправить в Telegram</span>
						<span className={styles.shareItemGlyph}>
							<Icon icon="solar:plain-linear" aria-hidden="true" />
						</span>
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
	const label = isCopied ? "Скопировано" : "Копировать ссылку";
	const glyphClassName = isCopied
		? styles.shareItemGlyphSuccess
		: styles.shareItemGlyph;

	return (
		<>
			<span className={styles.shareItemLabel}>{label}</span>
			<span className={glyphClassName}>
				<Icon icon={iconName} aria-hidden="true" />
			</span>
		</>
	);
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

function buildProductShareUrl(productId: Product["id"]) {
	if (typeof window === "undefined") {
		return "";
	}
	return `${window.location.origin}/products?id=${productId}`;
}

function buildTelegramShareUrl(product: Product) {
	const shareUrl = buildProductShareUrl(product.id);
	const shareText = `${product.name} — ${product.priceLabel}/${product.periodLabel}`;
	const encodedUrl = encodeURIComponent(shareUrl);
	const encodedText = encodeURIComponent(shareText);
	const telegramShareBaseUrl = "https://t.me/share/url";
	return `${telegramShareBaseUrl}?url=${encodedUrl}&text=${encodedText}`;
}
