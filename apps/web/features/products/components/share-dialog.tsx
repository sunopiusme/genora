"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./share-dialog.module.css";

const TELEGRAM_ICON =
  "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/telegram/default.svg";

function AirDropGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
      <path d="M7.6 16.4a6.2 6.2 0 0 1 0-8.8" />
      <path d="M16.4 7.6a6.2 6.2 0 0 1 0 8.8" />
      <path d="M4.9 19.1a10 10 0 0 1 0-14.2" />
      <path d="M19.1 4.9a10 10 0 0 1 0 14.2" />
    </svg>
  );
}

function MessagesGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3.5c-5.25 0-9.5 3.4-9.5 7.6 0 2.4 1.4 4.55 3.6 5.95-.15 1.05-.7 2.1-1.6 2.9a.4.4 0 0 0 .3.7c1.9-.1 3.45-.85 4.5-1.65.85.2 1.75.3 2.7.3 5.25 0 9.5-3.4 9.5-7.6S17.25 3.5 12 3.5Z" />
    </svg>
  );
}

function MailGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 6.75A2.75 2.75 0 0 1 5.75 4h12.5A2.75 2.75 0 0 1 21 6.75v10.5A2.75 2.75 0 0 1 18.25 20H5.75A2.75 2.75 0 0 1 3 17.25V6.75Zm2.2-.35 6.35 5.3c.27.22.63.22.9 0l6.35-5.3a.9.9 0 0 0-.55-.15H5.75a.9.9 0 0 0-.55.15Z" />
    </svg>
  );
}

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

  const apps = [
    {
      id: "airdrop",
      label: "AirDrop",
      tileClass: styles.tileAirdrop,
      glyph: <AirDropGlyph />,
      onClick: handleSystemShare,
    },
    {
      id: "telegram",
      label: "Telegram",
      tileClass: styles.tileTelegram,
      glyph: (
        // Логотип Telegram с theSVG.org
        // eslint-disable-next-line @next/next/no-img-element
        <img src={TELEGRAM_ICON} alt="" className={styles.tileImg} />
      ),
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
      tileClass: styles.tileMessages,
      glyph: <MessagesGlyph />,
      onClick: () => {
        window.location.href = `sms:?&body=${encodeURIComponent(`${shareTitle} ${pageUrl}`)}`;
      },
    },
    {
      id: "mail",
      label: "Почта",
      tileClass: styles.tileMail,
      glyph: <MailGlyph />,
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
          <img
            src="/genora-app-icon.png"
            alt=""
            className={styles.cover}
            width={56}
            height={56}
          />
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
              <span className={`${styles.tile} ${app.tileClass}`}>
                {app.glyph}
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
            <span
              className={styles.circle}
              data-copied={copied || undefined}
            >
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
