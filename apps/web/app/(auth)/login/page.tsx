import { AuthCard } from "@features/auth";

import { BrandPanel } from "../brand-panel";
import { SupportLink } from "../support-link";
import styles from "./page.module.css";

export default function LoginPage() {
  return (
    <main className={styles.main}>
      <BrandPanel />

      <section className={styles.formColumn}>
        <div className={styles.formInner}>
          <AuthCard />
        </div>
        <SupportLink className={styles.support} />
      </section>
    </main>
  );
}
