"use client";

import { SynoraLogo } from "@genora/ui";
import styles from "./synora-home.module.css";
import { findProject } from "../data/projects";
import { useProjectStore } from "../stores/project-store";

export function SynoraHome({ projectName }: { projectName?: string }) {
  const selection = useProjectStore((state) => state.selection);
  const hasSynced = useProjectStore((state) => state.hasSynced);
  const storeName =
    selection.kind === "project" ? findProject(selection.id)?.label : undefined;
  const name = hasSynced ? storeName : projectName;

  return (
    <main className={styles.page}>
      <div className={styles.hero}>
        <SynoraLogo className={styles.logo} width="100%" height="100%" />

        {name ? (
          <h1 className={styles.title}>
            Продолжим работу над{" "}
            <span className={styles.projectName}>{name}</span>
          </h1>
        ) : (
          <h1 className={styles.title}>Чем займёмся сегодня?</h1>
        )}
      </div>
    </main>
  );
}
