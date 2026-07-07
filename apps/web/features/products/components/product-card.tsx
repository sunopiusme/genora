"use client";

import {
  useRef,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { Button } from "@genora/ui";
import { getBrandLogoCssUrl } from "../brand-logos";
import type { Product } from "../types";
import styles from "./product-card.module.css";

const CLICK_MOVEMENT_THRESHOLD_PX = 6;

type ProductCardProps = {
  product: Product;
  onOpen: () => void;
};

export function ProductCard({ product, onOpen }: ProductCardProps) {
  const openGesture = useIntentionalOpen(onOpen);
  const startingPrice = getStartingPrice(product);

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
        <p className={styles.price}>
          {startingPrice.hasMultipleTiers ? "от " : ""}
          {startingPrice.priceLabel} в {product.periodLabel}
        </p>
      </div>
      <Button
        variant="primary"
        size="lg"
        className={styles.action}
        onClick={onOpen}
      >
        Купить
      </Button>
    </article>
  );
}

type StartingPrice = {
  priceLabel: string;
  hasMultipleTiers: boolean;
};

/**
 * Карточка витрины показывает минимальную цену («от X ₽») — паттерн
 * App Store. Выбор конкретного тарифа происходит в детальном просмотре.
 */
function getStartingPrice(product: Product): StartingPrice {
  const hasMultipleTiers = product.tiers.length > 1;
  if (product.tiers.length === 0) {
    return { priceLabel: product.priceLabel, hasMultipleTiers };
  }
  const cheapestTier = product.tiers.reduce((cheapest, tier) =>
    parsePriceValue(tier.priceLabel) < parsePriceValue(cheapest.priceLabel)
      ? tier
      : cheapest,
  );
  return { priceLabel: cheapestTier.priceLabel, hasMultipleTiers };
}

function parsePriceValue(priceLabel: string): number {
  return Number(priceLabel.replace(/[^\d]/g, "")) || 0;
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
