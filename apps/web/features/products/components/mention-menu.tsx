"use client";

import { Avatar } from "@genora/ui";
import { PROFILE } from "@/lib/profile";
import { getFeaturedProducts } from "../queries/featured-products";
import styles from "./mention-menu.module.css";

export type MentionItem = {
	id: string;
	/* Текст, который встаёт в строку после «@». */
	label: string;
	/* Подпись справа — поясняет, что это за сущность. */
	hint: string;
	kind: "profile" | "product";
	/* Слаг логотипа для товаров (файл в /brands). */
	logoSlug?: string;
};

/* Профиль — ссылка на самого пользователя: его подписки, историю
   и настройки. Дальше список пополняется товарами каталога, чтобы
   на них можно было ссылаться прямо в тексте вопроса. */
function buildMentionItems(): MentionItem[] {
	const profile: MentionItem = {
		id: "self",
		label: PROFILE.name,
		hint: "Мой профиль",
		kind: "profile",
	};
	const products: MentionItem[] = getFeaturedProducts().map((product) => ({
		id: product.id,
		label: product.name,
		hint: "Товар",
		kind: "product",
		logoSlug: product.logoSlug,
	}));
	return [profile, ...products];
}

/** Пункты, подходящие под введённый после «@» фрагмент. */
export function getMentionItems(query: string): MentionItem[] {
	const items = buildMentionItems();
	const normalized = query.trim().toLowerCase();
	if (!normalized) {
		return items;
	}
	return items.filter(
		(item) =>
			item.label.toLowerCase().includes(normalized) ||
			item.hint.toLowerCase().includes(normalized),
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
 * Занимает всю ширину бара; открывается при вводе «@» и
 * управляется с клавиатуры из инпута, поэтому фокус не забирает.
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
			<div className={styles.list}>
				{items.length === 0 ? (
					<p className={styles.emptyState}>Ничего не найдено</p>
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
							{item.kind === "profile" ? (
								<Avatar
									name={item.label}
									size="1.5rem"
									className={styles.itemAvatar}
									aria-hidden="true"
								/>
							) : (
								<span className={styles.itemLogoWrap} aria-hidden="true">
									<span
										className={styles.itemLogo}
										style={
											{
												"--logo-url": `url(/brands/${item.logoSlug}.svg)`,
											} as React.CSSProperties
										}
									/>
								</span>
							)}
							<span className={styles.itemLabel}>{item.label}</span>
							<span className={styles.itemHint}>{item.hint}</span>
						</button>
					))
				)}
			</div>
		</div>
	);
}
