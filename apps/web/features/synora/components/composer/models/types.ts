/* ─────────────────────────────────────────
   Типы для model picker.

   Единственный провайдер — Fable, единственная
   модель — Fable 5. Уровни reasoning упорядочены
   от слабого к сильному и выбираются ползунком
   (по паттерну tier-slider из products): позиция
   на треке = индекс уровня. Selection хранит
   модель и активный уровень.
   ───────────────────────────────────────── */

export type ProviderId = "fable";

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
