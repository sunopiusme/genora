"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { BRANCHES } from "./data";
import styles from "./BranchPicker.module.css";

/* ─────────────────────────────────────────
   Поповер выбора ветки — общий для триггера
   в drawer'е композера (открывается вверх)
   и десктопного заголовка /synora
   (открывается вниз).

   Внутри: поиск, список веток с галочкой
   у активной и pinned «Создать ветку…».
   ───────────────────────────────────────── */

type Props = {
  branch: string;
  placement: "up" | "down";
  onSelect: (next: string) => void;
};

export function BranchPopover({ branch, placement, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    /* Фокусим поле поиска без автоскролла. autoFocus у браузера
       приводит к тому, что страница «прыгает» к input'у — особенно
       заметно в sticky-композере, где popover открывается у нижней
       кромки viewport'а. preventScroll держит viewport на месте. */
    searchRef.current?.focus({ preventScroll: true });
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return BRANCHES;
    return BRANCHES.filter((b) => b.toLowerCase().includes(q));
  }, [query]);

  return (
    <div
      className={styles.popover}
      data-placement={placement}
      role="menu"
    >
      <div className={styles.search}>
        <span className={styles.searchIcon} aria-hidden="true">
          <SearchIcon />
        </span>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Поиск веток"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          ref={searchRef}
        />
      </div>

      <div className={styles.sectionTitle}>Ветки</div>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>Ничего не найдено</div>
        ) : (
          filtered.map((name) => {
            const selected = name === branch;
            return (
              <button
                key={name}
                type="button"
                className={styles.item}
                data-active={selected}
                onClick={() => onSelect(name)}
              >
                <span className={styles.itemIcon} aria-hidden="true">
                  <BranchIcon />
                </span>
                <span className={styles.itemLabel}>{name}</span>
                {selected ? (
                  <span className={styles.itemCheck} aria-hidden="true">
                    <CheckIcon />
                  </span>
                ) : (
                  <span aria-hidden="true" />
                )}
              </button>
            );
          })
        )}
      </div>

      <div className={styles.divider} />

      <button type="button" className={styles.item} role="menuitem">
        <span className={styles.itemIcon} aria-hidden="true">
          <PlusIcon />
        </span>
        <span className={styles.itemLabel}>Создать ветку…</span>
        <span aria-hidden="true" />
      </button>
    </div>
  );
}

/* ─── Иконки ─────────────────────────── */

const baseProps = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function BranchIcon() {
  return (
    <svg {...baseProps}>
      <circle cx="6" cy="5" r="2" />
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="7" r="2" />
      <path d="M6 7v10" />
      <path d="M18 9c0 4-4 4-6 5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg {...baseProps}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg {...baseProps}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg {...baseProps} strokeWidth={2.4}>
      <path d="m5 12 5 5 9-11" />
    </svg>
  );
}
