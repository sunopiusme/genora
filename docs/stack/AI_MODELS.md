# AI-модели в Синоре

Как устроены провайдеры и модели в фиче `apps/web/features/synora` и как подключается реальный инференс.

## Архитектура

| Слой | Файл | Ответственность |
| --- | --- | --- |
| Данные | `data/models.ts` | Каталог провайдеров, моделей и уровней; `DEFAULT_SELECTION` |
| Типы | `types.ts` | `ProviderId`, `ModelEntry`, `ModelSelection` |
| Валидация | `schemas/chat.ts` | Zod-схема запроса — единый источник истины для клиента и роута |
| Сервер | `api/anthropic-chat.ts` | Allowlist моделей, вызов шлюза через AI SDK, стриминг |
| Роут | `app/api/synora/chat/route.ts` | Тонкий `POST`: парсинг → валидация → стрим |
| Клиент | `hooks/use-chat-request.ts`, `stores/chat-store.ts` | Отправка, чтение стрима, состояние ответа |
| UI | `components/composer/assistant-reply.tsx` | Блок ответа под композером |

## Провайдеры

- **Anthropic** — Fable 5 (демонстрационная модель, отправка работает как заглушка) и Claude Sonnet 4.5 (`claude-sonnet-4-5`) с уровнями `standard` и `thinking`. Для Claude доступен реальный стриминговый инференс через Anthropic-совместимый шлюз.

Уровень `thinking` включает extended thinking (`providerOptions.anthropic.thinking`, бюджет 12 000 токенов).

## Переменные окружения

Только серверные, в клиентский бандл не попадают. Сервер (`resolveModel` в `api/anthropic-chat.ts`) выбирает шлюз по приоритету:

1. `ANTHROPIC_GATEWAY_BASE_URL` + `ANTHROPIC_GATEWAY_API_KEY` — Anthropic-совместимый шлюз (локально: `http://127.0.0.1:8000/v1`). Значение без суффикса `/v1` (`http://127.0.0.1:8000`) тоже принимается. Основной путь в локальной разработке; отдаёт реальный Claude. Если адрес указывает на `localhost`/`127.0.0.1`, сервер сначала проверяет доступность шлюза (HEAD-запрос, таймаут 700 мс, кэш результата 30 с) и при недоступности переходит к следующему пункту — один и тот же набор переменных работает и локально, и в предпросмотре v0.
2. `OPENROUTER_API_KEY` — OpenRouter через его Anthropic-совместимый эндпоинт `https://openrouter.ai/api/v1/messages`. Ключ бесплатный (без карты), модель закреплена в `OPENROUTER_MODELS` (`nvidia/nemotron-3-super-120b-a12b:free`; авто-роутер `openrouter/free` не используется — он может выбрать классификатор вместо чат-модели). Не Claude; лимит ~20 запросов в минуту. Уровень `thinking` на этом шлюзе игнорируется.
3. `AI_GATEWAY_API_KEY` — Vercel AI Gateway. Модель передаётся строкой каталога (`anthropic/claude-sonnet-4.5`), AI SDK направляет запрос в шлюз автоматически. Требует привязанную карту в команде Vercel.

В документации Anthropic-совместимого шлюза используется официальный `@anthropic-ai/sdk`, который добавляет к `baseURL` путь `/v1/messages` — итоговый документированный URL: `<host>/v1/v1/messages`. Используемый здесь `@ai-sdk/anthropic` добавляет только `/messages`, поэтому сервер (`normalizeBaseUrl`) приводит значение из env к виду `<host>/v1/v1`: итоговый URL запроса совпадает с документированным примером шлюза байт в байт при любой из двух форм записи env.

Приложение живёт в монорепе (`apps/web`), а env-переменные v0 записываются в `.env.development.local` корня воркспейса. `next.config.ts` (`loadWorkspaceEnv`) при старте подгружает `.env`, `.env.local` и `.env.development.local` из корня монорепы, не перезаписывая уже заданные переменные.

## Границы безопасности

- Ключ и endpoint шлюза читаются только на сервере (`api/anthropic-chat.ts`).
- Серверный allowlist (`ANTHROPIC_GATEWAY_MODELS` / `VERCEL_GATEWAY_MODELS` / `OPENROUTER_MODELS`): клиент не может подставить произвольную модель.
- Запрос валидируется Zod до обращения к шлюзу (промпт до 8000 символов).
- Ошибки шлюза не пробрасываются клиенту — роут отвечает общим `502`.
- Заголовки клиента в шлюз не форвардятся; таймаут запроса — 60 секунд.

## Как добавить новую модель

1. Добавить модель (и при необходимости провайдера) в `data/models.ts`; новый `ProviderId` — в `types.ts`.
2. Добавить соответствие `modelId → id модели шлюза` в `ANTHROPIC_GATEWAY_MODELS`, `VERCEL_GATEWAY_MODELS` и `OPENROUTER_MODELS` в `api/anthropic-chat.ts`.
3. Если у модели свои уровни — обработать их в `streamAnthropicChat`.
4. Проверить: `pnpm lint`, `pnpm typecheck`, ручная отправка промпта.
