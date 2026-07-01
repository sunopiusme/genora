# Data Layer

## Поток данных

```
Server Components
        |
Server Actions
        |
Prisma
        |
PostgreSQL
```

## Правила

- Чтение данных — в Server Components напрямую через Prisma.
- Мутации — через Server Actions, объявленные в `features/<feature>/actions`.
- Вход Server Action валидируется Zod-схемой из `features/<feature>/schemas`.
- Доступ к БД инкапсулирован в `@genora/database`; приложение не создаёт свой клиент.
- Внешние сервисы (платежи) — через `features/<feature>/api`.

## Кеширование

- Для каждого источника данных задаётся явная стратегия caching/revalidation.
- Серверные данные на клиенте управляются через TanStack Query (см. `STATE_MANAGEMENT.md`).

## Prisma

- Единая схема: `packages/database/prisma/schema.prisma`.
- Генерация клиента и миграции — через скрипты пакета `@genora/database`.

## Связанные документы

- `architecture/STATE_MANAGEMENT.md`
- `standards/TYPESCRIPT_STANDARDS.md`
