"use client";

import {
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

  function hideTooltip() {
    setPosition(null);
  }

  return (
    <div
      className={className ? `${styles.trigger} ${className}` : styles.trigger}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
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
