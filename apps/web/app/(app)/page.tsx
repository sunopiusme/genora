import {
  ProductShowcase,
  ShowcaseActions,
  ShowcaseFilter,
} from "@features/products";
import { PageScrollArea } from "@/components/shared/page-scroll-area";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main id="showcaseSurface" className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <h1 className={styles.title}>Витрина</h1>
          <div className={styles.headerLeading}>
            <ShowcaseFilter />
          </div>
          <div className={styles.headerTrailing}>
            <ShowcaseActions />
          </div>
        </div>
      </header>

      <PageScrollArea className={styles.scroll}>
        <div className={styles.scrollInner}>
          <ProductShowcase />
        </div>
      </PageScrollArea>
    </main>
  );
}
