"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PROJECTS, findProject } from "../../data/projects";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  GithubIcon,
  NoProjectIcon,
  PlusIcon,
  RepoIcon,
  RepoPlusIcon,
  SearchIcon,
  WorkspaceIcon,
} from "./project-icons";
import type { ProjectSelection } from "../../types";
import styles from "./project-picker.module.css";

type Props = {
  selection: ProjectSelection;
  onChange: (next: ProjectSelection) => void;
};

export function ProjectPicker({ selection, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const openPopover = useCallback(() => {
    setOpen(true);
  }, []);

  const closePopover = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const togglePopover = useCallback(() => {
    if (open) {
      closePopover();
      return;
    }
    openPopover();
  }, [closePopover, open, openPopover]);

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
    if (!open) return;
    searchRef.current?.focus({ preventScroll: true });
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return PROJECTS;
    return PROJECTS.filter((p) => p.label.toLowerCase().includes(q));
  }, [query]);

  const triggerLabel =
    selection.kind === "none"
      ? "Без проекта"
      : findProject(selection.id)?.label ?? "Проект";

  const triggerIcon =
    selection.kind === "none" ? <NoProjectIcon /> : <RepoIcon />;

  const pick = (id: string) => {
    onChange({ kind: "project", id });
    closePopover();
  };

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <button
        type="button"
        className={styles.trigger}
        data-empty={selection.kind === "none"}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={togglePopover}
      >
        <span className={styles.triggerIcon} aria-hidden="true">
          {triggerIcon}
        </span>
        <span className={styles.triggerLabel}>{triggerLabel}</span>
        <span className={styles.triggerChevron} aria-hidden="true">
          <ChevronDownIcon />
        </span>
      </button>

      {open ? (
        <div className={styles.popover} role="menu">
          <div className={styles.search}>
            <span className={styles.searchIcon} aria-hidden="true">
              <SearchIcon />
            </span>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Поиск проектов"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              ref={searchRef}
            />
          </div>

          <div className={styles.list}>
            {filtered.length === 0 ? (
              <div className={styles.empty}>Ничего не найдено</div>
            ) : (
              filtered.map((project) => {
                const selected =
                  selection.kind === "project" && selection.id === project.id;
                return (
                  <button
                    key={project.id}
                    type="button"
                    className={styles.item}
                    data-active={selected}
                    onClick={() => pick(project.id)}
                  >
                    <span className={styles.itemIcon} aria-hidden="true">
                      {project.kind === "workspace" ? (
                        <WorkspaceIcon />
                      ) : (
                        <RepoIcon />
                      )}
                    </span>
                    <span className={styles.itemLabel}>{project.label}</span>
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

          <div className={styles.item} data-has-submenu="true" role="menuitem">
            <span className={styles.itemIcon} aria-hidden="true">
              <RepoPlusIcon />
            </span>
            <span className={styles.itemLabel}>Добавить проект</span>
            <span className={styles.itemChevron} aria-hidden="true">
              <ChevronRightIcon />
            </span>
            <div className={styles.submenu} role="menu">
              <button type="button" className={styles.item} role="menuitem">
                <span className={styles.itemIcon} aria-hidden="true">
                  <PlusIcon />
                </span>
                <span className={styles.itemLabel}>Создать с нуля</span>
                <span aria-hidden="true" />
              </button>
              <button type="button" className={styles.item} role="menuitem">
                <span className={styles.itemIcon} aria-hidden="true">
                  <GithubIcon />
                </span>
                <span className={styles.itemLabel}>Подключить репозиторий</span>
                <span aria-hidden="true" />
              </button>
            </div>
          </div>

          <button
            type="button"
            className={styles.item}
            data-active={selection.kind === "none"}
            onClick={() => {
              onChange({ kind: "none" });
              closePopover();
            }}
          >
            <span className={styles.itemIcon} aria-hidden="true">
              <NoProjectIcon />
            </span>
            <span className={styles.itemLabel}>Не работать в проекте</span>
            {selection.kind === "none" ? (
              <span className={styles.itemCheck} aria-hidden="true">
                <CheckIcon />
              </span>
            ) : (
              <span aria-hidden="true" />
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}
