import { SYNORA_PROJECT_GROUPS } from "../../../recent-sandboxes";
import type { Project, ProjectSelection } from "./types";

/* ─────────────────────────────────────────
   Каталог проектов composer'а Синоры.

   Единый источник данных — SYNORA_PROJECT_GROUPS
   (recent-sandboxes.ts): те же проекты и ветки,
   что и в сайдбаре. Список picker'а строится из
   него, поэтому сайдбар, поле «Название» и
   раздел «Ветка» всегда синхронны.

   id проекта — его ветка GitHub: она уникальна
   и стабильна (работа идёт через GitHub без
   локального репозитория).
   ───────────────────────────────────────── */

export const PROJECTS: Project[] = [
  { id: "workspaces", label: "Песочницы", kind: "workspace" },
  ...SYNORA_PROJECT_GROUPS.map(
    (group): Project => ({
      id: group.branch,
      label: group.name,
      kind: "project",
      branch: group.branch,
    }),
  ),
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
