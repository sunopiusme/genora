import { ProductShowcase } from "@features/products";
import { DashboardShell } from "@components/shared/dashboard-shell";

import styles from "./auth-backdrop.module.css";

export function AuthBackdrop() {
  return (
    <div className={styles.root} inert aria-hidden="true">
      <DashboardShell>
        <div className={styles.surface}>
          <header className={styles.header}>
            <h2 className={styles.title}>Витрина</h2>
          </header>
          <div className={styles.content}>
            <ProductShowcase />
          </div>
        </div>
      </DashboardShell>
    </div>
  );
}
