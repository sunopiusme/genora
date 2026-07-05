import type { Product } from "../types";

const FEATURED_PRODUCTS: Product[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    provider: "OpenAI",
    logoSlug: "openai",
    brandColor: "#16d9a3",
    brandGlow: "#2f7cff",
    priceLabel: "1 990 ₽",
    periodLabel: "мес",
    description:
      "Доступ к продвинутым моделям GPT, приоритет в часы пиковой нагрузки, генерация изображений и работа с файлами.",
    defaultTierIndex: 0,
    tiers: [
      {
        id: "plus",
        name: "Plus",
        priceLabel: "1 990 ₽",
        description:
          "Доступ к продвинутым моделям GPT, приоритет в часы пиковой нагрузки, генерация изображений и работа с файлами.",
      },
      {
        id: "pro",
        name: "Pro",
        priceLabel: "19 900 ₽",
        description:
          "Безлимитный доступ к самым мощным моделям, режим глубокого рассуждения o1 pro и максимальные лимиты на генерацию.",
      },
    ],
  },
  {
    id: "claude",
    name: "Claude",
    provider: "Anthropic",
    logoSlug: "anthropic",
    brandColor: "#ff8a5c",
    brandGlow: "#e14fb2",
    priceLabel: "1 890 ₽",
    periodLabel: "мес",
    description:
      "Расширенные лимиты на запросы, большой контекст для длинных документов и приоритетный доступ к новым моделям Claude.",
    defaultTierIndex: 0,
    tiers: [
      {
        id: "pro",
        name: "Pro",
        priceLabel: "1 890 ₽",
        description:
          "Расширенные лимиты на запросы, большой контекст для длинных документов и приоритетный доступ к новым моделям Claude.",
      },
      {
        id: "max-5x",
        name: "Max 5x",
        priceLabel: "9 400 ₽",
        description:
          "В 5 раз больше лимитов, чем в Pro, приоритетный доступ в часы нагрузки и Claude Code в терминале.",
      },
      {
        id: "max-20x",
        name: "Max 20x",
        priceLabel: "18 900 ₽",
        description:
          "В 20 раз больше лимитов, чем в Pro, максимальный приоритет и ранний доступ к новым возможностям.",
      },
    ],
  },
  {
    id: "midjourney",
    name: "Midjourney",
    provider: "Midjourney",
    logoSlug: "midjourney",
    brandColor: "#7b8cff",
    brandGlow: "#b45cff",
    priceLabel: "2 400 ₽",
    periodLabel: "мес",
    description:
      "15 часов быстрой генерации в месяц, безлимитная генерация в расслабленном режиме и коммерческая лицензия на изображения.",
    defaultTierIndex: 1,
    tiers: [
      {
        id: "basic",
        name: "Basic",
        priceLabel: "950 ₽",
        description:
          "3,3 часа быстрой генерации в месяц и коммерческая лицензия на изображения.",
      },
      {
        id: "standard",
        name: "Standard",
        priceLabel: "2 400 ₽",
        description:
          "15 часов быстрой генерации в месяц, безлимитная генерация в расслабленном режиме и коммерческая лицензия на изображения.",
      },
      {
        id: "pro",
        name: "Pro",
        priceLabel: "5 700 ₽",
        description:
          "30 часов быстрой генерации, стелс-режим для приватности работ и 12 одновременных задач.",
      },
      {
        id: "mega",
        name: "Mega",
        priceLabel: "11 400 ₽",
        description:
          "60 часов быстрой генерации, стелс-режим и максимальное число одновременных задач.",
      },
    ],
  },
  {
    id: "gemini",
    name: "Gemini",
    provider: "Google",
    logoSlug: "gemini",
    brandColor: "#4e86f5",
    brandGlow: "#9a6bff",
    priceLabel: "1 750 ₽",
    periodLabel: "мес",
    description:
      "Доступ к самым мощным моделям Gemini, интеграция с Документами и Таблицами и увеличенное хранилище в облаке.",
    defaultTierIndex: 0,
    tiers: [
      {
        id: "advanced",
        name: "Advanced",
        priceLabel: "1 750 ₽",
        description:
          "Доступ к самым мощным моделям Gemini, интеграция с Документами и Таблицами и увеличенное хранилище в облаке.",
      },
      {
        id: "ultra",
        name: "Ultra",
        priceLabel: "12 500 ₽",
        description:
          "Максимальные лимиты, генерация видео Veo, приоритетный доступ к новинкам и 30 ТБ хранилища.",
      },
    ],
  },
  {
    id: "perplexity",
    name: "Perplexity",
    provider: "Perplexity",
    logoSlug: "perplexity",
    brandColor: "#2fd4ee",
    brandGlow: "#2f6bff",
    priceLabel: "1 690 ₽",
    periodLabel: "мес",
    description:
      "Безлимитные точные ответы со ссылками на источники, выбор модели и загрузка файлов для анализа.",
    defaultTierIndex: 0,
    tiers: [
      {
        id: "pro",
        name: "Pro",
        priceLabel: "1 690 ₽",
        description:
          "Безлимитные точные ответы со ссылками на источники, выбор модели и загрузка файлов для анализа.",
      },
      {
        id: "max",
        name: "Max",
        priceLabel: "16 900 ₽",
        description:
          "Неограниченный доступ к лучшим моделям, ранний доступ к новым функциям и приоритетная поддержка.",
      },
    ],
  },
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    provider: "GitHub",
    logoSlug: "github",
    brandColor: "#8b5cf6",
    brandGlow: "#38bdf8",
    priceLabel: "990 ₽",
    periodLabel: "мес",
    description:
      "Подсказки кода прямо в редакторе, объяснение и рефакторинг фрагментов и чат с контекстом вашего проекта.",
    defaultTierIndex: 0,
    tiers: [
      {
        id: "pro",
        name: "Pro",
        priceLabel: "990 ₽",
        description:
          "Подсказки кода прямо в редакторе, объяснение и рефакторинг фрагментов и чат с контекстом вашего проекта.",
      },
      {
        id: "pro-plus",
        name: "Pro+",
        priceLabel: "3 900 ₽",
        description:
          "Все возможности Pro, доступ к самым мощным моделям, агентный режим и 30-кратный лимит премиум-запросов.",
      },
    ],
  },
];

export function getFeaturedProducts(): Product[] {
  return FEATURED_PRODUCTS;
}
