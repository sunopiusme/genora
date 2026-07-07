"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/lib/icon";
import { useAuthStore } from "@/stores/auth-store";
import { RECENT_GROUPS } from "@/lib/recent-chats";
import { PageScrollArea } from "./page-scroll-area";
import styles from "./search-view.module.css";

export function SearchView() {
  const [query, setQuery] = useState("");
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const openLogin = useAuthStore((state) => state.openLogin);

  const groups = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return RECENT_GROUPS;
    }
    return RECENT_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.toLowerCase().includes(trimmed),
      ),
    })).filter((group) => group.items.length > 0);
  }, [query]);

  if (hasHydrated && !user) {
    return (
      <main className={styles.page}>
        <div className={styles.emptyState}>
          <Icon
            icon="solar:magnifer-linear"
            className={styles.emptyIcon}
            aria-hidden="true"
          />
          <h1 className={styles.emptyTitle}>Поиск по вашим запросам</h1>
          <p className={styles.emptyText}>
            Войдите, чтобы искать по истории своих чатов и запросов.
          </p>
          <button
            type="button"
            className={styles.emptyAction}
            onClick={openLogin}
          >
            Войти
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <h1 className={styles.title}>Поиск</h1>
        </div>
      </header>

      <PageScrollArea className={styles.scroll}>
        <div className={styles.scrollInner}>
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
              placeholder="Искать в чатах…"
              className={styles.searchInput}
              aria-label="Поиск по чатам"
              autoFocus
            />
          </div>

          {groups.length === 0 ? (
            <p className={styles.noResults}>
              Ничего не найдено по запросу «{query.trim()}»
            </p>
          ) : (
            groups.map((group) => (
              <section key={group.title} className={styles.group}>
                <h2 className={styles.groupTitle}>{group.title}</h2>
                <div className={styles.results}>
                  {group.items.map((item) => (
                    <Link key={item} href="/" className={styles.resultLink}>
                      <Icon
                        icon="solar:chat-round-line-linear"
                        className={styles.resultIcon}
                        aria-hidden="true"
                      />
                      <span className={styles.resultLabel}>{item}</span>
                    </Link>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </PageScrollArea>
    </main>
  );
}
