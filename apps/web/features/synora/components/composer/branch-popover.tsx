"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { BRANCHES } from "../../data/branches";
import styles from "./branch-picker.module.css";

type Props = {
  branch: string;
  placement: "up" | "down";
  onSelect: (next: string) => void;
};

export function BranchPopover({ branch, placement, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
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

const baseProps = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function BranchIcon() {
  return (
    <svg {...baseProps}>
      <circle cx="6.5" cy="5.5" r="2" />
      <circle cx="6.5" cy="18.5" r="2" />
      <circle cx="17.5" cy="7.5" r="2" />
      <path d="M6.5 7.5v9" />
      <path d="M17.5 9.5c0 3.5-3.5 3.8-6 4.5-1.7.5-2.5 1-2.5 2.5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg {...baseProps}>
      <circle cx="11.5" cy="11.5" r="7.5" />
      <path d="m17 17 4.5 4.5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg {...baseProps}>
      <path d="M12 5.5v13M5.5 12h13" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg {...baseProps} strokeWidth={1.8}>
      <path d="m4.5 12.75 4.5 4.5L19.5 6.75" />
    </svg>
  );
}
