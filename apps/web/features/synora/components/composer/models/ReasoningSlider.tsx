"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { ReasoningLevel } from "./types";
import styles from "./ReasoningSlider.module.css";

/* ─────────────────────────────────────────
   Ползунок уровня reasoning — перенос механики
   TierSlider (features/products/tier-slider):
   pointer-drag по треку c rAF-троттлингом,
   снэп к ближайшему стопу, точки-стопы на
   треке, стрелки/Home/End с клавиатуры и
   кликабельные подписи стопов снизу.

   Визуально — монохром композера (--c-* токены),
   без brand-цвета и dither-эффекта: ползунок
   живёт в popover'е model-пикера и не должен
   спорить с его поверхностью.
   ───────────────────────────────────────── */

type ReasoningSliderProps = {
  levels: ReasoningLevel[];
  levelIndex: number;
  onLevelChange: (index: number) => void;
};

export function ReasoningSlider({
  levels,
  levelIndex,
  onLevelChange,
}: ReasoningSliderProps) {
  const maxIndex = levels.length - 1;
  const currentLevel = levels[levelIndex];

  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef({
    rect: null as DOMRect | null,
    ratio: 0,
    rafId: 0,
    isDragging: false,
  });
  const committedIndexRef = useRef(levelIndex);
  committedIndexRef.current = levelIndex;

  const applyFill = useCallback((ratio: number) => {
    rootRef.current?.style.setProperty("--fill", `${ratio * 100}%`);
  }, []);

  useLayoutEffect(() => {
    if (!gestureRef.current.isDragging) {
      applyFill(maxIndex > 0 ? levelIndex / maxIndex : 0);
    }
  }, [levelIndex, maxIndex, applyFill]);

  useEffect(() => {
    const gesture = gestureRef.current;
    return () => cancelAnimationFrame(gesture.rafId);
  }, []);

  const commitNearestLevel = useCallback(
    (ratio: number) => {
      const nearest = Math.round(ratio * maxIndex);
      if (nearest !== committedIndexRef.current) {
        onLevelChange(nearest);
      }
    },
    [maxIndex, onLevelChange],
  );

  const renderFrame = useCallback(() => {
    const gesture = gestureRef.current;
    gesture.rafId = 0;
    applyFill(gesture.ratio);
    commitNearestLevel(gesture.ratio);
  }, [applyFill, commitNearestLevel]);

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
    commitNearestLevel(gesture.ratio);
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
      onLevelChange(nearest);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    let next = levelIndex;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
        next = Math.min(maxIndex, levelIndex + 1);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        next = Math.max(0, levelIndex - 1);
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
    if (next !== levelIndex) {
      onLevelChange(next);
    }
  }

  return (
    <div ref={rootRef} className={styles.slider}>
      <div
        ref={trackRef}
        className={styles.track}
        role="slider"
        tabIndex={0}
        aria-label="Уровень reasoning"
        aria-valuemin={0}
        aria-valuemax={maxIndex}
        aria-valuenow={levelIndex}
        aria-valuetext={currentLevel?.label}
        aria-orientation="horizontal"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onLostPointerCapture={handlePointerEnd}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.trackInner}>
          <div className={styles.fill} />
          {levels.map((level, index) => (
            <span
              key={level.id}
              className={styles.dot}
              style={
                {
                  "--pos": `${maxIndex > 0 ? (index / maxIndex) * 100 : 0}%`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
        <span className={styles.thumb} />
      </div>
      <div className={styles.stops} aria-hidden="true">
        {levels.map((level, index) => (
          <button
            key={level.id}
            type="button"
            tabIndex={-1}
            className={index === levelIndex ? styles.stopActive : styles.stop}
            style={
              {
                "--pos": `${maxIndex > 0 ? (index / maxIndex) * 100 : 0}%`,
              } as React.CSSProperties
            }
            onClick={() => onLevelChange(index)}
          >
            {level.label}
          </button>
        ))}
      </div>
    </div>
  );
}
