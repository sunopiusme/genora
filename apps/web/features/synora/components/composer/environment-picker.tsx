"use client";

import { useEffect, useRef, useState } from "react";

import type { EnvironmentMode } from "../../types";
import styles from "./environment-picker.module.css";

type Props = {
  mode: EnvironmentMode;
  onChange: (next: EnvironmentMode) => void;
};

const USAGE_PERCENT = 62;
const USAGE_RESET_LABEL = "Сбросится через 3 дня";

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

          <div className={styles.usage}>
            <div className={styles.usageHeader}>
              <span className={styles.usageIcon} aria-hidden="true">
                <GaugeIcon />
              </span>
              <span className={styles.usageLabel}>Лимит</span>
              <span className={styles.usageValue}>{USAGE_PERCENT}%</span>
            </div>
            <div className={styles.usageBody}>
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

function MonitorIcon() {
  return (
    <svg {...baseProps}>
      <path d="M2 10c0-2.828 0-4.243.879-5.121C3.757 4 5.172 4 8 4h8c2.828 0 4.243 0 5.121.879C22 5.757 22 7.172 22 10v1c0 2.828 0 4.243-.879 5.121C20.243 17 18.828 17 16 17H8c-2.828 0-4.243 0-5.121-.879C2 15.243 2 13.828 2 11v-1Z" />
      <path d="M8.5 21h7M12 17v4" />
    </svg>
  );
}

function GitForkIcon() {
  return (
    <svg {...baseProps}>
      <circle cx="12" cy="4.5" r="2" />
      <circle cx="5" cy="17.5" r="2" />
      <circle cx="19" cy="17.5" r="2" />
      <path d="M12 6.5v2c0 1.5-1 2.5-2.5 3.5L5 15.5" />
      <path d="M12 6.5v2c0 1.5 1 2.5 2.5 3.5l4.5 3.5" />
    </svg>
  );
}

function CloudOffIcon() {
  return (
    <svg {...baseProps}>
      <path d="M6.286 19C3.919 19 2 17.104 2 14.765c0-2.34 1.919-4.236 4.286-4.236c.284 0 .562.028.83.08m7.265-2.582a5.8 5.8 0 0 1 1.905-.321c.654 0 1.283.109 1.87.309m-11.04 2.594a5.6 5.6 0 0 1-.354-1.962C6.762 5.528 9.32 3 12.476 3c2.94 0 5.361 2.194 5.68 5.015m-11.04 2.594a4.3 4.3 0 0 1 1.55.634m9.49-3.228C20.392 8.78 22 10.881 22 13.353c0 2.427-1.552 4.495-3.72 5.29" />
      <path d="m10.5 13.5 4 4m0-4-4 4" />
    </svg>
  );
}

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

function CheckIcon() {
  return (
    <svg {...baseProps} strokeWidth={1.8}>
      <path d="m4.5 12.75 4.5 4.5L19.5 6.75" />
    </svg>
  );
}
