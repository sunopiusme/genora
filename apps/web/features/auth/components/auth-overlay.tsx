"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle, cn } from "@genora/ui";
import { useAuthStore } from "@/stores/auth-store";

import { AuthCard } from "./auth-card";
import { VerifyCard } from "./verify-card";
import styles from "./auth-overlay.module.css";

const CROSSFADE_MS = 180;

type AuthView = "login" | "verify";

function ViewContent({
  view,
  verifyEmail,
}: {
  view: AuthView;
  verifyEmail: string | null;
}) {
  if (view === "login") return <AuthCard />;
  return (
    <div className={styles.verifyInner}>
      <h2 className={styles.verifyTitle}>Введите код</h2>
      <p className={styles.verifySubtitle}>
        Отправили 6&#8209;значный код{" "}
        {verifyEmail ? (
          <>
            на <span className={styles.verifyEmail}>{verifyEmail}</span>
          </>
        ) : (
          "на вашу почту"
        )}
        .
      </p>
      <VerifyCard email={verifyEmail ?? undefined} />
    </div>
  );
}

export function AuthOverlay() {
  const view = useAuthStore((state) => state.view);
  const verifyEmail = useAuthStore((state) => state.verifyEmail);
  const closeAuth = useAuthStore((state) => state.closeAuth);

  const [currentView, setCurrentView] = useState<AuthView | null>(view);
  const [leavingView, setLeavingView] = useState<AuthView | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLDivElement>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!view) {
      setCurrentView(null);
      setLeavingView(null);
      return;
    }
    setCurrentView((prev) => {
      if (prev && prev !== view) {
        setLeavingView(prev);
        if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
        clearTimerRef.current = setTimeout(
          () => setLeavingView(null),
          CROSSFADE_MS,
        );
      }
      return view;
    });
  }, [view]);

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, []);

  // Keep viewport height in sync with the current view so it animates
  // as one continuous curve during the crossfade.
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const current = currentRef.current;
    if (!viewport || !current) return;

    const update = () => {
      viewport.style.height = `${current.offsetHeight}px`;
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(current);
    return () => observer.disconnect();
  }, [currentView]);

  if (!view || !currentView) return null;

  const isLocked = view === "verify";

  return (
    <Dialog open onOpenChange={(open) => !open && !isLocked && closeAuth()}>
      <DialogContent
        className={styles.content}
        overlayClassName={styles.overlay}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => isLocked && event.preventDefault()}
        onPointerDownOutside={(event) => isLocked && event.preventDefault()}
        onInteractOutside={(event) => isLocked && event.preventDefault()}
      >
        <DialogTitle className={styles.srOnly}>
          {view === "login" ? "Вход в Genora" : "Подтверждение почты"}
        </DialogTitle>
        <span className={styles.grabber} aria-hidden="true" />
        <button
          type="button"
          className={cn(
            styles.closeButton,
            isLocked && styles.closeButtonHidden,
          )}
          onClick={closeAuth}
          aria-label="Закрыть"
          aria-hidden={isLocked}
          tabIndex={isLocked ? -1 : 0}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={styles.closeIcon}
            aria-hidden="true"
          >
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div ref={viewportRef} className={styles.viewport}>
          {leavingView && (
            <div key={leavingView} className={styles.viewLeaving} aria-hidden>
              <ViewContent view={leavingView} verifyEmail={verifyEmail} />
            </div>
          )}
          <div
            ref={currentRef}
            key={currentView}
            className={cn(styles.view, leavingView && styles.viewEntering)}
          >
            <ViewContent view={currentView} verifyEmail={verifyEmail} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
