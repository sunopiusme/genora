import { VerifyCard } from "@features/auth";

import { AuthBackdrop } from "../auth-backdrop";
import { AuthModal } from "../auth-modal";
import styles from "./page.module.css";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <main>
      <AuthBackdrop />
      <AuthModal title="Подтверждение почты">
        <div className={styles.inner}>
          <h2 className={styles.title}>Введите код</h2>
          <p className={styles.subtitle}>
            Отправили 6&#8209;значный код{" "}
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
      </AuthModal>
    </main>
  );
}
