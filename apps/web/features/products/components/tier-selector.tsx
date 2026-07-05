"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/lib/icon";
import type { Product } from "../types";
import styles from "./tier-selector.module.css";
import { TierSlider } from "./tier-slider";

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
	const tier = product.tiers[tierIndex];

	const close = useCallback(() => setIsOpen(false), []);
	useClickOutside(containerRef, isOpen, close);

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
					onClick={() => setIsOpen((prev) => !prev)}
					aria-haspopup="true"
					aria-expanded={isOpen}
					aria-label={`Уровень подписки: ${tier?.name}`}
				>
					{tier?.name}
					<Icon
						icon={
							isOpen
								? "solar:alt-arrow-up-linear"
								: "solar:alt-arrow-down-linear"
						}
						className={styles.tierInlineChevron}
						aria-hidden="true"
					/>
				</button>
			) : (
				<button
					type="button"
					className={isOpen ? styles.tierTriggerOpen : styles.tierTrigger}
					onClick={() => setIsOpen((prev) => !prev)}
					aria-haspopup="true"
					aria-expanded={isOpen}
				>
					<span className={styles.tierTriggerCaption}>Уровень</span>
					<span className={styles.tierTriggerValue}>
						{tier?.name}
						<Icon
							icon={
								isOpen
									? "solar:alt-arrow-up-linear"
									: "solar:alt-arrow-down-linear"
							}
							className={styles.tierTriggerChevron}
							aria-hidden="true"
						/>
					</span>
				</button>
			)}
			{isOpen && (
				<div className={menuClassName}>
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

		function handleMouseDown(event: MouseEvent) {
			const target = event.target as Node;
			const container = containerRef.current;
			if (container && !container.contains(target)) {
				onOutsideClick();
			}
		}

		document.addEventListener("mousedown", handleMouseDown);
		return () => document.removeEventListener("mousedown", handleMouseDown);
	}, [containerRef, isActive, onOutsideClick]);
}
