"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@genora/ui";
import { Icon } from "@/lib/icon";
import styles from "./app-shell.module.css";

export type SidebarProject = {
  name: string;
  branch: string;
  chats: string[];
};

type SidebarProjectsProps = {
  projects: SidebarProject[];
  chatHref: (project: SidebarProject, chat: string) => string;
  newChatHref: (project: SidebarProject) => string;
};

export function SidebarProjects({
  projects,
  chatHref,
  newChatHref,
}: SidebarProjectsProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (name: string) =>
    setCollapsed((prev) => ({ ...prev, [name]: !prev[name] }));

  return (
    <>
      <p className={styles.sectionTitle}>Проекты</p>
      {projects.map((project) => {
        const isCollapsed = Boolean(collapsed[project.name]);
        return (
          <div key={project.name} className={styles.subsection}>
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
                  icon="solar:branch-linear"
                  className={styles.projectIcon}
                  aria-hidden="true"
                />
                <span className={styles.projectName}>{project.name}</span>
                <span
                  className={styles.projectBranch}
                  title={`Ветка ${project.branch}`}
                >
                  {project.branch}
                </span>
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
