"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./composer-input.module.css";
import {
  ChevronRightIcon,
  ClipIcon,
  GridIcon,
  PlusIcon,
  SlashIcon,
} from "./composer-icons";
import { PLUGINS } from "../../data/mentions";
import { PluginIcon } from "./plugin-icon";
import { Tooltip } from "./tooltip";

type PlusDropdownProps = {
  onAttach: () => void;
};

export function PlusDropdown({ onAttach }: PlusDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const handleAttach = () => {
    onAttach();
    setOpen(false);
  };

  return (
    <span ref={containerRef} className={styles.plusMenu}>
      <Tooltip label="Прикрепить файл и больше" shortcut={<SlashIcon />}>
        <button
          type="button"
          className={styles.iconBtn}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Прикрепить файл и больше"
          onClick={() => setOpen((prev) => !prev)}
        >
          <PlusIcon />
        </button>
      </Tooltip>
      {open ? (
        <div className={styles.dropdown} role="menu">
          <div className={styles.dropdownGroup}>
            <button
              type="button"
              className={styles.dropdownItem}
              role="menuitem"
              onClick={handleAttach}
            >
              <span className={styles.dropdownIcon}>
                <ClipIcon />
              </span>
              <span className={styles.dropdownLabel}>Прикрепить файл</span>
            </button>
          </div>
          <div className={styles.dropdownDivider} />
          <div className={styles.dropdownGroup}>
            <PluginsSubmenuItem />
          </div>
        </div>
      ) : null}
    </span>
  );
}

function PluginsSubmenuItem() {
  const [pinned, setPinned] = useState(false);

  return (
    <div className={styles.pluginsTrigger} data-open={pinned}>
      <button
        type="button"
        className={styles.dropdownItem}
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={pinned}
        onClick={() => setPinned((prev) => !prev)}
      >
        <span className={styles.dropdownIcon}>
          <GridIcon />
        </span>
        <span className={styles.dropdownLabel}>Плагины</span>
        <span className={styles.dropdownChevron}>
          <ChevronRightIcon />
        </span>
      </button>
      <div className={styles.pluginsSubmenu} role="menu">
        {PLUGINS.filter((plugin) => plugin.kind === "plugin").map((plugin) => (
          <button key={plugin.id} type="button" className={styles.pluginItem} role="menuitem">
            <PluginIcon id={plugin.id} />
            <span className={styles.pluginItemMain}>
              <span className={styles.pluginItemLabel}>{plugin.label}</span>
              <span className={styles.pluginItemDesc}>{plugin.description}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
