"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import styles from "./full-access-dialog.module.css";

type Props = {
  onAccept: () => void;
  onDecline: () => void;
};

export function FullAccessDialog({ onAccept, onDecline }: Props) {
  const acceptRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    acceptRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDecline();
    };
    document.addEventListener("keydown", handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onDecline]);

  return createPortal(
    <div className={styles.overlay} onMouseDown={onDecline}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="full-access-title"
        aria-describedby="full-access-desc"
        className={styles.dialog}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.iconBadge} aria-hidden="true">
          <ShieldAlertIcon />
        </div>
        <div className={styles.body}>
          <h2 id="full-access-title" className={styles.title}>
            Включить полный доступ?
          </h2>
          <p id="full-access-desc" className={styles.description}>
            Агент сможет выполнять команды и изменять репозиторий без
            подтверждения каждого действия. Вы сможете вернуться к
            стандартному доступу в любой момент.
          </p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.declineBtn}
            onClick={onDecline}
          >
            Отмена
          </button>
          <button
            ref={acceptRef}
            type="button"
            className={styles.acceptBtn}
            onClick={onAccept}
          >
            Включить полный доступ
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ShieldAlertIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 10.417c0-3.198 0-4.797.378-5.335c.377-.537 1.88-1.052 4.887-2.081l.573-.196C10.405 2.268 11.188 2 12 2s1.595.268 3.162.805l.573.196c3.007 1.029 4.51 1.544 4.887 2.081C21 5.62 21 7.22 21 10.417v1.574c0 5.638-4.239 8.375-6.899 9.536C13.38 21.842 13.02 22 12 22s-1.38-.158-2.101-.473C7.239 20.365 3 17.63 3 11.991v-1.574Z" />
      <path d="M12 8v4.5" />
      <circle cx="12" cy="15.75" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
