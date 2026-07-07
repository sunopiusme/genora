import type { Project, ProjectSelection } from "./types";

/* ─────────────────────────────────────────
   Каталог проектов composer'а Синоры.

   Список зеркалит недавние песочницы из
   сайдбара (recent-sandboxes.ts): выбор
   проекта здесь и переход по ссылке из
   сайдбара ведут к одному и тому же
   контексту.
   ───────────────────────────────────────── */

export const PROJECTS: Project[] = [
  { id: "workspaces", label: "Песочницы", kind: "workspace" },
  { id: "csv-parser", label: "Парсер CSV на TypeScript", kind: "project" },
  { id: "sortable-table", label: "Компонент таблицы с сортировкой", kind: "project" },
  { id: "express-api", label: "REST API на Express", kind: "project" },
  { id: "db-migration", label: "Скрипт миграции базы данных", kind: "project" },
  { id: "css-loader", label: "Анимация загрузчика на CSS", kind: "project" },
];

/* По умолчанию проект не выбран: новый запрос начинается
   вне контекста. Проект появляется при переходе из списка
   недавних песочниц (?project=) или выборе в самом picker'е. */
export const DEFAULT_PROJECT: ProjectSelection = { kind: "none" };

export function findProject(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}

/* Поиск по человекочитаемому названию — им оперируют
   ссылки недавних песочниц в сайдбаре. */
export function findProjectByLabel(label: string): Project | undefined {
  return PROJECTS.find((p) => p.label === label);
}
