"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./tier-value-transition.module.css";

type TierValueTransitionProps = {
	/* Отображаемое значение: имя тира или ценник. */
	text: string;
	/* Порядковый номер тира — задаёт направление прокрутки: рост
	   уровня «прокручивает» значение вверх, снижение — вниз. */
	order: number;
	className?: string;
};

type ValueSnapshot = {
	key: number;
	text: string;
};

/* Направленный «тикер» для сменных значений тира (цена, имя уровня):
   старое значение уезжает и гаснет, новое приезжает с противоположной
   стороны, а ширина контейнера плавно перетекает к ширине нового
   текста — соседние элементы (период «в месяц», шеврон) не прыгают,
   а сдвигаются мягко. Чистый CSS + два DOM-узла, без библиотек.

   Механика:
   - Смена text фиксируется прямо в рендере (канонический паттерн
     derived state): текущее значение становится «уходящим», новое —
     текущим с новым ключом, чтобы React перемонтировал узел и enter-
     анимация запустилась заново.
   - Ширина контейнера задаётся в пикселях из useLayoutEffect до
     отрисовки кадра и анимируется transition'ом; ResizeObserver
     держит её в синхроне при догрузке шрифтов.
   - Первый рендер (key 0) не анимируется — значение просто стоит
     на месте при маунте карточки или открытии меню. */
export function TierValueTransition({
	text,
	order,
	className,
}: TierValueTransitionProps) {
	const [current, setCurrent] = useState<ValueSnapshot>(() => ({
		key: 0,
		text,
	}));
	const [exiting, setExiting] = useState<ValueSnapshot | null>(null);
	const [direction, setDirection] = useState<"up" | "down">("up");

	const containerRef = useRef<HTMLSpanElement>(null);
	const currentRef = useRef<HTMLSpanElement>(null);
	const previousOrderRef = useRef(order);

	/* Свап во время рендера: React сразу перезапускает рендер с новым
	   состоянием, старый кадр на экран не попадает. */
	if (text !== current.text) {
		setExiting(current);
		setCurrent({ key: current.key + 1, text });
		setDirection(order >= previousOrderRef.current ? "up" : "down");
	}

	useEffect(() => {
		previousOrderRef.current = order;
	}, [order]);

	/* Ширина контейнера = ширина текущего значения, в пикселях: только
	   численные значения анимируются transition'ом (auto — нет; первый
	   замер на маунте потому происходит мгновенно, без анимации).
	   ResizeObserver страхует от смены метрик шрифта после загрузки. */
	useLayoutEffect(() => {
		const container = containerRef.current;
		const value = currentRef.current;
		if (!container || !value) {
			return;
		}
		const syncWidth = () => {
			container.style.width = `${value.getBoundingClientRect().width}px`;
		};
		syncWidth();
		/* Запись из колбэка обсервера уходит в следующий кадр: синхронная
		   мутация layout внутри ResizeObserver зацикливает его в том же
		   кадре («ResizeObserver loop completed…» в консоли). */
		let frameId = 0;
		const observer = new ResizeObserver(() => {
			cancelAnimationFrame(frameId);
			frameId = requestAnimationFrame(syncWidth);
		});
		observer.observe(value);
		return () => {
			cancelAnimationFrame(frameId);
			observer.disconnect();
		};
	}, [current.key]);

	const rootClassName = className ? `${styles.root} ${className}` : styles.root;

	return (
		<span ref={containerRef} className={rootClassName} data-direction={direction}>
			<span
				key={current.key}
				ref={currentRef}
				className={current.key === 0 ? styles.valueStatic : styles.value}
			>
				{current.text}
			</span>
			{exiting && (
				<span
					key={exiting.key}
					className={styles.valueExiting}
					aria-hidden="true"
					onAnimationEnd={() => setExiting(null)}
				>
					{exiting.text}
				</span>
			)}
		</span>
	);
}
