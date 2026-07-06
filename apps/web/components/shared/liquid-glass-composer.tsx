"use client";

import { useEffect, useRef, type RefObject } from "react";
import { AssistantBar } from "@features/products";
import { cn } from "@genora/ui";
import shellStyles from "./app-shell.module.css";
import composerStyles from "./composer-bar.module.css";
import styles from "./liquid-glass-composer.module.css";

/**
 * ТЕСТОВЫЙ РЕЖИМ Liquid Glass для Composer.
 *
 * Откат: поставить false (или удалить этот файл и вернуть
 * стандартный блок composer в app-shell.tsx) и убрать пакет
 * @ybouane/liquidglass из package.json.
 */
export const LIQUID_GLASS_COMPOSER = true;

const GLASS_CONFIG = {
  blurAmount: 0.18,
  refraction: 0.72,
  chromAberration: 0.06,
  edgeHighlight: 0.08,
  fresnel: 1,
  cornerRadius: 26,
  zRadius: 22,
  saturation: 0.15,
  shadowOpacity: 0.35,
  floating: false,
};

type LiquidGlassInstance = {
  destroy: () => void;
  markChanged: (element?: HTMLElement) => void;
};

type LiquidGlassComposerProps = {
  rootRef: RefObject<HTMLDivElement | null>;
};

export function LiquidGlassComposer({ rootRef }: LiquidGlassComposerProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);

  /* Геометрия: якорь в полосе composer задаёт место, стеклянная
     пилюля (прямой потомок root — требование библиотеки)
     выравнивается по нему. */
  useEffect(() => {
    const root = rootRef.current;
    const anchor = anchorRef.current;
    const glass = glassRef.current;
    if (!root || !anchor || !glass) {
      return;
    }

    function align() {
      if (!root || !anchor || !glass) {
        return;
      }
      const pillHeight = glass.offsetHeight;
      const anchorHeight = `${pillHeight}px`;
      if (anchor.style.height !== anchorHeight && pillHeight > 0) {
        anchor.style.height = anchorHeight;
      }

      const rootRect = root.getBoundingClientRect();
      const anchorRect = anchor.getBoundingClientRect();
      const left = `${anchorRect.left - rootRect.left}px`;
      const top = `${anchorRect.top - rootRect.top}px`;
      const width = `${anchorRect.width}px`;
      if (glass.style.left !== left) glass.style.left = left;
      if (glass.style.top !== top) glass.style.top = top;
      if (glass.style.width !== width) glass.style.width = width;
    }

    align();
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(align);
    });
    observer.observe(root);
    observer.observe(anchor);
    observer.observe(glass);
    return () => observer.disconnect();
  }, [rootRef]);

  /* Инициализация WebGL-стекла. */
  useEffect(() => {
    let destroyed = false;
    let instance: LiquidGlassInstance | null = null;
    let cleanupScroll: (() => void) | null = null;

    async function boot() {
      const root = rootRef.current;
      const glass = glassRef.current;
      if (!root || !glass) {
        return;
      }

      try {
        glass.dataset.config = JSON.stringify(GLASS_CONFIG);
        await document.fonts.ready;
        const { LiquidGlass } = await import("@ybouane/liquidglass");
        if (destroyed) {
          return;
        }

        instance = (await LiquidGlass.init({
          root,
          glassElements: [glass],
        })) as unknown as LiquidGlassInstance;

        if (destroyed) {
          instance.destroy();
          instance = null;
          return;
        }

        /* Фон под стеклом — растровый снимок: обновляем его после
           того, как скролл контента остановился. */
        let timer: number | undefined;
        const handleScroll = () => {
          window.clearTimeout(timer);
          timer = window.setTimeout(() => {
            instance?.markChanged();
          }, 120);
        };
        root.addEventListener("scroll", handleScroll, {
          capture: true,
          passive: true,
        });
        cleanupScroll = () => {
          root.removeEventListener("scroll", handleScroll, { capture: true });
          window.clearTimeout(timer);
        };
      } catch (error) {
        console.error("[liquid-glass] init failed:", error);
        /* Фолбэк: возвращаем пилюле непрозрачный фон. */
        glassRef.current?.setAttribute("data-glass-fallback", "1");
      }
    }

    void boot();

    return () => {
      destroyed = true;
      cleanupScroll?.();
      instance?.destroy();
      instance = null;
    };
  }, [rootRef]);

  return (
    <>
      <div className={shellStyles.composer} data-liquid-glass="">
        <div className={shellStyles.composerInner}>
          <div className={composerStyles.bar}>
            {/* Якорь резервирует место пилюли в потоке полосы composer */}
            <div
              ref={anchorRef}
              className={cn(composerStyles.input, styles.anchor)}
              aria-hidden="true"
            />
            <p className={composerStyles.disclaimer}>
              Даже топовые модели могут ошибаться.
            </p>
          </div>
        </div>
      </div>

      {/* Стеклянная пилюля — прямой потомок root (.content) */}
      <div
        ref={glassRef}
        className={cn(styles.glassPill, shellStyles.composerGlass)}
      >
        <AssistantBar />
      </div>
    </>
  );
}
