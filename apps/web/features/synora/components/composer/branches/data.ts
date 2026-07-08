import { SYNORA_PROJECT_GROUPS } from "../../../recent-sandboxes";

/* ─────────────────────────────────────────
   Реестр веток репозитория.

   Единый источник с сайдбаром: помимо базовых
   main/develop список содержит рабочие ветки
   всех проектов из SYNORA_PROJECT_GROUPS
   (recent-sandboxes.ts). Новый проект в
   сайдбаре автоматически появляется и здесь.
   ───────────────────────────────────────── */

const BASE_BRANCHES = ["main", "develop"];

export const BRANCHES: string[] = [
  ...BASE_BRANCHES,
  ...SYNORA_PROJECT_GROUPS.map((group) => group.branch),
];

export const DEFAULT_BRANCH = "main";
