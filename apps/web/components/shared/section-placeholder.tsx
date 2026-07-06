import { Icon } from "@/lib/icon";
import styles from "./section-placeholder.module.css";

type SectionPlaceholderProps = {
  title: string;
  icon: string;
  description: string;
};

export function SectionPlaceholder({
  title,
  icon,
  description,
}: SectionPlaceholderProps) {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <h1 className={styles.title}>{title}</h1>
        </div>
      </header>

      <div className={styles.emptyState}>
        <Icon icon={icon} className={styles.emptyIcon} aria-hidden="true" />
        <h2 className={styles.emptyTitle}>Здесь пока пусто</h2>
        <p className={styles.emptyText}>{description}</p>
      </div>
    </main>
  );
}
