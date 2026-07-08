"use client";

/**
 * Список проектов сайдбара — общий для Genora и «Синоры».
 *
 * Заголовок папки — название проекта; под ним подписью — рабочая
 * ветка GitHub (работа идёт без локального репозитория), ниже —
 * чаты этой ветки. При наведении на строку проекта появляется
 * шеврон: клик сворачивает/разворачивает список чатов.
 */

import { useState } from "react";
import Link from "next/link";
import { cn } from "@genora/ui";
import { Icon } from "@/lib/icon";
import styles from "./app-shell.module.css";

export type SidebarProject = {
  name: string;
  /* Ветка GitHub, в которой ведётся работа над проектом. */
  branch: string;
  chats: string[];
};

type SidebarProjectsProps = {
  projects: SidebarProject[];
  /* Куда ведёт чат проекта — у Genora и «Синоры» свои маршруты. */
  chatHref: (project: SidebarProject, chat: string) => string;
  /* Новый чат в контексте проекта: открывает окно площадки
     с уже выбранным контекстом соответствующего проекта. */
  newChatHref: (project: SidebarProject) => string;
};

export function SidebarProjects({
  projects,
  chatHref,
  newChatHref,
}: SidebarProjectsProps) {
  /* Свёрнутые проекты; по умолчанию все развёрнуты. */
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (name: string) =>
    setCollapsed((prev) => ({ ...prev, [name]: !prev[name] }));

  return (
    <>
      {/* Заголовок секции — как у остальных секций сайдбара. */}
      <p className={styles.sectionTitle}>Проекты</p>
      {projects.map((project) => {
        const isCollapsed = Boolean(collapsed[project.name]);
        return (
          <div key={project.name} className={styles.subsection}>
            {/* Строка проекта: слева — кнопка сворачивания (иконка
                ветки + название + шеврон), справа — «Новый чат»,
                появляющийся при наведении на строку. */}
            <div className={styles.projectRow}>
              <button
                type="button"
                className={styles.projectToggle}
                onClick={() => toggle(project.name)}
                aria-expanded={!isCollapsed}
                title={
                  isCollapsed
                    ? "Показать чаты проекта"
                    : "Скрыть чаты проекта"
                }
              >
                <Icon
                  icon="solar:folder-linear"
                  className={styles.projectIcon}
                  aria-hidden="true"
                />
                {/* Заголовок папки — название проекта; рабочая ветка
                    показана подписью под ним. */}
                <span className={styles.projectName}>{project.name}</span>
                {/* Шеврон виден при наведении; у свёрнутого проекта —
                    всегда, как напоминание о скрытых чатах. */}
                <Icon
                  icon="solar:alt-arrow-down-linear"
                  className={cn(
                    styles.projectChevron,
                    isCollapsed && styles.projectChevronCollapsed,
                  )}
                  aria-hidden="true"
                />
              </button>
              <Link
                href={newChatHref(project)}
                className={styles.projectNewChat}
                title={`Новый чат в проекте «${project.name}»`}
              >
                <Icon
                  icon="solar:plus-linear"
                  className={styles.projectNewChatIcon}
                  aria-hidden="true"
                />
                Новый чат
              </Link>
            </div>
            {/* Рабочая ветка GitHub — вторичная подпись под названием:
                работа идёт без локального репозитория, ветка и есть
                рабочий контекст проекта. */}
            <p
              className={styles.projectCaption}
              title={`Ветка ${project.branch}`}
            >
              <Icon
                icon="solar:branch-linear"
                className={styles.projectCaptionIcon}
                aria-hidden="true"
              />
              {project.branch}
            </p>
            {!isCollapsed && (
              <nav className={styles.recents}>
                {project.chats.map((chat) => (
                  <Link
                    key={chat}
                    href={chatHref(project, chat)}
                    className={cn(styles.recentLink, styles.recentLinkNested)}
                  >
                    {chat}
                  </Link>
                ))}
              </nav>
            )}
          </div>
        );
      })}
    </>
  );
}
