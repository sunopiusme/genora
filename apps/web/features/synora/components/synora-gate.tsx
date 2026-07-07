"use client";

/**
 * Экран-заслон площадки «Синора»: показывается неавторизованным
 * пользователям вместо контента. Окно входа открывается только
 * по нажатию кнопки «Войти» — без автозапуска, чтобы экран
 * не «мигал» модальным окном при загрузке.
 * После авторизации SynoraShell отрисует полноценную оболочку.
 */

import { SynoraLogo } from "@genora/ui";
import { useAuthStore } from "@/stores/auth-store";
import styles from "./synora-gate.module.css";

export function SynoraGate() {
  const openLogin = useAuthStore((state) => state.openLogin);

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
