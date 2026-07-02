import { Logo } from "@genora/ui";

import { AuthCard } from "./auth-card";
import { SupportLink } from "../support-link";
import styles from "./page.module.css";

export default function LoginPage() {
  return (
    <main className={styles.main}>
      <section className={styles.brand}>
        <div className={styles.brandGrid} aria-hidden="true" />
        <Logo className={styles.logo} />

        <div className={styles.brandBottom}>
          <h1 className={styles.headline}>Верните себе лучшие нейросети</h1>
        </div>
      </section>

      <section className={styles.formColumn}>
        <div className={styles.formInner}>
          <AuthCard />
        </div>
        <SupportLink className={styles.support} />
      </section>
    </main>
  );
}
