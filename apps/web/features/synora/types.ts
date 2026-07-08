export type AttachmentKind = "image" | "audio";

export type Attachment = {
  id: string;
  kind: AttachmentKind;
  file: File;
  previewUrl?: string;
  name: string;
  size: number;
};

export type EnvironmentMode = "local" | "worktree" | "cloud";

export type MentionKind = "plugin" | "file";

export type PluginId = "github" | "linear" | "figma" | "notion" | "slack";

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

export type PermissionLevel = "standard" | "review" | "full";

export type VoiceStage = "idle" | "recording" | "processing";

export type ProjectKind = "workspace" | "project";

export type Project = {
  id: string;
  label: string;
  kind: ProjectKind;
  branch?: string;
};

export type ProjectSelection =
  | { kind: "project"; id: string }
  | { kind: "none" };

export type ProjectGroup = {
  name: string;
  branch: string;
  chats: string[];
};
