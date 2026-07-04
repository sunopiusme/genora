"use client";

import {
	useEffect,
	useId,
	useRef,
	useState,
	type FormEvent,
	type KeyboardEvent,
	type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useComposerStore, type AttachedFile } from "@/stores/composer-store";
import { Icon } from "@/lib/icon";
import type { Product } from "../types";
import { AttachMenu } from "./attach-menu";
import {
	MentionMenu,
	getMentionItems,
	type MentionItem,
} from "./mention-menu";
import styles from "./assistant-bar.module.css";

/* Below this width the full placeholder does not fit — a shorter
   one is shown instead. iPhone screens are wider and keep the full
   text. */
const NARROW_MEDIA_QUERY = "(max-width: 22.5rem)";

/* Активный фрагмент упоминания: позиция «@» и текст после него
   до каретки. */
type MentionDraft = {
	start: number;
	query: string;
};

export function AssistantBar() {
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);
	const overlayRef = useRef<HTMLDivElement>(null);
	const mentionMenuId = useId();
	const [query, setQuery] = useState("");
	const [mentionDraft, setMentionDraft] = useState<MentionDraft | null>(null);
	const [mentionActiveIndex, setMentionActiveIndex] = useState(0);
	/* Имена, вставленные через меню, — по ним подсвечиваются
	   упоминания в тексте. */
	const [mentionNames, setMentionNames] = useState<string[]>([]);
	const attachedProduct = useComposerStore((state) => state.attachedProduct);
	const detachProduct = useComposerStore((state) => state.detach);
	const attachedFile = useComposerStore((state) => state.attachedFile);
	const detachFile = useComposerStore((state) => state.detachFile);
	const hasQuery = query.trim().length > 0;
	const isNarrowScreen = useIsNarrowScreen();

	useFocusInputOnAttach(inputRef, attachedProduct);

	const mentionItems = mentionDraft ? getMentionItems(mentionDraft.query) : [];
	const isMentionOpen = mentionDraft !== null && mentionItems.length > 0;

	function syncOverlayScroll() {
		if (overlayRef.current && inputRef.current) {
			overlayRef.current.scrollLeft = inputRef.current.scrollLeft;
		}
	}

	function updateMentionDraft(value: string, caret: number | null) {
		const draft = findMentionDraft(value, caret);
		setMentionDraft(draft);
		setMentionActiveIndex(0);
	}

	function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
		setQuery(event.target.value);
		updateMentionDraft(event.target.value, event.target.selectionStart);
		requestAnimationFrame(syncOverlayScroll);
	}

	function handleCaretMove(event: React.SyntheticEvent<HTMLInputElement>) {
		updateMentionDraft(query, event.currentTarget.selectionStart);
	}

	function handleSelectMention(item: MentionItem) {
		if (!mentionDraft) {
			return;
		}
		const caret = mentionDraft.start + 1 + mentionDraft.query.length;
		const inserted = `@${item.label} `;
		const nextValue =
			query.slice(0, mentionDraft.start) + inserted + query.slice(caret);
		setQuery(nextValue);
		setMentionDraft(null);
		setMentionNames((names) =>
			names.includes(item.label) ? names : [...names, item.label],
		);

		const nextCaret = mentionDraft.start + inserted.length;
		requestAnimationFrame(() => {
			const input = inputRef.current;
			if (input) {
				input.focus();
				input.setSelectionRange(nextCaret, nextCaret);
			}
			syncOverlayScroll();
		});
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!hasQuery) {
			return;
		}
		router.push(`/products?q=${encodeURIComponent(query.trim())}`);
	}

	function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		/* Enter может завершать композицию CJK-раскладок — в этот
		   момент ничего не перехватываем. */
		const isComposing =
			event.nativeEvent.isComposing || event.keyCode === 229;

		if (isMentionOpen && !isComposing) {
			if (event.key === "ArrowDown") {
				event.preventDefault();
				setMentionActiveIndex((index) => (index + 1) % mentionItems.length);
				return;
			}
			if (event.key === "ArrowUp") {
				event.preventDefault();
				setMentionActiveIndex(
					(index) => (index - 1 + mentionItems.length) % mentionItems.length,
				);
				return;
			}
			if (event.key === "Enter" || event.key === "Tab") {
				event.preventDefault();
				handleSelectMention(mentionItems[mentionActiveIndex]);
				return;
			}
			if (event.key === "Escape") {
				event.preventDefault();
				setMentionDraft(null);
				return;
			}
		}

		if (event.key === "Backspace" && query.length === 0) {
			if (attachedProduct) {
				event.preventDefault();
				detachProduct();
			} else if (attachedFile) {
				event.preventDefault();
				detachFile();
			}
		}
	}

	const placeholder = getPlaceholder(
		attachedProduct,
		attachedFile,
		isNarrowScreen,
	);
	const highlighted = renderWithMentions(query, mentionNames, styles.mention);
	const hasHighlights = highlighted !== null;

	return (
		<form className={styles.bar} onSubmit={handleSubmit}>
			{/* Плюсик виден всегда — тег с вложением встаёт справа от него. */}
			<AttachMenu />

			{attachedProduct && (
				<AttachedProductChip
					product={attachedProduct}
					onRemove={detachProduct}
				/>
			)}
			{!attachedProduct && attachedFile && (
				<AttachedFileChip file={attachedFile} onRemove={detachFile} />
			)}

			<div className={styles.inputWrap}>
				<input
					ref={inputRef}
					name="query"
					value={query}
					onChange={handleChange}
					onKeyDown={handleInputKeyDown}
					onSelect={handleCaretMove}
					onScroll={syncOverlayScroll}
					placeholder={placeholder}
					autoComplete="off"
					className={styles.input}
					data-has-mentions={hasHighlights || undefined}
					aria-label="Сообщение ассистенту"
					aria-autocomplete="list"
					aria-controls={isMentionOpen ? mentionMenuId : undefined}
					aria-activedescendant={
						isMentionOpen
							? `${mentionMenuId}-option-${mentionActiveIndex}`
							: undefined
					}
				/>
				{/* Зеркало текста: инпут делает буквы прозрачными, а слой
				    сверху рисует их же с подсветкой упоминаний. */}
				{hasHighlights && (
					<div ref={overlayRef} className={styles.inputOverlay} aria-hidden>
						{highlighted}
					</div>
				)}
			</div>

			{isMentionOpen && (
				<MentionMenu
					id={mentionMenuId}
					items={mentionItems}
					activeIndex={mentionActiveIndex}
					onSelect={handleSelectMention}
					onHover={setMentionActiveIndex}
				/>
			)}

			<button
				type="submit"
				className={styles.submit}
				disabled={!hasQuery}
				aria-label="Отправить"
			>
				<Icon
					icon="solar:arrow-up-bold-stroke"
					className={styles.submitGlyph}
				/>
			</button>
		</form>
	);
}

/**
 * Ищет активное упоминание: «@» в начале строки или после пробела,
 * между «@» и кареткой нет пробелов.
 */
function findMentionDraft(
	value: string,
	caret: number | null,
): MentionDraft | null {
	if (caret === null) {
		return null;
	}
	for (let i = caret - 1; i >= 0; i -= 1) {
		const char = value[i];
		if (char === "@") {
			const before = i === 0 ? "" : value[i - 1];
			if (before === "" || /\s/.test(before)) {
				return { start: i, query: value.slice(i + 1, caret) };
			}
			return null;
		}
		if (/\s/.test(char)) {
			return null;
		}
	}
	return null;
}

/**
 * Разбивает текст на сегменты, оборачивая «@Имя» в подсвеченный
 * span. Возвращает null, если подсвечивать нечего, — тогда инпут
 * показывает обычный текст без слоя-зеркала.
 */
function renderWithMentions(
	text: string,
	names: string[],
	mentionClassName: string,
): ReactNode[] | null {
	if (!text || names.length === 0) {
		return null;
	}
	/* Длинные имена first — чтобы «@Иван Петров» не перебивался
	   более коротким совпадением. */
	const sorted = [...names].sort((a, b) => b.length - a.length);
	const pattern = new RegExp(
		`@(?:${sorted.map(escapeRegExp).join("|")})`,
		"g",
	);

	const segments: ReactNode[] = [];
	let lastIndex = 0;
	let hasMention = false;
	for (const match of text.matchAll(pattern)) {
		const index = match.index ?? 0;
		if (index > lastIndex) {
			segments.push(text.slice(lastIndex, index));
		}
		segments.push(
			<span key={index} className={mentionClassName}>
				{match[0]}
			</span>,
		);
		lastIndex = index + match[0].length;
		hasMention = true;
	}
	if (!hasMention) {
		return null;
	}
	if (lastIndex < text.length) {
		segments.push(text.slice(lastIndex));
	}
	return segments;
}

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type AttachedProductChipProps = {
	product: Product;
	onRemove: () => void;
};

function AttachedProductChip({ product, onRemove }: AttachedProductChipProps) {
	return (
		<span
			className={styles.chip}
			role="status"
			aria-label={`Прикреплён товар: ${product.name}`}
		>
			<span
				className={styles.chipLogo}
				style={
					{
						"--logo-url": `url(/brands/${product.logoSlug}.svg)`,
					} as React.CSSProperties
				}
				aria-hidden="true"
			/>
			<span className={styles.chipLabel}>{product.name}</span>
			<button
				type="button"
				className={styles.chipRemove}
				onClick={onRemove}
				aria-label={`Открепить ${product.name}`}
			>
				<Icon
					icon="solar:close-bold-stroke"
					className={styles.chipRemoveGlyph}
					aria-hidden="true"
				/>
			</button>
		</span>
	);
}

type AttachedFileChipProps = {
	file: AttachedFile;
	onRemove: () => void;
};

function AttachedFileChip({ file, onRemove }: AttachedFileChipProps) {
	const icon =
		file.kind === "image"
			? "solar:gallery-linear"
			: "solar:document-text-linear";

	return (
		<span
			className={styles.chip}
			role="status"
			aria-label={`Прикреплён файл: ${file.name}`}
		>
			<Icon icon={icon} className={styles.chipFileGlyph} aria-hidden="true" />
			<span className={styles.chipLabel}>{file.name}</span>
			<button
				type="button"
				className={styles.chipRemove}
				onClick={onRemove}
				aria-label={`Открепить ${file.name}`}
			>
				<Icon
					icon="solar:close-bold-stroke"
					className={styles.chipRemoveGlyph}
					aria-hidden="true"
				/>
			</button>
		</span>
	);
}

function getPlaceholder(
	attachedProduct: Product | null,
	attachedFile: AttachedFile | null,
	isNarrowScreen: boolean,
) {
	/* Название товара или файла уже видно в теге слева — плейсхолдер
	   его не дублирует. */
	if (attachedProduct || attachedFile) {
		return "Ваш вопрос…";
	}
	return isNarrowScreen ? "Спросите" : "Спросите что угодно";
}

function useIsNarrowScreen() {
	const [isNarrow, setIsNarrow] = useState(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia(NARROW_MEDIA_QUERY);
		setIsNarrow(mediaQuery.matches);

		function handleChange(event: MediaQueryListEvent) {
			setIsNarrow(event.matches);
		}
		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, []);

	return isNarrow;
}

function useFocusInputOnAttach(
	inputRef: React.RefObject<HTMLInputElement | null>,
	attachedProduct: Product | null,
) {
	useEffect(() => {
		if (!attachedProduct) {
			return;
		}
		const frameId = requestAnimationFrame(() => {
			inputRef.current?.focus();
		});
		return () => cancelAnimationFrame(frameId);
	}, [inputRef, attachedProduct]);
}
