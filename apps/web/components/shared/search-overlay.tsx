"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@genora/ui";
import { Icon } from "@/lib/icon";
import { useUiStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { RECENT_GROUPS } from "@/lib/recent-chats";
import { useComposerStore } from "@features/products";
import styles from "./search-overlay.module.css";

type QuickAction = {
  label: string;
  icon: string;
  action?: "new-request";
  href?: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Новый запрос",
    icon: "solar:pen-new-square-linear",
    action: "new-request",
  },
  {
    label: "Витрина",
    icon: "solar:shop-2-linear",
    href: "/",
  },
];

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

  // Сбрасываем запрос при каждом открытии.
  useEffect(() => {
    if (isSearchOpen) {
      setQuery("");
    }
  }, [isSearchOpen]);

  const trimmed = query.trim().toLowerCase();

  const quickActions = useMemo(() => {
    if (!trimmed) return QUICK_ACTIONS;
    return QUICK_ACTIONS.filter((item) => matches(item.label, trimmed));
  }, [trimmed]);

  const chatGroups = useMemo(() => {
    if (!trimmed) return RECENT_GROUPS;
    return RECENT_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => matches(item, trimmed)),
    })).filter((group) => group.items.length > 0);
  }, [trimmed]);

  const isEmpty = quickActions.length === 0 && chatGroups.length === 0;

  function handleNewRequest() {
    closeSearch();
    if (pathname !== "/") {
      router.push("/");
    }
    requestComposerFocus();
  }

  if (!isSearchOpen) return null;

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
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск в чатах"
            className={styles.searchInput}
            aria-label="Поиск в чатах"
            autoFocus
          />
          <kbd className={styles.escHint}>Esc</kbd>
        </div>

        <div className={styles.results}>
          {isEmpty ? (
            <p className={styles.noResults}>Ничего не найдено</p>
          ) : (
            <>
              {quickActions.length > 0 && (
                <section className={styles.group}>
                  <h2 className={styles.groupTitle}>Действия</h2>
                  <div className={styles.list}>
                    {quickActions.map((item) =>
                      item.action === "new-request" ? (
                        <button
                          key={item.label}
                          type="button"
                          className={styles.item}
                          onClick={handleNewRequest}
                        >
                          <Icon
                            icon={item.icon}
                            className={styles.itemIcon}
                            aria-hidden="true"
                          />
                          <span className={styles.itemLabel}>
                            {item.label}
                          </span>
                        </button>
                      ) : (
                        <Link
                          key={item.label}
                          href={item.href ?? "/"}
                          className={styles.item}
                          onClick={closeSearch}
                        >
                          <Icon
                            icon={item.icon}
                            className={styles.itemIcon}
                            aria-hidden="true"
                          />
                          <span className={styles.itemLabel}>
                            {item.label}
                          </span>
                        </Link>
                      ),
                    )}
                  </div>
                </section>
              )}

              {chatGroups.map((group) => (
                <section key={group.title} className={styles.group}>
                  <h2 className={styles.groupTitle}>{group.title}</h2>
                  <div className={styles.list}>
                    {group.items.map((item) => (
                      <Link
                        key={item}
                        href="/"
                        className={styles.item}
                        onClick={closeSearch}
                      >
                        <Icon
                          icon="solar:chat-round-line-linear"
                          className={styles.itemIcon}
                          aria-hidden="true"
                        />
                        <span className={styles.itemLabel}>{item}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
