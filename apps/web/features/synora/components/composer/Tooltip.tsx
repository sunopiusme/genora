"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import styles from "./ComposerInput.module.css";

/* ─────────────────────────────────────────
   Tooltip — обёртка вокруг любого триггера
   композера. Появляется на hover/focus с
   задержкой ≈ macOS / Apple HIG (~450ms),
   мгновенно прячется на mouseleave/blur и
   на mousedown (чтобы клик-открытие меню
   не оставлял тултип висеть).

   Композиция: pill в палитре композера, label
   слева; справа — необязательный keycap для
   keyboard-shortcut'a.

   Единый компонент держит motion-токены и
   геометрию одной точкой правды — все триггеры
   в toolbar используют его, чтобы тултипы
   читались как один UI-pattern. ─────────── */

type Side = "top" | "bottom";

type Props = {
  /** Текст hint'а. */
  label: string;
  /** Опциональный ярлык клавиши. Текст или ReactNode. */
  shortcut?: ReactNode;
  /** С какой стороны от триггера выводить tooltip. По умолчанию top. */
  side?: Side;
  /** Принудительная видимость: если true, tooltip показан
   *  вне зависимости от hover/focus. Используется для
   *  feedback-состояний («Скопировано»), когда нужно
   *  держать hint в течение фиксированного времени. */
  open?: boolean;
  /** Триггер, обычно <button>. */
  children: ReactNode;
};

export function Tooltip({
  label,
  shortcut,
  side = "top",
  open,
  children,
}: Props) {
  const [internalVisible, setInternalVisible] = useState(false);
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const timer = useRef<number | null>(null);

  // Tooltip не должен соревноваться с открытым
  // меню. Если внутри обёртки есть элемент с
  // aria-expanded="true" (picker, plus-dropdown,
  // submenu) — значит пользователь уже видит
  // popover, и hint бесполезен. Проверяем прямо
  // перед показом и плюс через MutationObserver
  // на случай если меню откроется пока tooltip
  // уже виден.
  const isMenuOpen = () =>
    !!wrapRef.current?.querySelector('[aria-expanded="true"]');

  const show = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (isMenuOpen()) return;
      setInternalVisible(true);
    }, 450);
  };
  const hide = () => {
    if (timer.current) window.clearTimeout(timer.current);
    setInternalVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  // Если меню открывается уже после того, как
  // tooltip успел появиться — скрываем синхронно
  // через MutationObserver на subtree-изменения
  // aria-expanded.
  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const observer = new MutationObserver(() => {
      if (isMenuOpen()) hide();
    });
    observer.observe(node, {
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-expanded"],
    });
    return () => observer.disconnect();
  }, []);

  // open=true перекрывает hover-логику. open=false/undefined
  // отдаёт управление внутреннему состоянию, как и раньше.
  const visible = open || internalVisible;

  return (
    <span
      ref={wrapRef}
      className={styles.tooltipWrap}
      onMouseEnter={show}
      onMouseLeave={hide}
      onMouseDown={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible ? (
        <span
          className={styles.tooltip}
          data-side={side}
          role="tooltip"
        >
          <span className={styles.tooltipLabel}>{label}</span>
          {shortcut ? (
            <span className={styles.tooltipKbd} aria-hidden="true">
              {shortcut}
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
