"use client";

import styles from "./composer-input.module.css";
import { MicIcon, SpinnerIcon, StopIcon } from "./composer-icons";
import { Tooltip } from "./tooltip";
import type { VoiceStage } from "../../types";

export const VOICE_INPUT_ENABLED = false;

type Props = {
  stage: VoiceStage;
  onToggle: () => void;
};

export function MicButton({ stage, onToggle }: Props) {
  const label =
    stage === "recording"
      ? "Остановить запись"
      : stage === "processing"
        ? "Обработка"
        : "Голосовой ввод";

  return (
    <Tooltip
      label={label}
      shortcut={
        stage === "idle" ? (
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
        data-active={stage === "recording"}
        data-loading={stage === "processing"}
        aria-label={label}
        aria-pressed={stage === "recording"}
        disabled={stage === "processing"}
        onClick={onToggle}
      >
        {stage === "processing" ? (
          <SpinnerIcon />
        ) : stage === "recording" ? (
          <StopIcon />
        ) : (
          <MicIcon />
        )}
      </button>
    </Tooltip>
  );
}
