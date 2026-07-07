/**
 * Недавние песочницы «Синоры» — аналог RECENT_GROUPS у Genora
 * (lib/recent-chats.ts), но со своим контентом площадки.
 */

export type RecentGroup = {
  title: string;
  items: string[];
};

export const SYNORA_RECENT_GROUPS: RecentGroup[] = [
  {
    title: "Сегодня",
    items: [
      "Парсер CSV на TypeScript",
      "Компонент таблицы с сортировкой",
    ],
  },
  {
    title: "Вчера",
    items: [
      "REST API на Express",
      "Скрипт миграции базы данных",
      "Анимация загрузчика на CSS",
    ],
  },
];
