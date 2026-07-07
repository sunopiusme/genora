import type { ModelSelection, Provider, ReasoningLevel } from "./types";

/* ─────────────────────────────────────────
   Реестр уровней reasoning. Задаются на
   уровне модели, потому что набор зависит
   от того, насколько она «большая»:
     Opus 4.8     — Low / Medium / High / Max / Ultracode
     Opus 4.7/4.6 — Low / Medium / High / Max
     Sonnet 4.6   — Low / Medium / High / Max
     Haiku 4.6    — Low / Medium / High
     Все GPT      — Low / Medium / High / xHigh

   Ultracode — привилегия только Opus 4.8.
   xHigh — верхний уровень для семейства Codex.
   ───────────────────────────────────────── */

const CLAUDE_OPUS_4_8_LEVELS: ReasoningLevel[] = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
  { id: "max", label: "Max" },
  { id: "ultracode", label: "Ultracode" },
];

const CLAUDE_REASONING_LEVELS: ReasoningLevel[] = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
  { id: "max", label: "Max" },
];

const CLAUDE_LIGHT_LEVELS: ReasoningLevel[] = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
];

const CODEX_LEVELS: ReasoningLevel[] = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
  { id: "xhigh", label: "xHigh" },
];

export const PROVIDERS: Provider[] = [
  {
    id: "claude-code",
    label: "Claude Code",
    models: [
      {
        id: "opus-4.8",
        label: "Opus 4.8",
        levels: CLAUDE_OPUS_4_8_LEVELS,
        defaultLevelId: "high",
      },
      {
        id: "opus-4.7",
        label: "Opus 4.7",
        levels: CLAUDE_REASONING_LEVELS,
        defaultLevelId: "high",
      },
      {
        id: "opus-4.6",
        label: "Opus 4.6",
        levels: CLAUDE_REASONING_LEVELS,
        defaultLevelId: "high",
      },
      {
        id: "sonnet-4.6",
        label: "Sonnet 4.6",
        levels: CLAUDE_REASONING_LEVELS,
        defaultLevelId: "high",
      },
      {
        id: "haiku-4.6",
        label: "Haiku 4.6",
        levels: CLAUDE_LIGHT_LEVELS,
        defaultLevelId: "high",
      },
    ],
  },
  {
    id: "codex",
    label: "Codex",
    models: [
      {
        id: "gpt-5.5",
        label: "GPT 5.5",
        levels: CODEX_LEVELS,
        defaultLevelId: "high",
      },
      {
        id: "gpt-5.4",
        label: "GPT 5.4",
        levels: CODEX_LEVELS,
        defaultLevelId: "high",
      },
      {
        id: "gpt-5.4-mini",
        label: "GPT 5.4-Mini",
        levels: CODEX_LEVELS,
        defaultLevelId: "high",
      },
      {
        id: "gpt-5.3-codex",
        label: "GPT 5.3-Codex",
        levels: CODEX_LEVELS,
        defaultLevelId: "high",
      },
      {
        id: "gpt-5.2",
        label: "GPT 5.2",
        levels: CODEX_LEVELS,
        defaultLevelId: "high",
      },
    ],
  },
];

export const DEFAULT_SELECTION: ModelSelection = {
  providerId: "claude-code",
  modelId: "opus-4.8",
  levelId: "ultracode",
};

export function findProvider(id: string): Provider | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

export function findModel(selection: ModelSelection) {
  const provider = findProvider(selection.providerId);
  if (!provider) return null;
  const model = provider.models.find((m) => m.id === selection.modelId);
  if (!model) return null;
  const level =
    model.levels.find((l) => l.id === selection.levelId) ??
    model.levels.find((l) => l.id === model.defaultLevelId) ??
    null;
  return { provider, model, level };
}
