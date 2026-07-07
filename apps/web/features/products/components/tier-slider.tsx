"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { Product } from "../types";
import { TierDither } from "./tier-dither";
import styles from "./tier-slider.module.css";

type TierSliderProps = {
  product: Product;
  tierIndex: number;
  onTierChange: (index: number) => void;
};

export function TierSlider({
  product,
  tierIndex,
  onTierChange,
}: TierSliderProps) {
  const maxIndex = product.tiers.length - 1;
  const isMaxed = tierIndex === maxIndex;
  const currentTier = product.tiers[tierIndex];

  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef({
    rect: null as DOMRect | null,
    ratio: 0,
    rafId: 0,
    isDragging: false,
  });
  const committedIndexRef = useRef(tierIndex);
  committedIndexRef.current = tierIndex;

  const applyFill = useCallback((ratio: number) => {
    rootRef.current?.style.setProperty("--fill", `${ratio * 100}%`);
  }, []);

  useLayoutEffect(() => {
    if (!gestureRef.current.isDragging) {
      applyFill(maxIndex > 0 ? tierIndex / maxIndex : 0);
    }
  }, [tierIndex, maxIndex, applyFill]);

  useEffect(() => {
    const gesture = gestureRef.current;
    return () => cancelAnimationFrame(gesture.rafId);
  }, []);

  const commitNearestTier = useCallback(
    (ratio: number) => {
      let nearest = Math.round(ratio * maxIndex);
      if (
        gestureRef.current.isDragging &&
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
    const gesture = gestureRef.current;
    gesture.rect = track.getBoundingClientRect();
    gesture.isDragging = true;
    gesture.ratio = ratioFromClientX(event.clientX);
    track.setPointerCapture(event.pointerId);
    rootRef.current?.setAttribute("data-dragging", "true");
    applyFill(gesture.ratio);
    commitNearestTier(gesture.ratio);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    if (!gesture.isDragging) {
      return;
    }
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
    if (!gesture.isDragging) {
      return;
    }
    gesture.isDragging = false;
    cancelAnimationFrame(gesture.rafId);
    gesture.rafId = 0;
    const track = trackRef.current;
    if (track?.hasPointerCapture(event.pointerId)) {
      track.releasePointerCapture(event.pointerId);
    }
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
        onLostPointerCapture={handlePointerEnd}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.tierTrackInner}>
          <div className={styles.tierFill}>
            <TierDither isActive={isMaxed} brandColor={product.brandColor} />
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
