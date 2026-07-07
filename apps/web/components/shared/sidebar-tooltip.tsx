"use client";

import {
  useEffect,
  useState,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import styles from "./sidebar-tooltip.module.css";

const TOOLTIP_GAP_PX = 20;

type TooltipPosition = {
  top: number;
  left: number;
};

type SidebarTooltipProps = {
  label: string;
  isEnabled: boolean;
  children: ReactNode;
  className?: string;
};

export function SidebarTooltip({
  label,
  isEnabled,
  children,
  className,
}: SidebarTooltipProps) {
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  function showTooltip(
    event: MouseEvent<HTMLDivElement> | FocusEvent<HTMLDivElement>,
  ) {
    const triggerRect = event.currentTarget.getBoundingClientRect();
    setPosition({
      top: triggerRect.top + triggerRect.height / 2,
      left: triggerRect.right + TOOLTIP_GAP_PX,
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
        <span className={styles.tooltip} style={position} aria-hidden="true">
          {label}
        </span>
      )}
    </div>
  );
}
