"use client";

/**
 * Чат-инпут площадки «Синора» в стиле агентных IDE-композеров:
 * - большое многострочное поле «Опишите задачу…» (авторастёт до 10 строк);
 * - нижняя панель: «плюс» (вложения), селектор уровня доступа,
 *   выбор модели, голосовой ввод и круглая кнопка отправки;
 * - под контейнером — строка контекста песочницы: название проекта
 *   (из ?project=), режим выполнения и ветка. Показывается только
 *   когда открыта конкретная песочница.
 *
 * Композер общий для мобильной и десктопной версий: раскладку
 * (низ экрана / центр) задаёт обёртка в synora-shell.
 */

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/lib/icon";
import { useComposerStore } from "@features/products";
import styles from "./synora-composer.module.css";

const MAX_EDITOR_HEIGHT_REM = 15;

const ACCESS_OPTIONS = [
  {
    value: "full",
    label: "Полный доступ",
    hint: "Синора может менять файлы и выполнять команды",
  },
  {
    value: "read",
    label: "Только чтение",
    hint: "Изменения потребуют вашего подтверждения",
  },
] as const;

const MODEL_OPTIONS = [
  { value: "synora-pro", label: "Синора Pro", hint: "Максимум качества" },
  { value: "synora-fast", label: "Синора Fast", hint: "Быстрые ответы" },
] as const;

export function SynoraComposer() {
  const searchParams = useSearchParams();
  const projectName = searchParams.get("project") ?? undefined;

  const formRef = useRef<HTMLFormElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [hasContent, setHasContent] = useState(false);
  const [access, setAccess] = useState<string>(ACCESS_OPTIONS[0].value);
  const [model, setModel] = useState<string>(MODEL_OPTIONS[0].value);
  const focusSignal = useComposerStore((state) => state.focusSignal);

  useEffect(() => {
    if (focusSignal === 0) {
      return;
    }
    editorRef.current?.focus();
  }, [focusSignal]);

  function resizeEditor() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    const maxHeight =
      MAX_EDITOR_HEIGHT_REM *
      parseFloat(getComputedStyle(document.documentElement).fontSize);
    editor.style.height = "auto";
    editor.style.height = `${Math.min(editor.scrollHeight, maxHeight)}px`;
    editor.style.overflowY =
      editor.scrollHeight > maxHeight ? "auto" : "hidden";
  }

  function handleInput() {
    resizeEditor();
    setHasContent((editorRef.current?.value.trim().length ?? 0) > 0);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const editor = editorRef.current;
    const value = editor?.value.trim() ?? "";
    if (!editor || value.length === 0) {
      return;
    }
    /* Песочница пока без бэкенда: очищаем поле после отправки. */
    editor.value = "";
    setHasContent(false);
    resizeEditor();
    editor.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    const isComposing = event.nativeEvent.isComposing || event.keyCode === 229;
    if (event.key === "Enter" && !event.shiftKey && !isComposing) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  const accessOption =
    ACCESS_OPTIONS.find((option) => option.value === access) ??
    ACCESS_OPTIONS[0];
  const modelOption =
    MODEL_OPTIONS.find((option) => option.value === model) ?? MODEL_OPTIONS[0];

  return (
    <div className={styles.root}>
      <form ref={formRef} className={styles.panel} onSubmit={handleSubmit}>
        <textarea
          ref={editorRef}
          className={styles.editor}
          placeholder="Опишите задачу…"
          rows={1}
          aria-label="Задача для Синоры"
          onInput={handleInput}
          onKeyDown={handleKeyDown}
        />

        <div className={styles.toolbar}>
          <div className={styles.toolbarGroup}>
            <button
              type="button"
              className={styles.iconButton}
              aria-label="Прикрепить файлы"
            >
              <Icon icon="solar:add-circle-linear" className={styles.glyph} />
            </button>

            <ComposerSelect
              value={access}
              options={ACCESS_OPTIONS}
              onChange={setAccess}
              ariaLabel="Уровень доступа"
              buttonClassName={styles.accessButton}
            >
              <Icon
                icon="solar:danger-circle-linear"
                className={styles.glyph}
              />
              <span className={styles.selectLabel}>{accessOption.label}</span>
            </ComposerSelect>
          </div>

          <div className={styles.toolbarGroup}>
            <ComposerSelect
              value={model}
              options={MODEL_OPTIONS}
              onChange={setModel}
              ariaLabel="Модель"
              buttonClassName={styles.modelButton}
            >
              <span className={styles.selectLabel}>{modelOption.label}</span>
            </ComposerSelect>

            <button
              type="button"
              className={styles.iconButton}
              aria-label="Голосовой ввод"
            >
              <Icon icon="solar:microphone-linear" className={styles.glyph} />
            </button>

            <button
              type="submit"
              className={styles.submit}
              disabled={!hasContent}
              aria-label="Отправить"
            >
              <Icon
                icon="solar:arrow-up-bold-stroke"
                className={styles.submitGlyph}
              />
            </button>
          </div>
        </div>
      </form>

      {projectName && (
        <div className={styles.contextRow}>
          <span className={styles.contextChip}>
            <Icon icon="solar:folder-linear" className={styles.contextGlyph} />
            {projectName}
          </span>
          <span className={styles.contextChip}>
            <Icon
              icon="solar:sandbox-minimalistic-linear"
              className={styles.contextGlyph}
            />
            В песочнице
          </span>
          <span className={styles.contextChip}>
            <Icon
              icon="solar:branching-paths-up-linear"
              className={styles.contextGlyph}
            />
            main
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Компактный выпадающий список для панели композера.
 * Закрывается по Escape, клику вне и выбору пункта.
 */
function ComposerSelect({
  value,
  options,
  onChange,
  ariaLabel,
  buttonClassName,
  children,
}: {
  value: string;
  options: ReadonlyArray<{ value: string; label: string; hint: string }>;
  onChange: (value: string) => void;
  ariaLabel: string;
  buttonClassName?: string;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className={styles.selectRoot}>
      <button
        type="button"
        className={buttonClassName}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {children}
        <Icon icon="solar:alt-arrow-down-linear" className={styles.chevron} />
      </button>

      {isOpen && (
        <ul className={styles.selectMenu} role="listbox" aria-label={ariaLabel}>
          {options.map((option) => (
            <li key={option.value} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={styles.selectOption}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span className={styles.selectOptionLabel}>
                  {option.label}
                </span>
                <span className={styles.selectOptionHint}>{option.hint}</span>
                {option.value === value && (
                  <Icon
                    icon="solar:check-read-linear"
                    className={styles.selectOptionCheck}
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
