"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useComposerStore } from "@/stores/composer-store";

import styles from "./composer-input.module.css";
import { AttachmentTile } from "./attachment-tile";
import { BranchPicker } from "./branch-picker";
import {
  ArrowUpIcon,
  ClipIcon,
  ListChecksIcon,
  SpinnerIcon,
  StopIcon,
} from "./composer-icons";
import { LimitPicker } from "./limit-picker";
import { MicButton, VOICE_INPUT_ENABLED } from "./mic-button";
import { ModelPicker } from "./model-picker";
import { PermissionPicker } from "./permission-picker";
import { PlusDropdown } from "./plus-dropdown";
import { ProjectPicker } from "./project-picker";
import { PromptInput } from "./prompt-input";
import { Toast } from "./toast";
import { Tooltip } from "./tooltip";
import { VoiceRecorder } from "./voice-recorder";
import { DEFAULT_SELECTION } from "../../data/models";
import { useAttachments } from "../../hooks/use-attachments";
import { useChatRequest } from "../../hooks/use-chat-request";
import { useFileDrop } from "../../hooks/use-file-drop";
import { useVoiceWaveform } from "../../hooks/use-voice-waveform";
import { useBranchStore } from "../../stores/branch-store";
import { useChatStore } from "../../stores/chat-store";
import {
  branchForSelection,
  selectionFromQuery,
  useProjectStore,
} from "../../stores/project-store";
import type {
  ModelSelection,
  PermissionLevel,
  VoiceStage,
} from "../../types";

const SUBMIT_MS = 720;
const VOICE_PROCESSING_MS = 2400;
const TOAST_MS = 4000;

export function ComposerInput() {
  const searchParams = useSearchParams();
  const focusSignal = useComposerStore((state) => state.focusSignal);

  const [prompt, setPrompt] = useState("");
  const [planMode, setPlanMode] = useState(false);
  const [permission, setPermission] = useState<PermissionLevel>("standard");
  const [selection, setSelection] = useState<ModelSelection>(DEFAULT_SELECTION);
  const storeProject = useProjectStore((state) => state.selection);
  const hasSyncedProject = useProjectStore((state) => state.hasSynced);
  const setProject = useProjectStore((state) => state.setSelection);
  const syncProjectFromQuery = useProjectStore((state) => state.syncFromQuery);
  const storeBranch = useBranchStore((state) => state.branch);
  const setBranch = useBranchStore((state) => state.setBranch);

  const projectParam = searchParams.get("project");
  const querySelection = selectionFromQuery(projectParam);
  const project = hasSyncedProject ? storeProject : querySelection;
  const branch = hasSyncedProject
    ? storeBranch
    : branchForSelection(querySelection);
  const [voiceStage, setVoiceStage] = useState<VoiceStage>("idle");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const attachments = useAttachments();
  const fileDrop = useFileDrop(attachments.add);
  const chat = useChatRequest();
  const isStreaming = useChatStore((state) => state.status === "streaming");

  const voiceWaveform = useVoiceWaveform(voiceStage === "recording");

  useEffect(() => {
    syncProjectFromQuery(projectParam);
  }, [projectParam, syncProjectFromQuery]);

  useEffect(() => {
    if (focusSignal === 0) return;
    rootRef.current?.querySelector("textarea")?.focus();
  }, [focusSignal]);

  const promptReady = prompt.trim().length > 0;
  const canSend =
    promptReady || attachments.attachments.length > 0 || voiceStage !== "idle";
  const canSubmit = canSend && !sending && voiceStage !== "processing";

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

    if (selection.modelId === "claude-sonnet-4-5" && promptReady) {
      const trimmed = prompt.trim();
      setSending(true);
      setPrompt("");
      attachments.clear();
      void chat
        .send({
          prompt: trimmed,
          modelId: selection.modelId,
          levelId: selection.levelId,
        })
        .then((ok) => {
          if (!ok) setToast("Не удалось получить ответ модели");
        })
        .finally(() => {
          setSending(false);
          rootRef.current?.querySelector("textarea")?.focus();
        });
      return;
    }

    setSending(true);
    window.setTimeout(() => {
      setPrompt("");
      attachments.clear();
      setSending(false);
      rootRef.current?.querySelector("textarea")?.focus();
    }, SUBMIT_MS);
  }, [sending, voiceStage, promptReady, attachments, selection, prompt, chat]);

  const openFilePicker = () => fileInputRef.current?.click();

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
                    Отпустите, чтобы прикрепить
                  </span>
                  <span className={styles.dropOverlayHint}>
                    Изображение или аудио до 25 МБ
                  </span>
                </span>
              </div>
            </div>
          ) : null}

          <PromptInput
            value={prompt}
            disabled={sending && !isStreaming}
            canSubmit={canSubmit}
            onValueChange={setPrompt}
            onSubmit={handleSubmit}
          />

          <div className={styles.toolbar} data-recording={voiceStage !== "idle"}>
            <div className={styles.toolbarLeft}>
              <PlusDropdown onAttach={openFilePicker} />
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
              {VOICE_INPUT_ENABLED ? (
                <MicButton stage={voiceStage} onToggle={handleMicToggle} />
              ) : null}
              {isStreaming ? (
                <Tooltip label="Остановить">
                  <button
                    type="button"
                    className={styles.sendBtn}
                    aria-label="Остановить генерацию"
                    onClick={() => chat.cancel()}
                  >
                    <StopIcon />
                  </button>
                </Tooltip>
              ) : (
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
              )}
            </div>
          </div>
        </div>

        <div className={styles.context}>
          <ProjectPicker selection={project} onChange={setProject} />
          <BranchPicker branch={branch} onChange={setBranch} />
          <LimitPicker />
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
