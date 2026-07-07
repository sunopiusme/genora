/* ─────────────────────────────────────────
   Типы для @-mention popover.

   Item — единица в списке. Кроме id, label
   и описания у неё есть kind, по которому
   рендерер выбирает иконку и группу:
     "plugin" — карточка интеграции с цветной
                эмблемой (GitHub, Linear, …);
     "file"   — путь файла из фейк-индекса.
   ───────────────────────────────────────── */

export type MentionKind = "plugin" | "file";

export type PluginId =
  | "github"
  | "linear"
  | "figma"
  | "notion"
  | "slack";

export type MentionItem =
  | {
      kind: "plugin";
      id: PluginId;
      label: string;
      description: string;
      keywords: string[];
    }
  | {
      kind: "file";
      id: string;
      label: string;
      description: string;
      keywords: string[];
    };

export type MentionGroup = {
  title: string;
  kind: MentionKind;
  items: MentionItem[];
};
