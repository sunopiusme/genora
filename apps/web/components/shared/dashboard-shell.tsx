"use client";

import {
  useEffect,
  useId,
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

type RecentGroup = {
  title: string;
  items: string[];
};

/* Chats in a flat list grouped by time, ChatGPT-style. Replace with
   real chat data (grouped by updated_at) when the backend is wired up. */
const RECENT_GROUPS: RecentGroup[] = [
  {
    title: "Сегодня",
    items: ["Не приходит код подтверждения", "Подписка на ChatGPT"],
  },
  {
    title: "Вчера",
    items: ["Промпты для генерации изображений", "Сравнить Claude и Gemini"],
  },
  {
    title: "Последние 7 дней",
    items: [
      "Midjourney для дизайна",
      "Материалы для обучения модели",
      "Доступ к GitHub Copilot",
      "Оплата подписки не прошла",
      "Что выбрать для кода",
    ],
  },
];

/* Entries of the profile popup menu, mirroring the composer's
   attach menu pattern. */
const PROFILE_MENU_ITEMS: NavItem[] = [
  {
    label: "Настройки",
    href: "/dashboard",
    icon: "solar:settings-linear",
  },
  {
    label: "Помощь",
    href: "/dashboard",
    icon: "solar:question-circle-linear",
  },
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

          <div className={styles.scrollArea}>
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
                {RECENT_GROUPS.map((group) => (
                  <div key={group.title} className={styles.subsection}>
                    <p className={styles.sectionTitle}>{group.title}</p>
                    <nav className={styles.recents}>
                      {group.items.map((item) => (
                        <Link
                          key={item}
                          href="/dashboard"
                          className={styles.recentLink}
                        >
                          {item}
                        </Link>
                      ))}
                    </nav>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.sidebarFooter}>
            <ProfileMenu isSidebarOpen={isSidebarOpen} />
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

/**
 * Кнопка профиля с выпадающим меню, раскрывающимся вверх от самой
 * кнопки — тот же паттерн, что у меню плюсика в чат-инпуте.
 */
function ProfileMenu({ isSidebarOpen }: { isSidebarOpen: boolean }) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Collapsing the sidebar hides the anchor context — close the menu.
  useEffect(() => {
    if (!isSidebarOpen) {
      setIsOpen(false);
    }
  }, [isSidebarOpen]);

  return (
    <div ref={rootRef} className={styles.profileRoot}>
      {isOpen && (
        <div id={menuId} role="menu" className={styles.profileMenu}>
          {PROFILE_MENU_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              role="menuitem"
              className={styles.profileMenuItem}
              onClick={() => setIsOpen(false)}
            >
              <Icon
                icon={item.icon}
                className={styles.profileMenuGlyph}
                aria-hidden="true"
              />
              {item.label}
            </Link>
          ))}
        </div>
      )}
      <SidebarTooltip label={PROFILE.name} isEnabled={!isSidebarOpen && !isOpen}>
        <button
          type="button"
          className={styles.profile}
          data-open={isOpen || undefined}
          onClick={() => setIsOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={isOpen ? menuId : undefined}
        >
          <Avatar
            name={PROFILE.name}
            size="1.625rem"
            className={styles.profileAvatar}
          />
          <span className={styles.profileName}>{PROFILE.name}</span>
        </button>
      </SidebarTooltip>
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
