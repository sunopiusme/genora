"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import styles from "./sidebar-tooltip.module.css";

const TOOLTIP_GAP_RIGHT_PX = 20;
const TOOLTIP_GAP_BOTTOM_PX = 10;
const VIEWPORT_MARGIN_PX = 12;

type TooltipPosition = {
  top: number;
  left: number;
};

type TooltipPlacement = "right" | "bottom";

type SidebarTooltipProps = {
  label: string;
  isEnabled: boolean;
  children: ReactNode;
  className?: string;
  placement?: TooltipPlacement;
};

export function SidebarTooltip({
  label,
  isEnabled,
  children,
  className,
  placement = "right",
}: SidebarTooltipProps) {
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const tooltipRef = useRef<HTMLSpanElement | null>(null);

  /* Не даём тултипу с нижним размещением выходить за правый/левый
  край вьюпорта: после рендера измеряем ширину и сдвигаем центр. */
  useLayoutEffect(() => {
    if (!position || placement !== "bottom") return;
    const tooltipEl = tooltipRef.current;
    if (!tooltipEl) return;
    const halfWidth = tooltipEl.offsetWidth / 2;
    const minLeft = VIEWPORT_MARGIN_PX + halfWidth;
    const maxLeft = window.innerWidth - VIEWPORT_MARGIN_PX - halfWidth;
    const clampedLeft = Math.min(Math.max(position.left, minLeft), maxLeft);
    if (clampedLeft !== position.left) {
      setPosition({ top: position.top, left: clampedLeft });
    }
  }, [position, placement]);

  function showTooltip(
    event: MouseEvent<HTMLDivElement> | FocusEvent<HTMLDivElement>,
  ) {
    const triggerRect = event.currentTarget.getBoundingClientRect();
    if (placement === "bottom") {
      setPosition({
        top: triggerRect.bottom + TOOLTIP_GAP_BOTTOM_PX,
        left: triggerRect.left + triggerRect.width / 2,
      });
      return;
    }
    setPosition({
      top: triggerRect.top + triggerRect.height / 2,
      left: triggerRect.right + TOOLTIP_GAP_RIGHT_PX,
    });
  }

  /* Показываем тултип по фокусу ТОЛЬКО при навигации с клавиатуры
  (:focus-visible). Иначе браузер, восстанавливая фокус на кнопке при
  возврате на вкладку, повторно открывал тултип, и он висел, пока
  пользователь не наведёт и не уведёт курсор. */
  function handleFocus(event: FocusEvent<HTMLDivElement>) {
    if (
      event.target instanceof HTMLElement &&
      event.target.matches(":focus-visible")
    ) {
      showTooltip(event);
    }
  }

  function hideTooltip() {
    setPosition(null);
  }

  /* Страховка: прячем тултип при уходе из окна/вкладки, чтобы он
  не оставался открытым к моменту возврата. */
  useEffect(() => {
    if (!position) return;
    function handleWindowHide() {
      setPosition(null);
    }
    window.addEventListener("blur", handleWindowHide);
    document.addEventListener("visibilitychange", handleWindowHide);
    return () => {
      window.removeEventListener("blur", handleWindowHide);
      document.removeEventListener("visibilitychange", handleWindowHide);
    };
  }, [position]);

  return (
    <div
      className={className ? `${styles.trigger} ${className}` : styles.trigger}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={handleFocus}
      onBlur={hideTooltip}
    >
      {children}
      {isEnabled && position && (
        <span
          ref={tooltipRef}
          className={
            placement === "bottom"
              ? `${styles.tooltip} ${styles.tooltipBottom}`
              : styles.tooltip
          }
          style={position}
          aria-hidden="true"
        >
          {label}
        </span>
      )}
    </div>
  );
}
