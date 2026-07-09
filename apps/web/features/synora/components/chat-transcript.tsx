"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { DEFAULT_SELECTION } from "../data/models";
import { useChatRequest } from "../hooks/use-chat-request";
import { useChatStore } from "../stores/chat-store";
import type { ChatMessage } from "../types";
import styles from "./chat-transcript.module.css";
import { MarkdownContent } from "./markdown-content";

const BOTTOM_THRESHOLD = 48;

export function ChatTranscript() {
  const messages = useChatStore((state) => state.messages);
  const status = useChatStore((state) => state.status);
  const updateUserMessage = useChatStore((state) => state.updateUserMessage);
  const chat = useChatRequest();
  const scrollRef = useRef<HTMLElement | null>(null);
  const isAtBottomRef = useRef(true);
  const messageCountRef = useRef(0);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const isStreaming = status === "streaming";

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

  // Пересчёт положения при изменении размеров: без этого кнопка «вниз»
  // может остаться видимой после ресайза, когда прокрутка уже внизу.
  useEffect(() => {
    const scrollArea = scrollRef.current;
    if (!scrollArea) {
      return;
    }
    const recompute = () => {
      const remainingDistance =
        scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight;
      const nextIsAtBottom = remainingDistance < BOTTOM_THRESHOLD;
      isAtBottomRef.current = nextIsAtBottom;
      setIsAtBottom(nextIsAtBottom);
    };
    const observer = new ResizeObserver(recompute);
    observer.observe(scrollArea);
    return () => observer.disconnect();
  }, []);

  const scrollToBottom = useCallback(() => {
    const scrollArea = scrollRef.current;
    if (!scrollArea) {
      return;
    }
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    scrollArea.scrollTo({
      top: scrollArea.scrollHeight,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, []);

  const handleRetry = useCallback(() => {
    const currentMessages = useChatStore.getState().messages;
    const lastUserMessage = [...currentMessages]
      .reverse()
      .find((message) => message.role === "user");
    if (!lastUserMessage) {
      return;
    }
    isAtBottomRef.current = true;
    setIsAtBottom(true);
    void chat.retry({
      prompt: lastUserMessage.content,
      modelId: DEFAULT_SELECTION.modelId,
      levelId: DEFAULT_SELECTION.levelId,
    });
  }, [chat]);

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
        const nextIsAtBottom = remainingDistance < BOTTOM_THRESHOLD;
        isAtBottomRef.current = nextIsAtBottom;
        setIsAtBottom(nextIsAtBottom);
      }}
    >
      <div className={styles.messages}>
        {messages.map((message, index) =>
          message.role === "user" ? (
            <UserMessage
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
          ) : (
            <AssistantMessage
              key={message.id}
              message={message}
              isCopied={copiedMessageId === message.id}
              isLast={index === messages.length - 1}
              isBusy={isStreaming}
              onCopy={handleCopy}
              onRetry={handleRetry}
            />
          ),
        )}
      </div>
      <div className={styles.scrollDownDock} aria-hidden={isAtBottom}>
        <button
          type="button"
          className={styles.scrollDownBtn}
          data-visible={!isAtBottom}
          tabIndex={isAtBottom ? -1 : 0}
          aria-label="Прокрутить к последнему сообщению"
          onClick={scrollToBottom}
        >
          <ArrowDownIcon />
        </button>
      </div>
    </section>
  );
}

type UserMessageProps = {
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

function UserMessage({
  message,
  isCopied,
  isEditing,
  draft,
  onCopy,
  onEdit,
  onDraftChange,
  onEditCancel,
  onEditSave,
}: UserMessageProps) {
  const editInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Автовысота поля: пузырь растёт вместе с текстом, как в iOS.
  useEffect(() => {
    if (!isEditing) {
      return;
    }
    const element = editInputRef.current;
    if (!element) {
      return;
    }
    element.style.height = "0";
    element.style.height = `${element.scrollHeight}px`;
  }, [isEditing, draft]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }
    const element = editInputRef.current;
    if (!element) {
      return;
    }
    element.focus();
    element.setSelectionRange(element.value.length, element.value.length);
  }, [isEditing]);

  if (isEditing) {
    return (
      <article className={styles.userMessage} data-editing="true">
        <form className={styles.editForm} onSubmit={onEditSave}>
          <textarea
            ref={editInputRef}
            className={styles.editInput}
            value={draft}
            rows={1}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                onEditCancel();
                return;
              }
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !(event.nativeEvent.isComposing || event.keyCode === 229)
              ) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            aria-label="Редактировать запрос"
          />
          <div className={styles.editActions}>
            <button
              type="button"
              className={styles.editCancelBtn}
              onClick={onEditCancel}
            >
              Отмена
            </button>
            <button
              type="submit"
              className={styles.editSaveBtn}
              disabled={!draft.trim()}
            >
              Сохранить
            </button>
          </div>
        </form>
      </article>
    );
  }

  return (
    <article className={styles.userMessage}>
      <p className={styles.userContent}>{message.content}</p>
      <div className={styles.meta}>
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
    </article>
  );
}

type AssistantMessageProps = {
  message: ChatMessage;
  isCopied: boolean;
  isLast: boolean;
  isBusy: boolean;
  onCopy: (message: ChatMessage) => void;
  onRetry: () => void;
};

function AssistantMessage({
  message,
  isCopied,
  isLast,
  isBusy,
  onCopy,
  onRetry,
}: AssistantMessageProps) {
  const isStreaming = message.status === "streaming";
  const isError = message.status === "error";
  const isDone = message.status === "done" && message.content.length > 0;
  const canRetry = isLast && !isBusy;

  return (
    <article
      className={styles.assistantMessage}
      aria-live="polite"
      aria-busy={isStreaming}
      aria-label="Ответ Claude Sonnet 4.5"
    >
      {message.content ? (
        <MarkdownContent content={message.content} isStreaming={isStreaming} />
      ) : isStreaming ? (
        <div className={styles.pending} aria-label="Claude готовит ответ">
          <span />
          <span />
          <span />
        </div>
      ) : null}
      {isError ? (
        <div className={styles.errorBlock} role="alert">
          <span className={styles.errorIcon} aria-hidden="true">
            <AlertIcon />
          </span>
          <p className={styles.errorMessage}>
            {message.content
              ? "Соединение прервано, ответ получен не полностью."
              : "Не удалось получить ответ. Проверьте подключение."}
          </p>
          {canRetry ? (
            <button
              type="button"
              className={styles.errorRetryBtn}
              onClick={onRetry}
            >
              <RefreshIcon />
              Попробовать ещё раз
            </button>
          ) : null}
        </div>
      ) : null}
      {isDone ? (
        <div className={styles.meta}>
          <time dateTime={new Date(message.createdAt).toISOString()}>
            {formatMessageTime(message.createdAt)}
          </time>
          <button
            type="button"
            aria-label="Скопировать ответ"
            title="Скопировать"
            onClick={() => void onCopy(message)}
          >
            {isCopied ? <CheckIcon /> : <CopyIcon />}
          </button>
          {canRetry ? (
            <button
              type="button"
              aria-label="Повторить ответ"
              title="Повторить ответ"
              onClick={onRetry}
            >
              <RefreshIcon />
            </button>
          ) : null}
        </div>
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

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v3.7h-3.7" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 8.25v4.5" />
      <path d="M12 15.75h.01" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14m0 0 5.5-5.5M12 19l-5.5-5.5" />
    </svg>
  );
}
