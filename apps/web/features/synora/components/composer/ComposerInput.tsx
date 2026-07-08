"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useComposerStore } from "@features/products";

import styles from "./ComposerInput.module.css";
import { AttachmentTile } from "./attachments/AttachmentTile";
import { useAttachments } from "./attachments/useAttachments";
import {
  ArrowUpIcon,
  ClipIcon,
  ListChecksIcon,
  MicIcon,
  SpinnerIcon,
  StopIcon,
} from "./icons";
import { ModelPicker } from "./models/ModelPicker";
import { DEFAULT_SELECTION } from "./models/data";
import type { ModelSelection } from "./models/types";
import { PermissionPicker } from "./permissions/PermissionPicker";
import type { PermissionLevel } from "./permissions/types";
import { PlusDropdown } from "./PlusDropdown";
import { PromptInput } from "./PromptInput";
import { Tooltip } from "./Tooltip";
import { useFileDrop } from "./useFileDrop";
import { BranchPicker } from "./branches/BranchPicker";
import { useBranchStore } from "./branches/branch-store";
import { EnvironmentPicker } from "./environment/EnvironmentPicker";
import type { EnvironmentMode } from "./environment/types";
import { ProjectPicker } from "./projects/ProjectPicker";
import { DEFAULT_PROJECT, findProjectByLabel } from "./projects/data";
import type { ProjectSelection } from "./projects/types";
import { Toast } from "./voice/Toast";
import { VoiceRecorder } from "./voice/VoiceRecorder";
import { useVoiceWaveform } from "./voice/useVoiceWaveform";

const SUBMIT_MS = 720;
const VOICE_PROCESSING_MS = 2400;
const TOAST_MS = 4000;

type VoiceStage = "idle" | "recording" | "processing";

/**
 * Композер Синоры — единый модуль ввода запроса.
 *
 * Карточка с textarea (упоминания через @), вложениями
 * (кнопка «+», drag-and-drop), голосовым вводом и выбором
 * уровня доступа и модели. Под карточкой — drawer контекста:
 * проект, окружение запуска и ветка.
 *
 * Проект предвыбирается из query-параметра ?project= при
 * переходе из списка недавних песочниц в сайдбаре
 * (см. synora-shell.tsx); фокус поля запрашивается через
 * useComposerStore.focusSignal.
 */
export function ComposerInput() {
  const searchParams = useSearchParams();
  const focusSignal = useComposerStore((state) => state.focusSignal);

  const [prompt, setPrompt] = useState("");
  const [planMode, setPlanMode] = useState(false);
  const [permission, setPermission] = useState<PermissionLevel>("standard");
  const [selection, setSelection] = useState<ModelSelection>(DEFAULT_SELECTION);
  const [project, setProject] = useState<ProjectSelection>(DEFAULT_PROJECT);
  const [environment, setEnvironment] = useState<EnvironmentMode>("local");
  /* Ветка живёт в общем сторе: её также показывает и меняет
     десктопный заголовок главной /synora (SynoraHeading). */
  const branch = useBranchStore((state) => state.branch);
  const setBranch = useBranchStore((state) => state.setBranch);
  const [voiceStage, setVoiceStage] = useState<VoiceStage>("idle");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const attachments = useAttachments();
  const fileDrop = useFileDrop(attachments.add);

  /* Live-буфер амплитуд для waveform в строке записи. */
  const voiceWaveform = useVoiceWaveform(voiceStage === "recording");

  /* Переход из сайдбара («недавние песочницы») предвыбирает
     проект: ссылки передают человекочитаемое название. */
  const projectParam = searchParams.get("project");
  useEffect(() => {
    if (!projectParam) {
      setProject(DEFAULT_PROJECT);
      return;
    }
    const match = findProjectByLabel(projectParam);
    setProject(match ? { kind: "project", id: match.id } : DEFAULT_PROJECT);
  }, [projectParam]);

  /* Запрос фокуса извне (кнопка «Новый запрос» в сайдбаре). */
  useEffect(() => {
    if (focusSignal === 0) return;
    rootRef.current?.querySelector("textarea")?.focus();
  }, [focusSignal]);

  const promptReady = prompt.trim().length > 0;
  const canSend =
    promptReady || attachments.attachments.length > 0 || voiceStage !== "idle";
  const canSubmit = canSend && !sending && voiceStage !== "processing";

  /* Голосовой ввод — демо без бэкенда: после остановки записи
     показываем «обработку» и сообщаем, что распознавание
     недоступно. */
  useEffect(() => {
    if (voiceStage !== "processing") return;
    const id = window.setTimeout(() => {
      setVoiceStage("idle");
      setToast("Распознавание речи пока недоступно");
    }, VOICE_PROCESSING_MS);
    return () => window.clearTimeout(id);
  }, [voiceStage]);

  const handleMicToggle = () => {
    if (voiceStage === "idle") setVoiceStage("recording");
    else if (voiceStage === "recording") setVoiceStage("processing");
  };

  const handleSubmit = useCallback(() => {
    if (sending || voiceStage === "processing") return;
    if (voiceStage === "recording") {
      setVoiceStage("processing");
      return;
    }
    if (!promptReady && attachments.attachments.length === 0) return;

    /* Песочница пока без бэкенда: имитируем отправку
       и очищаем композер. */
    setSending(true);
    window.setTimeout(() => {
      setPrompt("");
      attachments.clear();
      setSending(false);
      rootRef.current?.querySelector("textarea")?.focus();
    }, SUBMIT_MS);
  }, [sending, voiceStage, promptReady, attachments]);

  const openFilePicker = () => fileInputRef.current?.click();

  const micLabel =
    voiceStage === "recording"
      ? "Остановить запись"
      : voiceStage === "processing"
        ? "Обработка"
        : "Голосовой ввод";

  return (
    <div ref={rootRef} className={styles.root}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,audio/*"
        className={styles.hiddenFile}
        onChange={(event) => {
          if (event.target.files) attachments.add(event.target.files);
          /* Сброс позволяет выбрать тот же файл повторно после удаления. */
          event.target.value = "";
        }}
      />
      <div className={styles.stack}>
        <div
          className={styles.card}
          data-drag={fileDrop.dragOver}
          data-sending={sending}
          aria-busy={sending}
          {...fileDrop.handlers}
        >
          {attachments.attachments.length > 0 ? (
            <div className={styles.attachmentsRow}>
              {attachments.attachments.map((att) => (
                <AttachmentTile
                  key={att.id}
                  attachment={att}
                  onRemove={attachments.remove}
                  onReorder={attachments.reorder}
                />
              ))}
            </div>
          ) : null}
          {fileDrop.dragOver ? (
            <div className={styles.dropOverlay} aria-hidden="true">
              <div className={styles.dropOverlayInner}>
                <span className={styles.dropOverlayIcon}>
                  <ClipIcon />
                </span>
                <span className={styles.dropOverlayCopy}>
                  <span className={styles.dropOverlayTitle}>
                    О��пустите, чтобы прикрепить
                  </span>
                  <span className={styles.dropOverlayHint}>
                    Изображение или аудио до 25 МБ
                  </span>
                </span>
              </div>
            </div>
          ) : null}

          {/* Верхний ряд карточки — многострочное поле ввода.
              Живёт отдельно от toolbar'а, чтобы длинный промпт
              рос вниз (auto-grow), а не сжимал контролы. */}
          <PromptInput
            value={prompt}
            disabled={sending}
            canSubmit={canSubmit}
            onValueChange={setPrompt}
            onSubmit={handleSubmit}
          />

          <div className={styles.toolbar} data-recording={voiceStage !== "idle"}>
            <div className={styles.toolbarLeft}>
              <PlusDropdown onAttach={openFilePicker} />
              {/* Планирование — постоянная кнопка-тоггл рядом с «+»:
                  всегда на месте, при активации получает tonal-fill
                  (data-active, как mic во время записи). Ничего не
                  появляется и не исчезает — layout стабилен. */}
              <Tooltip
                label={planMode ? "Выключить планирование" : "Планирование"}
              >
                <button
                  type="button"
                  className={styles.iconBtn}
                  data-active={planMode}
                  aria-label="Режим планирования"
                  aria-pressed={planMode}
                  onClick={() => setPlanMode((prev) => !prev)}
                >
                  <ListChecksIcon />
                </button>
              </Tooltip>
              {voiceStage !== "idle" ? (
                <VoiceRecorder stage={voiceStage} waveform={voiceWaveform} />
              ) : null}
            </div>

            <div className={styles.toolbarRight}>
              {voiceStage !== "idle" ? null : (
                <>
                  <Tooltip label="Уровень доступа">
                    <PermissionPicker level={permission} onChange={setPermission} />
                  </Tooltip>
                  <Tooltip label="Выбрать модель">
                    <ModelPicker selection={selection} onChange={setSelection} />
                  </Tooltip>
                </>
              )}
              <Tooltip
                label={micLabel}
                shortcut={
                  voiceStage === "idle" ? (
                    <>
                      <span aria-hidden="true">⌃</span>
                      <span aria-hidden="true">M</span>
                    </>
                  ) : undefined
                }
              >
                <button
                  type="button"
                  className={styles.iconBtn}
                  data-active={voiceStage === "recording"}
                  data-loading={voiceStage === "processing"}
                  aria-label={micLabel}
                  aria-pressed={voiceStage === "recording"}
                  disabled={voiceStage === "processing"}
                  onClick={handleMicToggle}
                >
                  {voiceStage === "processing" ? (
                    <SpinnerIcon />
                  ) : voiceStage === "recording" ? (
                    <StopIcon />
                  ) : (
                    <MicIcon />
                  )}
                </button>
              </Tooltip>
              <Tooltip label="Отправить">
                <button
                  type="button"
                  className={styles.sendBtn}
                  aria-label="Отправить"
                  disabled={!canSubmit}
                  data-disabled={!canSubmit}
                  data-sending={sending}
                  onClick={handleSubmit}
                >
                  {sending ? <SpinnerIcon /> : <ArrowUpIcon />}
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Drawer контекста: проект, окружение запуска, ветка. */}
        <div className={styles.context}>
          <ProjectPicker selection={project} onChange={setProject} />
          <EnvironmentPicker mode={environment} onChange={setEnvironment} />
          <BranchPicker branch={branch} onChange={setBranch} />
        </div>
      </div>

      {toast ? (
        <Toast
          message={toast}
          duration={TOAST_MS}
          onDismiss={() => setToast(null)}
        />
      ) : null}
    </div>
  );
}
