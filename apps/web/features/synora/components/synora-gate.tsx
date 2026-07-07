"use client";

/**
 * Экран-заслон площадки «Синора»: показывается неавторизованным
 * пользователям вместо контента и сразу открывает окно входа.
 * После авторизации SynoraShell отрисует полноценную оболочку.
 */

import { useEffect } from "react";
import { SynoraLogo } from "@genora/ui";
import { useAuthStore } from "@/stores/auth-store";
import styles from "./synora-gate.module.css";

export function SynoraGate() {
  const openLogin = useAuthStore((state) => state.openLogin);
  const view = useAuthStore((state) => state.view);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    if (hasHydrated && !view) {
      openLogin();
    }
    // Открываем форму один раз после гидрации; если пользователь закрыл
    // окно, он может открыть его снова кнопкой ниже.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]);

  return (
    <main className={styles.gate}>
      <SynoraLogo width="3rem" height="3rem" className={styles.logo} />
      <h1 className={styles.title}>Синора</h1>
      <p className={styles.text}>
        Песочница для написания кода. Войдите, чтобы продолжить.
      </p>
      <button type="button" className={styles.button} onClick={openLogin}>
        Войти
      </button>
    </main>
  );
}
