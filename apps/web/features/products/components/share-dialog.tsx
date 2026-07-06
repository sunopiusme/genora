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

type ShareMenuProps = {
  onClose: () => void;
};

/* Панель «Поделиться» — выпадающее меню, привязанное к кнопке,
   в том же стиле, что и меню категорий по «...» */
export function ShareMenu({ onClose }: ShareMenuProps) {
  const [copied, setCopied] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const [host, setHost] = useState("");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPageUrl(window.location.href);
    setHost(window.location.hostname);
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

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

  const handleAirDrop = async () => {
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

  /* Иконки сервисов — официальные SVG, скачанные из
     Wikimedia Commons и theSVG.org (см. public/share) */
  const apps = [
    {
      id: "airdrop",
      label: "AirDrop",
      icon: "/share/airdrop.svg",
      onClick: handleAirDrop,
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
    <div className={styles.panel} role="dialog" aria-label="Поделиться">
      <div className={styles.header}>
        {/* Обложка: наш логотип на чёрном сквиркле */}
        <span className={styles.cover} aria-hidden="true">
          <Logo className={styles.coverLogo} width="1.5rem" height="1.5rem" />
        </span>
        <div className={styles.headerText}>
          <p className={styles.siteTitle}>{shareTitle}</p>
          <p className={styles.siteHost}>{host}</p>
        </div>
      </div>

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

      <button type="button" className={styles.copyItem} onClick={handleCopy}>
        <span>{copied ? "Скопировано" : "Копировать ссылку"}</span>
        <span className={styles.copyIcon} data-copied={copied || undefined}>
          <CopyGlyph />
        </span>
      </button>
    </div>
  );
}
