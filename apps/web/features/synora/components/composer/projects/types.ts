/* ─────────────────────────────────────────
   Типы для project picker.

   Project — рабочий контекст composer'а.
   Источник scope-а команд, вложений, истории.
   None означает «не работать в проекте».
   ───────────────────────────────────────── */

export type ProjectKind = "workspace" | "project";

export type Project = {
  id: string;
  label: string;
  kind: ProjectKind;
  /* Ветка GitHub проекта — та же, что показана в сайдбаре.
     У workspace-записей ветки нет. */
  branch?: string;
};

export type ProjectSelection =
  | { kind: "project"; id: string }
  | { kind: "none" };
