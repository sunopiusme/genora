import { Logo } from "@genora/ui";

import { AuthCard } from "./auth-card";
import { SupportLink } from "../support-link";
import styles from "./page.module.css";

export default function LoginPage() {
  return (
    <main className={styles.main}>
      <div className={styles.grid}>
        <section className={styles.hero}>
          <Logo className={styles.logo} />

          <p className={styles.tagline}>
            Claude, ChatGPT и Cursor под одним аккаунтом. Оплата в рублях, без
            карты и VPN.
          </p>
        </section>

        <section className={styles.formColumn}>
          <div className={styles.formInner}>
            <div className={styles.card}>
              <AuthCard />
            </div>
            <SupportLink className={styles.support} />
          </div>
        </section>
      </div>
    </main>
  );
}
