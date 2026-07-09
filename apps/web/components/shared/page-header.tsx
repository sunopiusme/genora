import type { ReactNode } from "react";
import styles from "./page-header.module.css";

type PageHeaderProps = {
  title?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
};

/**
 * Единая шапка страниц приложения: одна геометрия, один размер
 * заголовка и одно затемнение на всех вкладках — при переключении
 * между разделами ничего не смещается.
 */
export function PageHeader({ title, leading, trailing }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {leading ? <div className={styles.leading}>{leading}</div> : null}
        {title ? <h1 className={styles.title}>{title}</h1> : null}
        {trailing ? <div className={styles.trailing}>{trailing}</div> : null}
      </div>
    </header>
  );
}
