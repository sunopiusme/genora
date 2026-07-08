"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import styles from "./composer-input.module.css";

type Side = "top" | "bottom";

type Props = {
  label: string;
  shortcut?: ReactNode;
  side?: Side;
  open?: boolean;
  children: ReactNode;
};

export function Tooltip({
  label,
  shortcut,
  side = "top",
  open,
  children,
}: Props) {
  const [internalVisible, setInternalVisible] = useState(false);
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const timer = useRef<number | null>(null);

  const isMenuOpen = () =>
    !!wrapRef.current?.querySelector('[aria-expanded="true"]');

  const show = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (isMenuOpen()) return;
      setInternalVisible(true);
    }, 450);
  };
  const hide = () => {
    if (timer.current) window.clearTimeout(timer.current);
    setInternalVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const observer = new MutationObserver(() => {
      if (isMenuOpen()) hide();
    });
    observer.observe(node, {
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-expanded"],
    });
    return () => observer.disconnect();
  }, []);

  const visible = open || internalVisible;

  return (
    <span
      ref={wrapRef}
      className={styles.tooltipWrap}
      onMouseEnter={show}
      onMouseLeave={hide}
      onMouseDown={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible ? (
        <span
          className={styles.tooltip}
          data-side={side}
          role="tooltip"
        >
          <span className={styles.tooltipLabel}>{label}</span>
          {shortcut ? (
            <span className={styles.tooltipKbd} aria-hidden="true">
              {shortcut}
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
