"use client";

import { useEffect, useRef } from "react";

import { useChatStore } from "../../stores/chat-store";
import styles from "./assistant-reply.module.css";

export function AssistantReply() {
  const status = useChatStore((state) => state.status);
  const reply = useChatStore((state) => state.reply);
  const reset = useChatStore((state) => state.reset);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [reply]);

  if (status === "idle") return null;

  return (
    <section className={styles.card} aria-live="polite" aria-label="Ответ модели">
      <div className={styles.header}>
        <span className={styles.status} data-status={status}>
          {status === "streaming"
            ? "Sonnet 4.5 отвечает…"
            : status === "error"
              ? "Не удалось получить ответ"
              : "Sonnet 4.5"}
        </span>
        <button
          type="button"
          className={styles.dismiss}
          aria-label="Скрыть ответ"
          onClick={reset}
        >
          <CloseIcon />
        </button>
      </div>
      {reply ? (
        <div ref={scrollRef} className={styles.body}>
          {reply}
        </div>
      ) : status === "streaming" ? (
        <div className={styles.pending} aria-hidden="true">
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
      ) : null}
    </section>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
