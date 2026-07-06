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
import { PROFILE } from "@features/profile";
import { Icon } from "@/lib/icon";
import { useAuthStore } from "@/stores/auth-store";
import { useComposerStore } from "../stores/composer-store";
import { AttachMenu } from "./attach-menu";
import { MentionMenu, getMentionItems, type MentionItem } from "./mention-menu";
import styles from "./assistant-bar.module.css";

const NARROW_MEDIA_QUERY = "(max-width: 22.5rem)";
const ZERO_WIDTH_SPACE = "\u200B";
const NON_BREAKING_SPACE = "\u00A0";

type Token = {
  id: string;
  kind: "profile" | "product" | "file";
  label: string;
  logoSlug?: string;
  fileKind?: "image" | "document";
  host: HTMLElement;
};

type MentionDraft = {
  node: Text;
  start: number;
  query: string;
};

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
  const previousNode = editor.childNodes[offset - 1] ?? null;
  const nextNode = editor.childNodes[offset] ?? null;
  const caret = document.createRange();

  if (previousNode && previousNode.nodeType === Node.TEXT_NODE) {
    caret.setStart(previousNode, (previousNode as Text).length);
  } else if (nextNode && nextNode.nodeType === Node.TEXT_NODE) {
    caret.setStart(nextNode, 0);
  } else if (previousNode || nextNode) {
    const filler = document.createTextNode(ZERO_WIDTH_SPACE);
    if (previousNode) {
      previousNode.after(filler);
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
  const lastRangeRef = useRef<Range | null>(null);
  const isNarrowScreen = useIsNarrowScreen();

  const attachedProduct = useComposerStore((state) => state.attachedProduct);
  const attachedFile = useComposerStore((state) => state.attachedFile);
  const isProfileAttached = useComposerStore(
    (state) => state.isProfileAttached,
  );
  const detachProduct = useComposerStore((state) => state.detachProduct);
  const detachFile = useComposerStore((state) => state.detachFile);
  const detachProfile = useComposerStore((state) => state.detachProfile);
  const focusSignal = useComposerStore((state) => state.focusSignal);
  const user = useAuthStore((state) => state.user);
  const openLogin = useAuthStore((state) => state.openLogin);

  useEffect(() => {
    if (focusSignal === 0) {
      return;
    }
    editorRef.current?.focus();
  }, [focusSignal]);

  const mentionItems = mentionDraft ? getMentionItems(mentionDraft.query) : [];
  const isMentionOpen = mentionDraft !== null && mentionItems.length > 0;

  function refreshEditorState() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    normalizeCaret(editor);
    setTokens((previous) => previous.filter((token) => token.host.isConnected));
    const text = (editor.textContent ?? "")
      .replace(/[\u00A0\u200B]/g, " ")
      .trim();
    const hasToken = editor.querySelector("[data-token-id]") !== null;
    setHasContent(text.length > 0 || hasToken);
  }

  function insertToken(data: Omit<Token, "id" | "host">) {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const isProfileAlreadyInserted =
      data.kind === "profile" &&
      tokensRef.current.some(
        (token) => token.kind === "profile" && token.host.isConnected,
      );
    if (isProfileAlreadyInserted) {
      editor.focus();
      return;
    }

    const id = `token-${Math.random().toString(36).slice(2, 10)}`;
    const host = document.createElement("span");
    host.className = styles.token ?? "";
    host.contentEditable = "false";
    host.dataset.tokenId = id;
    host.dataset.label = data.label;

    const selection = window.getSelection();
    let range: Range;
    const hasLiveCaretInEditor =
      selection &&
      selection.rangeCount > 0 &&
      editor.contains(selection.anchorNode) &&
      document.activeElement === editor;
    const hasSavedRangeInEditor =
      lastRangeRef.current &&
      lastRangeRef.current.startContainer.isConnected &&
      editor.contains(lastRangeRef.current.startContainer);

    if (hasLiveCaretInEditor) {
      range = selection.getRangeAt(0);
      range.deleteContents();
    } else if (hasSavedRangeInEditor) {
      range = lastRangeRef.current as Range;
      range.deleteContents();
    } else {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }
    editor.focus();
    range.insertNode(host);

    const trailingSpace = document.createTextNode(NON_BREAKING_SPACE);
    host.after(trailingSpace);
    if (selection) {
      const caret = document.createRange();
      caret.setStart(trailingSpace, 1);
      caret.collapse(true);
      selection.removeAllRanges();
      selection.addRange(caret);
      lastRangeRef.current = caret.cloneRange();
    }

    setTokens((previous) => [
      ...previous.filter((token) => token.host.isConnected),
      { ...data, id, host },
    ]);
    setHasContent(true);
  }

  const insertTokenRef = useRef(insertToken);
  insertTokenRef.current = insertToken;

  useEffect(() => {
    if (!attachedProduct) {
      return;
    }
    insertTokenRef.current({
      kind: "product",
      label: attachedProduct.name,
      logoSlug: attachedProduct.logoSlug,
    });
    detachProduct();
  }, [attachedProduct, detachProduct]);

  useEffect(() => {
    if (!attachedFile) {
      return;
    }
    insertTokenRef.current({
      kind: "file",
      label: attachedFile.name,
      fileKind: attachedFile.kind,
    });
    detachFile();
  }, [attachedFile, detachFile]);

  useEffect(() => {
    if (!isProfileAttached) {
      return;
    }
    insertTokenRef.current({ kind: "profile", label: PROFILE.name });
    detachProfile();
  }, [isProfileAttached, detachProfile]);

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
    if (editor && document.activeElement === editor) {
      normalizeCaret(editor);
    }
    const selection = window.getSelection();

    const hasCaretInEditor =
      editor &&
      selection &&
      selection.rangeCount > 0 &&
      selection.anchorNode &&
      editor.contains(selection.anchorNode) &&
      document.activeElement === editor;
    if (hasCaretInEditor) {
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

    for (let index = caret - 1; index >= 0; index -= 1) {
      const char = text.charAt(index);
      if (char === "@") {
        const charBefore = index === 0 ? "" : text.charAt(index - 1);
        const isMentionStart =
          charBefore === "" || /[\s\u00A0\u200B]/.test(charBefore);
        if (isMentionStart) {
          setMentionDraft((previous) => {
            const next = {
              node,
              start: index,
              query: text.slice(index + 1, caret),
            };
            const isSameDraft =
              previous &&
              previous.node === next.node &&
              previous.start === next.start &&
              previous.query === next.query;
            if (isSameDraft) {
              return previous;
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
    if (!user) {
      openLogin();
      return;
    }
    router.push(`/products?q=${encodeURIComponent(query)}`);
  }

  function handleEditorKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const isComposing = event.nativeEvent.isComposing || event.keyCode === 229;
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
        const activeItem = mentionItems[mentionActiveIndex];
        if (activeItem) {
          handleSelectMention(activeItem);
        }
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setMentionDraft(null);
        return;
      }
    }

    if (event.key === "Enter") {
      event.preventDefault();
      formRef.current?.requestSubmit();
      return;
    }

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
        const previousNode = editor.childNodes[startOffset - 1];
        if (
          previousNode instanceof Element &&
          previousNode.hasAttribute("data-token-id")
        ) {
          tokenBefore = previousNode;
        }
      } else if (startContainer.nodeType === Node.TEXT_NODE) {
        const text = startContainer.textContent ?? "";
        const isCaretRightAfterToken = /^[\u200B]*$/.test(
          text.slice(0, startOffset),
        );
        if (isCaretRightAfterToken) {
          const previousNode = startContainer.previousSibling;
          if (
            previousNode instanceof Element &&
            previousNode.hasAttribute("data-token-id")
          ) {
            tokenBefore = previousNode;
          }
        }
      }

      if (tokenBefore) {
        event.preventDefault();
        if (startContainer.nodeType === Node.TEXT_NODE && startOffset > 0) {
          (startContainer as Text).deleteData(0, startOffset);
        }
        tokenBefore.remove();
        refreshEditorState();
      }
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
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

      {tokens.map((token) =>
        token.host.isConnected
          ? createPortal(<TokenContent token={token} />, token.host, token.id)
          : null,
      )}
    </form>
  );
}

type TokenContentProps = {
  token: Token;
};

function TokenContent({ token }: TokenContentProps) {
  return <span className={styles.tokenLabel}>{token.label}</span>;
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
