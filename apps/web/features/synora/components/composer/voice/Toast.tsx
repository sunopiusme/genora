"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

import styles from "./Toast.module.css";

/* ─────────────────────────────────────────
   Toast — alert-уведомление, всплывающее
   поверх всего интерфейса в правом верхнем
   углу viewport'а.

   • Рендерится через createPortal в document.body,
     чтобы быть НАД любыми stacking-context'ами
     композера (popover'ы пикеров, mentions, и т.д.).
   • Auto-dismiss по timeout, плюс manual close
     через крестик слева.
   • Дизайн: blood-red surface для error-state,
     hairline + close-icon, ink-light текст.
   ───────────────────────────────────────── */

type Props = {
  message: string;
  duration?: number;
  onDismiss: () => void;
};

export function Toast({ message, duration = 4000, onDismiss }: Props) {
  useEffect(() => {
    const id = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(id);
  }, [duration, onDismiss]);

  // SSR-safe portal: на сервере document
  // отсутствует, рендерим null. В client'e
  // body уже доступен к моменту mount'а.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className={styles.layer} aria-live="polite" aria-atomic="true">
      <div className={styles.toast} role="alert">
        <button
          type="button"
          className={styles.close}
          aria-label="Закрыть"
          onClick={onDismiss}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M6 6 18 18M18 6 6 18" />
          </svg>
        </button>
        <span className={styles.text}>{message}</span>
      </div>
    </div>,
    document.body,
  );
}
