"use client";

import { Glass } from "@samasante/liquid-glass";
import { AssistantBar } from "@features/products";
import styles from "./composer-bar.module.css";

const GLASS_OPTICS = {
  depth: 0.3,
  curvature: 0.18,
  bend: 0.7,
  dispersion: 0.2,
  frost: 0,
  saturate: 1,
  brightness: 0,
  specular: 0.15,
  sheen: 0,
  glow: 0,
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
