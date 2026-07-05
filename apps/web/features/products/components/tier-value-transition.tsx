"use client";

import { useLayoutEffect, useRef, useState } from "react";
import styles from "./tier-value-transition.module.css";

type TierValueTransitionProps = {
  text: string;
  order: number;
  className?: string;
};

type Cell = {
  pos: number;
  char: string | null;
  rev: number;
  exiting: string | null;
  delayMs: number;
};

const STAGGER_MS = 26;
const MAX_DELAY_MS = 130;

function buildInitialCells(text: string): Cell[] {
  return Array.from(text, (char, index) => ({
    pos: text.length - 1 - index,
    char,
    rev: 0,
    exiting: null,
    delayMs: 0,
  }));
}

function advanceCells(
  prevCells: Cell[],
  prevText: string,
  nextText: string,
  revision: number,
): Cell[] {
  const maxLength = Math.max(prevText.length, nextText.length);
  const prevByPos = new Map(prevCells.map((cell) => [cell.pos, cell]));
  const next: Cell[] = [];

  for (let pos = maxLength - 1; pos >= 0; pos -= 1) {
    const oldChar = prevText[prevText.length - 1 - pos] ?? null;
    const newChar = nextText[nextText.length - 1 - pos] ?? null;
    const prevCell = prevByPos.get(pos);
    if (oldChar === newChar && prevCell) {
      next.push(prevCell);
    } else {
      next.push({
        pos,
        char: newChar,
        rev: revision,
        exiting: oldChar,
        delayMs: 0,
      });
    }
  }

  let waveIndex = 0;
  for (const cell of next) {
    if (cell.rev === revision) {
      cell.delayMs = Math.min(waveIndex * STAGGER_MS, MAX_DELAY_MS);
      waveIndex += 1;
    }
  }

  return next;
}

export function TierValueTransition({
  text,
  order,
  className,
}: TierValueTransitionProps) {
  const [state, setState] = useState(() => ({
    text,
    cells: buildInitialCells(text),
    revision: 0,
  }));
  const [direction, setDirection] = useState<"up" | "down">("up");

  const rootRef = useRef<HTMLSpanElement>(null);
  const previousOrderRef = useRef(order);

  if (text !== state.text) {
    const revision = state.revision + 1;
    setState({
      text,
      cells: advanceCells(state.cells, state.text, text, revision),
      revision,
    });
    setDirection(order >= previousOrderRef.current ? "up" : "down");
    previousOrderRef.current = order;
  }

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    const syncWidths = () => {
      const cellNodes = root.querySelectorAll<HTMLElement>("[data-cell]");
      for (const cellNode of cellNodes) {
        const charNode = cellNode.querySelector<HTMLElement>("[data-char]");
        cellNode.style.width = charNode
          ? `${charNode.getBoundingClientRect().width}px`
          : "0px";
      }
    };
    syncWidths();
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) {
        syncWidths();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [state.revision]);

  const handleExitEnd = (pos: number) => {
    setState((prev) => ({
      ...prev,
      cells: prev.cells
        .map((cell) => (cell.pos === pos ? { ...cell, exiting: null } : cell))
        .filter((cell) => cell.char !== null || cell.exiting !== null),
    }));
  };

  const rootClassName = className ? `${styles.root} ${className}` : styles.root;

  return (
    <span
      ref={rootRef}
      className={rootClassName}
      data-direction={direction}
      aria-label={text}
    >
      <span className={styles.row} aria-hidden="true">
        {state.cells.map((cell) => (
          <span
            key={cell.pos}
            data-cell=""
            className={styles.cell}
            style={
              cell.delayMs > 0
                ? ({
                    "--roll-delay": `${cell.delayMs}ms`,
                  } as React.CSSProperties)
                : undefined
            }
          >
            {cell.char !== null && (
              <span
                key={cell.rev}
                data-char=""
                className={cell.rev === 0 ? styles.charStatic : styles.char}
              >
                {cell.char}
              </span>
            )}
            {cell.exiting !== null && (
              <span
                className={styles.charExiting}
                onAnimationEnd={() => handleExitEnd(cell.pos)}
              >
                {cell.exiting}
              </span>
            )}
          </span>
        ))}
      </span>
    </span>
  );
}
