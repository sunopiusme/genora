import type { Product } from "../types";

const FEATURED_PRODUCTS: Product[] = [
  {
    id: "chatgpt-plus",
    name: "ChatGPT Plus",
    provider: "OpenAI",
    priceLabel: "1 990 ₽",
    periodLabel: "мес",
    description:
      "Доступ к продвинутым моделям GPT, приоритет в часы пиковой нагрузки, генерация изображений и работа с файлами.",
  },
  {
    id: "claude-pro",
    name: "Claude Pro",
    provider: "Anthropic",
    priceLabel: "1 890 ₽",
    periodLabel: "мес",
    description:
      "Расширенные лимиты на запросы, большой контекст для длинных документов и приоритетный доступ к новым моделям Claude.",
  },
  {
    id: "midjourney-standard",
    name: "Midjourney Standard",
    provider: "Midjourney",
    priceLabel: "2 400 ₽",
    periodLabel: "мес",
    description:
      "15 часов быстрой генерации в месяц, безлимитная генерация в расслабленном режиме и коммерческая лицензия на изображения.",
  },
  {
    id: "gemini-advanced",
    name: "Gemini Advanced",
    provider: "Google",
    priceLabel: "1 750 ₽",
    periodLabel: "мес",
    description:
      "Доступ к самым мощным моделям Gemini, интеграция с Документами и Таблицами и увеличенное хранилище в облаке.",
  },
  {
    id: "perplexity-pro",
    name: "Perplexity Pro",
    provider: "Perplexity",
    priceLabel: "1 690 ₽",
    periodLabel: "мес",
    description:
      "Безлимитные точные ответы со ссылками на источники, выбор модели и загрузка файлов для анализа.",
  },
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    provider: "GitHub",
    priceLabel: "990 ₽",
    periodLabel: "мес",
    description:
      "Подсказки кода прямо в редакторе, объяснение и рефакторинг фрагментов и чат с контекстом вашего проекта.",
  },
];

export function getFeaturedProducts(): Product[] {
  return FEATURED_PRODUCTS;
}
