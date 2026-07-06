"use client";

import { Dialog, DialogContent, DialogTitle, Logo } from "@genora/ui";
import { useAuthStore } from "@/stores/auth-store";

import { AuthCard } from "./auth-card";
import { VerifyCard } from "./verify-card";
import { SupportLink } from "./support-link";
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
        <Logo className={styles.logo} />
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
        <SupportLink className={styles.support} />
      </DialogContent>
    </Dialog>
  );
}
