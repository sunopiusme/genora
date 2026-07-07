"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@genora/ui";
import { Icon } from "@/lib/icon";
import { useUiStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { RECENT_GROUPS } from "@/lib/recent-chats";
import { useComposerStore } from "@features/products";
import styles from "./search-overlay.module.css";

/* Единая модель результата: и быстрые действия, и чаты сводятся к
   плоскому списку опций — по нему ходит клавиатурная навигация
   (паттерн combobox: фокус остаётся в инпуте, активная опция
   подсвечивается через aria-activedescendant). */
type ResultItem = {
  id: string;
  label: string;
  icon: string;
  run: () => void;
};

type ResultSection = {
  title: string;
  items: ResultItem[];
};

function matches(label: string, query: string): boolean {
  return label.toLowerCase().includes(query);
}

export function SearchOverlay() {
  const isSearchOpen = useUiStore((state) => state.isSearchOpen);
  const openSearch = useUiStore((state) => state.openSearch);
  const closeSearch = useUiStore((state) => state.closeSearch);
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const openLogin = useAuthStore((state) => state.openLogin);
  const requestComposerFocus = useComposerStore((state) => state.requestFocus);
  const pathname = usePathname();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  // Горячая клавиша Cmd/Ctrl+K — открыть поиск (или вход, если не авторизован).
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (!hasHydrated) return;
        if (!user) {
          openLogin();
          return;
        }
        openSearch();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasHydrated, user, openLogin, openSearch]);

  // Сбрасываем состояние при каждом открытии.
  useEffect(() => {
    if (isSearchOpen) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [isSearchOpen]);

  const trimmed = query.trim().toLowerCase();

  const sections = useMemo<ResultSection[]>(() => {
    function goTo(href: string) {
      closeSearch();
      if (pathname !== href) {
        router.push(href);
      }
    }

    const quickActions: ResultItem[] = [
      {
        id: "action-new-request",
        label: "Новый запрос",
        icon: "solar:pen-new-square-linear",
        run: () => {
          goTo("/genora");
          requestComposerFocus();
        },
      },
      {
        id: "action-showcase",
        label: "Витрина",
        icon: "solar:shop-2-linear",
        run: () => goTo("/genora"),
      },
    ];

    const result: ResultSection[] = [];

    const filteredActions = trimmed
      ? quickActions.filter((item) => matches(item.label, trimmed))
      : quickActions;
    if (filteredActions.length > 0) {
      result.push({ title: "Действия", items: filteredActions });
    }

    for (const group of RECENT_GROUPS) {
      const items = (
        trimmed
          ? group.items.filter((item) => matches(item, trimmed))
          : group.items
      ).map<ResultItem>((label, index) => ({
        id: `chat-${group.title}-${index}`,
        label,
        icon: "solar:chat-round-line-linear",
        run: () => goTo("/genora"),
      }));
      if (items.length > 0) {
        result.push({ title: group.title, items });
      }
    }

    return result;
  }, [trimmed, pathname, router, closeSearch, requestComposerFocus]);

  const flatItems = useMemo(
    () => sections.flatMap((section) => section.items),
    [sections],
  );

  // При изменении запроса активная опция возвращается к началу списка.
  useEffect(() => {
    setActiveIndex(0);
  }, [trimmed]);

  const activeItem = flatItems[activeIndex];
  const activeId = activeItem ? `search-option-${activeItem.id}` : undefined;

  // Активная опция всегда в зоне видимости прокручиваемого списка.
  useEffect(() => {
    if (!activeId) return;
    document
      .getElementById(activeId)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeId]);

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (flatItems.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % flatItems.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(
        (index) => (index - 1 + flatItems.length) % flatItems.length,
      );
      return;
    }
    if (event.key === "Enter") {
      if (event.nativeEvent.isComposing || event.keyCode === 229) return;
      event.preventDefault();
      flatItems[activeIndex]?.run();
    }
  }

  if (!isSearchOpen) return null;

  let optionIndex = -1;

  return (
    <Dialog open onOpenChange={(open) => !open && closeSearch()}>
      <DialogContent
        className={styles.content}
        overlayClassName={styles.overlay}
      >
        <DialogTitle className={styles.srOnly}>Поиск по чатам</DialogTitle>
        <span className={styles.grabber} aria-hidden="true" />

        <div className={styles.searchField}>
          <Icon
            icon="solar:magnifer-linear"
            className={styles.searchIcon}
            aria-hidden="true"
          />
          <input
            type="search"
            role="combobox"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Поиск в чатах"
            className={styles.searchInput}
            aria-label="Поиск в чатах"
            aria-expanded="true"
            aria-controls="search-results"
            aria-activedescendant={activeId}
            autoComplete="off"
            autoFocus
          />
          <kbd className={styles.escHint}>Esc</kbd>
        </div>

        <div
          id="search-results"
          role="listbox"
          aria-label="Результаты поиска"
          className={styles.results}
        >
          {flatItems.length === 0 ? (
            <p className={styles.noResults}>Ничего не найдено</p>
          ) : (
            sections.map((section) => (
              <section key={section.title} className={styles.group}>
                <h2 className={styles.groupTitle}>{section.title}</h2>
                <div role="group" aria-label={section.title} className={styles.list}>
                  {section.items.map((item) => {
                    optionIndex += 1;
                    const index = optionIndex;
                    const isActive = index === activeIndex;
                    return (
                      <button
                        key={item.id}
                        id={`search-option-${item.id}`}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        tabIndex={-1}
                        data-active={isActive || undefined}
                        className={styles.item}
                        onClick={item.run}
                        onMouseMove={() => {
                          if (!isActive) setActiveIndex(index);
                        }}
                      >
                        <Icon
                          icon={item.icon}
                          className={styles.itemIcon}
                          aria-hidden="true"
                        />
                        <span className={styles.itemLabel}>{item.label}</span>
                        {isActive && (
                          <Icon
                            icon="solar:alt-arrow-right-linear"
                            className={styles.itemEnterHint}
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
