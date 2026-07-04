"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent,
  type TransitionEvent,
} from "react";
import Link from "next/link";
import { Avatar, Logo, cn } from "@genora/ui";
import { useUiStore } from "@/stores/ui-store";
import { Icon } from "@/lib/icon";
import { PROFILE } from "@/lib/profile";
import { ComposerBar } from "@/app/dashboard/composer-bar";
import { SidebarTooltip } from "./sidebar-tooltip";
import { MOBILE_MEDIA_QUERY } from "./breakpoints";
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

/* A leftward swipe longer than this closes the sidebar. */
const SWIPE_CLOSE_DISTANCE = 48;

export function DashboardShell({ children }: { children: ReactNode }) {
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen);
  const closeSidebar = useUiStore((state) => state.closeSidebar);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSidebarOpen = useRef(isSidebarOpen);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // Swipe-to-close: a horizontal leftward swipe anywhere on the open
  // sidebar or the backdrop dismisses the drawer, matching the native
  // iOS gesture. Vertical swipes keep scrolling the sidebar content.
  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    if (!touchStart.current) {
      return;
    }
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    touchStart.current = null;

    const isLeftSwipe = deltaX < -SWIPE_CLOSE_DISTANCE;
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
    if (isLeftSwipe && isHorizontal) {
      closeSidebar();
    }
  }

  // Track every open/close transition (toggle button, Escape, backdrop
  // click) so the header freeze applies no matter how the sidebar was
  // toggled.
  useEffect(() => {
    if (prevSidebarOpen.current === isSidebarOpen) {
      return;
    }
    prevSidebarOpen.current = isSidebarOpen;
    setIsAnimating(true);
    if (animationTimeout.current) {
      clearTimeout(animationTimeout.current);
    }
    // Fallback in case the width transition never fires
    // (e.g. prefers-reduced-motion).
    animationTimeout.current = setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  }, [isSidebarOpen]);

  function handleSidebarTransitionEnd(event: TransitionEvent<HTMLElement>) {
    if (event.target !== event.currentTarget || event.propertyName !== "width") {
      return;
    }
    if (animationTimeout.current) {
      clearTimeout(animationTimeout.current);
      animationTimeout.current = null;
    }
    setIsAnimating(false);
  }

  useEffect(() => {
    return () => {
      if (animationTimeout.current) {
        clearTimeout(animationTimeout.current);
      }
    };
  }, []);

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

  // Desktop and mobile share one sidebar state, but their layouts
  // differ: on mobile an open sidebar pushes the whole page aside.
  // When the viewport crosses into the mobile range (device rotation,
  // window resize, DevTools device toolbar), close the sidebar so the
  // page never appears pre-shifted.
  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    function handleChange(event: MediaQueryListEvent) {
      if (event.matches) {
        closeSidebar();
      }
    }
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [closeSidebar]);

  return (
    <div className={cn(styles.shell, isSidebarOpen && styles.shellOpen)}>
      <aside
        className={cn(
          styles.sidebar,
          isSidebarOpen && styles.sidebarOpen,
          isAnimating && styles.sidebarAnimating,
        )}
        onTransitionEnd={handleSidebarTransitionEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
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
                <Avatar
                  name={PROFILE.name}
                  size="1.625rem"
                  className={styles.profileAvatar}
                />
                <span className={styles.profileName}>{PROFILE.name}</span>
              </button>
            </SidebarTooltip>
          </div>
        </div>
      </aside>

      <button
        type="button"
        className={styles.mobileFab}
        onClick={toggleSidebar}
        aria-label="Открыть меню"
      >
        <SidebarIcon />
      </button>

      {isSidebarOpen && (
        <button
          type="button"
          className={styles.backdrop}
          onClick={closeSidebar}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
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
