import type { MentionItem } from "./types";

/* ─────────────────────────────────────────
   Плагины — наша персональная подборка
   (не копия Codex):
     GitHub  — PR-ы и CI;
     Linear  — задачи и спринты;
     Figma   — дизайн-исходники;
     Notion  — спецификации и заметки;
     Slack   — обсуждения команды.

   keywords нужны для поиска: при наборе @gh
   или @figma фильтруем здесь же без regex.
   ───────────────────────────────────────── */

export const PLUGINS: MentionItem[] = [
  {
    kind: "plugin",
    id: "github",
    label: "GitHub",
    description: "PR-ы, issues, CI и релизы",
    keywords: ["github", "git", "pr", "issue", "ci"],
  },
  {
    kind: "plugin",
    id: "linear",
    label: "Linear",
    description: "Задачи, спринты, циклы команды",
    keywords: ["linear", "task", "sprint", "issue"],
  },
  {
    kind: "plugin",
    id: "figma",
    label: "Figma",
    description: "Дизайн-исходники и компоненты",
    keywords: ["figma", "design", "ui", "frame"],
  },
  {
    kind: "plugin",
    id: "notion",
    label: "Notion",
    description: "Спецификации, заметки, базы знаний",
    keywords: ["notion", "docs", "wiki", "spec"],
  },
  {
    kind: "plugin",
    id: "slack",
    label: "Slack",
    description: "Каналы и треды команды",
    keywords: ["slack", "chat", "thread"],
  },
];

/* ─────────────────────────────────────────
   Файлы — псевдо-индекс проекта skitime-resume.
   Достаточно представительный, чтобы поиск
   по первым буквам показывал нечто осмысленное:
   набираем @comp → все ComposerInput-файлы,
   набираем @sidebar → ProjectSidebar,
   набираем @think → ThinkingModel и его таймлайн.
   ───────────────────────────────────────── */

export const PROJECT_FILES: MentionItem[] = [
  {
    kind: "file",
    id: "composer-input-tsx",
    label: "ComposerInput.tsx",
    description: "src/features/projects/composer/live/composer-input",
    keywords: ["composer", "input", "prompt", "tsx"],
  },
  {
    kind: "file",
    id: "composer-input-css",
    label: "ComposerInput.module.css",
    description: "src/features/projects/composer/live/composer-input",
    keywords: ["composer", "input", "css", "styles"],
  },
  {
    kind: "file",
    id: "thinking-model-tsx",
    label: "ThinkingModel.tsx",
    description: "src/features/projects/composer/live/thinking-model",
    keywords: ["thinking", "model", "trace"],
  },
  {
    kind: "file",
    id: "use-thinking-timeline",
    label: "useThinkingTimeline.ts",
    description: "src/features/projects/composer/live/thinking-model",
    keywords: ["thinking", "timeline", "hook", "use"],
  },
  {
    kind: "file",
    id: "project-sidebar-tsx",
    label: "ProjectSidebar.tsx",
    description: "src/features/projects/composer/live/project-sidebar",
    keywords: ["sidebar", "project", "session", "archive"],
  },
  {
    kind: "file",
    id: "project-sidebar-css",
    label: "ProjectSidebar.module.css",
    description: "src/features/projects/composer/live/project-sidebar",
    keywords: ["sidebar", "project", "session", "css"],
  },
  {
    kind: "file",
    id: "code-block-tsx",
    label: "CodeBlock.tsx",
    description: "src/features/projects/composer/parts",
    keywords: ["code", "block", "snippet", "diff"],
  },
  {
    kind: "file",
    id: "highlight-ts",
    label: "highlight.ts",
    description: "src/lib/code",
    keywords: ["highlight", "shiki", "lib", "code"],
  },
  {
    kind: "file",
    id: "case-tsx",
    label: "case.tsx",
    description: "src/content/projects/composer",
    keywords: ["case", "story", "content"],
  },
  {
    kind: "file",
    id: "design-system-composer",
    label: "composer.ts",
    description: "src/design-system",
    keywords: ["design", "system", "tokens", "composer"],
  },
];
