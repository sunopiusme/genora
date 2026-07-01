# Feature Structure

## Назначение

Бизнес-логика организована по фичам, а не по техническим слоям. Каждая фича
самодостаточна и содержит всё необходимое для своей работы.

## Структура фичи

```
features/<feature>/
├── components/   # UI фичи поверх @genora/ui
├── hooks/        # клиентские хуки фичи
├── actions/      # Server Actions
├── schemas/      # Zod-схемы валидации
├── queries/      # TanStack Query
├── api/          # обращения к внешним сервисам
├── types.ts      # доменные типы фичи
└── index.ts      # публичный вход фичи
```

## Фичи v1

- `auth` — аутентификация и сессии.
- `products` — каталог и карточки продуктов.
- `checkout` — оформление и оплата.
- `subscriptions` — подписки и продления.
- `profile` — личный кабинет пользователя.

## Правила

- `app/*` импортирует фичу через её `index.ts`, не лезет во внутренние пути.
- Фича не импортирует внутренние файлы другой фичи.
- Общее между фичами выносится в `packages/*` или `components/shared`.
- Zod-схема — единый источник истины для формы и Server Action одной фичи.

## Связанные документы

- `architecture/DATA_LAYER.md`
- `architecture/STATE_MANAGEMENT.md`
- `standards/CODE_STANDARD.md`
