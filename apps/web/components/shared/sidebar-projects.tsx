"use client";

/**
 * Список проектов сайдбара — общий для Genora и «Синоры».
 *
 * Работа идёт через GitHub без локального репозитория, поэтому
 * проект помечен иконкой ветки, а под ним — чаты этой ветки.
 * При наведении на строку проекта появляется шеврон: клик
 * сворачивает/разворачивает список чатов проекта.
 */

import { useState } from "react";
import Link from "next/link";
import { cn } from "@genora/ui";
import { Icon } from "@/lib/icon";
import styles from "./app-shell.module.css";

export type SidebarProject = {
  name: string;
  chats: string[];
};

type SidebarProjectsProps = {
  projects: SidebarProject[];
  /* Куда ведёт чат проекта — у Genora и «Синоры» свои маршруты. */
  chatHref: (project: SidebarProject, chat: string) => string;
};

export function SidebarProjects({ projects, chatHref }: SidebarProjectsProps) {
  /* Свёрнутые проекты; по умолчанию все развёрнуты. */
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (name: string) =>
    setCollapsed((prev) => ({ ...prev, [name]: !prev[name] }));

  return (
    <>
      {projects.map((project) => {
        const isCollapsed = Boolean(collapsed[project.name]);
        return (
          <div key={project.name} className={styles.subsection}>
            <button
              type="button"
              className={styles.projectRow}
              onClick={() => toggle(project.name)}
              aria-expanded={!isCollapsed}
              title={
                isCollapsed
                  ? "Показать чаты проекта"
                  : "Скрыть чаты проекта"
              }
            >
              <Icon
                icon="solar:branch-linear"
                className={styles.projectIcon}
                aria-hidden="true"
              />
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
