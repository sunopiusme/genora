"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { BranchPopover } from "./composer/branch-popover";
import styles from "./synora-heading.module.css";
import { findProject } from "../data/projects";
import { useBranchStore } from "../stores/branch-store";
import {
  branchForSelection,
  selectionFromQuery,
  useProjectStore,
} from "../stores/project-store";

export function SynoraHeading() {
  const searchParams = useSearchParams();
  const paramName = searchParams.get("project")?.trim() || undefined;

  const selection = useProjectStore((state) => state.selection);
  const hasSynced = useProjectStore((state) => state.hasSynced);
  const storeName =
    selection.kind === "project" ? findProject(selection.id)?.label : undefined;
  const projectName = hasSynced ? storeName : paramName;

  const storeBranch = useBranchStore((state) => state.branch);
  const setBranch = useBranchStore((state) => state.setBranch);
  const branch = hasSynced
    ? storeBranch
    : branchForSelection(selectionFromQuery(paramName ?? null));

  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement | null>(null);

  const closePopover = useCallback(() => {
    setOpen(false);
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
          <span className={styles.projectChevron} aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m19 9-7 6-7-6" />
            </svg>
          </span>
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
