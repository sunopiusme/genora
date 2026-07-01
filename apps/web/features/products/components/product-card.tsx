"use client";

import {
  useEffect,
  useRef,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { Button } from "@genora/ui";
import type { Product } from "../types";
import styles from "./product-card.module.css";

const CLICK_MOVEMENT_THRESHOLD_PX = 6;
const DOUBLE_CLICK_GRACE_MS = 220;

type ProductCardProps = {
  product: Product;
  onOpen: () => void;
};

export function ProductCard({ product, onOpen }: ProductCardProps) {
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const pendingOpen = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pendingOpen.current) {
        clearTimeout(pendingOpen.current);
      }
    };
  }, []);

  function cancelPendingOpen() {
    if (pendingOpen.current) {
      clearTimeout(pendingOpen.current);
      pendingOpen.current = null;
    }
  }

  function openDetail() {
    cancelPendingOpen();
    onOpen();
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) {
      return;
    }
    pointerStart.current = { x: event.clientX, y: event.clientY };
  }

  function handleCardClick(event: MouseEvent<HTMLElement>) {
    const start = pointerStart.current;
    pointerStart.current = null;

    if (!start) {
      return;
    }

    const movedX = Math.abs(event.clientX - start.x);
    const movedY = Math.abs(event.clientY - start.y);
    if (
      movedX > CLICK_MOVEMENT_THRESHOLD_PX ||
      movedY > CLICK_MOVEMENT_THRESHOLD_PX
    ) {
      return;
    }

    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      return;
    }

    cancelPendingOpen();
    pendingOpen.current = setTimeout(() => {
      pendingOpen.current = null;
      onOpen();
    }, DOUBLE_CLICK_GRACE_MS);
  }

  function handleOpenFromButton(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    openDetail();
  }

  return (
    <article
      className={styles.card}
      onPointerDown={handlePointerDown}
      onClick={handleCardClick}
      onDoubleClick={cancelPendingOpen}
    >
      <button
        type="button"
        className={styles.cover}
        onClick={handleOpenFromButton}
        aria-label={`Открыть ${product.name}`}
      >
        <span className={styles.wordmark}>{product.provider}</span>
      </button>

      <div className={styles.info}>
        <h3 className={styles.name}>{product.name}</h3>
        <p className={styles.price}>
          <span className={styles.amount}>{product.priceLabel}</span>
          <span className={styles.separator} aria-hidden="true">
            /
          </span>
          <span className={styles.period}>{product.periodLabel}</span>
        </p>
      </div>

      <Button
        variant="primary"
        size="lg"
        className={styles.action}
        onClick={handleOpenFromButton}
      >
        Купить
      </Button>
    </article>
  );
}
