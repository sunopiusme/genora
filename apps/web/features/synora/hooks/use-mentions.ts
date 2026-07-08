"use client";

import { useCallback, useMemo, useState } from "react";

import { PLUGINS, PROJECT_FILES } from "../data/mentions";
import { parseMentionToken } from "../lib/parse-mention-token";
import type { MentionGroup, MentionItem } from "../types";

type Args = {
  value: string;
  caret: number;
  focused: boolean;
};

type ApplyResult = {
  nextValue: string;
  nextCaret: number;
};

type Controller = {
  open: boolean;
  query: string;
  groups: MentionGroup[];
  flatItems: MentionItem[];
  activeIndex: number;
  activeFromKeyboard: boolean;
  setActiveIndex: (index: number, source?: "mouse" | "keyboard") => void;
  apply: (item: MentionItem) => ApplyResult | null;
  close: () => void;
};

function matchesQuery(item: MentionItem, query: string): boolean {
  if (!query) return true;
  if (item.label.toLowerCase().includes(query)) return true;
  return item.keywords.some((kw) => kw.includes(query));
}

export function useMentions({ value, caret, focused }: Args): Controller {
  const [state, setState] = useState<{
    tokenKey: string | null;
    activeIndex: number;
    activeFromKeyboard: boolean;
    closedTokenKey: string | null;
  }>({
    tokenKey: null,
    activeIndex: 0,
    activeFromKeyboard: false,
    closedTokenKey: null,
  });

  const token = useMemo(() => parseMentionToken(value, caret), [value, caret]);
  const tokenKey = token ? `${token.start}:${token.query}` : null;

  const derivedState =
    state.tokenKey === tokenKey
      ? state
      : {
          tokenKey,
          activeIndex: 0,
          activeFromKeyboard: false,
          closedTokenKey: state.closedTokenKey,
        };

  const open = !!token && derivedState.closedTokenKey !== tokenKey;
  const query = token?.query ?? "";

  const filteredPlugins = useMemo(
    () => PLUGINS.filter((p) => matchesQuery(p, query)),
    [query],
  );
  const filteredFiles = useMemo(
    () => PROJECT_FILES.filter((f) => matchesQuery(f, query)),
    [query],
  );

  const groups = useMemo<MentionGroup[]>(() => {
    const result: MentionGroup[] = [];
    if (filteredPlugins.length > 0) {
      result.push({ title: "Плагины", kind: "plugin", items: filteredPlugins });
    }
    result.push({
      title: "Файлы",
      kind: "file",
      items: filteredFiles,
    });
    return result;
  }, [filteredPlugins, filteredFiles]);

  const flatItems = useMemo(
    () => groups.flatMap((g) => g.items),
    [groups],
  );

  const safeIndex = Math.min(derivedState.activeIndex, Math.max(flatItems.length - 1, 0));

  const setActiveIndex = useCallback(
    (index: number, source: "mouse" | "keyboard" = "keyboard") => {
      setState({
        tokenKey,
        activeIndex: Math.max(0, index),
        activeFromKeyboard: source === "keyboard",
        closedTokenKey: null,
      });
    },
    [tokenKey],
  );

  const apply = useCallback<Controller["apply"]>(
    (item) => {
      if (!token) return null;
      const before = value.slice(0, token.start);
      const after = value.slice(token.end);
      const insertion = `@${item.label} `;
      return {
        nextValue: before + insertion + after,
        nextCaret: before.length + insertion.length,
      };
    },
    [token, value],
  );

  const close = useCallback(() => {
    setState((prev) => ({
      ...prev,
      tokenKey,
      closedTokenKey: tokenKey,
    }));
  }, [tokenKey]);

  return {
    open: open && focused && flatItems.length > 0,
    query,
    groups,
    flatItems,
    activeIndex: safeIndex,
    activeFromKeyboard: derivedState.activeFromKeyboard,
    setActiveIndex,
    apply,
    close,
  };
}
