import type { Product } from "../types";

const FEATURED_PRODUCTS: Product[] = [
  {
    id: "chatgpt-plus",
    name: "ChatGPT Plus",
    provider: "OpenAI",
    logoSlug: "openai",
    brandColor: "#16d9a3",
    brandGlow: "#2f7cff",
    priceLabel: "1 990 ₽",
    periodLabel: "мес",
    description:
      "Доступ к продвинутым моделям GPT, приоритет в часы пиковой нагрузки, генерация изображений и работа с файлами.",
  },
  {
    id: "claude-pro",
    name: "Claude Pro",
    provider: "Anthropic",
    logoSlug: "anthropic",
    brandColor: "#ff8a5c",
    brandGlow: "#e14fb2",
    priceLabel: "1 890 ₽",
    periodLabel: "мес",
    description:
      "Расширенные лимиты на запросы, большой контекст для длинных документов и приоритетный доступ к новым моделям Claude.",
  },
  {
    id: "midjourney-standard",
    name: "Midjourney Standard",
    provider: "Midjourney",
    logoSlug: "midjourney",
    brandColor: "#7b8cff",
    brandGlow: "#b45cff",
    priceLabel: "2 400 ₽",
    periodLabel: "мес",
    description:
      "15 часов быстрой генерации в месяц, безлимитная генерация в расслабленном режиме и коммерческая лицензия на изображения.",
  },
  {
    id: "gemini-advanced",
    name: "Gemini Advanced",
    provider: "Google",
    logoSlug: "gemini",
    brandColor: "#4e86f5",
    brandGlow: "#9a6bff",
    priceLabel: "1 750 ₽",
    periodLabel: "мес",
    description:
      "Доступ к самым мощным моделям Gemini, интеграция с Документами и Таблицами и увеличенное хранилище в облаке.",
  },
  {
    id: "perplexity-pro",
    name: "Perplexity Pro",
    provider: "Perplexity",
    logoSlug: "perplexity",
    brandColor: "#2fd4ee",
    brandGlow: "#2f6bff",
    priceLabel: "1 690 ₽",
    periodLabel: "мес",
    description:
      "Безлимитные точные ответы со ссылками на источники, выбор модели и загрузка файлов для анализа.",
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
  },
];

export function getFeaturedProducts(): Product[] {
  return FEATURED_PRODUCTS;
}
