/**
 * Проекты сайдбара Genora: работа идёт через GitHub без локального
 * репозитория, поэтому каждый проект — ветка репозитория (иконка
 * ветки в сайдбаре), а внутри — чаты, привязанные к этой ветке.
 */

export type ProjectGroup = {
  /* Название проекта — имя ветки GitHub. */
  name: string;
  /* Чаты, ведущиеся в контексте этой ветки. */
  chats: string[];
};

export const PROJECT_GROUPS: ProjectGroup[] = [
  {
    name: "main",
    chats: ["Не приходит код подтверждения", "Подписка на ChatGPT"],
  },
  {
    name: "feat/checkout",
    chats: ["Оплата подписки не прошла", "Сравнить Claude и Gemini"],
  },
  {
    name: "feat/showcase",
    chats: [
      "Промпты для генерации изображений",
      "Midjourney для дизайна",
      "Что выбрать для кода",
    ],
  },
];
