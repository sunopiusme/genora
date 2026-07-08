import { create } from "zustand";

import { DEFAULT_BRANCH } from "../branches/data";
import { useBranchStore } from "../branches/branch-store";
import { DEFAULT_PROJECT, findProject, findProjectByLabel } from "./data";
import type { ProjectSelection } from "./types";

/* ─────────────────────────────────────────
   Общее состояние выбранного проекта.

   Проект меняется из трёх мест:
   • picker в drawer'е композера (ProjectPicker);
   • ссылки сайдбара (?project= → syncFromQuery);
   • заголовки главной /synora читают выбор
     для поля «Название» (SynoraHeading,
     SynoraHome).

   Смена проекта автоматически переключает
   ветку на рабочую ветку проекта (та же, что
   в сайдбаре); сброс проекта возвращает
   DEFAULT_BRANCH. Так «Название» и «Ветка»
   всегда описывают один контекст.
   ───────────────────────────────────────── */

type ProjectStore = {
  selection: ProjectSelection;
  /* Был ли выбор синхронизирован с query-параметром: до этого
     заголовки используют серверное значение ?project=, чтобы
     не мигать при первом рендере. */
  hasSynced: boolean;
  setSelection: (next: ProjectSelection) => void;
  syncFromQuery: (label: string | null) => void;
};

/* Ветка следует за проектом: у проекта — его рабочая ветка,
   вне проекта — ветка по умолчанию. */
function syncBranch(selection: ProjectSelection) {
  const project =
    selection.kind === "project" ? findProject(selection.id) : undefined;
  useBranchStore.getState().setBranch(project?.branch ?? DEFAULT_BRANCH);
}

export const useProjectStore = create<ProjectStore>((set) => ({
  selection: DEFAULT_PROJECT,
  hasSynced: false,
  setSelection: (next) => {
    set({ selection: next, hasSynced: true });
    syncBranch(next);
  },
  syncFromQuery: (label) => {
    const match = label ? findProjectByLabel(label) : undefined;
    const next: ProjectSelection = match
      ? { kind: "project", id: match.id }
      : DEFAULT_PROJECT;
    set({ selection: next, hasSynced: true });
    syncBranch(next);
  },
}));
