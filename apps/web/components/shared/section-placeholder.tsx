import { Icon } from "@/lib/icon";
import { PageHeader } from "./page-header";
import styles from "./section-placeholder.module.css";

type SectionPlaceholderProps = {
  title: string;
  icon: string;
  emptyTitle: string;
  description: string;
};

export function SectionPlaceholder({
  title,
  icon,
  emptyTitle,
  description,
}: SectionPlaceholderProps) {
  return (
    <main className={styles.page}>
      <PageHeader title={title} />

      <div className={styles.emptyState}>
        <Icon icon={icon} className={styles.emptyIcon} aria-hidden="true" />
        <h2 className={styles.emptyTitle}>{emptyTitle}</h2>
        <p className={styles.emptyText}>{description}</p>
      </div>
    </main>
  );
}
