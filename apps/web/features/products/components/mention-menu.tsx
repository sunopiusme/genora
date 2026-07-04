"use client";

import { Avatar } from "@genora/ui";
import { PROFILE } from "@/lib/profile";
import styles from "./mention-menu.module.css";

export type MentionItem = {
	id: string;
	/* Текст, который встаёт в строку после «@». */
	label: string;
	/* Подпись справа — поясняет, кто это. */
	hint?: string;
};

/* Пока единственный пункт — сам пользователь. Список рассчитан
   на расширение: подписки, заказы и другие сущности добавятся
   сюда же. */
const MENTION_ITEMS: MentionItem[] = [
	{ id: "self", label: PROFILE.name, hint: "Вы" },
];

/** Пункты, подходящие под введённый после «@» фрагмент. */
export function getMentionItems(query: string): MentionItem[] {
	const normalized = query.trim().toLowerCase();
	if (!normalized) {
		return MENTION_ITEMS;
	}
	return MENTION_ITEMS.filter(
		(item) =>
			item.label.toLowerCase().includes(normalized) ||
			item.hint?.toLowerCase().includes(normalized),
	);
}

type MentionMenuProps = {
	id: string;
	items: MentionItem[];
	activeIndex: number;
	onSelect: (item: MentionItem) => void;
	onHover: (index: number) => void;
};

/**
 * Всплывающий список упоминаний над строкой ассистента.
 * Открывается при вводе «@»; управляется с клавиатуры из инпута,
 * поэтому сам фокус не забирает.
 */
export function MentionMenu({
	id,
	items,
	activeIndex,
	onSelect,
	onHover,
}: MentionMenuProps) {
	return (
		<div id={id} role="listbox" aria-label="Упоминания" className={styles.menu}>
			{items.length === 0 ? (
				<p className={styles.emptyState}>Никого не найдено</p>
			) : (
				items.map((item, index) => (
					<button
						key={item.id}
						id={`${id}-option-${index}`}
						type="button"
						role="option"
						aria-selected={index === activeIndex}
						className={styles.item}
						data-active={index === activeIndex || undefined}
						/* pointerdown раньше blur инпута — предотвращаем потерю
						   фокуса, чтобы каретка осталась на месте. */
						onPointerDown={(event) => event.preventDefault()}
						onClick={() => onSelect(item)}
						onPointerEnter={() => onHover(index)}
					>
						<Avatar
							name={item.label}
							size="1.5rem"
							className={styles.itemAvatar}
							aria-hidden="true"
						/>
						<span className={styles.itemLabel}>{item.label}</span>
						{item.hint && <span className={styles.itemHint}>{item.hint}</span>}
					</button>
				))
			)}
		</div>
	);
}
