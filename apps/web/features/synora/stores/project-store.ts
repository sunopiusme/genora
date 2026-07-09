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

export function selectionFromQuery(label: string | null): ProjectSelection {
  const match = label ? findProjectByLabel(label) : undefined;
  return match ? { kind: "project", id: match.id } : DEFAULT_PROJECT;
}

export function branchForSelection(selection: ProjectSelection): string {
  const project =
    selection.kind === "project" ? findProject(selection.id) : undefined;
  return project?.branch ?? DEFAULT_BRANCH;
}

function syncBranch(selection: ProjectSelection) {
  useBranchStore.getState().setBranch(branchForSelection(selection));
}

export const useProjectStore = create<ProjectStore>((set) => ({
  selection: DEFAULT_PROJECT,
  hasSynced: false,
  setSelection: (next) => {
    set({ selection: next, hasSynced: true });
    syncBranch(next);
  },
  syncFromQuery: (label) => {
    const next = selectionFromQuery(label);
    set({ selection: next, hasSynced: true });
    syncBranch(next);
  },
}));
