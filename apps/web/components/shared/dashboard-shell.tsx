"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { Logo, cn } from "@genora/ui";
import { useUiStore } from "@/stores/ui-store";
import { Icon } from "@/lib/icon";
import { ComposerBar } from "@/app/dashboard/composer-bar";
import { SidebarTooltip } from "./sidebar-tooltip";
import styles from "./dashboard-shell.module.css";

type NavItem = {
  label: string;
  href: string;
  icon: string;
  active?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Новый запрос",
    href: "/dashboard",
    icon: "solar:pen-new-square-linear",
  },
  { label: "Поиск", href: "/dashboard", icon: "solar:magnifer-linear" },
  {
    label: "Витрина",
    href: "/dashboard",
    icon: "solar:shop-2-linear",
    active: true,
  },
  { label: "Подписки", href: "/dashboard", icon: "solar:card-2-linear" },
  { label: "Заказы", href: "/dashboard", icon: "solar:bag-4-linear" },
];

const RECENT_ITEMS = [
  "Подписка на ChatGPT",
  "Сравнить Claude и Gemini",
  "Midjourney для дизайна",
  "Доступ к GitHub Copilot",
  "Что выбрать для кода",
];

const PROFILE = {
  name: "Иван Петров",
  meta: "Личный аккаунт",
};

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase();
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen);
  const closeSidebar = useUiStore((state) => state.closeSidebar);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  useEffect(() => {
    if (!isSidebarOpen) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeSidebar();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen, closeSidebar]);

  return (
    <div className={cn(styles.shell, isSidebarOpen && styles.shellOpen)}>
      <aside className={cn(styles.sidebar, isSidebarOpen && styles.sidebarOpen)}>
        <div className={styles.sidebarInner}>
          <div className={styles.sidebarHeader}>
            <span className={styles.logo}>
              <Logo width="1.25rem" height="1.25rem" />
            </span>
            <button
              type="button"
              className={styles.sidebarToggle}
              onClick={toggleSidebar}
              aria-label="Переключить меню"
            >
              <SidebarIcon />
            </button>
          </div>

          <div className={styles.sidebarScroll}>
            <nav className={styles.nav}>
              {NAV_ITEMS.map((item) => (
                <SidebarTooltip
                  key={item.label}
                  label={item.label}
                  isEnabled={!isSidebarOpen}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      styles.navLink,
                      item.active && styles.navLinkActive,
                    )}
                  >
                    <Icon icon={item.icon} className={styles.navIcon} />
                    <span className={styles.navLabel}>{item.label}</span>
                  </Link>
                </SidebarTooltip>
              ))}
            </nav>

            <div className={styles.section}>
              <p className={styles.sectionTitle}>Недавние</p>
              <nav className={styles.recents}>
                {RECENT_ITEMS.map((item) => (
                  <Link key={item} href="/dashboard" className={styles.recentLink}>
                    {item}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          <div className={styles.sidebarFooter}>
            <SidebarTooltip label={PROFILE.name} isEnabled={!isSidebarOpen}>
              <button type="button" className={styles.profile}>
                <span className={styles.profileAvatar}>
                  {getInitial(PROFILE.name)}
                </span>
                <span className={styles.profileText}>
                  <span className={styles.profileName}>{PROFILE.name}</span>
                  <span className={styles.profileMeta}>{PROFILE.meta}</span>
                </span>
                <span className={styles.profileChevron}>
                  <ChevronIcon />
                </span>
              </button>
            </SidebarTooltip>
          </div>
        </div>
      </aside>

      {isSidebarOpen && (
        <button
          type="button"
          className={styles.backdrop}
          onClick={closeSidebar}
          aria-label="Закрыть меню"
        />
      )}

      <div className={styles.main}>
        <div className={styles.content}>
          {children}
          <div className={styles.composer}>
            <div className={styles.composerInner}>
              <ComposerBar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
      />
      <path
        d="M9 4.5v15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8 9l4-4 4 4M8 15l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
