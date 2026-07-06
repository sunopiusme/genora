"use client";

import { Glass } from "@samasante/liquid-glass";
import { AssistantBar } from "@features/products";
import styles from "./composer-bar.module.css";

const GLASS_OPTICS = {
  depth: 0.3,
  curvature: 0.18,
  bend: 0.7,
  dispersion: 0.25,
  frost: 1.5,
  saturate: 1.4,
  brightness: 0.06,
  specular: 1,
  sheen: 1,
  glow: 0.4,
};

export function ComposerBar() {
  return (
    <div className={styles.bar}>
      <div className={styles.input}>
        <Glass className={styles.glass} optics={GLASS_OPTICS}>
          <AssistantBar />
        </Glass>
      </div>
      <p className={styles.disclaimer}>Даже топовые модели могут ошибаться.</p>
    </div>
  );
}
