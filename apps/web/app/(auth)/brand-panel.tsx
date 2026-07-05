import { Logo } from "@genora/ui";

import styles from "./brand-panel.module.css";

export function BrandPanel() {
  return (
    <section className={styles.brand}>
      <Logo className={styles.logo} />

      <div className={styles.brandBottom}>
        <h1 className={styles.headline}>ChatGPT, Claude и Midjourney в рублях</h1>
        <p className={styles.tagline}>
          Оплата картой российского банка. Подписка работает на вашем личном
          аккаунте.
        </p>
      </div>
    </section>
  );
}
