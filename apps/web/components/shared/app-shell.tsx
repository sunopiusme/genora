"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type TouchEvent,
  type TransitionEvent,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, Logo, cn } from "@genora/ui";
import { useUiStore } from "@/stores/ui-store";
import { useAuthStore, type AuthUser } from "@/stores/auth-store";
import { Icon } from "@/lib/icon";
import { RECENT_GROUPS } from "@/lib/recent-chats";
import { PROFILE, formatBalance } from "@features/profile";
import { useComposerStore } from "@features/products";
import { ComposerBar } from "./composer-bar";
import { SidebarTooltip } from "./sidebar-tooltip";
import { ProfileSheet } from "./profile-sheet";
import { MOBILE_MEDIA_QUERY } from "./breakpoints";
import styles from "./app-shell.module.css";

type NavItem = {
  label: string;
  href: string;
  icon: string;
  requiresAuth?: boolean;
  action?: "new-request" | "search";
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Новый запрос",
    href: "/",
    icon: "solar:pen-new-square-linear",
    action: "new-request",
  },
  {
    label: "Поиск",
    href: "/",
    icon: "solar:magnifer-linear",
    requiresAuth: true,
    action: "search",
  },
  {
    label: "Витрина",
    href: "/",
    icon: "solar:shop-2-linear",
  },
  {
    label: "Подписки",
    href: "/subscriptions",
    icon: "solar:card-2-linear",
    requiresAuth: true,
  },
  {
    label: "Заказы",
    href: "/orders",
    icon: "solar:bag-4-linear",
    requiresAuth: true,
  },
];

type ProfileMenuItem = {
  label: string;
  href: string;
  icon: string;
  isLogout?: boolean;
  showsBalance?: boolean;
};

const PROFILE_MENU_GROUPS: ProfileMenuItem[][] = [
  [
    {
      label: "Пополнить",
      href: "/",
      icon: "solar:wallet-linear",
      showsBalance: true,
    },
    {
      label: "Улучшить план",
      href: "/",
      icon: "solar:star-fall-minimalistic-2-linear",
    },
    {
      label: "Персонализация",
      href: "/",
      icon: "solar:magic-stick-3-linear",
    },
    {
      label: "Профиль",
      href: "/",
      icon: "solar:user-circle-linear",
    },
    {
      label: "Настройки",
      href: "/",
      icon: "solar:settings-linear",
    },
  ],
  [
    {
      label: "Помощь",
      href: "/",
      icon: "solar:question-circle-linear",
    },
    {
      label: "Выйти",
      href: "/",
      icon: "solar:logout-2-linear",
      isLogout: true,
    },
  ],
];

const SWIPE_CLOSE_DISTANCE = 48;

export function AppShell({
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
  const openLogin = useAuthStore((state) => state.openLogin);
  const requestComposerFocus = useComposerStore((state) => state.requestFocus);
  const authenticatedUser = hasHydrated ? user : initialUser;
  const navItems = authenticatedUser
    ? NAV_ITEMS
    : NAV_ITEMS.filter((item) => !item.requiresAuth);

  function isNavItemActive(item: NavItem): boolean {
    if (item.action) {
      return false;
    }
    return pathname === item.href;
  }

  function handleNewRequest() {
    if (window.matchMedia(MOBILE_MEDIA_QUERY).matches) {
      closeSidebar();
    }
    if (!authenticatedUser) {
      openLogin();
      return;
    }
    if (pathname !== "/") {
      router.push("/");
    }
    requestComposerFocus();
  }

  function handleSearch() {
    if (window.matchMedia(MOBILE_MEDIA_QUERY).matches) {
      closeSidebar();
    }
    if (!authenticatedUser) {
      openLogin();
      return;
    }
    openSearch();
  }
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSidebarOpen = useRef(isSidebarOpen);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  function endSidebarAnimation() {
    setIsAnimating(false);
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
      endSidebarAnimation();
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
    endSidebarAnimation();
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
            <span className={styles.wordmark}>Genora</span>
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
                  /* Снимаем фокус после клика мышью, чтобы браузер
                  не восстанавливал его (и тултип) при возврате на вкладку. */
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
                {navItems.map((item) => (
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
                      </Link>
                    )}
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
                            href="/"
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
              <div key="profile" className={styles.footerSwap}>
                <ProfileMenu
                  isSidebarOpen={isSidebarOpen}
                  user={authenticatedUser}
                />
              </div>
            ) : (
              <div key="login" className={styles.footerSwap}>
                <LoginButton isSidebarOpen={isSidebarOpen} />
              </div>
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
        <div ref={contentRef} className={styles.content}>
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
      <button type="button" onClick={openLogin} className={styles.loginButton}>
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
        r="9.1"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle
        cx="12"
        cy="9.5"
        r="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M6.17 18.45c.6-2.32 2.9-3.7 5.83-3.7s5.23 1.38 5.83 3.7"
        stroke="currentColor"
        strokeWidth="1.8"
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
  const [menuStyle, setMenuStyle] = useState<CSSProperties>();
  const logout = useAuthStore((state) => state.logout);

  useLayoutEffect(() => {
    if (!isOpen || !rootRef.current) {
      return;
    }
    const rect = rootRef.current.getBoundingClientRect();
    if (isSidebarOpen) {
      setMenuStyle({
        position: "fixed",
        left: rect.left,
        bottom: window.innerHeight - (rect.top + 5.5) + 4,
      });
      return;
    }
    setMenuStyle({
      position: "fixed",
      left: rect.right + 18,
      bottom: Math.max(window.innerHeight - rect.bottom - 2, 8),
    });
  }, [isOpen, isSidebarOpen]);

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
        <div
          id={menuId}
          role="menu"
          className={cn(
            styles.profileMenu,
            !isSidebarOpen && styles.profileMenuFlyout,
          )}
          style={menuStyle}
        >
          <Link
            href="/"
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
                    {item.showsBalance && (
                      <span className={styles.profileMenuBalanceChip}>
                        {formatBalance(PROFILE.balance)}
                      </span>
                    )}
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
          <span className={styles.profileBalance}>
            {formatBalance(PROFILE.balance)}
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
