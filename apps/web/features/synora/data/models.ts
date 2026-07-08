import type { ModelSelection, Provider, ReasoningLevel } from "../types";

const FABLE_5_LEVELS: ReasoningLevel[] = [
  { id: "low", label: "Лёгкий" },
  { id: "medium", label: "Средний" },
  { id: "high", label: "Высокий" },
  { id: "max", label: "Максимум" },
  { id: "ultracode", label: "Ультракод" },
];

export const PROVIDERS: Provider[] = [
  {
    id: "fable",
    label: "Fable",
    models: [
      {
        id: "fable-5",
        label: "Fable 5",
        levels: FABLE_5_LEVELS,
        defaultLevelId: "high",
      },
    ],
  },
];

export const DEFAULT_SELECTION: ModelSelection = {
  providerId: "fable",
  modelId: "fable-5",
  levelId: "high",
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
