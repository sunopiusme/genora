"use client";

import { SynoraLogo } from "@genora/ui";
import { useProjectStore } from "./composer/projects/project-store";
import { findProject } from "./composer/projects/data";
import styles from "./synora-home.module.css";

/**
 * Главный экран площадки «Синора» — пустое состояние нового запроса.
 *
 * Виден только на мобильных (< 48rem): фирменный знак и приветствие
 * центрируются над нижним композером. Текст в двух вариантах:
 * - без проекта:  «Чем займёмся сегодня?»
 * - с проектом:   «Продолжим работу над <название>» — без кавычек
 *   и без вопросительного знака: это утверждение, а не вопрос.
 *
 * На планшете и десктопе герой скрыт — там показывается только
 * композер по центру экрана (см. synora-shell.module.css).
 *
 * Название читается из общего стора проекта: выбор в picker'е
 * композера и переход по ?project= из сайдбара меняют приветствие
 * синхронно. До первой синхронизации стора используется серверный
 * projectName из query-параметра — так текст не мигает при загрузке.
 */
export function SynoraHome({ projectName }: { projectName?: string }) {
  const selection = useProjectStore((state) => state.selection);
  const hasSynced = useProjectStore((state) => state.hasSynced);
  const storeName =
    selection.kind === "project" ? findProject(selection.id)?.label : undefined;
  const name = hasSynced ? storeName : projectName;

  return (
    <main className={styles.page}>
      <div className={styles.hero}>
        {/* Размер знака задаётся в CSS: на мобильных и планшетах он крупнее. */}
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
