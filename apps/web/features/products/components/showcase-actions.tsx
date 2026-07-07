"use client";

import { useEffect, useId, useRef, useState } from "react";
import { SidebarTooltip } from "@/components/shared/sidebar-tooltip";
import { PRODUCT_CATEGORY_FILTERS } from "../catalog";
import { useShowcaseStore } from "../stores/showcase-store";
import type { ShowcaseSort } from "../types";
import { ShareMenu } from "./share-dialog";
import styles from "./showcase-actions.module.css";

const SORT_OPTIONS: { id: ShowcaseSort; label: string }[] = [
  { id: "featured", label: "По умолчанию" },
  { id: "price-asc", label: "Сначала дешевле" },
  { id: "price-desc", label: "Сначала дороже" },
  { id: "name", label: "По названию" },
];

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

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function ShowcaseActions() {
  const categoryFilter = useShowcaseStore((state) => state.categoryFilter);
  const setCategoryFilter = useShowcaseStore(
    (state) => state.setCategoryFilter,
  );
  const sort = useShowcaseStore((state) => state.sort);
  const setSort = useShowcaseStore((state) => state.setSort);

  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  useEffect(() => {
    if (!menuOpen && !shareOpen) return;

    const closeAll = () => {
      setMenuOpen(false);
      setShareOpen(false);
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeAll();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAll();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen, shareOpen]);

  return (
    <div className={styles.actions} ref={rootRef}>
      <SidebarTooltip
        label="Поделиться"
        isEnabled={!shareOpen}
        placement="bottom"
      >
        <button
          type="button"
          className={`${styles.iconButton} ${styles.shareButton}`}
          onClick={() => {
            setShareOpen((open) => !open);
            setMenuOpen(false);
          }}
          aria-label="Поделиться"
          aria-haspopup="dialog"
          aria-expanded={shareOpen}
          data-active={shareOpen || undefined}
        >
          <ShareIcon />
        </button>
      </SidebarTooltip>
      <SidebarTooltip
        label="Категории и сортировка"
        isEnabled={!menuOpen}
        placement="bottom"
      >
        <button
          type="button"
          className={`${styles.iconButton} ${styles.menuButton}`}
          onClick={() => {
            setMenuOpen((open) => !open);
            setShareOpen(false);
          }}
          aria-label="Категории и сортировка"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          data-active={menuOpen || undefined}
        >
          <DotsIcon />
        </button>
      </SidebarTooltip>

      {menuOpen && (
        <div className={styles.menu} id={menuId} role="menu">
          <p className={styles.menuHeading}>Категории</p>
          {PRODUCT_CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              role="menuitemradio"
              aria-checked={categoryFilter === filter.id}
              className={styles.menuItem}
              onClick={() => {
                setCategoryFilter(filter.id);
                setMenuOpen(false);
              }}
            >
              <span>{filter.label}</span>
              {categoryFilter === filter.id && (
                <span className={styles.menuCheck}>
                  <CheckIcon />
                </span>
              )}
            </button>
          ))}

          <div className={styles.menuDivider} role="separator" />

          <p className={styles.menuHeading}>Сортировка</p>
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="menuitemradio"
              aria-checked={sort === option.id}
              className={styles.menuItem}
              onClick={() => {
                setSort(option.id);
                setMenuOpen(false);
              }}
            >
              <span>{option.label}</span>
              {sort === option.id && (
                <span className={styles.menuCheck}>
                  <CheckIcon />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {shareOpen && <ShareMenu onClose={() => setShareOpen(false)} />}
    </div>
  );
}
