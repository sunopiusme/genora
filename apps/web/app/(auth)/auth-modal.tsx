"use client";

import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogTitle, Logo } from "@genora/ui";

import { SupportLink } from "./support-link";
import styles from "./auth-modal.module.css";

export function AuthModal({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Dialog open>
      <DialogContent
        className={styles.content}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogTitle className={styles.srOnly}>{title}</DialogTitle>
        <Logo className={styles.logo} />
        {children}
        <SupportLink className={styles.support} />
      </DialogContent>
    </Dialog>
  );
}
