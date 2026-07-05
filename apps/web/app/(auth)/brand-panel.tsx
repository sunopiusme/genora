import { Logo } from "@genora/ui";

import styles from "./brand-panel.module.css";

export function BrandPanel() {
  return (
    <section className={styles.brand}>
      <Logo className={styles.logo} />

      <div className={styles.brandBottom}>
        <h1 className={styles.headline}>
          Подписки на ChatGPT, Claude и Midjourney
        </h1>
        <p className={styles.tagline}>
          Оплачивайте российской картой и получайте доступ на свой аккаунт за
          несколько минут.
        </p>
      </div>
    </section>
  );
}
