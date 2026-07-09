"use client";

import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent,
  type TransitionEvent,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SynoraLogo, cn } from "@genora/ui";
import { useUiStore } from "@/stores/ui-store";
import { useAuthStore, type AuthUser } from "@/stores/auth-store";
import { Icon } from "@/lib/icon";
import { useComposerStore } from "@/stores/composer-store";
import { ProfileMenu } from "@/components/shared/app-shell";
import { SidebarTooltip } from "@/components/shared/sidebar-tooltip";
import { SidebarProjects } from "@/components/shared/sidebar-projects";
import { MOBILE_MEDIA_QUERY } from "@/components/shared/breakpoints";
import { SynoraGate } from "./synora-gate";
import { SynoraHeading } from "./synora-heading";
import { ComposerInput } from "./composer/composer-input";
import { SYNORA_PROJECT_GROUPS } from "../data/recent-sandboxes";
import styles from "@/components/shared/app-shell.module.css";
import synoraStyles from "./synora-shell.module.css";

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
    label: "Задачи",
    href: "/synora/tasks",
    icon: "solar:checklist-minimalistic-linear",
  },
  {
    label: "Genora",
    href: "/genora",
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
  const hasInitializedSidebar = useUiStore(
    (state) => state.hasInitializedSidebar,
  );
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

  useLayoutEffect(() => {
    const isDesktop = !window.matchMedia(MOBILE_MEDIA_QUERY).matches;
    useUiStore.getState().initSidebar(isDesktop);
    prevSidebarOpen.current = useUiStore.getState().isSidebarOpen;
  }, []);

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
    router.push("/synora");
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
    <div
      className={cn(
        styles.shell,
        isSidebarOpen && styles.shellOpen,
        !hasInitializedSidebar && styles.shellPreInit,
      )}
    >
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
              <SynoraLogo width="1.625rem" height="1.625rem" />
            </span>
            <span className={styles.wordmark}>Синора</span>
            <div className={styles.sidebarHeaderProfile}>
              <ProfileMenu
                isSidebarOpen={isSidebarOpen}
                user={authenticatedUser}
                planLabel="Песочница"
                area="synora"
              />
            </div>
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
                <SidebarProjects
                  projects={SYNORA_PROJECT_GROUPS}
                  chatHref={(project) =>
                    `/synora?project=${encodeURIComponent(project.name)}`
                  }
                  newChatHref={(project) =>
                    `/synora?project=${encodeURIComponent(project.name)}`
                  }
                />
              </div>
            </div>
          </div>

          <div className={styles.sidebarFooter}>
            <div
              key="profile"
              className={cn(styles.footerSwap, styles.footerSwapProfile)}
            >
              <ProfileMenu
                isSidebarOpen={isSidebarOpen}
                user={authenticatedUser}
                planLabel="Песочница"
                area="synora"
              />
            </div>
          </div>

          <button
            type="button"
            className={styles.sidebarChatFab}
            onClick={handleNewRequest}
          >
            <Icon
              icon="solar:pen-new-square-linear"
              className={styles.sidebarChatFabIcon}
              aria-hidden="true"
            />
            Чат
          </button>
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
          <div
            className={cn(
              styles.composer,
              pathname === "/synora" && synoraStyles.composerCentered,
            )}
          >
            <div className={styles.composerInner}>
              <Suspense fallback={null}>
                {pathname === "/synora" && <SynoraHeading />}
                <ComposerInput />
              </Suspense>
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
        x="2"
        y="3.25"
        width="20"
        height="17.5"
        rx="3.25"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M8.75 3.75v16.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
