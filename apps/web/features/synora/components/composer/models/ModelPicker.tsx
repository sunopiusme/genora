"use client";

import { useEffect, useRef, useState } from "react";

import { findModel } from "./data";
import type { ModelSelection } from "./types";
import { ReasoningSlider } from "./ReasoningSlider";
import styles from "./ModelPicker.module.css";

/* ─────────────────────────────────────────
   Model + reasoning picker.

   Триггер в тулбаре показывает имя модели и
   текущий уровень («Fable 5 High»).

   В popover'е:
     1. Секция «Reasoning» — ползунок уровней
        (механика tier-slider из products):
        drag по треку, снэп к стопам, подписи
        стопов кликабельны.
     2. Секция «Model» — единственная модель
        Fable 5 с галочкой. Подменю нет —
        popover фиксированной ширины у правого
        края триггера и никогда не уходит за
        границы экрана (прошлый submenu
        открывался вправо и обрезался).
   ───────────────────────────────────────── */

type Props = {
  selection: ModelSelection;
  onChange: (next: ModelSelection) => void;
};

export function ModelPicker({ selection, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!wrapRef.current) return;
      if (wrapRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const current = findModel(selection);
  if (!current) return null;

  const levelIndex = Math.max(
    0,
    current.model.levels.findIndex((l) => l.id === selection.levelId),
  );

  const pickLevelIndex = (index: number) => {
    const level = current.model.levels[index];
    if (!level || level.id === selection.levelId) return;
    onChange({ ...selection, levelId: level.id });
  };

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={styles.triggerLabel}>{current.model.label}</span>
        <span className={styles.triggerLevel}>{current.level?.label}</span>
        <span className={styles.triggerChevron} aria-hidden="true">
          <ChevronDown />
        </span>
      </button>
      {open ? (
        <div className={styles.providers} role="menu">
          {/* Заголовок «Effort {уровень}» рендерит сам слайдер — по референсу. */}
          <ReasoningSlider
            levels={current.model.levels}
            levelIndex={levelIndex}
            onLevelChange={pickLevelIndex}
          />

          <div className={styles.divider} />

          <div className={styles.sectionTitle}>Model</div>
          <div className={styles.section}>
            <div className={styles.modelRow} data-active="true" role="menuitem">
              <span className={styles.modelLabel}>{current.model.label}</span>
              <span className={styles.checkIcon} aria-hidden="true">
                <CheckIcon />
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ─── Иконки — стиль Solar Linear ──────────
   stroke 1.5, единая шкала с lib/icon.tsx. */

const iconBase = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/* Solar alt-arrow-down-linear. */
function ChevronDown() {
  return (
    <svg {...iconBase}>
      <path d="m19 9-7 6-7-6" />
    </svg>
  );
}

/* Solar check-read-linear (одиночная галочка). */
function CheckIcon() {
  return (
    <svg {...iconBase}>
      <path d="m4.5 12.75 4.5 4.5L19.5 6.75" />
    </svg>
  );
}
