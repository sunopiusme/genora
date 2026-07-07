import { SynoraLogo } from "@genora/ui";
import styles from "./synora-home.module.css";

/**
 * Главный экран площадки «Синора» — пустое состояние нового запроса.
 *
 * Вместо служебного заголовка «Песочница» и Dev-иконки показываем
 * фирменный знак Синоры по центру и приветственный текст в двух
 * вариантах:
 * - без проекта:  «Чем займёмся сегодня?»
 * - с проектом:   «Продолжим работу над „<название>“?»
 *
 * Название проекта приходит из query-параметра ?project= при переходе
 * из списка недавних песочниц в сайдбаре (см. synora-shell.tsx).
 */
export function SynoraHome({ projectName }: { projectName?: string }) {
  return (
    <main className={styles.page}>
      <div className={styles.hero}>
        <SynoraLogo className={styles.logo} width="4rem" height="4rem" />

        {projectName ? (
          <h1 className={styles.title}>
            Продолжим работу над{" "}
            <span className={styles.projectName}>
              &laquo;{projectName}&raquo;
            </span>
            ?
          </h1>
        ) : (
          <h1 className={styles.title}>Чем займёмся сегодня?</h1>
        )}

        <p className={styles.hint}>
          Опишите задачу внизу — Синора напишет и выполнит код в песочнице.
        </p>
      </div>
    </main>
  );
}
