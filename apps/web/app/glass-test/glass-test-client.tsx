"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./glass-test.module.css";

/* ---------- Общие иконки (реплика composer-пилюли) ---------- */

function PlusIcon() {
  return (
    <svg
      className={styles.iconGlyph}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg
      className={styles.iconGlyph}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

/* ---------- Содержимое пилюли (одинаковое для обоих вариантов) ---------- */

function PillContent() {
  return (
    <>
      <span className={styles.pillIconButton} aria-hidden="true">
        <PlusIcon />
      </span>
      <span className={styles.pillPlaceholder}>Найти подписку…</span>
      <span className={styles.pillSubmit} aria-hidden="true">
        <ArrowUpIcon />
      </span>
    </>
  );
}

/* ---------- Вариант 1: CSS + SVG-рефракция ---------- */

function CssGlassPanel() {
  return (
    <section className={styles.panel} aria-label="CSS вариант">
      <div className={styles.panelBadge}>CSS + SVG</div>

      {/* Живой фон: анимация скролла видна сквозь стекло в реальном времени */}
      <div className={styles.cssBackdrop} aria-hidden="true" />

      <div className={styles.cssGlassPill} role="presentation">
        <PillContent />
      </div>

      <p className={styles.panelNote}>
        Живой фон, рефракция в Chromium, frosted-fallback в Safari/Firefox
      </p>
    </section>
  );
}

/* ---------- Вариант 2: WebGL @ybouane/liquidglass ---------- */

function WebGlGlassPanel() {
  const rootRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    let destroyed = false;
    let instance: { destroy: () => void } | null = null;

    async function boot() {
      try {
        const root = rootRef.current;
        const glass = glassRef.current;
        if (!root || !glass) return;

        glass.dataset.config = JSON.stringify({
          blurAmount: 0.18,
          refraction: 0.72,
          chromAberration: 0.06,
          edgeHighlight: 0.08,
          fresnel: 1,
          cornerRadius: 32,
          zRadius: 28,
          saturation: 0.15,
          shadowOpacity: 0.35,
          floating: true,
        });

        await document.fonts.ready;
        const { LiquidGlass } = await import("@ybouane/liquidglass");
        if (destroyed) return;

        instance = await LiquidGlass.init({
          root,
          glassElements: [glass],
        });

        if (destroyed) {
          instance.destroy();
          instance = null;
          return;
        }
        setStatus("ready");
      } catch (error) {
        console.error("[glass-test] LiquidGlass init failed:", error);
        if (!destroyed) setStatus("error");
      }
    }

    void boot();

    return () => {
      destroyed = true;
      instance?.destroy();
      instance = null;
    };
  }, []);

  return (
    <section className={styles.panel} aria-label="WebGL вариант">
      <div className={styles.panelBadge}>WebGL (библиотека)</div>

      <div ref={rootRef} className={styles.webglRoot}>
        {/* Фон должен быть прямым потомком root — его захватывает шейдер */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.webglBackdrop}
          src="/glass-test-bg.png"
          alt=""
          aria-hidden="true"
        />

        {/* Стеклянная пилюля — тоже прямой потомок root */}
        <div ref={glassRef} className={styles.webglGlassPill} role="presentation">
          <PillContent />
        </div>
      </div>

      <p className={styles.panelNote}>
        {status === "loading" && "Инициализация WebGL…"}
        {status === "ready" && "Пилюлю можно перетаскивать. Фон — статичный снимок"}
        {status === "error" && "WebGL недоступен — эффект не запустился"}
      </p>
    </section>
  );
}

/* ---------- Страница ---------- */

export function GlassTestClient() {
  return (
    <main className={styles.page}>
      {/* SVG-фильтр рефракции для CSS-варианта (виден только Chromium) */}
      <svg className={styles.svgDefs} aria-hidden="true" focusable="false">
        <filter id="lg-refraction" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.012"
            numOctaves="2"
            seed="7"
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="2.5" result="soft" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="soft"
            scale="56"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      <header className={styles.header}>
        <h1 className={styles.title}>Liquid Glass — тестовое сравнение</h1>
        <p className={styles.subtitle}>
          Одна и та же composer-пилюля в двух реализациях. Слева фон живой и
          анимируется, справа — растеризованный снимок с шейдерной рефракцией.
        </p>
      </header>

      <div className={styles.grid}>
        <CssGlassPanel />
        <WebGlGlassPanel />
      </div>
    </main>
  );
}
