"use client";

import { useEffect, useRef, useState } from "react";

import { PROVIDERS, findModel, findProvider } from "./data";
import type { ModelSelection, ProviderId } from "./types";
import styles from "./ModelPicker.module.css";

/* ─────────────────────────────────────────
   Объединённый model+reasoning picker.

   Единственный триггер в тулбаре показывает
   имя модели и текущий reasoning-уровень
   (например «GPT 5.4 High» или «Opus 4.8 Ultracode»).

   В popover'е:
     1. Секция «Reasoning» — список уровней
        выбранной модели, с галочкой у активного.
        Набор уровней зависит от модели (см. data.ts):
        Opus 4.8 — единственный с ultracode, у GPT —
        xHigh, у haiku — усечённый набор.
     2. Секция «Model» — текущая модель строкой
        с chevron справа; на hover открывает
        submenu со списком всех моделей всех
        провайдеров.
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
  const provider = findProvider(selection.providerId);
  if (!current || !provider) return null;

  // Имя модели в чипе триггера: для GPT показываем
  // полное «GPT 5.4» (с пробелом, см. data.ts) — иначе
  // короткое «5.4» нечитаемо и непонятно, что за провайдер.
  // Для Claude — полное «Opus 4.8», оно и так компактное.
  const triggerModelLabel = current.model.label;

  // При смене модели — откатываем level, если у новой
  // модели этого уровня нет (напр. ultracode есть только
  // у Opus 4.8, xHigh — только у Codex).
  const pickModel = (providerId: ProviderId, modelId: string) => {
    const next = findProvider(providerId);
    if (!next) return;
    const target = next.models.find((m) => m.id === modelId);
    if (!target) return;
    const stillValid = target.levels.some((l) => l.id === selection.levelId);
    onChange({
      providerId,
      modelId,
      levelId: stillValid ? selection.levelId : target.defaultLevelId,
    });
    setOpen(false);
  };

  const pickLevel = (levelId: string) => {
    onChange({ ...selection, levelId });
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
        <span className={styles.triggerLabel}>{triggerModelLabel}</span>
        <span className={styles.triggerLevel}>{current.level?.label}</span>
        <span className={styles.triggerChevron} aria-hidden="true">
          <ChevronDown />
        </span>
      </button>
      {open ? (
        <div className={styles.providers} role="menu">
          <div className={styles.sectionTitle}>Reasoning</div>
          <div className={styles.section}>
            {current.model.levels.map((level) => {
              const selected = level.id === selection.levelId;
              return (
                <button
                  key={level.id}
                  type="button"
                  className={`${styles.modelRow} ${styles.levelRow}`}
                  data-active={selected}
                  onClick={() => pickLevel(level.id)}
                >
                  <span className={styles.modelLabel}>{level.label}</span>
                  {selected ? (
                    <span className={styles.checkIcon} aria-hidden="true">
                      <CheckIcon />
                    </span>
                  ) : (
                    <span aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>

          <div className={styles.divider} />

          <div className={styles.section}>
            <div className={styles.providerRow} data-active="true" role="menuitem">
              <span className={styles.providerLabel}>{current.model.label}</span>
              <span className={styles.providerChevron} aria-hidden="true">
                <ChevronRight />
              </span>
              <div className={styles.modelsSubmenu} role="menu">
                <div className={styles.sectionTitle}>Model</div>
                {PROVIDERS.flatMap((p) => p.models.map((m) => ({ p, m }))).map(
                  ({ p, m }) => {
                    const selected =
                      p.id === selection.providerId && m.id === selection.modelId;
                    return (
                      <button
                        key={`${p.id}-${m.id}`}
                        type="button"
                        className={`${styles.modelRow} ${styles.levelRow}`}
                        data-active={selected}
                        onClick={() => pickModel(p.id, m.id)}
                      >
                        <span className={styles.modelLabel}>{m.label}</span>
                        {selected ? (
                          <span className={styles.checkIcon} aria-hidden="true">
                            <CheckIcon />
                          </span>
                        ) : (
                          <span aria-hidden="true" />
                        )}
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ChevronDown() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 5 5 9-11" />
    </svg>
  );
}
