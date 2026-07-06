export type RecentGroup = {
  title: string;
  items: string[];
};

export const RECENT_GROUPS: RecentGroup[] = [
  {
    title: "Сегодня",
    items: ["Не приходит код подтверждения", "Подписка на ChatGPT"],
  },
  {
    title: "Вчера",
    items: ["Промпты для генерации изображений", "Сравнить Claude и Gemini"],
  },
  {
    title: "Последние 7 дней",
    items: [
      "Midjourney для дизайна",
      "Материалы для обучения модели",
      "Доступ к GitHub Copilot",
      "Оплата подписки не прошла",
      "Что выбрать для кода",
    ],
  },
];
