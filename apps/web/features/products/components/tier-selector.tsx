"use client";

import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { Icon } from "@/lib/icon";
import type { Product } from "../types";
import styles from "./tier-selector.module.css";
import { TierSlider } from "./tier-slider";
import { TierValueTransition } from "./tier-value-transition";

type TierSelectorProps = {
	product: Product;
	tierIndex: number;
	onTierChange: (index: number) => void;
	/* Компактный режим для карточки: без подписи «Уровень», только
	   значение — триггер занимает минимум места. */
	compact?: boolean;
	/* Куда раскрывать меню: вниз (модалка) или вверх (низ карточки,
	   чтобы меню не обрезалось краем сетки). */
	placement?: "down" | "up";
};

/* Селектор уровня подписки: компактная строка со значением, по нажатию
   раскрывается меню со слайдером. Слайдер не занимает место в макете
   постоянно и появляется только когда пользователь выбирает уровень. */
export function TierSelector({
	product,
	tierIndex,
	onTierChange,
	compact = false,
	placement = "down",
}: TierSelectorProps) {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const tier = product.tiers[tierIndex];

	/* Фиксация якоря меню: триггер меняет ширину при смене имени тира
	   («Plus» → «Максимум»), и центр контейнера уезжает. Запоминаем
	   viewport-координату центра триггера в момент открытия и держим
	   меню на ней, пересчитывая смещение при каждой смене тира. */
	const anchorViewportX = useRef(0);

	function toggleOpen() {
		setIsOpen((prev) => !prev);
	}

	useLayoutEffect(() => {
		if (!isOpen) {
			return;
		}
		const container = containerRef.current;
		const menu = menuRef.current;
		if (!container || !menu) {
			return;
		}
		/* Якорь захватывается ЗДЕСЬ, а не в обработчике клика: layout
		   effect выполняется после рендера открытого состояния, но до
		   отрисовки — геометрия триггера уже финальная. Захват в момент
		   клика давал устаревший центр, и меню прыгало первым кадром. */
		{
			const rect = container.getBoundingClientRect();
			anchorViewportX.current = rect.left + rect.width / 2;
		}
		/* Позиция пишется в DOM напрямую, минуя setState: обновление
		   через состояние приходило на кадр позже движения контейнера
		   (rAF-задержка против петли обсервера), и меню осциллировало
		   на ±2px всю анимацию ширины триггера. Прямая запись left не
		   меняет размеров наблюдаемого элемента — петля ResizeObserver
		   невозможна, а колбэк выполняется до отрисовки кадра, так что
		   меню визуально пригвождено к точке открытия. */
		const updateMenuLeft = () => {
			const rect = container.getBoundingClientRect();
			/* Кламп по вьюпорту: меню центрировано translateX(-50%), и на
			   мобильном у триггера в правой части экрана половина меню
			   уходила бы за край и срезалась. Центр смещается ровно
			   настолько, чтобы оба края меню остались в безопасной зоне. */
			const menuWidth = menu.offsetWidth;
			const viewportWidth = document.documentElement.clientWidth;
			const edgeGap = 12;
			const halfWidth = menuWidth / 2;
			const clampedCenterX = Math.min(
				Math.max(anchorViewportX.current, edgeGap + halfWidth),
				viewportWidth - edgeGap - halfWidth,
			);
			menu.style.left = `${clampedCenterX - rect.left}px`;
		};
		updateMenuLeft();
		/* Ширина триггера меняется ПЛАВНО (тикер имени тира анимирует
		   width) — обсервер ведёт меню за контейнером каждый кадр. */
		const observer = new ResizeObserver(updateMenuLeft);
		observer.observe(container);
		return () => observer.disconnect();
	}, [isOpen]);

	const close = useCallback(() => setIsOpen(false), []);
	useClickOutside(containerRef, isOpen, close);
	useScrollLock(containerRef, isOpen);

	useEffect(() => {
		if (!isOpen) {
			return;
		}
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				/* Гасим Escape локально, чтобы не закрылась вся модалка. */
				event.stopPropagation();
				close();
			}
		}
		window.addEventListener("keydown", handleKeyDown, { capture: true });
		return () =>
			window.removeEventListener("keydown", handleKeyDown, { capture: true });
	}, [isOpen, close]);

	const menuClassName = [
		placement === "up" ? styles.tierMenuUp : styles.tierMenu,
		compact ? styles.tierMenuCompact : "",
	]
		.join(" ")
		.trim();

	return (
		<div className={styles.tierSelector} ref={containerRef}>
			{compact ? (
				/* Карточка витрины: тихий текстовый триггер в строке цены —
				   имя тира + шеврон. Не занимает отдельного места и не
				   конкурирует с кнопкой «Купить». */
				<button
					type="button"
					className={
						isOpen ? styles.tierInlineTriggerOpen : styles.tierInlineTrigger
					}
					onClick={toggleOpen}
					aria-haspopup="true"
					aria-expanded={isOpen}
					aria-label={`Уровень подписки: ${tier?.name}`}
				>
					<TierValueTransition text={tier?.name ?? ""} order={tierIndex} />
					{/* Один глиф с CSS-поворотом вместо подмены иконки:
					    другой глиф Iconify грузится асинхронно, и триггер
					    прыгал по ширине в момент открытия — якорь меню
					    захватывался до прыжка, меню дёргалось. */}
					<Icon
						icon="solar:alt-arrow-down-linear"
						className={
							isOpen ? styles.tierInlineChevronOpen : styles.tierInlineChevron
						}
						aria-hidden="true"
					/>
				</button>
			) : (
				<button
					type="button"
					className={isOpen ? styles.tierTriggerOpen : styles.tierTrigger}
					onClick={toggleOpen}
					aria-haspopup="true"
					aria-expanded={isOpen}
				>
					<span className={styles.tierTriggerCaption}>Уровень</span>
					<span className={styles.tierTriggerValue}>
						<TierValueTransition text={tier?.name ?? ""} order={tierIndex} />
						{/* Один глиф с поворотом — см. комментарий у
						    компактного триггера выше. */}
						<Icon
							icon="solar:alt-arrow-down-linear"
							className={
								isOpen
									? styles.tierTriggerChevronOpen
									: styles.tierTriggerChevron
							}
							aria-hidden="true"
						/>
					</span>
				</button>
			)}
			{isOpen && (
				<div ref={menuRef} className={menuClassName}>
					<TierSlider
						product={product}
						tierIndex={tierIndex}
						onTierChange={onTierChange}
						compact={compact}
					/>
				</div>
			)}
		</div>
	);
}

function useClickOutside(
	containerRef: React.RefObject<HTMLElement | null>,
	isActive: boolean,
	onOutsideClick: () => void,
) {
	useEffect(() => {
		if (!isActive) {
			return;
		}

		/* pointerdown вместо mousedown: на тач-устройствах mousedown
		   приходит с задержкой или не приходит вовсе — меню не
		   закрывалось по тапу мимо. Pointer Events покрывают мышь,
		   палец и стилус одним слушателем. */
		function handlePointerDown(event: PointerEvent) {
			const target = event.target as Node;
			const container = containerRef.current;
			if (container && !container.contains(target)) {
				onOutsideClick();
			}
		}

		document.addEventListener("pointerdown", handlePointerDown);
		return () => document.removeEventListener("pointerdown", handlePointerDown);
	}, [containerRef, isActive, onOutsideClick]);
}

/* Блокировка фонового скролла на время открытого меню — канон
   модальных поповеров (так работают Radix/Headless UI в modal-режиме).
   Без неё каталог продолжал скроллиться под открытым слайдером, и
   меню уезжало от своей точки открытия — выглядело сломанным.

   Слушатели wheel/touchmove на документе с passive: false гасят
   прокрутку ЛЮБОГО контейнера (body, внутренние скролл-области),
   если жест начался вне меню. Внутри меню события не трогаются —
   слайдер работает как обычно. Такой перехват не сдвигает layout,
   поэтому не нужна компенсация ширины скроллбара, как при
   overflow: hidden на body. */
function useScrollLock(
	containerRef: React.RefObject<HTMLElement | null>,
	isActive: boolean,
) {
	useEffect(() => {
		if (!isActive) {
			return;
		}

		function handleScrollAttempt(event: Event) {
			const target = event.target as Node;
			const container = containerRef.current;
			if (container && !container.contains(target)) {
				event.preventDefault();
			}
		}

		/* capture: true — перехват до того, как событие дойдёт до
		   скроллируемых контейнеров; passive: false обязателен, иначе
		   preventDefault для touchmove/wheel игнорируется браузером. */
		const options = { passive: false, capture: true } as const;
		document.addEventListener("wheel", handleScrollAttempt, options);
		document.addEventListener("touchmove", handleScrollAttempt, options);
		return () => {
			document.removeEventListener("wheel", handleScrollAttempt, options);
			document.removeEventListener("touchmove", handleScrollAttempt, options);
		};
	}, [containerRef, isActive]);
}
