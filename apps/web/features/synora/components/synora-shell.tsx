"use client";

/**
 * Оболочка площадки «Синора» — архитектурная копия AppShell (Genora),
 * адаптированная под площадку-песочницу:
 * - логотип и вордмарк «Синора» вместо Genora;
 * - навигация без витрины и подписок: «Новый запрос», «Поиск», «Плагины»;
 * - обратный переход на Genora с той же стрелкой-индикатором;
 * - доступ только после авторизации (см. layout /synora).
 *
 * Стили переиспользуются из app-shell.module.css: обе площадки живут
 * в одной платформе и должны выглядеть идентично. При будущем переезде
 * внутрь Genora достаточно будет перенести эту папку.
 */

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent,
  type TransitionEvent,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, SynoraLogo, cn } from "@genora/ui";
import { useUiStore } from "@/stores/ui-store";
import { useAuthStore, type AuthUser } from "@/stores/auth-store";
import { Icon } from "@/lib/icon";
import { useComposerStore } from "@features/products";
import { ComposerBar } from "@/components/shared/composer-bar";
import { SidebarTooltip } from "@/components/shared/sidebar-tooltip";
import { MOBILE_MEDIA_QUERY } from "@/components/shared/breakpoints";
import { SynoraGate } from "./synora-gate";
import { SYNORA_RECENT_GROUPS } from "../recent-sandboxes";
import styles from "@/components/shared/app-shell.module.css";

type NavItem = {
  label: string;
  href: string;
  icon: string;
  action?: "new-request" | "search";
  isExternalArea?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Новый запрос",
    href: "/synora",
    icon: "solar:pen-new-square-linear",
    action: "new-request",
  },
  {
    label: "Поиск",
    href: "/synora",
    icon: "solar:magnifer-linear",
    action: "search",
  },
  {
    label: "Плагины",
    href: "/synora/plugins",
    icon: "solar:widget-add-linear",
  },
  {
    label: "Genora",
    href: "/",
    icon: "solar:shop-2-linear",
    isExternalArea: true,
  },
];

const SWIPE_CLOSE_DISTANCE = 48;

export function SynoraShell({
  children,
  initialUser = null,
}: {
  children: ReactNode;
  initialUser?: AuthUser | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen);
  const closeSidebar = useUiStore((state) => state.closeSidebar);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const openSearch = useUiStore((state) => state.openSearch);
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const requestComposerFocus = useComposerStore((state) => state.requestFocus);
  const authenticatedUser = hasHydrated ? user : initialUser;

  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSidebarOpen = useRef(isSidebarOpen);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  function isNavItemActive(item: NavItem): boolean {
    if (item.action || item.isExternalArea) {
      return false;
    }
    return pathname === item.href;
  }

  function handleNewRequest() {
    if (window.matchMedia(MOBILE_MEDIA_QUERY).matches) {
      closeSidebar();
    }
    if (pathname !== "/synora") {
      router.push("/synora");
    }
    requestComposerFocus();
  }

  function handleSearch() {
    if (window.matchMedia(MOBILE_MEDIA_QUERY).matches) {
      closeSidebar();
    }
    openSearch();
  }

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
    }, 440);
  }, [isSidebarOpen]);

  function handleSidebarTransitionEnd(event: TransitionEvent<HTMLElement>) {
    if (
      event.target !== event.currentTarget ||
      (event.propertyName !== "width" && event.propertyName !== "transform")
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

  if (!authenticatedUser) {
    return <SynoraGate />;
  }

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
              <SynoraLogo width="1.25rem" height="1.25rem" />
            </span>
            <span className={styles.wordmark}>Синора</span>
            <SidebarTooltip
              label={isSidebarOpen ? "Свернуть меню" : "Развернуть меню"}
              isEnabled={!isAnimating}
              className={styles.sidebarToggleWrap}
            >
              <button
                type="button"
                className={styles.sidebarToggle}
                onClick={(event) => {
                  toggleSidebar();
                  if (!event.currentTarget.matches(":focus-visible")) {
                    event.currentTarget.blur();
                  }
                }}
                aria-label="Переключить меню"
              >
                <SidebarIcon />
              </button>
            </SidebarTooltip>
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
                    {item.action ? (
                      <button
                        type="button"
                        className={cn(styles.navLink, styles.navButton)}
                        onClick={
                          item.action === "new-request"
                            ? handleNewRequest
                            : handleSearch
                        }
                      >
                        <Icon icon={item.icon} className={styles.navIcon} />
                        <span className={styles.navLabel}>{item.label}</span>
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        className={cn(
                          styles.navLink,
                          isNavItemActive(item) && styles.navLinkActive,
                        )}
                        aria-current={
                          isNavItemActive(item) ? "page" : undefined
                        }
                      >
                        <Icon icon={item.icon} className={styles.navIcon} />
                        <span className={styles.navLabel}>{item.label}</span>
                        {item.isExternalArea && (
                          <Icon
                            icon="solar:arrow-right-up-linear"
                            className={styles.navExternalArrow}
                            aria-hidden="true"
                          />
                        )}
                      </Link>
                    )}
                  </SidebarTooltip>
                ))}
              </nav>

              <div className={styles.section}>
                {SYNORA_RECENT_GROUPS.map((group) => (
                  <div key={group.title} className={styles.subsection}>
                    <p className={styles.sectionTitle}>{group.title}</p>
                    <nav className={styles.recents}>
                      {group.items.map((item) => (
                        <Link
                          key={item}
                          href="/synora"
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
            <div key="profile" className={styles.footerSwap}>
              <SynoraProfile user={authenticatedUser} />
            </div>
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

function SynoraProfile({ user }: { user: AuthUser }) {
  const logout = useAuthStore((state) => state.logout);

  return (
    <SidebarTooltip label={user.name} isEnabled>
      <button
        type="button"
        className={styles.profile}
        onClick={logout}
        aria-label={`${user.name} — выйти`}
        title="Выйти"
      >
        <Avatar
          name={user.name}
          size="1.625rem"
          className={styles.profileAvatar}
        />
        <span className={styles.profileIdentity}>
          <span className={styles.profileName}>{user.name}</span>
          <span className={styles.profilePlan}>Песочница</span>
        </span>
      </button>
    </SidebarTooltip>
  );
}

function SidebarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="2"
        y="3.25"
        width="20"
        height="17.5"
        rx="3.25"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
      />
      <path
        d="M8.75 3.75v16.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
