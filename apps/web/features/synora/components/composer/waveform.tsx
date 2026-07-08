"use client";

import { useEffect, useRef, type RefObject } from "react";

import styles from "./voice-recorder.module.css";
import { VOICE_BARS } from "../../hooks/use-voice-waveform";

type Props = {
  barsRef: RefObject<Float32Array>;
  lastSampleRef: RefObject<number>;
  sampleIntervalMs: number;
};

export function Waveform({
  barsRef,
  lastSampleRef,
  sampleIntervalMs,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;

    let rafId = 0;
    let pxWidth = 0;
    let pxHeight = 0;

    const n = VOICE_BARS;
    const xs = new Float32Array(n);
    const tops = new Float32Array(n);

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      pxWidth = Math.max(1, Math.round(rect.width * dpr));
      pxHeight = Math.max(1, Math.round(rect.height * dpr));
      canvas.width = pxWidth;
      canvas.height = pxHeight;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      canvas.style.top = "0";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };

    const buildEnvelopePath = (cy: number) => {
      ctx.beginPath();
      ctx.moveTo(xs[0]!, tops[0]!);
      for (let i = 1; i < n - 1; i++) {
        const cx = xs[i]!;
        const cyTop = tops[i]!;
        const mx = (xs[i]! + xs[i + 1]!) / 2;
        const my = (tops[i]! + tops[i + 1]!) / 2;
        ctx.quadraticCurveTo(cx, cyTop, mx, my);
      }
      ctx.lineTo(xs[n - 1]!, tops[n - 1]!);
      ctx.lineTo(xs[n - 1]!, cy + (cy - tops[n - 1]!));
      for (let i = n - 2; i >= 1; i--) {
        const cx = xs[i]!;
        const cyBot = cy + (cy - tops[i]!);
        const mx = (xs[i]! + xs[i - 1]!) / 2;
        const my = cy + (cy - (tops[i]! + tops[i - 1]!) / 2);
        ctx.quadraticCurveTo(cx, cyBot, mx, my);
      }
      ctx.lineTo(xs[0]!, cy + (cy - tops[0]!));
      ctx.closePath();
    };

    const draw = (now: number) => {
      const data = barsRef.current;
      if (!data) {
        rafId = requestAnimationFrame(draw);
        return;
      }
      const w = pxWidth;
      const h = pxHeight;
      const cy = h / 2;

      const lastSample = lastSampleRef.current ?? now;
      const elapsed = now - lastSample;
      const frac = Math.max(0, Math.min(1, elapsed / sampleIntervalMs));
      const stride = w / (n - 1);
      const shift = frac * stride;

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";

      ctx.fillStyle = "rgba(255, 255, 255, 0.32)";
      ctx.fillRect(0, Math.round(cy) - 0.5, w, 1);

      const baseHalf = h * 0.04;
      const spanHalf = h * 0.46;

      let anyVoice = false;
      for (let i = 0; i < n; i++) {
        const v = data[i] ?? 0;
        if (v > 0) anyVoice = true;
        const half = v === 0 ? 0 : baseHalf + v * spanHalf;
        xs[i] = i * stride - shift;
        tops[i] = cy - half;
      }

      if (anyVoice) {
        ctx.fillStyle = "rgb(245, 245, 245)";
        buildEnvelopePath(cy);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "destination-in";
      const fade = ctx.createLinearGradient(0, 0, w, 0);
      fade.addColorStop(0, "rgba(0, 0, 0, 0)");
      fade.addColorStop(0.08, "rgba(0, 0, 0, 1)");
      fade.addColorStop(0.92, "rgba(0, 0, 0, 1)");
      fade.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";

      rafId = requestAnimationFrame(draw);
    };

    resize();
    rafId = requestAnimationFrame(draw);

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [barsRef, lastSampleRef, sampleIntervalMs]);

  return (
    <div ref={containerRef} className={styles.waveform} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
