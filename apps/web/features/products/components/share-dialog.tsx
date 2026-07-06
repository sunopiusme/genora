"use client";

import { useEffect, useRef, useState } from "react";
import { Logo } from "@genora/ui";
import styles from "./share-dialog.module.css";

function CopyGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="11" height="12" rx="2.5" />
      <path d="M15 9V6.5A2.5 2.5 0 0 0 12.5 4H6.5A2.5 2.5 0 0 0 4 6.5v8A2.5 2.5 0 0 0 6.5 17H9" />
    </svg>
  );
}

function MoreGlyph() {
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

type ShareDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function ShareDialog({ open, onClose }: ShareDialogProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const [host, setHost] = useState("");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    setPageUrl(window.location.href);
    setHost(window.location.hostname);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  if (!open) return null;

  const shareTitle = "Genora Pro";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // Буфер обмена недоступен
    }
  };

  const handleSystemShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: pageUrl });
        onClose();
      } catch {
        // Пользователь отменил системный диалог
      }
    } else {
      handleCopy();
    }
  };

  /* Иконки сервисов — реальные SVG, скачанные из
     Wikimedia Commons и theSVG.org (см. public/share) */
  const apps = [
    {
      id: "airdrop",
      label: "AirDrop",
      icon: "/share/airdrop.svg",
      onClick: handleSystemShare,
    },
    {
      id: "telegram",
      label: "Telegram",
      icon: "/share/telegram.svg",
      onClick: () => {
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareTitle)}`,
          "_blank",
          "noopener,noreferrer",
        );
      },
    },
    {
      id: "messages",
      label: "Сообщения",
      icon: "/share/imessage.svg",
      onClick: () => {
        window.location.href = `sms:?&body=${encodeURIComponent(`${shareTitle} ${pageUrl}`)}`;
      },
    },
    {
      id: "mail",
      label: "Почта",
      icon: "/share/mail.svg",
      onClick: () => {
        window.location.href = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(pageUrl)}`;
      },
    },
  ];

  return (
    <div
      className={styles.overlay}
      onPointerDown={(event) => {
        if (!dialogRef.current?.contains(event.target as Node)) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Поделиться"
      >
        <header className={styles.header}>
          {/* Обложка: наш логотип на чёрном сквиркле */}
          <span className={styles.cover} aria-hidden="true">
            <span className={styles.coverGlow} />
            <Logo className={styles.coverLogo} width="1.75rem" height="1.75rem" />
          </span>
          <div className={styles.headerText}>
            <p className={styles.siteTitle}>{shareTitle}</p>
            <p className={styles.siteHost}>{host}</p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Закрыть"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        <div className={styles.divider} role="separator" />

        <div className={styles.appsRow}>
          {apps.map((app) => (
            <button
              key={app.id}
              type="button"
              className={styles.appButton}
              onClick={app.onClick}
            >
              <span className={styles.tile}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={app.icon} alt="" className={styles.tileImg} />
              </span>
              <span className={styles.appLabel}>{app.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.divider} role="separator" />

        <div className={styles.actionsRow}>
          <button
            type="button"
            className={styles.circleAction}
            onClick={handleCopy}
          >
            <span className={styles.circle} data-copied={copied || undefined}>
              <CopyGlyph />
            </span>
            <span className={styles.appLabel}>
              {copied ? "Скопировано" : "Копировать"}
            </span>
          </button>
          <button
            type="button"
            className={styles.circleAction}
            onClick={handleSystemShare}
          >
            <span className={styles.circle}>
              <MoreGlyph />
            </span>
            <span className={styles.appLabel}>Ещё</span>
          </button>
        </div>
      </div>
    </div>
  );
}
