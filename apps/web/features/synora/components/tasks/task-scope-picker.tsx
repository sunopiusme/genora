"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { BRANCHES } from "../../data/branches";
import { SYNORA_PROJECT_GROUPS } from "../../data/recent-sandboxes";
import { BranchIcon } from "../composer/branch-popover";
import {
  CheckIcon,
  ChevronDownIcon,
  RepoIcon,
  SearchIcon,
  WorkspaceIcon,
} from "../composer/project-icons";
import styles from "./task-scope-picker.module.css";

export type TaskScope = {
  project: string | null;
  branch: string;
};

type Props = {
  scope: TaskScope;
  onChange: (next: TaskScope) => void;
};

export function TaskScopePicker({ scope, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const closePopover = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const togglePopover = useCallback(() => {
    setOpen((prev) => {
      if (prev) {
        setQuery("");
      }
      return !prev;
    });
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

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus({ preventScroll: true });
  }, [open]);

  const normalizedQuery = query.toLowerCase().trim();

  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) return SYNORA_PROJECT_GROUPS;
    return SYNORA_PROJECT_GROUPS.filter((group) =>
      group.name.toLowerCase().includes(normalizedQuery),
    );
  }, [normalizedQuery]);

  const filteredBranches = useMemo(() => {
    if (!normalizedQuery) return BRANCHES;
    return BRANCHES.filter((branch) =>
      branch.toLowerCase().includes(normalizedQuery),
    );
  }, [normalizedQuery]);

  const pickProject = (group: (typeof SYNORA_PROJECT_GROUPS)[number]) => {
    onChange({ project: group.name, branch: group.branch });
    closePopover();
  };

  const pickAllProjects = () => {
    onChange({ ...scope, project: null });
    closePopover();
  };

  const pickBranch = (branch: string) => {
    onChange({ ...scope, branch });
    closePopover();
  };

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={togglePopover}
      >
        <span className={styles.triggerLabel}>
          {scope.project ?? "Все проекты"}
        </span>
        {scope.project ? (
          <span
            className={styles.triggerBranch}
            title={`Ветка ${scope.branch}`}
          >
            {scope.branch}
          </span>
        ) : null}
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
              placeholder="Поиск проектов и веток"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              ref={searchRef}
            />
          </div>

          <div className={styles.list}>
            <div className={styles.sectionTitle}>Проекты</div>

            <button
              type="button"
              className={styles.item}
              data-active={scope.project === null}
              role="menuitem"
              onClick={pickAllProjects}
            >
              <span className={styles.itemIcon} aria-hidden="true">
                <WorkspaceIcon />
              </span>
              <span className={styles.itemBody}>
                <span className={styles.itemLabel}>Все проекты</span>
              </span>
              {scope.project === null ? (
                <span className={styles.itemCheck} aria-hidden="true">
                  <CheckIcon />
                </span>
              ) : (
                <span aria-hidden="true" />
              )}
            </button>

            {filteredGroups.map((group) => {
              const selected = group.name === scope.project;
              return (
                <button
                  key={group.name}
                  type="button"
                  className={styles.item}
                  data-active={selected}
                  role="menuitem"
                  onClick={() => pickProject(group)}
                >
                  <span className={styles.itemIcon} aria-hidden="true">
                    <RepoIcon />
                  </span>
                  <span className={styles.itemBody}>
                    <span className={styles.itemLabel}>{group.name}</span>
                  </span>
                  {selected ? (
                    <span className={styles.itemCheck} aria-hidden="true">
                      <CheckIcon />
                    </span>
                  ) : (
                    <span aria-hidden="true" />
                  )}
                </button>
              );
            })}

            <div className={styles.sectionTitle}>Ветки</div>

            {filteredBranches.map((branch) => {
              const selected = branch === scope.branch;
              return (
                <button
                  key={branch}
                  type="button"
                  className={styles.item}
                  data-active={selected}
                  role="menuitem"
                  onClick={() => pickBranch(branch)}
                >
                  <span className={styles.itemIcon} aria-hidden="true">
                    <BranchIcon />
                  </span>
                  <span className={styles.itemBody}>
                    <span className={styles.itemLabel}>{branch}</span>
                  </span>
                  {selected ? (
                    <span className={styles.itemCheck} aria-hidden="true">
                      <CheckIcon />
                    </span>
                  ) : (
                    <span aria-hidden="true" />
                  )}
                </button>
              );
            })}

            {filteredGroups.length === 0 && filteredBranches.length === 0 ? (
              <div className={styles.empty}>Ничего не найдено</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
