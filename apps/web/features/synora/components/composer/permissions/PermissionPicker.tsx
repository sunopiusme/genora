"use client";

import { useEffect, useRef, useState } from "react";

import type { PermissionLevel } from "./types";
import styles from "./PermissionPicker.module.css";

/* ─────────────────────────────────────────
   Permission picker для composer toolbar.

   Три уровня доступа: Standard / Auto-review /
   Full. Last triggers оранжевый акцент по
   всему триггеру (full access — рискованный
   режим, требует визуального предупреждения).
   ───────────────────────────────────────── */

type Props = {
  level: PermissionLevel;
  onChange: (next: PermissionLevel) => void;
};

const OPTIONS: Array<{
  id: PermissionLevel;
  label: string;
  Icon: React.ComponentType;
}> = [
  { id: "standard", label: "Стандартный доступ", Icon: HandIcon },
  { id: "review", label: "Авто-ревью", Icon: ShieldCheckIcon },
  { id: "full", label: "Полный доступ", Icon: ShieldAlertIcon },
];

export function PermissionPicker({ level, onChange }: Props) {
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

  const current = OPTIONS.find((o) => o.id === level) ?? OPTIONS[0]!;
  const TriggerIcon = current.Icon;

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <button
        type="button"
        className={styles.trigger}
        data-level={level}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={styles.triggerIcon} aria-hidden="true">
          <TriggerIcon />
        </span>
        <span className={styles.srOnly}>{current.label}</span>
      </button>
      {open ? (
        <div className={styles.popover} role="menu">
          {OPTIONS.map((option) => {
            const Icon = option.Icon;
            const selected = option.id === level;
            return (
              <button
                key={option.id}
                type="button"
                className={styles.option}
                data-level={option.id}
                data-active={selected}
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
              >
                <span className={styles.optionIcon} aria-hidden="true">
                  <Icon />
                </span>
                <span className={styles.optionLabel}>{option.label}</span>
                {selected ? (
                  <span className={styles.checkIcon} aria-hidden="true">
                    <CheckIcon />
                  </span>
                ) : (
                  <span aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function HandIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 11V5.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M14 11V4.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M17 11V6.5a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6h-1a5 5 0 0 1-4-2L6.5 14a1.5 1.5 0 0 1 2.4-1.8L11 14" />
      <path d="M11 11V8" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function ShieldAlertIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-3Z" />
      <path d="M12 8v4" />
      <circle cx="12" cy="15.2" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 5 5 9-11" />
    </svg>
  );
}
