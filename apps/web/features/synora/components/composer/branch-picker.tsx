"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { BranchIcon, BranchPopover } from "./branch-popover";
import styles from "./branch-picker.module.css";

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
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePopover();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closePopover, open]);

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <button
        type="button"
        className={styles.trigger}
        data-context-segment="middle"
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
          placement="down"
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
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m19 9-7 6-7-6" />
    </svg>
  );
}
