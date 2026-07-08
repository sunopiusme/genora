"use client";

import { useEffect, useRef, useState } from "react";

import type { PermissionLevel } from "./types";
import { FullAccessDialog } from "./FullAccessDialog";
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

/* Ключ sessionStorage: подтверждение полного доступа спрашиваем
   один раз за сессию вкладки. */
const FULL_ACCESS_CONFIRMED_KEY = "synora-full-access-confirmed";

export function PermissionPicker({ level, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
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
                  setOpen(false);
                  /* Полный доступ при первом выборе за сессию требует
                     подтверждения в модалке; после подтверждения — сразу. */
                  if (
                    option.id === "full" &&
                    level !== "full" &&
                    sessionStorage.getItem(FULL_ACCESS_CONFIRMED_KEY) !== "1"
                  ) {
                    setConfirming(true);
                    return;
                  }
                  onChange(option.id);
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
      {confirming ? (
        <FullAccessDialog
          onAccept={() => {
            sessionStorage.setItem(FULL_ACCESS_CONFIRMED_KEY, "1");
            setConfirming(false);
            onChange("full");
          }}
          onDecline={() => setConfirming(false)}
        />
      ) : null}
    </div>
  );
}

/* ─── Иконки — стиль Solar Linear ──────────
   24×24, stroke 1.5, скруглённая геометрия —
   единая шкала с lib/icon.tsx. Инлайн-SVG:
   без сетевых загрузок и мигания. */

const baseProps = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/* Ладонь «стоп» — стандартный доступ. */
function HandIcon() {
  return (
    <svg {...baseProps}>
      <path d="M11 11V5.25a1.5 1.5 0 0 1 3 0V11" />
      <path d="M14 11V4.25a1.5 1.5 0 0 1 3 0V11" />
      <path d="M17 11V6.25a1.5 1.5 0 0 1 3 0v8.25a6 6 0 0 1-6 6h-1a5 5 0 0 1-4-2l-2.5-4.5a1.5 1.5 0 0 1 2.4-1.8L11 14" />
      <path d="M11 11V7.75" />
    </svg>
  );
}

/* Solar shield-check-linear. */
function ShieldCheckIcon() {
  return (
    <svg {...baseProps}>
      <path d="M3 10.417c0-3.198 0-4.797.378-5.335c.377-.537 1.88-1.052 4.887-2.081l.573-.196C10.405 2.268 11.188 2 12 2s1.595.268 3.162.805l.573.196c3.007 1.029 4.51 1.544 4.887 2.081C21 5.62 21 7.22 21 10.417v1.574c0 5.638-4.239 8.375-6.899 9.536C13.38 21.842 13.02 22 12 22s-1.38-.158-2.101-.473C7.239 20.365 3 17.63 3 11.991v-1.574Z" />
      <path d="m9.5 12.4 1.714 1.6L15.5 10" />
    </svg>
  );
}

/* Solar shield-warning-linear. */
function ShieldAlertIcon() {
  return (
    <svg {...baseProps}>
      <path d="M3 10.417c0-3.198 0-4.797.378-5.335c.377-.537 1.88-1.052 4.887-2.081l.573-.196C10.405 2.268 11.188 2 12 2s1.595.268 3.162.805l.573.196c3.007 1.029 4.51 1.544 4.887 2.081C21 5.62 21 7.22 21 10.417v1.574c0 5.638-4.239 8.375-6.899 9.536C13.38 21.842 13.02 22 12 22s-1.38-.158-2.101-.473C7.239 20.365 3 17.63 3 11.991v-1.574Z" />
      <path d="M12 8v4.5" />
      <circle cx="12" cy="15.75" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* Solar check-read-linear (одиночная галочка). */
function CheckIcon() {
  return (
    <svg {...baseProps} strokeWidth={1.8}>
      <path d="m4.5 12.75 4.5 4.5L19.5 6.75" />
    </svg>
  );
}
