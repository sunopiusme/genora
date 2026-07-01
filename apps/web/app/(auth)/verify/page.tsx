import { Logo } from "@genora/ui";

import { VerifyCard } from "./verify-card";
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
      <div className={styles.content}>
        <div className={styles.inner}>
          <Logo className={styles.brand} />

          <h1 className={styles.title}>Введите код</h1>
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
      </div>

      <SupportLink className={styles.support} />
    </main>
  );
}
