"use client";

import {
	useEffect,
	useId,
	useRef,
	useState,
	type FormEvent,
	type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Avatar } from "@genora/ui";
import { useComposerStore } from "@/stores/composer-store";
import { Icon } from "@/lib/icon";
import { PROFILE } from "@/lib/profile";
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

/* Инлайн-тег в потоке текста. host — DOM-узел внутри
   contenteditable, содержимое рисует React через портал. */
type Token = {
	id: string;
	kind: "profile" | "product" | "file";
	label: string;
	logoSlug?: string;
	fileKind?: "image" | "document";
	host: HTMLElement;
};

/* Активное упоминание: текстовый узел с «@», позиция и фрагмент
   до каретки. */
type MentionDraft = {
	node: Text;
	start: number;
	query: string;
};

/**
 * Не даёт каретке стоять «голой» в DIV редактора вплотную к тегу.
 * В этой позиции Chrome рисует каретку по высоте соседнего
 * inline-flex элемента — она резко вырастает. Каретка пересаживается
 * в соседний текстовый узел, а если его нет — создаётся узел с
 * нулевой шириной (\u200B), невидимый и вычищаемый при serialize.
 */
function normalizeCaret(editor: HTMLElement) {
	const selection = window.getSelection();
	if (
		!selection ||
		selection.rangeCount === 0 ||
		!selection.isCollapsed ||
		document.activeElement !== editor
	) {
		return;
	}
	const range = selection.getRangeAt(0);
	if (range.startContainer !== editor) {
		return;
	}

	const offset = range.startOffset;
	const prev = editor.childNodes[offset - 1] ?? null;
	const next = editor.childNodes[offset] ?? null;
	const caret = document.createRange();

	if (prev && prev.nodeType === Node.TEXT_NODE) {
		caret.setStart(prev, (prev as Text).length);
	} else if (next && next.nodeType === Node.TEXT_NODE) {
		caret.setStart(next, 0);
	} else if (prev || next) {
		/* Каретка зажата между тегами или тегом и краем поля —
		   подкладываем невидимый текстовый узел. */
		const filler = document.createTextNode("\u200B");
		if (prev) {
			prev.after(filler);
		} else {
			editor.prepend(filler);
		}
		caret.setStart(filler, filler.length);
	} else {
		return;
	}

	caret.collapse(true);
	selection.removeAllRanges();
	selection.addRange(caret);
}

export function AssistantBar() {
	const router = useRouter();
	const formRef = useRef<HTMLFormElement>(null);
	const editorRef = useRef<HTMLDivElement>(null);
	const mentionMenuId = useId();
	const [tokens, setTokens] = useState<Token[]>([]);
	const tokensRef = useRef<Token[]>(tokens);
	tokensRef.current = tokens;
	const [hasContent, setHasContent] = useState(false);
	const [mentionDraft, setMentionDraft] = useState<MentionDraft | null>(null);
	const [mentionActiveIndex, setMentionActiveIndex] = useState(0);
	/* Последняя позиция каретки внутри редактора. Клик по меню
	   плюсика уводит фокус — без неё вставка попадала бы в начало
	   текста, а не туда, где пользователь остановился. */
	const lastRangeRef = useRef<Range | null>(null);
	const isNarrowScreen = useIsNarrowScreen();

	const attachedProduct = useComposerStore((state) => state.attachedProduct);
	const attachedFile = useComposerStore((state) => state.attachedFile);
	const isProfileAttached = useComposerStore(
		(state) => state.isProfileAttached,
	);
	const detachProduct = useComposerStore((state) => state.detach);
	const detachFile = useComposerStore((state) => state.detachFile);
	const detachProfile = useComposerStore((state) => state.detachProfile);

	const mentionItems = mentionDraft ? getMentionItems(mentionDraft.query) : [];
	const isMentionOpen = mentionDraft !== null && mentionItems.length > 0;

	/* Синхронизирует производное состояние после любой правки DOM:
	   выкидывает теги, чьи узлы стёрты Backspace-ом, и пересчитывает
	   «есть ли что отправлять». */
	function refreshEditorState() {
		const editor = editorRef.current;
		if (!editor) {
			return;
		}
		normalizeCaret(editor);
		setTokens((prev) => prev.filter((token) => token.host.isConnected));
		const text = (editor.textContent ?? "")
			.replace(/[\u00A0\u200B]/g, " ")
			.trim();
		const hasToken = editor.querySelector("[data-token-id]") !== null;
		setHasContent(text.length > 0 || hasToken);
	}

	/**
	 * Вставляет тег в позицию каретки. Если фокус вне редактора
	 * (например, выбор из меню плюсика) — тег встаёт в конец текста,
	 * сохраняя последовательность фразы.
	 */
	function insertToken(data: Omit<Token, "id" | "host">) {
		const editor = editorRef.current;
		if (!editor) {
			return;
		}

		/* Профиль в тексте достаточно упомянуть один раз. */
		if (
			data.kind === "profile" &&
			tokensRef.current.some(
				(token) => token.kind === "profile" && token.host.isConnected,
			)
		) {
			editor.focus();
			return;
		}

		const id = `token-${Math.random().toString(36).slice(2, 10)}`;
		const host = document.createElement("span");
		host.className = styles.token;
		host.contentEditable = "false";
		host.dataset.tokenId = id;
		host.dataset.label = data.label;

		/* Порядок выбора места вставки: живая каретка в редакторе →
		   сохранённая позиция до ухода фокуса → конец текста. */
		const selection = window.getSelection();
		let range: Range;
		if (
			selection &&
			selection.rangeCount > 0 &&
			editor.contains(selection.anchorNode) &&
			document.activeElement === editor
		) {
			range = selection.getRangeAt(0);
			range.deleteContents();
		} else if (
			lastRangeRef.current &&
			lastRangeRef.current.startContainer.isConnected &&
			editor.contains(lastRangeRef.current.startContainer)
		) {
			range = lastRangeRef.current;
			range.deleteContents();
		} else {
			range = document.createRange();
			range.selectNodeContents(editor);
			range.collapse(false);
		}
		editor.focus();
		range.insertNode(host);

		/* Пробел после тега, чтобы продолжить фразу сразу. */
		const space = document.createTextNode("\u00A0");
		host.after(space);
		if (selection) {
			const caret = document.createRange();
			caret.setStart(space, 1);
			caret.collapse(true);
			selection.removeAllRanges();
			selection.addRange(caret);
			lastRangeRef.current = caret.cloneRange();
		}

		setTokens((prev) => [
			...prev.filter((token) => token.host.isConnected),
			{ ...data, id, host },
		]);
		setHasContent(true);
	}

	/* Заявки из меню плюсика и карточек товара: стор используется
	   как «почтовый ящик» — тег вставляется в текст, заявка
	   сбрасывается. */
	useEffect(() => {
		if (!attachedProduct) {
			return;
		}
		insertToken({
			kind: "product",
			label: attachedProduct.name,
			logoSlug: attachedProduct.logoSlug,
		});
		detachProduct();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [attachedProduct, detachProduct]);

	useEffect(() => {
		if (!attachedFile) {
			return;
		}
		insertToken({
			kind: "file",
			label: attachedFile.name,
			fileKind: attachedFile.kind,
		});
		detachFile();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [attachedFile, detachFile]);

	useEffect(() => {
		if (!isProfileAttached) {
			return;
		}
		insertToken({ kind: "profile", label: PROFILE.name });
		detachProfile();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isProfileAttached, detachProfile]);

	/* Каретка двигается и без ввода (клики, стрелки) — упоминание
	   отслеживается через selectionchange. */
	const updateMentionDraftRef = useRef(updateMentionDraft);
	updateMentionDraftRef.current = updateMentionDraft;
	useEffect(() => {
		function handleSelectionChange() {
			updateMentionDraftRef.current();
		}
		document.addEventListener("selectionchange", handleSelectionChange);
		return () =>
			document.removeEventListener("selectionchange", handleSelectionChange);
	}, []);

	function updateMentionDraft() {
		const editor = editorRef.current;
		/* Стрелки и клики тоже могут поставить каретку вплотную
		   к тегу — выравниваем при каждом движении. */
		if (editor && document.activeElement === editor) {
			normalizeCaret(editor);
		}
		const selection = window.getSelection();

		/* Пока каретка в редакторе — запоминаем её позицию для
		   вставок из внешних меню. */
		if (
			editor &&
			selection &&
			selection.rangeCount > 0 &&
			selection.anchorNode &&
			editor.contains(selection.anchorNode) &&
			document.activeElement === editor
		) {
			lastRangeRef.current = selection.getRangeAt(0).cloneRange();
		}

		if (
			!editor ||
			!selection ||
			selection.rangeCount === 0 ||
			!selection.isCollapsed ||
			!selection.anchorNode ||
			!editor.contains(selection.anchorNode) ||
			selection.anchorNode.nodeType !== Node.TEXT_NODE
		) {
			setMentionDraft(null);
			return;
		}

		const node = selection.anchorNode as Text;
		const text = node.textContent ?? "";
		const caret = selection.anchorOffset;

		for (let i = caret - 1; i >= 0; i -= 1) {
			const char = text[i];
			if (char === "@") {
				const before = i === 0 ? "" : text[i - 1];
				if (before === "" || /[\s\u00A0\u200B]/.test(before)) {
					setMentionDraft((prev) => {
						const next = { node, start: i, query: text.slice(i + 1, caret) };
						if (
							prev &&
							prev.node === next.node &&
							prev.start === next.start &&
							prev.query === next.query
						) {
							return prev;
						}
						setMentionActiveIndex(0);
						return next;
					});
					return;
				}
				break;
			}
			if (/[\s\u00A0\u200B]/.test(char)) {
				break;
			}
		}
		setMentionDraft(null);
	}

	/* Выбор упоминания: «@фрагмент» заменяется тегом ровно в том же
	   месте текста. */
	function handleSelectMention(item: MentionItem) {
		const draft = mentionDraft;
		if (!draft || !draft.node.isConnected) {
			setMentionDraft(null);
			return;
		}

		const selection = window.getSelection();
		const range = document.createRange();
		const end = Math.min(
			draft.start + 1 + draft.query.length,
			draft.node.length,
		);
		range.setStart(draft.node, draft.start);
		range.setEnd(draft.node, end);
		range.deleteContents();
		if (selection) {
			selection.removeAllRanges();
			selection.addRange(range);
		}
		setMentionDraft(null);

		if (item.kind === "profile") {
			insertToken({ kind: "profile", label: PROFILE.name });
		} else if (item.product) {
			insertToken({
				kind: "product",
				label: item.product.name,
				logoSlug: item.product.logoSlug,
			});
		}
	}

	function serialize(): string {
		const editor = editorRef.current;
		if (!editor) {
			return "";
		}
		let result = "";
		editor.childNodes.forEach((node) => {
			if (node instanceof HTMLElement && node.dataset.tokenId) {
				result += node.dataset.label ?? "";
			} else {
				result += node.textContent ?? "";
			}
		});
		return result
			.replace(/\u200B/g, "")
			.replace(/\u00A0/g, " ")
			.replace(/\s+/g, " ")
			.trim();
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const query = serialize();
		if (query.length === 0) {
			return;
		}
		router.push(`/products?q=${encodeURIComponent(query)}`);
	}

	function handleEditorKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		/* Enter может завершать композицию CJK-раскладок — в этот
		   момент ничего не перехватываем. */
		const isComposing =
			event.nativeEvent.isComposing || event.keyCode === 229;
		if (isComposing) {
			return;
		}

		if (isMentionOpen) {
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

		/* Однострочный редактор: Enter отправляет, а не переносит. */
		if (event.key === "Enter") {
			event.preventDefault();
			formRef.current?.requestSubmit();
			return;
		}

		/* Backspace вплотную к тегу удаляет сам тег. Без этого
		   Backspace стирал бы невидимую подложку (\u200B), которую
		   normalizeCaret тут же создавал бы заново — и тег стал бы
		   неудаляемым. */
		if (event.key === "Backspace") {
			const editor = editorRef.current;
			const selection = window.getSelection();
			if (
				!editor ||
				!selection ||
				selection.rangeCount === 0 ||
				!selection.isCollapsed
			) {
				return;
			}
			const range = selection.getRangeAt(0);
			const { startContainer, startOffset } = range;

			let tokenBefore: Element | null = null;
			if (startContainer === editor) {
				const prev = editor.childNodes[startOffset - 1];
				if (prev instanceof Element && prev.hasAttribute("data-token-id")) {
					tokenBefore = prev;
				}
			} else if (startContainer.nodeType === Node.TEXT_NODE) {
				const text = startContainer.textContent ?? "";
				/* До каретки только невидимые символы — фактически
				   каретка стоит сразу за тегом. */
				if (/^[\u200B]*$/.test(text.slice(0, startOffset))) {
					const prev = startContainer.previousSibling;
					if (
						prev instanceof Element &&
						prev.hasAttribute("data-token-id")
					) {
						tokenBefore = prev;
					}
				}
			}

			if (tokenBefore) {
				event.preventDefault();
				/* Вместе с тегом убираем невидимую подложку перед
				   кареткой, чтобы она не копилась. */
				if (
					startContainer.nodeType === Node.TEXT_NODE &&
					startOffset > 0
				) {
					(startContainer as Text).deleteData(0, startOffset);
				}
				tokenBefore.remove();
				refreshEditorState();
			}
		}
	}

	function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
		/* Только плоский текст — без стилей и переносов строк. */
		event.preventDefault();
		const text = event.clipboardData
			.getData("text/plain")
			.replace(/[\r\n]+/g, " ");
		document.execCommand("insertText", false, text);
	}

	const placeholder = getPlaceholder(tokens.length > 0, isNarrowScreen);

	return (
		<form ref={formRef} className={styles.bar} onSubmit={handleSubmit}>
			<AttachMenu />

			<div className={styles.editorWrap}>
				<div
					ref={editorRef}
					contentEditable
					suppressContentEditableWarning
					role="textbox"
					aria-multiline="false"
					aria-label="Сообщение ассистенту"
					aria-autocomplete="list"
					aria-controls={isMentionOpen ? mentionMenuId : undefined}
					aria-activedescendant={
						isMentionOpen
							? `${mentionMenuId}-option-${mentionActiveIndex}`
							: undefined
					}
					className={styles.editor}
					onInput={refreshEditorState}
					onKeyDown={handleEditorKeyDown}
					onPaste={handlePaste}
				/>
				{!hasContent && (
					<span className={styles.editorPlaceholder} aria-hidden="true">
						{placeholder}
					</span>
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
				disabled={!hasContent}
				aria-label="Отправить"
			>
				<Icon
					icon="solar:arrow-up-bold-stroke"
					className={styles.submitGlyph}
				/>
			</button>

			{/* Содержимое тегов рисует React внутри DOM-узлов редактора. */}
			{tokens.map((token) =>
				token.host.isConnected
					? createPortal(
							<TokenContent token={token} />,
							token.host,
							token.id,
						)
					: null,
			)}
		</form>
	);
}

type TokenContentProps = {
	token: Token;
};

/* Упоминание в стиле Slack/Telegram: подсвеченный акцентом текст
   с маленькой иконкой, без крестика в потоке. Удаляется целиком
   одним Backspace — host не редактируется, браузер стирает его
   как один символ. */
function TokenContent({ token }: TokenContentProps) {
	return (
		<span className={styles.tokenInner}>
			{token.kind === "profile" ? (
				<Avatar
					name={token.label}
					size="1rem"
					className={styles.tokenAvatar}
					aria-hidden="true"
				/>
			) : token.kind === "product" ? (
				<span
					className={styles.tokenLogo}
					style={
						{
							"--logo-url": `url(/brands/${token.logoSlug}.svg)`,
						} as React.CSSProperties
					}
					aria-hidden="true"
				/>
			) : (
				<Icon
					icon={
						token.fileKind === "image"
							? "solar:gallery-linear"
							: "solar:document-text-linear"
					}
					className={styles.tokenFileGlyph}
					aria-hidden="true"
				/>
			)}
			<span className={styles.tokenLabel}>{token.label}</span>
		</span>
	);
}

function getPlaceholder(hasTokens: boolean, isNarrowScreen: boolean) {
	if (hasTokens) {
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
