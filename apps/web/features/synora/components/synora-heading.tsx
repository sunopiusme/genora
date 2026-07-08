"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { BranchPopover } from "./composer/branches/BranchPopover";
import { useBranchStore } from "./composer/branches/branch-store";
import { useProjectStore } from "./composer/projects/project-store";
import { findProject } from "./composer/projects/data";
import styles from "./synora-heading.module.css";

/**
 * Десктопный заголовок главной /synora — над центрированным композером.
 *
 * Два варианта (аналог героя на мобильных, см. synora-home.tsx):
 * - без проекта:  «Что создадим?»
 * - с проектом:   серое «Продолжим» + белое название проекта.
 *
 * Название проекта — единственный интерактивный элемент: по клику
 * открывается общий поповер веток (BranchPopover), тот же, что
 * в drawer'е композера. Состояние ветки синхронизировано через
 * useBranchStore.
 *
 * На мобильных (< 48rem) заголовок скрыт — там работает герой
 * SynoraHome. Название читается из общего стора проекта: выбор в
 * picker'е композера и переход по ?project= из сайдбара меняют
 * заголовок синхронно. До первой синхронизации стора используется
 * query-параметр — так заголовок не мигает при загрузке.
 */
export function SynoraHeading() {
  const searchParams = useSearchParams();
  const paramName = searchParams.get("project")?.trim() || undefined;

  const selection = useProjectStore((state) => state.selection);
  const hasSynced = useProjectStore((state) => state.hasSynced);
  const storeName =
    selection.kind === "project" ? findProject(selection.id)?.label : undefined;
  const projectName = hasSynced ? storeName : paramName;

  const branch = useBranchStore((state) => state.branch);
  const setBranch = useBranchStore((state) => state.setBranch);

  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement | null>(null);

  const closePopover = useCallback(() => {
    setOpen(false);
  }, []);

  /* Закрытие по клику вне поповера и по Escape. */
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

  /* Смена проекта закрывает открытый поповер. */
  useEffect(() => {
    setOpen(false);
  }, [projectName]);

  if (!projectName) {
    return <h1 className={styles.heading}>Что создадим?</h1>;
  }

  return (
    <h1 className={styles.heading} data-open={open}>
      <span className={styles.lead}>Продолжим</span>{" "}
      <span ref={wrapRef} className={styles.projectWrap}>
        <button
          type="button"
          className={styles.project}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Проект «${projectName}», ветка ${branch}. Выбрать ветку`}
          onClick={() => setOpen((prev) => !prev)}
        >
          {projectName}
        </button>
        {open ? (
          <BranchPopover
            branch={branch}
            placement="down"
            onSelect={(name) => {
              setBranch(name);
              closePopover();
            }}
          />
        ) : null}
      </span>
    </h1>
  );
}
