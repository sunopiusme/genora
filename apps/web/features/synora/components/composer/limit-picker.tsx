"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./limit-picker.module.css";

const USAGE_PERCENT = 62;
const USAGE_RESET_LABEL = "Сбросится через 3 дня";

export function LimitPicker() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!wrapRef.current) return;
      if (wrapRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Лимит использован на ${USAGE_PERCENT}%`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={styles.triggerIcon} aria-hidden="true">
          <GaugeIcon />
        </span>
        <span className={styles.triggerLabel}>Лимит</span>
        <span className={styles.triggerValue}>{USAGE_PERCENT}%</span>
        <span className={styles.triggerChevron} aria-hidden="true">
          <ChevronDownIcon />
        </span>
      </button>

      {open ? (
        <div className={styles.popover} role="dialog" aria-label="Лимит запросов">
          <div className={styles.usage}>
            <div className={styles.usageHeader}>
              <span className={styles.usageLabel}>Использовано</span>
              <span className={styles.usageValue}>{USAGE_PERCENT}%</span>
            </div>
            <div
              className={styles.usageBar}
              role="progressbar"
              aria-label="Использование лимита"
              aria-valuenow={USAGE_PERCENT}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={styles.usageFill}
                style={{ width: `${USAGE_PERCENT}%` }}
              />
            </div>
            <div className={styles.usageMeta}>{USAGE_RESET_LABEL}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const baseProps = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function GaugeIcon() {
  return (
    <svg {...baseProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="m12 12 3.5-3.5" />
      <path d="M12 6.5v.01M17.5 12h.01M6.5 12h.01" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg {...baseProps}>
      <path d="m19 9-7 6-7-6" />
    </svg>
  );
}
