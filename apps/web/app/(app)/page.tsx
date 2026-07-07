import { ProductShowcase, ShowcaseActions } from "@features/products";
import { PageHeader } from "@/components/shared/page-header";
import { PageScrollArea } from "@/components/shared/page-scroll-area";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main id="showcaseSurface" className={styles.page}>
      <PageHeader title="Витрина" trailing={<ShowcaseActions />} />

      <PageScrollArea className={styles.scroll}>
        <div className={styles.scrollInner}>
          <ProductShowcase />
        </div>
      </PageScrollArea>
    </main>
  );
}
