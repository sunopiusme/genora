"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./showcase-actions.module.css";

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 15V3" />
      <path d="m8 7 4-4 4 4" />
      <path d="M4 13v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="19" cy="12" r="1.75" />
    </svg>
  );
}

export function ShowcaseActions() {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url });
        return;
      } catch {
        // Пользователь отменил системный диалог — ничего не делаем
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // Буфер обмена недоступен
    }
  };

  return (
    <div className={styles.actions}>
      <button
        type="button"
        className={styles.share}
        onClick={handleShare}
        data-copied={copied || undefined}
      >
        <span className={styles.shareIcon}>
          <ShareIcon />
        </span>
        <span className={styles.shareLabel}>
          {copied ? "Скопировано" : "Поделиться"}
        </span>
      </button>
      <button
        type="button"
        className={styles.more}
        aria-label="Дополнительные действия"
        aria-haspopup="menu"
      >
        <DotsIcon />
      </button>
    </div>
  );
}
