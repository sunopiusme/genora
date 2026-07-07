/* ─────────────────────────────────────────
   Типы для model picker.

   Provider — agentic-инструмент (Claude Code,
   Codex). Внутри каждого — несколько моделей,
   и у каждой модели свой набор уровней
   reasoning. У Claude старшие модели (opus,
   sonnet) умеют max, opus 4.8 — единственный
   с ultracode. У Codex верхний уровень — xHigh.
   Selection хранит обе вершины: какую модель
   выбрали и на каком уровне reasoning.
   ───────────────────────────────────────── */

export type ProviderId = "claude-code" | "codex";

export type ReasoningLevel = {
  id: string;
  label: string;
};

export type ModelEntry = {
  id: string;
  label: string;
  levels: ReasoningLevel[];
  defaultLevelId: string;
};

export type Provider = {
  id: ProviderId;
  label: string;
  models: ModelEntry[];
};

export type ModelSelection = {
  providerId: ProviderId;
  modelId: string;
  levelId: string;
};
