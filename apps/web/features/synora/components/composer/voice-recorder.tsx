"use client";

import { useEffect, useState } from "react";

import styles from "./voice-recorder.module.css";
import { Waveform } from "./waveform";
import type { VoiceWaveform } from "../../hooks/use-voice-waveform";

type Stage = "recording" | "processing";

type Props = {
  stage: Stage;
  waveform: VoiceWaveform;
};

export function VoiceRecorder({ stage, waveform }: Props) {
  const { barsRef, lastSampleRef, sampleIntervalMs, source } = waveform;
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (stage !== "recording") return;
    if (source === "idle") return;
    const id = window.setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [stage, source]);

  const mm = Math.floor(seconds / 60).toString();
  const ss = (seconds % 60).toString().padStart(2, "0");

  return (
    <div
      className={styles.recorder}
      data-stage={stage}
      role="status"
      aria-label={stage === "recording" ? "Запись голоса" : "Обработка записи"}
    >
      <Waveform
        barsRef={barsRef}
        lastSampleRef={lastSampleRef}
        sampleIntervalMs={sampleIntervalMs}
      />
      {stage === "recording" ? (
        <span className={styles.timer}>
          {mm}:{ss}
        </span>
      ) : null}
    </div>
  );
}
