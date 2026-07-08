"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

import styles from "./toast.module.css";

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
