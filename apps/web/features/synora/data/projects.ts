import { SYNORA_PROJECT_GROUPS } from "./recent-sandboxes";
import type { Project, ProjectSelection } from "../types";

export const PROJECTS: Project[] = [
  { id: "workspaces", label: "Все проекты", kind: "workspace" },
  ...SYNORA_PROJECT_GROUPS.map(
    (group): Project => ({
      id: group.branch,
      label: group.name,
      kind: "project",
      branch: group.branch,
    }),
  ),
];

export const DEFAULT_PROJECT: ProjectSelection = { kind: "none" };

export function findProject(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}

export function findProjectByLabel(label: string): Project | undefined {
  return PROJECTS.find((p) => p.label === label);
}
