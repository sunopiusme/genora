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
import { useAuthStore, type AuthUser } from "@/stores/auth-store";
import { Icon } from "@/lib/icon";
import { PROFILE } from "@features/profile";
import { ComposerBar } from "@/app/dashboard/composer-bar";
import { SidebarTooltip } from "./sidebar-tooltip";
import { ProfileSheet } from "./profile-sheet";
import { MOBILE_MEDIA_QUERY } from "./breakpoints";
import styles from "./dashboard-shell.module.css";

type NavItem = {
  label: string;
  href: string;
  icon: string;
  active?: boolean;
  requiresAuth?: boolean;
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
  {
    label: "Подписки",
    href: "/dashboard",
    icon: "solar:card-2-linear",
    requiresAuth: true,
  },
  {
    label: "Заказы",
    href: "/dashboard",
    icon: "solar:bag-4-linear",
    requiresAuth: true,
  },
];

type RecentGroup = {
  title: string;
  items: string[];
};

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

type ProfileMenuItem = {
  label: string;
  href: string;
  icon: string;
  isLogout?: boolean;
};

const PROFILE_MENU_GROUPS: ProfileMenuItem[][] = [
  [
    {
      label: "Улучшить план",
      href: "/dashboard",
      icon: "solar:star-fall-minimalistic-2-linear",
    },
    {
      label: "Персонализация",
      href: "/dashboard",
      icon: "solar:magic-stick-3-linear",
    },
    {
      label: "Профиль",
      href: "/dashboard",
      icon: "solar:user-circle-linear",
    },
    {
      label: "Настройки",
      href: "/dashboard",
      icon: "solar:settings-linear",
    },
  ],
  [
    {
      label: "Помощь",
      href: "/dashboard",
      icon: "solar:question-circle-linear",
    },
    {
      label: "Выйти",
      href: "/dashboard",
      icon: "solar:logout-2-linear",
      isLogout: true,
    },
  ],
];

const SWIPE_CLOSE_DISTANCE = 48;

export function DashboardShell({ children }: { children: ReactNode }) {
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen);
  const closeSidebar = useUiStore((state) => state.closeSidebar);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const authenticatedUser = hasHydrated ? user : null;
  const navItems = authenticatedUser
    ? NAV_ITEMS
    : NAV_ITEMS.filter((item) => !item.requiresAuth);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSidebarOpen = useRef(isSidebarOpen);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    if (!touchStart.current) {
      return;
    }
    const touch = event.changedTouches[0];
    if (!touch) {
      return;
    }
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    touchStart.current = null;

    const isLeftSwipe = deltaX < -SWIPE_CLOSE_DISTANCE;
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
    if (isLeftSwipe && isHorizontal) {
      closeSidebar();
    }
  }

  useEffect(() => {
    if (prevSidebarOpen.current === isSidebarOpen) {
      return;
    }
    prevSidebarOpen.current = isSidebarOpen;
    setIsAnimating(true);
    if (animationTimeout.current) {
      clearTimeout(animationTimeout.current);
    }
    animationTimeout.current = setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  }, [isSidebarOpen]);

  function handleSidebarTransitionEnd(event: TransitionEvent<HTMLElement>) {
    if (
      event.target !== event.currentTarget ||
      event.propertyName !== "width"
    ) {
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
                {navItems.map((item) => (
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

              {authenticatedUser && (
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
              )}
            </div>
          </div>

          <div className={styles.sidebarFooter}>
            {authenticatedUser ? (
              <ProfileMenu isSidebarOpen={isSidebarOpen} user={authenticatedUser} />
            ) : (
              <LoginButton isSidebarOpen={isSidebarOpen} />
            )}
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

function LoginButton({ isSidebarOpen }: { isSidebarOpen: boolean }) {
  const openLogin = useAuthStore((state) => state.openLogin);

  return (
    <SidebarTooltip label="Войти" isEnabled={!isSidebarOpen}>
      <button type="button" onClick={openLogin} className={styles.loginPill}>
        <LoginGlyph />
        <span className={styles.loginLabel}>Войти</span>
      </button>
    </SidebarTooltip>
  );
}

function LoginGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={styles.loginGlyph}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="12"
        cy="9.5"
        r="3"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M6.17 18.45c.6-2.32 2.9-3.7 5.83-3.7s5.23 1.38 5.83 3.7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProfileMenu({
  isSidebarOpen,
  user,
}: {
  isSidebarOpen: boolean;
  user: AuthUser;
}) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const logout = useAuthStore((state) => state.logout);

  function handleLogout() {
    setIsOpen(false);
    setIsSheetOpen(false);
    logout();
  }

  function handleProfileClick() {
    if (window.matchMedia(MOBILE_MEDIA_QUERY).matches) {
      setIsSheetOpen(true);
      return;
    }
    setIsOpen((open) => !open);
  }

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

  useEffect(() => {
    if (!isSidebarOpen) {
      setIsOpen(false);
    }
  }, [isSidebarOpen]);

  return (
    <div ref={rootRef} className={styles.profileRoot}>
      {isOpen && (
        <div id={menuId} role="menu" className={styles.profileMenu}>
          <Link
            href="/dashboard"
            role="menuitem"
            className={styles.profileMenuHeader}
            onClick={() => setIsOpen(false)}
          >
            <Avatar
              name={user.name}
              size="2rem"
              className={styles.profileMenuAvatar}
            />
            <span className={styles.profileMenuIdentity}>
              <span className={styles.profileMenuName}>{user.name}</span>
              <span className={styles.profileMenuPlan}>{PROFILE.plan}</span>
            </span>
            <Icon
              icon="solar:alt-arrow-right-linear"
              className={styles.profileMenuChevron}
              aria-hidden="true"
            />
          </Link>
          {PROFILE_MENU_GROUPS.map((group, groupIndex) => (
            <div key={groupIndex} className={styles.profileMenuGroup}>
              {group.map((item) =>
                item.isLogout ? (
                  <button
                    key={item.label}
                    type="button"
                    role="menuitem"
                    className={styles.profileMenuItem}
                    onClick={handleLogout}
                  >
                    <Icon
                      icon={item.icon}
                      className={styles.profileMenuGlyph}
                      aria-hidden="true"
                    />
                    {item.label}
                  </button>
                ) : (
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
                ),
              )}
            </div>
          ))}
        </div>
      )}
      <SidebarTooltip
        label={user.name}
        isEnabled={!isSidebarOpen && !isOpen}
      >
        <button
          type="button"
          className={styles.profile}
          data-open={isOpen || undefined}
          onClick={handleProfileClick}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={isOpen ? menuId : undefined}
        >
          <Avatar
            name={user.name}
            size="1.625rem"
            className={styles.profileAvatar}
          />
          <span className={styles.profileIdentity}>
            <span className={styles.profileName}>{user.name}</span>
            <span className={styles.profilePlan}>{PROFILE.plan}</span>
          </span>
        </button>
      </SidebarTooltip>
      <ProfileSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
      />
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
