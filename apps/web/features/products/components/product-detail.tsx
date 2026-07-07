"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/lib/icon";
import { useComposerStore } from "../stores/composer-store";
import { useMobileViewport } from "../hooks/use-mobile-viewport";
import { getBrandLogoCssUrl } from "../brand-logos";
import type { Product } from "../types";
import styles from "./product-detail.module.css";
import { ShareMenu as ShareDialogMenu } from "./share-dialog";
import shareStyles from "./share-dialog.module.css";
import { TierSelector } from "./tier-selector";
import { TierValueTransition } from "./tier-value-transition";

const SURFACE_ELEMENT_ID = "showcaseSurface";
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
  const attachProduct = useComposerStore((state) => state.attachProduct);
  const isMobile = useMobileViewport();
  const requestClose = useDelayedClose(
    onClose,
    isMobile ? CLOSE_ANIMATION_MOBILE_MS : 0,
  );
  const swipe = useSwipeToDismiss(
    panelRef,
    bodyRef,
    requestClose.begin,
    isMobile,
  );
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
          "--logo-url": getBrandLogoCssUrl(product.logoSlug),
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
          {tier && (
            <>
              {" "}
              <TierValueTransition text={tier.name} order={tierIndex} />
            </>
          )}
        </h2>
      </div>

      {hasTiers && tier && (
        <div className={styles.tierSelectorSlot}>
          <TierSelector
            product={product}
            tierIndex={tierIndex}
            onTierChange={setTierIndex}
          />
        </div>
      )}

      <p className={styles.priceRow}>
        <span className={styles.amount}>
          <TierValueTransition
            text={tier?.priceLabel ?? product.priceLabel}
            order={tierIndex}
          />
        </span>
        <span className={styles.period}>{`/ ${product.periodLabel}`}</span>
      </p>

      <span className={styles.divider} aria-hidden="true" />

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

type ShareMenuProps = {
  product: Product;
};

function ShareMenu({ product }: ShareMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, isOpen, closeMenu);

  useEffect(() => {
    setShareUrl(buildProductShareUrl(product.id));
  }, [product.id]);

  function closeMenu() {
    setIsOpen(false);
  }

  function toggleMenu() {
    setIsOpen((prev) => !prev);
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
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <Icon icon="solar:square-share-line-linear" aria-hidden="true" />
      </button>
      {isOpen && (
        <ShareDialogMenu
          onClose={closeMenu}
          title={product.name}
          url={shareUrl}
          cover={<ProductShareCover product={product} />}
        />
      )}
    </div>
  );
}

type ProductShareCoverProps = {
  product: Product;
};

function ProductShareCover({ product }: ProductShareCoverProps) {
  return (
    <span
      className={shareStyles.cover}
      style={
        {
          "--logo-url": getBrandLogoCssUrl(product.logoSlug),
          "--brand": product.brandColor,
        } as React.CSSProperties
      }
      aria-hidden="true"
    >
      <span className={shareStyles.coverProductGlow} />
      <span className={shareStyles.coverProductLogo} />
    </span>
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
  const [isSettling, setIsSettling] = useState(false);
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

function buildProductShareUrl(productId: Product["id"]) {
  if (typeof window === "undefined") {
    return "";
  }
  return `${window.location.origin}/products?id=${productId}`;
}
