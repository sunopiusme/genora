"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { BranchIcon, BranchPopover } from "./BranchPopover";
import styles from "./BranchPicker.module.css";

/* ─────────────────────────────────────────
   Branch picker для composer footer'а.

   Триггер показывает текущую ветку; сам
   popover (поиск, список, «Создать ветку…»)
   общий с десктопным заголовком /synora —
   см. BranchPopover.tsx.
   ───────────────────────────────────────── */

type Props = {
  branch: string;
  onChange: (next: string) => void;
};

export function BranchPicker({ branch, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const closePopover = useCallback(() => {
    setOpen(false);
  }, []);

  const togglePopover = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!wrapRef.current) return;
      if (wrapRef.current.contains(event.target as Node)) return;
      closePopover();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [closePopover, open]);

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={togglePopover}
      >
        <span className={styles.triggerIcon} aria-hidden="true">
          <BranchIcon />
        </span>
        <span className={styles.triggerLabel}>{branch}</span>
        <span className={styles.triggerChevron} aria-hidden="true">
          <ChevronDownIcon />
        </span>
      </button>

      {open ? (
        <BranchPopover
          branch={branch}
          placement="up"
          onSelect={(name) => {
            onChange(name);
            closePopover();
          }}
        />
      ) : null}
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
