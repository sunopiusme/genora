"use client";

import { useEffect, useState } from "react";

import styles from "./VoiceRecorder.module.css";
import { Waveform } from "./Waveform";
import type { VoiceWaveform } from "./useVoiceWaveform";

/* ─────────────────────────────────────────
   VoiceRecorder

   Inline-режим записи в toolbar композера.
   Управляется stage'ом извне:
   • "recording" — micro активен, waveform
     стримит, timer тикает;
   • "processing" — после нажатия Stop:
     waveform приглушается, timer заменяется
     на «Обработка…» с animated dots. Через
     ~1.2s родитель ComposerInput вернёт
     idle-state и покажет демо-статус в LCD.

   Сам микрофонный хук (useVoiceWaveform) живёт
   в ComposerInput: тот же live-буфер питает и
   эту waveform в toolbar'е, и радужную волну
   в LCD-экране (LcdMarquee) — один источник
   правды для голосовой энергии.
   ───────────────────────────────────────── */

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
