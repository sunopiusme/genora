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
  { id: "genora-web", label: "Веб-приложение Genora", kind: "project" },
  { id: "synora-composer", label: "Composer Синоры", kind: "project" },
  { id: "products-showcase", label: "Витрина продуктов", kind: "project" },
  { id: "ui-kit", label: "UI-кит @genora/ui", kind: "project" },
  { id: "e2e-tests", label: "E2E-тесты интерфейса", kind: "project" },
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
