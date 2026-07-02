import { ProductShowcase } from "@features/products";
import styles from "./page.module.css";

export default function DashboardPage() {
  return (
    <main id="dashboardSurface" className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <h1 className={styles.title}>Витрина</h1>
        </div>
      </header>

      <div className={styles.scroll}>
        <div className={styles.scrollInner}>
          <ProductShowcase />
        </div>
      </div>
    </main>
  );
}
