import { SYNORA_PROJECT_GROUPS } from "./recent-sandboxes";

const BASE_BRANCHES = ["main", "develop"];

export const BRANCHES: string[] = [
  ...BASE_BRANCHES,
  ...SYNORA_PROJECT_GROUPS.map((group) => group.branch),
];

export const DEFAULT_BRANCH = "main";
