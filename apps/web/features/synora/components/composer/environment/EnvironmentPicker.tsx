"use client";

import { useEffect, useRef, useState } from "react";

import type { EnvironmentMode } from "./types";
import styles from "./EnvironmentPicker.module.css";

/* ─────────────────────────────────────────
   Environment picker для composer footer'а.

   Опции «Запуск в»: локально, новый worktree,
   Codex web (ext-link), облако (disabled).
   Внизу — submenu «Лимит» с прогресс-баром
   использования.
   ───────────────────────────────────────── */

type Props = {
  mode: EnvironmentMode;
  onChange: (next: EnvironmentMode) => void;
};

const OPTIONS: Array<{
  id: EnvironmentMode;
  label: string;
  Icon: React.ComponentType;
  disabled?: boolean;
}> = [
  { id: "local", label: "Локально", Icon: MonitorIcon },
  { id: "worktree", label: "Новый worktree", Icon: GitForkIcon },
  { id: "cloud", label: "Отправить в облако", Icon: CloudOffIcon, disabled: true },
];

export function EnvironmentPicker({ mode, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!wrapRef.current) return;
      if (wrapRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const current = OPTIONS.find((o) => o.id === mode) ?? OPTIONS[0]!;
  const TriggerIcon = current.Icon;

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={styles.triggerIcon} aria-hidden="true">
          <TriggerIcon />
        </span>
        <span className={styles.triggerLabel}>{current.label}</span>
        <span className={styles.triggerChevron} aria-hidden="true">
          <ChevronDownIcon />
        </span>
      </button>

      {open ? (
        <div className={styles.popover} role="menu">
          <div className={styles.sectionTitle}>Запуск в</div>
          {OPTIONS.map((option) => {
            const Icon = option.Icon;
            const selected = option.id === mode;
            return (
              <button
                key={option.id}
                type="button"
                className={styles.item}
                data-active={selected}
                data-disabled={option.disabled || undefined}
                disabled={option.disabled}
                onClick={() => {
                  if (option.disabled) return;
                  onChange(option.id);
                  setOpen(false);
                }}
              >
                <span className={styles.itemIcon} aria-hidden="true">
                  <Icon />
                </span>
                <span className={styles.itemLabel}>{option.label}</span>
                {selected ? (
                  <span className={styles.itemCheck} aria-hidden="true">
                    <CheckIcon />
                  </span>
                ) : (
                  <span aria-hidden="true" />
                )}
              </button>
            );
          })}

          <div className={styles.divider} />

          <div className={styles.item} data-has-submenu="true" role="menuitem">
            <span className={styles.itemIcon} aria-hidden="true">
              <GaugeIcon />
            </span>
            <span className={styles.itemLabel}>Лимит</span>
            <span className={styles.itemSuffix} aria-hidden="true">
              <ChevronRightIcon />
            </span>
            <div className={styles.submenu} role="menu">
              <div className={styles.usageRow}>
                <div className={styles.usageHeader}>
                  <span>Использовано</span>
                  <span className={styles.usageValue}>62%</span>
                </div>
                <div className={styles.usageBar}>
                  <div
                    className={styles.usageFill}
                    style={{ width: "62%" }}
                  />
                </div>
                <div className={styles.usageMeta}>
                  Сбросится через 3 дня
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ─── Иконки ─────────────────────────── */

const baseProps = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function MonitorIcon() {
  return (
    <svg {...baseProps}>
      <rect x="2.5" y="4" width="19" height="13" rx="2" />
      <path d="M8.5 21h7M12 17v4" />
    </svg>
  );
}

function GitForkIcon() {
  return (
    <svg {...baseProps}>
      <path d="M9 6 5 10v4" />
      <path d="m15 6 4 4v4" />
      <circle cx="5" cy="18" r="2" />
      <circle cx="19" cy="18" r="2" />
      <circle cx="12" cy="4" r="2" />
    </svg>
  );
}

function CloudOffIcon() {
  return (
    <svg {...baseProps}>
      <path d="M5 18a4 4 0 0 1 1-7.9" />
      <path d="M9 7.5a5 5 0 0 1 9.5 2.5 4 4 0 0 1-1 7.6" />
      <path d="m4 4 16 16" />
    </svg>
  );
}

function GaugeIcon() {
  return (
    <svg {...baseProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="m12 12 5-3" />
      <path d="M12 7v0" />
      <path d="M16 12v0" />
      <path d="M8 12v0" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg {...baseProps} strokeWidth={2}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg {...baseProps} strokeWidth={2}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg {...baseProps} strokeWidth={2.4}>
      <path d="m5 12 5 5 9-11" />
    </svg>
  );
}
