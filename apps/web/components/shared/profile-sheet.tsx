"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Avatar } from "@genora/ui";
import { Icon } from "@/lib/icon";
import { useAuthStore } from "@/stores/auth-store";
import { PROFILE, formatBalance } from "@features/profile";
import styles from "./profile-sheet.module.css";

const CLOSE_ANIMATION_MS = 280;

type SheetRow = {
  label: string;
  icon: string;
  value?: string;
  detail?: string;
  href?: string;
  isAccent?: boolean;
  hasChevron?: boolean;
  isLogout?: boolean;
  /* Раздел ещё в разработке: строка неактивна, вместо значения — «Скоро». */
  isSoon?: boolean;
};

type SheetSection = {
  title: string;
  rows: SheetRow[];
};

type ProfileSheetArea = "genora" | "synora";

/* Секции магазина Genora: рабочая ссылка ведёт на существующую страницу
   подписок, разделы без страниц помечены «Скоро». */
const GENORA_SHEET_SECTIONS: SheetSection[] = [
  {
    title: "Настройка Genora",
    rows: [
      {
        label: "Профиль",
        icon: "solar:user-circle-linear",
        isSoon: true,
      },
      {
        label: "Настройки",
        icon: "solar:settings-linear",
        isSoon: true,
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
        href: "/subscriptions",
        isAccent: true,
      },
    ],
  },
  {
    title: "Прочее",
    rows: [
      {
        label: "Помощь",
        icon: "solar:question-circle-linear",
        isSoon: true,
      },
      {
        label: "Выйти",
        icon: "solar:logout-2-linear",
        isLogout: true,
      },
    ],
  },
];

/* Секции песочницы «Синора»: тариф с лимитами сборок и пополнение
   баланса вместо витринных пунктов. Разделы без страниц — «Скоро»
   до внедрения планов и ограничений. */
const SYNORA_SHEET_SECTIONS: SheetSection[] = [
  {
    title: "Песочница",
    rows: [
      {
        label: "Тариф и лимиты",
        icon: "solar:card-2-linear",
        isSoon: true,
      },
      {
        label: "Пополнить",
        icon: "solar:wallet-linear",
        isSoon: true,
      },
      {
        label: "Настройки песочницы",
        icon: "solar:settings-linear",
        isSoon: true,
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
        label: "Профиль",
        icon: "solar:user-circle-linear",
        isSoon: true,
      },
    ],
  },
  {
    title: "Прочее",
    rows: [
      {
        label: "Помощь",
        icon: "solar:question-circle-linear",
        isSoon: true,
      },
      {
        label: "Выйти",
        icon: "solar:logout-2-linear",
        isLogout: true,
      },
    ],
  },
];

const SHEET_SECTIONS_BY_AREA: Record<ProfileSheetArea, SheetSection[]> = {
  genora: GENORA_SHEET_SECTIONS,
  synora: SYNORA_SHEET_SECTIONS,
};

type ProfileSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  area?: ProfileSheetArea;
};

export function ProfileSheet({
  isOpen,
  onClose,
  area = "genora",
}: ProfileSheetProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isOpen || !isMounted) {
    return null;
  }

  return createPortal(
    <ProfileSheetPanel onClose={onClose} area={area} />,
    document.body,
  );
}

function ProfileSheetPanel({
  onClose,
  area,
}: {
  onClose: () => void;
  area: ProfileSheetArea;
}) {
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

          {SHEET_SECTIONS_BY_AREA[area].map((section) => (
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
  const logout = useAuthStore((state) => state.logout);

  function handleLogout() {
    logout();
    onNavigate();
  }

  const content = (
    <>
      <span className={styles.rowMain}>
        <Icon
          icon={row.icon}
          className={row.isAccent ? styles.rowGlyphAccent : styles.rowGlyph}
          aria-hidden="true"
        />
        <span className={row.isAccent ? styles.rowLabelAccent : styles.rowLabel}>
          {row.label}
        </span>
        {row.value && <span className={styles.rowValue}>{row.value}</span>}
        {row.isSoon && <span className={styles.rowSoonChip}>Скоро</span>}
        {row.hasChevron && (
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

  if (row.isLogout) {
    return (
      <button type="button" className={styles.row} onClick={handleLogout}>
        {content}
      </button>
    );
  }

  if (row.href) {
    return (
      <Link href={row.href} className={styles.row} onClick={onNavigate}>
        {content}
      </Link>
    );
  }

  return <div className={styles.row}>{content}</div>;
}
