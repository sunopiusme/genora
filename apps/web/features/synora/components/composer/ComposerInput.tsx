"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./ComposerInput.module.css";
import { AttachmentTile } from "./attachments/AttachmentTile";
import { useAttachments } from "./attachments/useAttachments";
import { ArrowUpIcon, ClipIcon, CloseIcon, ListChecksIcon, MicIcon, SpinnerIcon, StopIcon } from "./icons";
import LcdMarquee, { VOICE_DECODE_TOTAL_MS } from "./LcdMarquee";
import {
  attachCountTransient,
  deriveLcdState,
  fileRejectedTransient,
  modelTransient,
  permissionTransient,
  planModeTransient,
  useTransient,
  voiceUnavailableTransient,
} from "./lcdPanel";
import { ModelPicker } from "./models/ModelPicker";
import { DEFAULT_SELECTION } from "./models/data";
import type { ModelSelection } from "./models/types";
import { PermissionPicker } from "./permissions/PermissionPicker";
import type { PermissionLevel } from "./permissions/types";
import { PlusDropdown } from "./PlusDropdown";
import { PromptInput } from "./PromptInput";
import { Tooltip } from "./Tooltip";
import { useFileDrop } from "./useFileDrop";
import { useTypingPulse } from "./useTypingPulse";
import { VoiceRecorder } from "./voice/VoiceRecorder";
import { useVoiceWaveform } from "./voice/useVoiceWaveform";

const TRANSIENT_MS = 1700;
const REJECTED_MS = 2200;
const SUBMIT_MS = 720;
const THINK_MS = 6000;
const READY_MS = 1900;
/* Распознавание нарочно неторопливое: в LCD волна перетягивается в
   жидкую сферу, та живёт сердцебиением и в финале схлопывается в
   точку. Длительность диктует таймлайн самой анимации — один
   источник правды в LcdMarquee. */
const VOICE_PROCESSING_MS = VOICE_DECODE_TOTAL_MS;

type VoiceStage = "idle" | "recording" | "processing";

function useTimerChain() {
  const idsRef = useRef<number[]>([]);

  const cancelAll = useCallback(() => {
    idsRef.current.forEach((id) => window.clearTimeout(id));
    idsRef.current = [];
  }, []);

  const schedule = useCallback((delayMs: number, fn: () => void) => {
    idsRef.current.push(window.setTimeout(fn, delayMs));
  }, []);

  useEffect(() => cancelAll, [cancelAll]);

  return { schedule, cancelAll };
}

type ComposerInputV2Props = {
  /** Превью-обложка: LCD показывает push-сцену вместо живой статус-панели. */
  preview?: boolean;
};

export default function ComposerInputV2({ preview = false }: ComposerInputV2Props) {
  const [prompt, setPrompt] = useState("");
  const [planMode, setPlanMode] = useState(false);
  const [permission, setPermission] = useState<PermissionLevel>("standard");
  const [selection, setSelection] = useState<ModelSelection>(DEFAULT_SELECTION);
  const [voiceStage, setVoiceStage] = useState<VoiceStage>("idle");
  const [inputFocused, setInputFocused] = useState(false);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const attachments = useAttachments();
  const fileDrop = useFileDrop(attachments.add);
  const lcd = useTransient();
  const sendFlow = useTimerChain();
  const { pulseRef, registerKeystroke } = useTypingPulse();

  // Один live-буфер амплитуд питает и waveform в toolbar'е,
  // и радужную волну в LCD-экране.
  const voiceWaveform = useVoiceWaveform(voiceStage === "recording");

  const promptReady = prompt.trim().length > 0;
  const typing = promptReady && voiceStage === "idle";
  const canSend = promptReady || attachments.attachments.length > 0 || voiceStage !== "idle";
  const canSubmit = canSend && !sending && voiceStage !== "processing";

  const lcdState = deriveLcdState({
    sending,
    voiceStage,
    typing,
    transient: lcd.transient,
  });

  const handleSelectionChange = (next: ModelSelection) => {
    setSelection(next);
    lcd.show(modelTransient(next), TRANSIENT_MS);
  };

  const handlePermissionChange = (next: PermissionLevel) => {
    setPermission(next);
    lcd.show(permissionTransient(next), TRANSIENT_MS);
  };

  const handlePlanModeChange = (next: boolean) => {
    setPlanMode(next);
    lcd.show(planModeTransient(next), TRANSIENT_MS);
  };

  const showLcd = lcd.show;
  const attachCount = attachments.attachments.length;

  useEffect(() => {
    if (attachCount === 0) return;
    showLcd(attachCountTransient(attachCount), TRANSIENT_MS);
  }, [attachCount, showLcd]);

  useEffect(() => {
    if (attachments.lastRejected.length === 0) return;
    showLcd(fileRejectedTransient(), REJECTED_MS);
  }, [attachments.lastRejected, showLcd]);

  useEffect(() => {
    if (voiceStage !== "processing") return;
    const id = window.setTimeout(() => {
      setVoiceStage("idle");
      showLcd(voiceUnavailableTransient(), REJECTED_MS);
    }, VOICE_PROCESSING_MS);
    return () => window.clearTimeout(id);
  }, [voiceStage, showLcd]);

  const handleMicToggle = () => {
    if (voiceStage === "idle") setVoiceStage("recording");
    else if (voiceStage === "recording") setVoiceStage("processing");
  };

  const handlePromptChange = (next: string) => {
    registerKeystroke();
    setPrompt(next);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (voiceStage === "recording") {
      setVoiceStage("processing");
      return;
    }

    setSending(true);
    lcd.clear();
    sendFlow.cancelAll();
    sendFlow.schedule(SUBMIT_MS, () => {
      setPrompt("");
      attachments.clear();
      setSending(false);
      lcd.show({ text: "ДУМАЕТ", mood: "ponder" });
      sendFlow.schedule(THINK_MS, () => {
        lcd.show({ text: "ГОТОВО К НОВОЙ ЗАДАЧЕ", mood: "ready" }, READY_MS);
      });
    });
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const micLabel =
    voiceStage === "recording"
      ? "Остановить запись"
      : voiceStage === "processing"
        ? "Обработка"
        : "Голосовой ввод";

  return (
    <div className={styles.root} aria-label="Демонстрация composer input">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,audio/*"
        className={styles.hiddenFile}
        onChange={(event) => {
          if (event.target.files) attachments.add(event.target.files);
          // Сброс позволяет выбрать тот же файл повторно после удаления.
          event.target.value = "";
        }}
      />
      <div className={styles.stack}>
        <div className={styles.lcdRow} role="status">
          <LcdMarquee
            status={lcdState.status}
            mood={lcdState.mood}
            tone={lcdState.tone}
            accessLevel={lcd.transient?.accessLevel}
            colorMode={lcdState.colorMode}
            typingPulse={pulseRef}
            voice={voiceWaveform}
            scene={preview ? "push" : "status"}
          />
        </div>
        <div
          className={styles.card}
          data-drag={fileDrop.dragOver}
          data-focus={inputFocused}
          data-typing={promptReady}
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

          <div className={styles.toolbar} data-recording={voiceStage !== "idle"}>
            <div className={styles.toolbarLeft}>
              <PlusDropdown
                planMode={planMode}
                onPlanModeChange={handlePlanModeChange}
                onAttach={openFilePicker}
              />
              {voiceStage !== "idle" ? (
                <VoiceRecorder stage={voiceStage} waveform={voiceWaveform} />
              ) : (
                <>
                  <PromptInput
                    value={prompt}
                    disabled={sending}
                    canSubmit={canSubmit}
                    onValueChange={handlePromptChange}
                    onFocusChange={setInputFocused}
                    onSubmit={handleSubmit}
                  />
                  {planMode ? (
                    <span className={styles.modeChip}>
                      <span className={styles.modeChipIcon} aria-hidden="true">
                        <ListChecksIcon />
                      </span>
                      Планирование
                      <button
                        type="button"
                        className={styles.modeChipClose}
                        aria-label="Выключить планирование"
                        onClick={() => handlePlanModeChange(false)}
                      >
                        <CloseIcon />
                      </button>
                    </span>
                  ) : null}
                </>
              )}
            </div>

            <div className={styles.toolbarRight}>
              {voiceStage !== "idle" ? null : (
                <>
                  <Tooltip label="Уровень доступа">
                    <PermissionPicker level={permission} onChange={handlePermissionChange} />
                  </Tooltip>
                  <Tooltip label="Выбрать модель">
                    <ModelPicker selection={selection} onChange={handleSelectionChange} />
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
      </div>
    </div>
  );
}
