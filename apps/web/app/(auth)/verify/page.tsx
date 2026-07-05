import { VerifyCard } from "@features/auth";

import { BrandPanel } from "../brand-panel";
import { SupportLink } from "../support-link";
import styles from "./page.module.css";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <main className={styles.main}>
      <BrandPanel />

      <section className={styles.formColumn}>
        <div className={styles.formInner}>
          <h2 className={styles.title}>Введите код</h2>
          <p className={styles.subtitle}>
            Отправили 6‑значный код{" "}
            {email ? (
              <>
                на <span className={styles.email}>{email}</span>
              </>
            ) : (
              "на вашу почту"
            )}
            .
          </p>

          <VerifyCard />
        </div>

        <SupportLink className={styles.support} />
      </section>
    </main>
  );
}
