"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

type Props = {
  project: string | null;
  onChange: (next: string | null) => void;
};

export function TaskScopePicker({ project, onChange }: Props) {
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

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return SYNORA_PROJECT_GROUPS;
    return SYNORA_PROJECT_GROUPS.filter(
      (group) =>
        group.name.toLowerCase().includes(q) ||
        group.branch.toLowerCase().includes(q),
    );
  }, [query]);

  const selectedGroup = SYNORA_PROJECT_GROUPS.find(
    (group) => group.name === project,
  );

  const pick = (next: string | null) => {
    onChange(next);
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
          {selectedGroup ? selectedGroup.name : "Все проекты"}
        </span>
        {selectedGroup ? (
          <span
            className={styles.triggerBranch}
            title={`Ветка ${selectedGroup.branch}`}
          >
            {selectedGroup.branch}
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
            <button
              type="button"
              className={styles.item}
              data-active={project === null}
              role="menuitem"
              onClick={() => pick(null)}
            >
              <span className={styles.itemIcon} aria-hidden="true">
                <WorkspaceIcon />
              </span>
              <span className={styles.itemBody}>
                <span className={styles.itemLabel}>Все проекты</span>
              </span>
              {project === null ? (
                <span className={styles.itemCheck} aria-hidden="true">
                  <CheckIcon />
                </span>
              ) : (
                <span aria-hidden="true" />
              )}
            </button>

            {filtered.length === 0 ? (
              <div className={styles.empty}>Ничего не найдено</div>
            ) : (
              filtered.map((group) => {
                const selected = group.name === project;
                return (
                  <button
                    key={group.name}
                    type="button"
                    className={styles.item}
                    data-active={selected}
                    role="menuitem"
                    onClick={() => pick(group.name)}
                  >
                    <span className={styles.itemIcon} aria-hidden="true">
                      <RepoIcon />
                    </span>
                    <span className={styles.itemBody}>
                      <span className={styles.itemLabel}>{group.name}</span>
                      <span className={styles.itemBranch}>
                        <span
                          className={styles.itemBranchIcon}
                          aria-hidden="true"
                        >
                          <BranchIcon />
                        </span>
                        {group.branch}
                      </span>
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
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
