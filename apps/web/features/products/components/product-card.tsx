"use client";

import {
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

type ProductCardProps = {
  product: Product;
  onOpen: () => void;
  onBuy?: (tierIndex: number) => void;
};

export function ProductCard({ product, onOpen, onBuy }: ProductCardProps) {
  const openGesture = useIntentionalOpen(onOpen);
  const [tierIndex, setTierIndex] = useState(product.defaultTierIndex);
  const selectedTier = product.tiers[tierIndex];

  function handleBuyClick(_event: MouseEvent<HTMLButtonElement>) {
    if (onBuy) {
      onBuy(tierIndex);
    }
  }

  return (
    <article className={styles.card}>
      <button
        type="button"
        className={styles.cover}
        onPointerDown={openGesture.handlePointerDown}
        onClick={openGesture.handleClick}
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
          <h3 className={styles.name}>
            <button
              type="button"
              className={styles.nameButton}
              onPointerDown={openGesture.handlePointerDown}
              onClick={openGesture.handleClick}
            >
              {product.name}
            </button>
          </h3>
          <span className={styles.tierArea}>
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

/**
 * Открывает детальный просмотр только по намеренному клику: если между
 * нажатием и отпусканием указатель заметно сместился (перетаскивание,
 * скролл) или пользователь выделял текст — открытие не срабатывает.
 */
function useIntentionalOpen(onOpen: () => void) {
  const pressStartRef = useRef<PressStartPoint | null>(null);

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) {
      return;
    }
    pressStartRef.current = { x: event.clientX, y: event.clientY };
  }

  function handleClick(event: MouseEvent<HTMLElement>) {
    const pressStart = pressStartRef.current;
    pressStartRef.current = null;

    // Клик с клавиатуры (Enter/Space) не проходит через pointerdown —
    // считаем его намеренным и открываем сразу.
    if (event.detail > 0) {
      if (!pressStart) {
        return;
      }
      if (hasPointerMovedTooFar(pressStart, event)) {
        return;
      }
      if (hasActiveTextSelection()) {
        return;
      }
    }

    onOpen();
  }

  return {
    handlePointerDown,
    handleClick,
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
