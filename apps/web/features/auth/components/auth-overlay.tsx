"use client";

import { Dialog, DialogContent, DialogTitle } from "@genora/ui";
import { useAuthStore } from "@/stores/auth-store";

import { AuthCard } from "./auth-card";
import { VerifyCard } from "./verify-card";
import styles from "./auth-overlay.module.css";

export function AuthOverlay() {
  const view = useAuthStore((state) => state.view);
  const verifyEmail = useAuthStore((state) => state.verifyEmail);
  const closeAuth = useAuthStore((state) => state.closeAuth);

  if (!view) return null;

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
        {!isLocked && (
          <button
            type="button"
            className={styles.closeButton}
            onClick={closeAuth}
            aria-label="Закрыть"
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
        )}
        {view === "login" ? (
          <AuthCard />
        ) : (
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
        )}
      </DialogContent>
    </Dialog>
  );
}
