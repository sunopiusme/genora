"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Icon } from "@/lib/icon";
import type { Product } from "../types";
import styles from "./tier-selector.module.css";
import { TierSlider } from "./tier-slider";
import { TierValueTransition } from "./tier-value-transition";

type TierSelectorProps = {
  product: Product;
  tierIndex: number;
  onTierChange: (index: number) => void;
};

export function TierSelector({
  product,
  tierIndex,
  onTierChange,
}: TierSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const tier = product.tiers[tierIndex];

  const anchorViewportX = useRef(0);

  function toggleOpen() {
    setIsOpen((prev) => !prev);
  }

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }
    const container = containerRef.current;
    const menu = menuRef.current;
    if (!container || !menu) {
      return;
    }
    {
      const rect = container.getBoundingClientRect();
      anchorViewportX.current = rect.left + rect.width / 2;
    }
    const updateMenuLeft = () => {
      const rect = container.getBoundingClientRect();
      const menuWidth = menu.offsetWidth;
      const viewportWidth = document.documentElement.clientWidth;
      const edgeGap = 12;
      const halfWidth = menuWidth / 2;
      const clampedCenterX = Math.min(
        Math.max(anchorViewportX.current, edgeGap + halfWidth),
        viewportWidth - edgeGap - halfWidth,
      );
      menu.style.left = `${clampedCenterX - rect.left}px`;
    };
    updateMenuLeft();
    const observer = new ResizeObserver(updateMenuLeft);
    observer.observe(container);
    return () => observer.disconnect();
  }, [isOpen]);

  const close = useCallback(() => setIsOpen(false), []);
  useClickOutside(containerRef, isOpen, close);
  useScrollLock(containerRef, isOpen);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
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
        onClick={toggleOpen}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className={styles.tierTriggerCaption}>Уровень</span>
        <span className={styles.tierTriggerValue}>
          <TierValueTransition text={tier?.name ?? ""} order={tierIndex} />
          <Icon
            icon="solar:alt-arrow-down-linear"
            className={
              isOpen ? styles.tierTriggerChevronOpen : styles.tierTriggerChevron
            }
            aria-hidden="true"
          />
        </span>
      </button>
      {isOpen && (
        <div ref={menuRef} className={styles.tierMenu}>
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

function useClickOutside(
  containerRef: React.RefObject<HTMLElement | null>,
  isActive: boolean,
  onOutsideClick: () => void,
) {
  useEffect(() => {
    if (!isActive) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      const container = containerRef.current;
      if (container && !container.contains(target)) {
        onOutsideClick();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [containerRef, isActive, onOutsideClick]);
}

function useScrollLock(
  containerRef: React.RefObject<HTMLElement | null>,
  isActive: boolean,
) {
  useEffect(() => {
    if (!isActive) {
      return;
    }

    function handleScrollAttempt(event: Event) {
      const target = event.target as Node;
      const container = containerRef.current;
      if (container && !container.contains(target)) {
        event.preventDefault();
      }
    }

    const options = { passive: false, capture: true } as const;
    document.addEventListener("wheel", handleScrollAttempt, options);
    document.addEventListener("touchmove", handleScrollAttempt, options);
    return () => {
      document.removeEventListener("wheel", handleScrollAttempt, options);
      document.removeEventListener("touchmove", handleScrollAttempt, options);
    };
  }, [containerRef, isActive]);
}
