"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";

import styles from "./ComposerInput.module.css";
import { MentionPopover } from "./mentions/MentionPopover";
import { useMentions } from "./mentions/useMentions";
import type { MentionItem } from "./mentions/types";

type PromptInputProps = {
  value: string;
  disabled: boolean;
  canSubmit: boolean;
  onValueChange: (next: string) => void;
  onSubmit: () => void;
};

export function PromptInput({
  value,
  disabled,
  canSubmit,
  onValueChange,
  onSubmit,
}: PromptInputProps) {
  const [caret, setCaret] = useState(0);
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const mentions = useMentions({ value, caret, focused });

  /* Auto-grow: высота textarea следует за контентом
     (1..~6 строк, лимит задаёт max-height в CSS —
     дальше включается вертикальный скролл). Пересчёт
     и на внешние изменения value (очистка после
     отправки), поэтому layout-effect, а не onChange. */
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const syncCaret = () => {
    setCaret(ref.current?.selectionStart ?? 0);
  };

  const applyMention = (item: MentionItem) => {
    const result = mentions.apply(item);
    if (!result) return;
    onValueChange(result.nextValue);
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(result.nextCaret, result.nextCaret);
      setCaret(result.nextCaret);
    });
  };

  const handleMentionKeys = (event: KeyboardEvent<HTMLTextAreaElement>): boolean => {
    const count = mentions.flatItems.length;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        mentions.setActiveIndex((mentions.activeIndex + 1) % count, "keyboard");
        return true;
      case "ArrowUp":
        event.preventDefault();
        mentions.setActiveIndex((mentions.activeIndex - 1 + count) % count, "keyboard");
        return true;
      case "Enter":
      case "Tab": {
        const item = mentions.flatItems[mentions.activeIndex];
        if (!item) return true;
        event.preventDefault();
        applyMention(item);
        return true;
      }
      case "Escape":
        event.preventDefault();
        mentions.close();
        return true;
      default:
        return false;
    }
  };

  const isPlainEnter = (event: KeyboardEvent<HTMLTextAreaElement>) =>
    event.key === "Enter" &&
    !event.shiftKey &&
    !event.altKey &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.nativeEvent.isComposing;

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentions.open && handleMentionKeys(event)) return;
    if (isPlainEnter(event)) {
      event.preventDefault();
      if (canSubmit) onSubmit();
    }
  };

  return (
    <div className={styles.inputWrap}>
      <textarea
        ref={ref}
        className={styles.input}
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value);
          syncCaret();
        }}
        onKeyUp={syncCaret}
        onClick={syncCaret}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Что агент должен изменить?"
        rows={1}
        aria-label="Промпт"
        disabled={disabled}
      />
      {mentions.open ? (
        <MentionPopover
          groups={mentions.groups}
          flatItems={mentions.flatItems}
          activeIndex={mentions.activeIndex}
          activeFromKeyboard={mentions.activeFromKeyboard}
          onHover={(idx) => mentions.setActiveIndex(idx, "mouse")}
          onPick={applyMention}
        />
      ) : null}
    </div>
  );
}
