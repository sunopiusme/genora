"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle, cn } from "@genora/ui";
import { useAuthStore } from "@/stores/auth-store";

import { AuthCard } from "./auth-card";
import { VerifyCard } from "./verify-card";
import styles from "./auth-overlay.module.css";

const VIEW_EXIT_MS = 150;

type AuthView = "login" | "verify";

export function AuthOverlay() {
  const view = useAuthStore((state) => state.view);
  const verifyEmail = useAuthStore((state) => state.verifyEmail);
  const closeAuth = useAuthStore((state) => state.closeAuth);

  const [displayedView, setDisplayedView] = useState<AuthView | null>(view);
  const [phase, setPhase] = useState<"idle" | "exit" | "enter">("idle");
  const [isBack, setIsBack] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!view) {
      setDisplayedView(null);
      setPhase("idle");
      return;
    }
    if (!displayedView) {
      setDisplayedView(view);
      return;
    }
    if (view !== displayedView) {
      setIsBack(view === "login");
      setPhase("exit");
      const timer = setTimeout(() => {
        setDisplayedView(view);
        setPhase("enter");
      }, VIEW_EXIT_MS);
      return () => clearTimeout(timer);
    }
  }, [view, displayedView]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const inner = innerRef.current;
    if (!viewport || !inner) return;

    const update = () => {
      viewport.style.height = `${inner.offsetHeight}px`;
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [displayedView]);

  if (!view || !displayedView) return null;

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
          <div
            ref={innerRef}
            key={displayedView}
            className={cn(
              styles.view,
              phase === "exit" &&
                (isBack ? styles.viewExitBack : styles.viewExit),
              phase === "enter" &&
                (isBack ? styles.viewEnterBack : styles.viewEnter),
            )}
            onAnimationEnd={() => phase === "enter" && setPhase("idle")}
          >
            {displayedView === "login" ? (
              <AuthCard />
            ) : (
              <div className={styles.verifyInner}>
                <h2 className={styles.verifyTitle}>Введите код</h2>
                <p className={styles.verifySubtitle}>
                  Отправили 6&#8209;значный код{" "}
                  {verifyEmail ? (
                    <>
                      на{" "}
                      <span className={styles.verifyEmail}>{verifyEmail}</span>
                    </>
                  ) : (
                    "на вашу почту"
                  )}
                  .
                </p>
                <VerifyCard email={verifyEmail ?? undefined} />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
