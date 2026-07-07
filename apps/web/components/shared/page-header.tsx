import type { ReactNode } from "react";
import styles from "./page-header.module.css";

type PageHeaderProps = {
  title: string;
  trailing?: ReactNode;
};

/**
 * Единая шапка страниц приложения: одна геометрия, один размер
 * заголовка и одно затемнение на всех вкладках — при переключении
 * между разделами ничего не смещается.
 */
export function PageHeader({ title, trailing }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <h1 className={styles.title}>{title}</h1>
        {trailing ? <div className={styles.trailing}>{trailing}</div> : null}
      </div>
    </header>
  );
}
