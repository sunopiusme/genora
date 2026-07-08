import type { ProjectGroup } from "../types";

export const SYNORA_PROJECT_GROUPS: ProjectGroup[] = [
  {
    name: "Genora",
    branch: "v0/mobile-profile-layout",
    chats: [
      "Шторка профиля на мобильных",
      "Единый радиус модальных окон",
      "Усечение email в строке профиля",
    ],
  },
  {
    name: "Synora",
    branch: "feat/composer-projects",
    chats: [
      "Синхронизация проекта и ветки",
      "Picker проектов в композере",
    ],
  },
  {
    name: "@genora/ui",
    branch: "feat/design-tokens",
    chats: ["Токены радиусов и теней"],
  },
];
