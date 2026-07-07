import type { Project, ProjectSelection } from "./types";

/* ─────────────────────────────────────────
   Каталог проектов composer'а.

   Workspaces — корневая папка с проектами,
   ниже идут конкретные проекты.
   ───────────────────────────────────────── */

export const PROJECTS: Project[] = [
  { id: "workspaces", label: "Workspaces", kind: "workspace" },
  { id: "skitime-resume", label: "skitime-resume", kind: "project" },
  { id: "zenpulse", label: "ZenPulse", kind: "project" },
  { id: "horizon-sprint", label: "horizon-sprint", kind: "workspace" },
  { id: "cmux", label: "cmux", kind: "project" },
];

export const DEFAULT_PROJECT: ProjectSelection = {
  kind: "project",
  id: "skitime-resume",
};

export function findProject(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}
