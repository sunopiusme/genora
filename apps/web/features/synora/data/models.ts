import type { ModelSelection, Provider, ReasoningLevel } from "../types";

const FABLE_5_LEVELS: ReasoningLevel[] = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
  { id: "max", label: "Max" },
  { id: "ultracode", label: "Ultracode" },
];

const SONNET_45_LEVELS: ReasoningLevel[] = [
  { id: "standard", label: "Standard" },
  { id: "thinking", label: "Thinking" },
];

export const PROVIDERS: Provider[] = [
  {
    id: "anthropic",
    label: "Anthropic",
    models: [
      {
        id: "fable-5",
        label: "Fable 5",
        levels: FABLE_5_LEVELS,
        defaultLevelId: "high",
      },
      {
        id: "claude-sonnet-4-5",
        label: "Sonnet 4.5",
        levels: SONNET_45_LEVELS,
        defaultLevelId: "standard",
      },
    ],
  },
];

export const DEFAULT_SELECTION: ModelSelection = {
  providerId: "anthropic",
  modelId: "claude-sonnet-4-5",
  levelId: "standard",
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
