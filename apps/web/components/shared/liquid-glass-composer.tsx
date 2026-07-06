"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
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

/* Параметры близки к дефолтам библиотеки (README ybouane/liquidglass):
   агрессивные значения (shadowOpacity 0.55, edgeHighlight 0.35)
   давали «затемнение по всей поверхности». */
const GLASS_CONFIG = {
  blurAmount: 0.2,
  refraction: 0.69,
  chromAberration: 0.05,
  edgeHighlight: 0.12,
  fresnel: 1,
  cornerRadius: 26,
  zRadius: 22,
  saturation: 0.1,
  shadowOpacity: 0.3,
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

  /* Поиск скролл-контейнера текущей страницы. useLayoutEffect —
     до первой отрисовки, иначе на кадр мелькает обычный composer,
     который тут же подменяется стеклянным.

     ВАЖНО: rootRef.current здесь ещё может быть null (layout-эффекты
     детей выполняются раньше привязки ref родителя), поэтому ищем
     через rootRef с фолбэком на document и повтором на след. кадр. */
  useLayoutEffect(() => {
    let raf = 0;
    const find = () => {
      const scope = rootRef.current ?? document;
      const found = scope.querySelector<HTMLElement>("[data-glass-scroll]");
      if (found) {
        setScroller(found);
        return;
      }
      /* Страница могла ещё не домонтироваться — одна повторная
         попытка после первого кадра, дальше — фолбэк-ветка. */
      raf = requestAnimationFrame(() => {
        const late = (rootRef.current ?? document).querySelector<HTMLElement>(
          "[data-glass-scroll]",
        );
        setScroller(late ?? null);
      });
    };
    find();
    return () => {
      cancelAnimationFrame(raf);
    };
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

        /* Pending-вид снимаем только после того, как WebGL-canvas
           реально отрисовал кадры (init резолвится ДО первой отрисовки —
           снятие сразу и давало цепочку «обычный → пусто → стекло»).
           Два rAF: кадр рендера библиотеки + кадр композитинга. */
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
          });
        });
        if (destroyed) {
          return;
        }
        glass.removeAttribute("data-glass-pending");

        const inner = scroller.querySelector<HTMLElement>(":scope > *");

        /* Единая очередь пересъёмки фона: не чаще одного захвата
           одновременно и с паузой между ними — гонка параллельных
           captureElement и вызывала постоянное мигание поверхности. */
        let capturing = false;
        let pendingCapture = false;
        const RECAPTURE_COOLDOWN = 1200;
        /* init() уже сделал pre-warm снимок — стартуем кулдаун сейчас,
           иначе немедленная пересъёмка подменяла свежий кадр стекла. */
        let lastCapture = Date.now();
        const recapture = async () => {
          if (!inner || inner === glass || !instance) {
            return;
          }
          if (capturing) {
            pendingCapture = true;
            return;
          }
          const now = Date.now();
          if (now - lastCapture < RECAPTURE_COOLDOWN) {
            pendingCapture = true;
            window.setTimeout(() => {
              if (pendingCapture) {
                pendingCapture = false;
                void recapture();
              }
            }, RECAPTURE_COOLDOWN - (now - lastCapture));
            return;
          }
          capturing = true;
          lastCapture = now;
          try {
            await instance.capture.captureElement(inner, true);
            instance.markChanged();
          } finally {
            capturing = false;
            if (pendingCapture && !destroyed) {
              pendingCapture = false;
              void recapture();
            }
          }
        };

        /* Скролл: НЕ пересъёмка и НЕ покадровый markChanged (это
           заставляло все стёкла перерисовываться каждый кадр).
           Один markChanged после остановки скролла + свежий снимок. */
        let scrollTimer: number | undefined;
        const handleScroll = () => {
          window.clearTimeout(scrollTimer);
          scrollTimer = window.setTimeout(() => {
            void recapture();
          }, 220);
        };
        scroller.addEventListener("scroll", handleScroll, { passive: true });
        cleanups.push(() => {
          scroller.removeEventListener("scroll", handleScroll);
          window.clearTimeout(scrollTimer);
        });

        /* Асинхронная догрузка контента (карточки, изображения):
           один отложенный снимок после затишья мутаций. Только
           childList — characterData дёргала пересъёмку на каждый чих. */
        if (inner && inner !== glass) {
          let mutationTimer: number | undefined;
          const mutationObserver = new MutationObserver(() => {
            window.clearTimeout(mutationTimer);
            mutationTimer = window.setTimeout(() => {
              void recapture();
            }, 500);
          });
          mutationObserver.observe(inner, {
            childList: true,
            subtree: true,
          });
          cleanups.push(() => {
            mutationObserver.disconnect();
            window.clearTimeout(mutationTimer);
          });
          /* Контент мог дорендериться между init и наблюдением. */
          void recapture();
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

      {/* Стеклянная пилюля — sticky прямой потомок скроллера.
          data-glass-pending: до готовности WebGL пилюля выглядит как
          обычный composer — никаких «двух объектов» при загрузке. */}
      {createPortal(
        <div
          ref={glassRef}
          data-glass-pending=""
          className={cn(styles.glassPill, shellStyles.composerGlass)}
        >
          <AssistantBar />
        </div>,
        scroller,
      )}
    </>
  );
}
