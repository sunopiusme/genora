"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { useChatStore } from "../stores/chat-store";
import type { ChatMessage } from "../types";
import styles from "./chat-transcript.module.css";

export function ChatTranscript() {
  const messages = useChatStore((state) => state.messages);
  const updateUserMessage = useChatStore((state) => state.updateUserMessage);
  const scrollRef = useRef<HTMLElement | null>(null);
  const isAtBottomRef = useRef(true);
  const messageCountRef = useRef(0);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const scrollArea = scrollRef.current;
    const hasNewMessage = messages.length > messageCountRef.current;
    messageCountRef.current = messages.length;
    if (!scrollArea || (!isAtBottomRef.current && !hasNewMessage)) {
      return;
    }
    scrollArea.scrollTo({ top: scrollArea.scrollHeight });
  }, [messages]);

  async function handleCopy(message: ChatMessage) {
    const didCopy = await copyText(message.content);
    if (!didCopy) {
      return;
    }
    setCopiedMessageId(message.id);
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(() => {
      setCopiedMessageId(null);
    }, 1600);
  }

  function handleEdit(message: ChatMessage) {
    setEditingMessageId(message.id);
    setDraft(message.content);
  }

  function handleEditCancel() {
    setEditingMessageId(null);
    setDraft("");
  }

  function handleEditSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextContent = draft.trim();
    if (!editingMessageId || !nextContent) {
      return;
    }
    updateUserMessage(editingMessageId, nextContent);
    handleEditCancel();
  }

  if (messages.length === 0) {
    return null;
  }

  return (
    <section
      ref={scrollRef}
      className={styles.scrollArea}
      aria-label="Диалог с Claude Sonnet 4.5"
      onScroll={(event) => {
        const element = event.currentTarget;
        const remainingDistance =
          element.scrollHeight - element.scrollTop - element.clientHeight;
        isAtBottomRef.current = remainingDistance < 48;
      }}
    >
      <div className={styles.messages}>
        {messages.map((message) => (
          <ChatMessageItem
            key={message.id}
            message={message}
            isCopied={copiedMessageId === message.id}
            isEditing={editingMessageId === message.id}
            draft={draft}
            onCopy={handleCopy}
            onEdit={handleEdit}
            onDraftChange={setDraft}
            onEditCancel={handleEditCancel}
            onEditSave={handleEditSave}
          />
        ))}
      </div>
    </section>
  );
}

type ChatMessageItemProps = {
  message: ChatMessage;
  isCopied: boolean;
  isEditing: boolean;
  draft: string;
  onCopy: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
  onDraftChange: (nextValue: string) => void;
  onEditCancel: () => void;
  onEditSave: (event: FormEvent<HTMLFormElement>) => void;
};

function ChatMessageItem({
  message,
  isCopied,
  isEditing,
  draft,
  onCopy,
  onEdit,
  onDraftChange,
  onEditCancel,
  onEditSave,
}: ChatMessageItemProps) {
  if (message.role === "user") {
    return (
      <article className={styles.userMessage}>
        {isEditing ? (
          <form className={styles.editForm} onSubmit={onEditSave}>
            <textarea
              className={styles.editInput}
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              aria-label="Редактировать запрос"
              autoFocus
            />
            <div className={styles.editActions}>
              <button type="button" onClick={onEditCancel}>
                Отмена
              </button>
              <button type="submit" disabled={!draft.trim()}>
                Сохранить
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className={styles.userContent}>{message.content}</p>
            <div className={styles.userMeta}>
              <time dateTime={new Date(message.createdAt).toISOString()}>
                {formatMessageTime(message.createdAt)}
              </time>
              <button
                type="button"
                aria-label="Скопировать запрос"
                title="Скопировать"
                onClick={() => void onCopy(message)}
              >
                {isCopied ? <CheckIcon /> : <CopyIcon />}
              </button>
              <button
                type="button"
                aria-label="Редактировать запрос"
                title="Редактировать"
                onClick={() => onEdit(message)}
              >
                <EditIcon />
              </button>
            </div>
          </>
        )}
      </article>
    );
  }

  const isStreaming = message.status === "streaming";
  const isError = message.status === "error";

  return (
    <article
      className={styles.assistantMessage}
      aria-live="polite"
      aria-busy={isStreaming}
      aria-label="Ответ Claude Sonnet 4.5"
    >
      {message.content ? (
        <div className={styles.assistantContent}>{message.content}</div>
      ) : isStreaming ? (
        <div className={styles.pending} aria-label="Claude готовит ответ">
          <span />
          <span />
          <span />
        </div>
      ) : isError ? (
        <p className={styles.errorMessage}>
          Проверьте подключение и попробуйте отправить запрос ещё раз.
        </p>
      ) : null}
      {isError && message.content ? (
        <p className={styles.errorMessage}>
          Соединение прервано. Попробуйте отправить запрос ещё раз.
        </p>
      ) : null}
    </article>
  );
}

async function copyText(content: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(content);
      return true;
    } catch {
      return false;
    }
  }

  const textArea = document.createElement("textarea");
  textArea.value = content;
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.append(textArea);
  textArea.select();
  const didCopy = document.execCommand("copy");
  textArea.remove();
  return didCopy;
}

function formatMessageTime(timestamp: number): string {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="8.5" y="8.5" width="10.5" height="11" rx="1.5" />
      <path d="M15.5 8.5V6.25A1.75 1.75 0 0 0 13.75 4.5h-7A1.75 1.75 0 0 0 5 6.25v8.5c0 .97.78 1.75 1.75 1.75H8.5" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m14.5 5.5 4 4M5 19l.8-4.05L15.2 5.5a1.8 1.8 0 0 1 2.55 0l.75.75a1.8 1.8 0 0 1 0 2.55l-9.45 9.4L5 19Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12.5 4.25 4.25L19 7" />
    </svg>
  );
}
