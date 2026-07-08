"use client";

import { useEffect, useRef, useState } from "react";

const BARS = 110;
const FAKE_SPEED = 0.06;
const SAMPLE_INTERVAL_MS = 70;

export type VoiceSource = "live" | "fake" | "idle";

export type VoiceWaveform = {
  barsRef: React.MutableRefObject<Float32Array>;
  bandsRef: React.MutableRefObject<Float32Array>;
  lastSampleRef: React.MutableRefObject<number>;
  sampleIntervalMs: number;
  source: VoiceSource;
};

export function useVoiceWaveform(active: boolean): VoiceWaveform {
  const barsRef = useRef<Float32Array>(new Float32Array(BARS));
  const bandsRef = useRef<Float32Array>(new Float32Array(3));
  const [source, setSource] = useState<VoiceSource>("idle");

  const sourceRef = useRef<VoiceSource>("idle");
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const freqRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const bandBinsRef = useRef<Array<[number, number]>>([]);
  const fakePhaseRef = useRef(0);
  const lastSampleRef = useRef(0);
  const peakRef = useRef(0);
  const emaRef = useRef(0);
  const SILENCE_RMS = 0.018;
  const SILENCE_RATIO = 0.09;
  const PEAK_DECAY = 0.965;
  const PEAK_FLOOR = 0.04;
  const EMA_ALPHA = 0.6;

  useEffect(() => {
    if (!active) {
      cleanup();
      barsRef.current = new Float32Array(BARS);
      bandsRef.current.fill(0);
      sourceRef.current = "idle";
      setSource("idle");
      return;
    }

    let cancelled = false;

    const startLive = async () => {
      try {
        if (
          typeof window === "undefined" ||
          !navigator.mediaDevices?.getUserMedia
        ) {
          throw new Error("no-mediaDevices");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const ctx = new Ctx();
        audioCtxRef.current = ctx;

        const sourceNode = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.6;
        sourceNode.connect(analyser);
        analyserRef.current = analyser;
        dataRef.current = new Uint8Array<ArrayBuffer>(
          new ArrayBuffer(analyser.fftSize),
        );
        freqRef.current = new Uint8Array<ArrayBuffer>(
          new ArrayBuffer(analyser.frequencyBinCount),
        );
        const binHz = ctx.sampleRate / analyser.fftSize;
        const bin = (hz: number) =>
          Math.max(
            1,
            Math.min(analyser.frequencyBinCount - 1, Math.round(hz / binHz)),
          );
        bandBinsRef.current = [
          [bin(85), bin(320)],
          [bin(320), bin(2200)],
          [bin(2200), bin(6500)],
        ];

        sourceRef.current = "live";
        setSource("live");
        loop(performance.now());
      } catch {
        if (cancelled) return;
        sourceRef.current = "fake";
        setSource("fake");
        loop(performance.now());
      }
    };

    const loop = (now: number) => {
      if (now - lastSampleRef.current >= SAMPLE_INTERVAL_MS) {
        lastSampleRef.current = now;
        const bars = barsRef.current;
        bars.copyWithin(0, 1);

        let level = 0;
        if (
          sourceRef.current === "live" &&
          analyserRef.current &&
          dataRef.current
        ) {
          const analyser = analyserRef.current;
          const data = dataRef.current;
          analyser.getByteTimeDomainData(data);

          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const v = (data[i]! - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length);

          if (rms < SILENCE_RMS || rms < peakRef.current * SILENCE_RATIO) {
            emaRef.current = emaRef.current * 0.25;
            level = emaRef.current < 0.02 ? 0 : emaRef.current;
            const bands = bandsRef.current;
            bands[0] = bands[0]! * 0.3;
            bands[1] = bands[1]! * 0.3;
            bands[2] = bands[2]! * 0.3;
          } else {
            peakRef.current = Math.max(
              peakRef.current * PEAK_DECAY,
              PEAK_FLOOR,
              rms,
            );
            const norm = rms / peakRef.current;
            const compressed = Math.min(1, Math.pow(norm, 0.7));
            emaRef.current =
              EMA_ALPHA * compressed + (1 - EMA_ALPHA) * emaRef.current;
            level = emaRef.current;

            const fd = freqRef.current;
            if (fd) {
              analyser.getByteFrequencyData(fd);
              const bands = bandsRef.current;
              const gains = [1.15, 1.0, 1.65] as const;
              for (let b = 0; b < 3; b++) {
                const [a, z] = bandBinsRef.current[b] ?? [0, 0];
                let s = 0;
                for (let i = a; i < z; i++) s += fd[i]!;
                const n = z > a ? z - a : 1;
                bands[b] = Math.min(
                  1,
                  Math.pow((s / (n * 255)) * gains[b]!, 0.8),
                );
              }
            }
          }
        } else {
          fakePhaseRef.current += FAKE_SPEED;
          const t = fakePhaseRef.current;
          const env = Math.max(0, 0.5 + 0.55 * Math.sin(t * 0.13));
          const noise = (Math.random() - 0.5) * 0.4;
          const wave =
            Math.sin(t * 1.7) * 0.45 +
            Math.sin(t * 0.6 + 1.2) * 0.35 +
            noise;
          level = Math.max(0, Math.min(1, env * Math.abs(wave)));
          const bands = bandsRef.current;
          bands[0] = Math.min(1, level * (0.8 + 0.25 * Math.sin(t * 0.9)));
          bands[1] = Math.min(
            1,
            level * (0.55 + 0.45 * Math.abs(Math.sin(t * 1.6))),
          );
          bands[2] = Math.min(
            1,
            level * (0.3 + 0.55 * Math.abs(Math.sin(t * 2.3 + 0.7))),
          );
        }

        bars[BARS - 1] = level;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    void startLive();

    return () => {
      cancelled = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const cleanup = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {
        analyserRef.current = null;
      }
      analyserRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        void audioCtxRef.current.close();
      } catch {
        audioCtxRef.current = null;
      }
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    dataRef.current = null;
    freqRef.current = null;
    bandBinsRef.current = [];
  };

  return {
    barsRef,
    bandsRef,
    lastSampleRef,
    sampleIntervalMs: SAMPLE_INTERVAL_MS,
    source,
  };
}

export const VOICE_BARS = BARS;
