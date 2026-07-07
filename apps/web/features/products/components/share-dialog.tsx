"use client";

import { useEffect, useRef, useState } from "react";
import { Logo } from "@genora/ui";
import { IMESSAGE_ICON, MAIL_ICON, TELEGRAM_ICON } from "./share-icons";
import styles from "./share-dialog.module.css";

const COPIED_RESET_DELAY_MS = 1600;

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
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="2.1" />
      <circle cx="12" cy="12" r="2.1" />
      <circle cx="19" cy="12" r="2.1" />
    </svg>
  );
}

type ShareMenuProps = {
  onClose: () => void;
};

export function ShareMenu({ onClose }: ShareMenuProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const [host, setHost] = useState("");
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPageUrl(window.location.href);
    setHost(window.location.hostname);
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const shareTitle = "Genora Pro";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setIsCopied(true);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(
        () => setIsCopied(false),
        COPIED_RESET_DELAY_MS,
      );
    } catch {
      return;
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      await handleCopy();
      return;
    }
    try {
      await navigator.share({ title: shareTitle, url: pageUrl });
      onClose();
    } catch {
      return;
    }
  };

  const apps = [
    {
      id: "more",
      label: "Ещё",
      icon: null,
      hasIconPadding: false,
      onClick: handleNativeShare,
    },
    {
      id: "telegram",
      label: "Telegram",
      icon: TELEGRAM_ICON,
      hasIconPadding: true,
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
      icon: IMESSAGE_ICON,
      hasIconPadding: false,
      onClick: () => {
        window.location.href = `sms:?&body=${encodeURIComponent(`${shareTitle} ${pageUrl}`)}`;
      },
    },
    {
      id: "mail",
      label: "Почта",
      icon: MAIL_ICON,
      hasIconPadding: false,
      onClick: () => {
        window.location.href = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(pageUrl)}`;
      },
    },
  ];

  return (
    <div className={styles.panel} role="dialog" aria-label="Поделиться">
      <div className={styles.header}>
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
            {app.icon ? (
              <span className={styles.tile}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={app.icon}
                  alt=""
                  className={
                    app.hasIconPadding
                      ? `${styles.tileImg} ${styles.tileImgZoom}`
                      : styles.tileImg
                  }
                />
              </span>
            ) : (
              <span className={`${styles.tile} ${styles.tileMore}`}>
                <MoreGlyph />
              </span>
            )}
            <span className={styles.appLabel}>{app.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.divider} role="separator" />

      <button type="button" className={styles.copyItem} onClick={handleCopy}>
        <span>{isCopied ? "Скопировано" : "Копировать ссылку"}</span>
        <span className={styles.copyIcon} data-copied={isCopied || undefined}>
          <CopyGlyph />
        </span>
      </button>
    </div>
  );
}
