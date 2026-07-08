import { create } from "zustand";

import { DEFAULT_BRANCH } from "../data/branches";
import { useBranchStore } from "./branch-store";
import {
  DEFAULT_PROJECT,
  findProject,
  findProjectByLabel,
} from "../data/projects";
import type { ProjectSelection } from "../types";

type ProjectStore = {
  selection: ProjectSelection;
  hasSynced: boolean;
  setSelection: (next: ProjectSelection) => void;
  syncFromQuery: (label: string | null) => void;
};

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
