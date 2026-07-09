"use client";

import { SynoraLogo } from "@genora/ui";
import styles from "./synora-home.module.css";

export function SynoraHome() {
  return (
    <main className={styles.page}>
      <div className={styles.hero}>
        <SynoraLogo className={styles.logo} width="100%" height="100%" />
        <h1 className={styles.srOnly}>Синора</h1>
      </div>
    </main>
  );
}
