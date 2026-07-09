"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { BRANCHES } from "../../data/branches";
import { SYNORA_PROJECT_GROUPS } from "../../data/recent-sandboxes";
import { BranchIcon } from "../composer/branch-popover";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
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

  const pickProject = (group: (typeof SYNORA_PROJECT_GROUPS)[number]) => {
    onChange({ project: group.name, branch: group.branch });
    closePopover();
  };

  const pickProjectBranch = (
    group: (typeof SYNORA_PROJECT_GROUPS)[number],
    branch: string,
  ) => {
    onChange({ project: group.name, branch });
    closePopover();
  };

  const pickAllProjects = () => {
    onChange({ ...scope, project: null });
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
              placeholder="Поиск проектов"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              ref={searchRef}
            />
          </div>

          <div className={styles.list}>
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
              <span className={styles.itemLabel}>Все проекты</span>
              {scope.project === null ? (
                <span className={styles.itemCheck} aria-hidden="true">
                  <CheckIcon />
                </span>
              ) : (
                <span aria-hidden="true" />
              )}
            </button>

            {filteredGroups.length === 0 ? (
              <div className={styles.empty}>Ничего не найдено</div>
            ) : (
              filteredGroups.map((group) => {
                const selected = group.name === scope.project;
                return (
                  <div
                    key={group.name}
                    className={styles.item}
                    data-active={selected}
                    data-has-submenu="true"
                    role="menuitem"
                    tabIndex={0}
                    onClick={() => pickProject(group)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        pickProject(group);
                      }
                    }}
                  >
                    <span className={styles.itemIcon} aria-hidden="true">
                      <RepoIcon />
                    </span>
                    <span className={styles.itemLabel}>{group.name}</span>
                    {selected ? (
                      <span className={styles.itemCheck} aria-hidden="true">
                        <CheckIcon />
                      </span>
                    ) : (
                      <span className={styles.itemChevron} aria-hidden="true">
                        <ChevronRightIcon />
                      </span>
                    )}

                    <div className={styles.submenu} role="menu">
                      <div className={styles.sectionTitle}>Ветки</div>
                      {BRANCHES.map((branch) => {
                        const branchSelected =
                          selected && branch === scope.branch;
                        return (
                          <button
                            key={branch}
                            type="button"
                            className={styles.item}
                            data-active={branchSelected}
                            role="menuitem"
                            onClick={(event) => {
                              event.stopPropagation();
                              pickProjectBranch(group, branch);
                            }}
                          >
                            <span
                              className={styles.itemIcon}
                              aria-hidden="true"
                            >
                              <BranchIcon />
                            </span>
                            <span className={styles.itemLabel}>{branch}</span>
                            {branchSelected ? (
                              <span
                                className={styles.itemCheck}
                                aria-hidden="true"
                              >
                                <CheckIcon />
                              </span>
                            ) : (
                              <span aria-hidden="true" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
