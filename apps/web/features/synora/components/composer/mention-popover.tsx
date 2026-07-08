"use client";

import { useEffect, useRef } from "react";

import styles from "./mention-popover.module.css";
import { PluginIcon } from "./plugin-icon";
import type { MentionGroup, MentionItem } from "../../types";

type Props = {
  groups: MentionGroup[];
  flatItems: MentionItem[];
  activeIndex: number;
  activeFromKeyboard: boolean;
  onHover: (index: number) => void;
  onPick: (item: MentionItem) => void;
};

export function MentionPopover({
  groups,
  flatItems,
  activeIndex,
  activeFromKeyboard,
  onHover,
  onPick,
}: Props) {
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!activeFromKeyboard) return;
    const node = itemRefs.current[activeIndex];
    if (!node) return;
    node.scrollIntoView({ block: "nearest" });
  }, [activeIndex, activeFromKeyboard, flatItems]);

  return (
    <div ref={popoverRef} className={styles.popover} role="listbox">
      <div className={styles.scroller}>
        {groups.map((group) => (
          <div key={group.title} className={styles.group}>
            <div className={styles.groupTitle}>{group.title}</div>
            {group.items.length === 0 ? (
              <div className={styles.empty}>
                {group.kind === "file"
                  ? "Начните вводить, чтобы искать файлы"
                  : "Ничего не найдено"}
              </div>
            ) : (
              group.items.map((item) => {
                const flatIdx = flatItems.indexOf(item);
                const active = flatIdx === activeIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    data-active={active}
                    className={styles.item}
                    ref={(node) => {
                      itemRefs.current[flatIdx] = node;
                    }}
                    onMouseEnter={() => onHover(flatIdx)}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      onPick(item);
                    }}
                  >
                    {item.kind === "plugin" ? (
                      <PluginIcon id={item.id} />
                    ) : (
                      <span className={styles.fileIcon}>
                        <FileGlyph />
                      </span>
                    )}
                    <span className={styles.itemMain}>
                      <span className={styles.itemLabel}>{item.label}</span>
                      <span className={styles.itemDesc}>{item.description}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FileGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}
