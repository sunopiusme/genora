"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { AssistantBar } from "@features/products";
import { cn } from "@genora/ui";
import shellStyles from "./app-shell.module.css";
import composerStyles from "./composer-bar.module.css";
import { ComposerBar } from "./composer-bar";
import styles from "./liquid-glass-composer.module.css";

/**
 * ТЕСТОВЫЙ РЕЖИМ Liquid Glass для Composer.
 *
 * Архитектура: root для WebGL-стекла — сам скролл-контейнер страницы
 * ([data-glass-scroll], см. PageScrollArea). Пилюля портализуется
 * внутрь него sticky-элементом. Так снимок фона (html-to-image)
 * делается один раз, а при скролле библиотека корректно смещает
 * выборку — стекло преломляет реальный контент под собой.
 *
 * Откат: поставить false (или удалить этот файл и вернуть
 * стандартный блок composer в app-shell.tsx) и убрать пакет
 * @ybouane/liquidglass из package.json.
 */
export const LIQUID_GLASS_COMPOSER = true;

const GLASS_CONFIG = {
  blurAmount: 0.22,
  refraction: 0.78,
  chromAberration: 0.08,
  /* Заметная светящаяся кромка: на плоском тёмном фоне именно она
     отделяет стекло от подложки. */
  edgeHighlight: 0.35,
  fresnel: 1.4,
  cornerRadius: 26,
  zRadius: 22,
  saturation: 0.2,
  shadowOpacity: 0.55,
  floating: false,
};

type LiquidGlassInstance = {
  destroy: () => void;
  markChanged: (element?: HTMLElement) => void;
  capture: {
    captureElement: (element: HTMLElement, force?: boolean) => Promise<void>;
  };
};

type LiquidGlassComposerProps = {
  rootRef: RefObject<HTMLDivElement | null>;
};

export function LiquidGlassComposer({ rootRef }: LiquidGlassComposerProps) {
  const pathname = usePathname();
  const anchorRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const [scroller, setScroller] = useState<HTMLElement | null>(null);

  /* Поиск скролл-контейнера текущей страницы. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    setScroller(
      root.querySelector<HTMLElement>("[data-glass-scroll]") ?? null,
    );
  }, [rootRef, pathname]);

  /* Геометрия: якорь в полосе composer резервирует вертикальное
     место; sticky-пилюля выравнивается по нему offset'ом снизу. */
  useEffect(() => {
    const anchor = anchorRef.current;
    const glass = glassRef.current;
    if (!anchor || !glass || !scroller) {
      return;
    }

    /* Пилюля должна прижиматься к низу и при коротком контенте. */
    const prevDisplay = scroller.style.display;
    const prevDirection = scroller.style.flexDirection;
    scroller.style.display = "flex";
    scroller.style.flexDirection = "column";

    function align() {
      if (!anchor || !glass || !scroller) {
        return;
      }
      const pillHeight = glass.offsetHeight;
      if (pillHeight > 0) {
        const anchorHeight = `${pillHeight}px`;
        if (anchor.style.height !== anchorHeight) {
          anchor.style.height = anchorHeight;
        }
      }
      const scrollerRect = scroller.getBoundingClientRect();
      const anchorRect = anchor.getBoundingClientRect();
      if (anchorRect.height > 0 && scrollerRect.height > 0) {
        const bottom = `${Math.max(0, Math.round(scrollerRect.bottom - anchorRect.bottom))}px`;
        if (glass.style.bottom !== bottom) {
          glass.style.bottom = bottom;
        }
      }
    }

    align();
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(align);
    });
    observer.observe(scroller);
    observer.observe(anchor);
    observer.observe(glass);
    return () => {
      observer.disconnect();
      scroller.style.display = prevDisplay;
      scroller.style.flexDirection = prevDirection;
    };
  }, [scroller]);

  /* Инициализация WebGL-стекла: root — скролл-контейнер. */
  useEffect(() => {
    if (!scroller) {
      return;
    }

    let destroyed = false;
    let instance: LiquidGlassInstance | null = null;
    const cleanups: Array<() => void> = [];

    async function boot() {
      const glass = glassRef.current;
      if (!scroller || !glass) {
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
          root: scroller,
          glassElements: [glass],
        })) as unknown as LiquidGlassInstance;

        if (destroyed) {
          instance.destroy();
          instance = null;
          return;
        }

        /* Живая рефракция при скролле: снимок фона валиден, меняется
           только смещение выборки — шейдер перерисовываем покадрово. */
        let raf = 0;
        const handleScroll = () => {
          if (raf) {
            return;
          }
          raf = requestAnimationFrame(() => {
            raf = 0;
            instance?.markChanged();
          });
        };
        scroller.addEventListener("scroll", handleScroll, { passive: true });
        cleanups.push(() => {
          scroller.removeEventListener("scroll", handleScroll);
          cancelAnimationFrame(raf);
        });

        /* Контент страницы (карточки) подгружается асинхронно —
           пересобираем снимок фона после мутаций DOM. */
        const inner = scroller.querySelector<HTMLElement>(":scope > *");
        if (inner && inner !== glass) {
          let timer: number | undefined;
          const mutationObserver = new MutationObserver(() => {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => {
              void instance?.capture.captureElement(inner, true);
            }, 200);
          });
          mutationObserver.observe(inner, {
            childList: true,
            subtree: true,
            characterData: true,
          });
          cleanups.push(() => {
            mutationObserver.disconnect();
            window.clearTimeout(timer);
          });
          /* Первый контент мог дорендериться между init и наблюдением. */
          void instance.capture.captureElement(inner, true);
        }
      } catch (error) {
        console.error("[liquid-glass] init failed:", error);
        /* Фолбэк: возвращаем пилюле непрозрачный фон. */
        glassRef.current?.setAttribute("data-glass-fallback", "1");
      }
    }

    void boot();

    return () => {
      destroyed = true;
      for (const cleanup of cleanups) {
        cleanup();
      }
      instance?.destroy();
      instance = null;
    };
  }, [scroller]);

  /* Страница без [data-glass-scroll] — стандартный composer. */
  if (!scroller) {
    return (
      <div className={shellStyles.composer}>
        <div className={shellStyles.composerInner}>
          <ComposerBar />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={shellStyles.composer} data-liquid-glass="">
        <div className={shellStyles.composerInner}>
          <div className={composerStyles.bar}>
            {/* Якорь резервирует место пилюли в полосе composer */}
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

      {/* Стеклянная пилюля — sticky прямой потомок скроллера */}
      {createPortal(
        <div
          ref={glassRef}
          className={cn(styles.glassPill, shellStyles.composerGlass)}
        >
          <AssistantBar />
        </div>,
        scroller,
      )}
    </>
  );
}
