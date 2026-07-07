/* ─────────────────────────────────────────
   Типы для environment picker.

   EnvironmentMode — где запустится агент:
     local    — локально на машине,
     worktree — новый git-worktree,
     cloud    — облачное окружение (disabled).
   ───────────────────────────────────────── */

export type EnvironmentMode = "local" | "worktree" | "cloud";
