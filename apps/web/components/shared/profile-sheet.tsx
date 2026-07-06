"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Avatar } from "@genora/ui";
import { Icon } from "@/lib/icon";
import { PROFILE, formatBalance } from "@features/profile";
import styles from "./profile-sheet.module.css";

const CLOSE_ANIMATION_MS = 280;

type SheetRow = {
  label: string;
  icon: string;
  value?: string;
  detail?: string;
  href?: string;
  accent?: boolean;
  chevron?: boolean;
};

type SheetSection = {
  title: string;
  rows: SheetRow[];
};

const SHEET_SECTIONS: SheetSection[] = [
  {
    title: "Настройка Genora",
    rows: [
      {
        label: "Персонализация",
        icon: "solar:magic-stick-3-linear",
        href: "/dashboard",
        chevron: true,
      },
      {
        label: "Профиль",
        icon: "solar:user-circle-linear",
        href: "/dashboard",
        chevron: true,
      },
      {
        label: "Настройки",
        icon: "solar:settings-linear",
        href: "/dashboard",
        chevron: true,
      },
    ],
  },
  {
    title: "Аккаунт",
    rows: [
      {
        label: "Баланс",
        icon: "solar:wallet-linear",
        value: formatBalance(PROFILE.balance),
      },
      {
        label: "Email",
        icon: "solar:letter-linear",
        detail: PROFILE.email,
      },
      {
        label: "Подписка",
        icon: "solar:card-2-linear",
        value: PROFILE.plan,
      },
      {
        label: "Улучшить план",
        icon: "solar:star-fall-minimalistic-2-linear",
        href: "/dashboard",
        accent: true,
      },
    ],
  },
  {
    title: "Прочее",
    rows: [
      {
        label: "Помощь",
        icon: "solar:question-circle-linear",
        href: "/dashboard",
        chevron: true,
      },
      {
        label: "Выйти",
        icon: "solar:logout-2-linear",
        href: "/dashboard",
      },
    ],
  },
];

type ProfileSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ProfileSheet({ isOpen, onClose }: ProfileSheetProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isOpen || !isMounted) {
    return null;
  }

  return createPortal(<ProfileSheetPanel onClose={onClose} />, document.body);
}

function ProfileSheetPanel({ onClose }: { onClose: () => void }) {
  const [isClosing, setIsClosing] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  const requestClose = useCallback(() => {
    setIsClosing((closing) => {
      if (closing) {
        return closing;
      }
      closeTimer.current = window.setTimeout(onClose, CLOSE_ANIMATION_MS);
      return true;
    });
  }, [onClose]);

  useEffect(() => {
    return () => window.clearTimeout(closeTimer.current);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        requestClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [requestClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      className={isClosing ? styles.overlayClosing : styles.overlay}
      onClick={requestClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Профиль"
        className={isClosing ? styles.panelClosing : styles.panel}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.closeButton}
            onClick={requestClose}
            aria-label="Закрыть"
          >
            <Icon icon="solar:close-linear" aria-hidden="true" />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.identity}>
            <Avatar
              name={PROFILE.name}
              size="4.5rem"
              className={styles.identityAvatar}
            />
            <p className={styles.identityName}>{PROFILE.name}</p>
          </div>

          {SHEET_SECTIONS.map((section) => (
            <section key={section.title} className={styles.section}>
              <h3 className={styles.sectionTitle}>{section.title}</h3>
              <div className={styles.group}>
                {section.rows.map((row) => (
                  <SheetRowItem
                    key={row.label}
                    row={row}
                    onNavigate={requestClose}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function SheetRowItem({
  row,
  onNavigate,
}: {
  row: SheetRow;
  onNavigate: () => void;
}) {
  const content = (
    <>
      <span className={styles.rowMain}>
        <Icon
          icon={row.icon}
          className={row.accent ? styles.rowGlyphAccent : styles.rowGlyph}
          aria-hidden="true"
        />
        <span className={row.accent ? styles.rowLabelAccent : styles.rowLabel}>
          {row.label}
        </span>
        {row.value && <span className={styles.rowValue}>{row.value}</span>}
        {row.chevron && (
          <Icon
            icon="solar:alt-arrow-right-linear"
            className={styles.rowChevron}
            aria-hidden="true"
          />
        )}
      </span>
      {row.detail && <span className={styles.rowDetail}>{row.detail}</span>}
    </>
  );

  if (row.href) {
    return (
      <Link href={row.href} className={styles.row} onClick={onNavigate}>
        {content}
      </Link>
    );
  }

  return <div className={styles.row}>{content}</div>;
}
