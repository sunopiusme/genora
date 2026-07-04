"use client";

import { AssistantBar } from "@features/products";
import styles from "./composer-bar.module.css";

export function ComposerBar() {
  return (
    <div className={styles.bar}>
      <div className={styles.input}>
        <AssistantBar />
      </div>
      <p className={styles.disclaimer}>
        Для данной работы используются топовые модели, которые применяются для
        поиска, но даже они могут совершать ошибки.
      </p>
    </div>
  );
}
