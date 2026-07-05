"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { Button } from "@genora/ui";
import { getBrandLogoCssUrl } from "../brand-logos";
import type { Product } from "../types";
import styles from "./product-card.module.css";
import { TierSelector } from "./tier-selector";
import { TierValueTransition } from "./tier-value-transition";

const CLICK_MOVEMENT_THRESHOLD_PX = 6;
const DOUBLE_CLICK_GRACE_MS = 220;

type ProductCardProps = {
  product: Product;
  onOpen: () => void;
  onBuy?: (tierIndex: number) => void;
};

export function ProductCard({ product, onOpen, onBuy }: ProductCardProps) {
  const openGesture = useCardOpenGesture(onOpen);
  const [tierIndex, setTierIndex] = useState(product.defaultTierIndex);
  const selectedTier = product.tiers[tierIndex];

  function stopCardGesture(event: MouseEvent | PointerEvent) {
    event.stopPropagation();
    openGesture.clearPressStart();
    openGesture.cancelPendingOpen();
  }

  function handleCoverClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    openGesture.clearPressStart();
    openGesture.openImmediately();
  }

  function handleBuyClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    openGesture.clearPressStart();
    openGesture.cancelPendingOpen();
    if (onBuy) {
      onBuy(tierIndex);
    }
  }

  return (
    <article
      className={styles.card}
      onPointerDown={openGesture.handlePointerDown}
      onClick={openGesture.handleCardClick}
      onDoubleClick={openGesture.cancelPendingOpen}
    >
      <button
        type="button"
        className={styles.cover}
        onClick={handleCoverClick}
        aria-label={`Открыть ${product.name}`}
        style={
          {
            "--logo-url": getBrandLogoCssUrl(product.logoSlug),
            "--brand": product.brandColor,
            "--brand-glow": product.brandGlow,
          } as CSSProperties
        }
      >
        <span className={styles.logoTile}>
          <span
            className={styles.logo}
            role="img"
            aria-label={product.provider}
          />
          <span className={styles.reflection} aria-hidden="true" />
        </span>
      </button>
      <div className={styles.info}>
        <div className={styles.nameRow}>
          <h3 className={styles.name}>{product.name}</h3>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: обёртка
					    только гасит всплытие к кликабельной карточке; интерактивность
					    и клавиатура — у триггера и слайдера внутри селектора. */}
          <span
            className={styles.tierArea}
            onPointerDown={stopCardGesture}
            onClick={stopCardGesture}
          >
            <TierSelector
              product={product}
              tierIndex={tierIndex}
              onTierChange={setTierIndex}
              compact
              placement="up"
            />
          </span>
        </div>
        <p className={styles.price}>
          <span className={styles.amount}>
            <TierValueTransition
              text={selectedTier?.priceLabel ?? product.priceLabel}
              order={tierIndex}
            />
          </span>
          <span className={styles.period}>в {product.periodLabel}</span>
        </p>
      </div>
      <Button
        variant="primary"
        size="lg"
        className={styles.action}
        onClick={handleBuyClick}
      >
        Купить
      </Button>
    </article>
  );
}

type PressStartPoint = {
  x: number;
  y: number;
};

function useCardOpenGesture(onOpen: () => void) {
  const pressStartRef = useRef<PressStartPoint | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => cancelPendingOpen();
  }, []);

  function cancelPendingOpen() {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }

  function clearPressStart() {
    pressStartRef.current = null;
  }

  function openImmediately() {
    cancelPendingOpen();
    onOpen();
  }

  function scheduleOpenAfterDoubleClickGrace() {
    cancelPendingOpen();
    openTimerRef.current = setTimeout(() => {
      openTimerRef.current = null;
      onOpen();
    }, DOUBLE_CLICK_GRACE_MS);
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) {
      return;
    }
    pressStartRef.current = { x: event.clientX, y: event.clientY };
  }

  function handleCardClick(event: MouseEvent<HTMLElement>) {
    const pressStart = pressStartRef.current;
    pressStartRef.current = null;

    if (!pressStart) {
      return;
    }
    if (hasPointerMovedTooFar(pressStart, event)) {
      return;
    }
    if (hasActiveTextSelection()) {
      return;
    }

    scheduleOpenAfterDoubleClickGrace();
  }

  return {
    handlePointerDown,
    handleCardClick,
    cancelPendingOpen,
    clearPressStart,
    openImmediately,
  };
}

function hasPointerMovedTooFar(
  pressStart: PressStartPoint,
  event: MouseEvent<HTMLElement>,
) {
  const movedX = Math.abs(event.clientX - pressStart.x);
  const movedY = Math.abs(event.clientY - pressStart.y);
  return (
    movedX > CLICK_MOVEMENT_THRESHOLD_PX || movedY > CLICK_MOVEMENT_THRESHOLD_PX
  );
}

function hasActiveTextSelection() {
  const selection = window.getSelection();
  if (!selection) {
    return false;
  }
  return selection.toString().length > 0;
}
