"use client";

import { useLayoutEffect, useRef, useState } from "react";
import styles from "./tier-value-transition.module.css";

type TierValueTransitionProps = {
	/* Отображаемое значение: имя тира или ценник. */
	text: string;
	/* Порядковый номер тира — задаёт направление прокрутки: рост
	   уровня «прокручивает» символы вверх, снижение — вниз. */
	order: number;
	className?: string;
};

type Cell = {
	/* Позиция символа ОТ КОНЦА строки — стабильный ключ ячейки.
	   Выравнивание с конца держит на месте суффиксы («₽», «Pro» в
	   «Mega Pro»), а рост числа разрядов добавляет ячейки слева —
	   как у настоящего одометра. */
	pos: number;
	/* Текущий символ; null — ячейка схлопывается (строка укоротилась). */
	char: string | null;
	/* Ревизия узла символа: инкремент перемонтирует узел и
	   перезапускает enter-анимацию. 0 — первый рендер, без анимации. */
	rev: number;
	/* Предыдущий символ, уезжающий из ячейки. */
	exiting: string | null;
	/* Ступенчатая задержка волны слева направо, мс. */
	delayMs: number;
};

/* Шаг волны между соседними изменившимися символами. */
const STAGGER_MS = 26;
/* Потолок суммарной задержки — длинный ценник не должен тянуться. */
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

/* Диф двух строк с выравниванием от конца: неизменившиеся позиции
   сохраняют свои ячейки (узлы не перемонтируются — символ стоит
   неподвижно), изменившиеся получают новую ревизию и место в волне. */
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

	/* Волна слева направо только по изменившимся ячейкам. */
	let waveIndex = 0;
	for (const cell of next) {
		if (cell.rev === revision) {
			cell.delayMs = Math.min(waveIndex * STAGGER_MS, MAX_DELAY_MS);
			waveIndex += 1;
		}
	}

	return next;
}

/* Посимвольный «одометр» для сменных значений тира (цена, имя уровня):
   строки выравниваются от конца, и крутятся ТОЛЬКО изменившиеся
   символы — «₽» и совпавшие разряды стоят неподвижно, остальные
   прокатываются вертикальной волной слева направо. Ширина каждой
   ячейки анимируется в пикселях, так что соседние элементы (период
   «в месяц», шеврон) сдвигаются плавно. Чистый CSS, без библиотек.

   Механика:
   - Смена text фиксируется прямо в рендере (канонический паттерн
     derived state): диф строит новый список ячеек, изменившиеся
     получают новый rev — React перемонтирует узел символа, и
     enter-анимация запускается заново.
   - Ширина ячейки замеряется по входящему символу в useLayoutEffect
     до отрисовки кадра и перетекает transition'ом; после догрузки
     шрифтов происходит одна повторная синхронизация.
   - Первый рендер (rev 0) не анимируется — значение просто стоит
     на месте при маунте карточки или открытии меню. */
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

	/* Свап во время рендера: React сразу перезапускает рендер с новым
	   состоянием, старый кадр на экран не попадает. */
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

	/* Ширина каждой ячейки = ширина её текущего символа, в пикселях:
	   только численные значения анимируются transition'ом (auto — нет;
	   первый замер на маунте потому происходит мгновенно). Повторный
	   замер после document.fonts.ready страхует от смены метрик
	   шрифта после загрузки. */
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
			{/* Ячейки скрыты от скринридеров: значение читается целиком
			    из aria-label, а не по одному символу. */}
			<span className={styles.row} aria-hidden="true">
				{state.cells.map((cell) => (
					<span
						key={cell.pos}
						data-cell=""
						className={styles.cell}
						style={
							cell.delayMs > 0
								? ({ "--roll-delay": `${cell.delayMs}ms` } as React.CSSProperties)
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
