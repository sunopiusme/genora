# System Overview

## Context

Genora Pro — единое веб-приложение поверх монорепозитория. Магазин, личный кабинет,
подписки и админка живут в `apps/web`, а переиспользуемые слои — в `packages/*`.

## Контуры приложения

- Marketing — лендинги и продуктовая презентация (`app/(marketing)`).
- Shop — каталог продуктов и страницы покупки (`app/(shop)`).
- Dashboard — личный кабинет, заказы, подписки (`app/dashboard`).
- Admin — управление продуктами, подписками и заказами (`app/admin`).
- API — служебные эндпоинты и webhooks платежей (`app/api`).

## Переиспользуемые пакеты

- `@genora/ui` — собственная UI библиотека.
- `@genora/design-tokens` — токены дизайна.
- `@genora/database` — Prisma client и схема.
- `@genora/utils` — утилиты.
- `@genora/config` — общие пресеты eslint/tsconfig/tailwind.

## External integrations

- Провайдеры аутентификации (Auth.js v5).
- Платёжные шлюзы: ЮKassa / CloudPayments.
- Мониторинг ошибок: Sentry.

## High-level data flow

1. Server Component запрашивает данные из Prisma.
2. Пользовательская мутация вызывает Server Action.
3. Server Action валидирует вход через Zod и обращается к Prisma.
4. Клиентские серверные данные кешируются через TanStack Query.
5. Платёжный webhook обновляет статус заказа и подписки.
