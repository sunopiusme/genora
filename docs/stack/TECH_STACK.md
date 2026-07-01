# Tech Stack

Закреплённый технический стек Genora Pro. Версии зафиксированы в манифестах пакетов.

## Базис

| Слой | Технология | Версия |
| --- | --- | --- |
| Framework | Next.js (App Router) | 15.1.x |
| UI runtime | React / React DOM | 19.0.x |
| Language | TypeScript | 5.7.x |
| Monorepo | Turborepo | 2.3.x |
| Package manager | pnpm | 9.15.x |

## Frontend

| Назначение | Технология | Версия |
| --- | --- | --- |
| Styling | Tailwind CSS | 3.4.x |
| Accessibility primitives | @radix-ui/react-* | 1.x / 2.x |
| Animation | Framer Motion | 11.15.x |
| Client state | Zustand | 5.0.x |
| Server state | @tanstack/react-query | 5.62.x |
| Forms | React Hook Form | 7.54.x |
| Validation | Zod | 3.24.x |
| UI docs | Storybook | 8.4.x |

## Backend и данные

| Назначение | Технология | Версия |
| --- | --- | --- |
| Auth | next-auth (Auth.js v5) | 5.0.0-beta.x |
| Auth adapter | @auth/prisma-adapter | 2.7.x |
| ORM | Prisma / @prisma/client | 6.1.x |
| Database | PostgreSQL | 16+ |

## Платежи и мониторинг

| Назначение | Технология |
| --- | --- |
| Payments | ЮKassa / CloudPayments |
| Monitoring | @sentry/nextjs 8.47.x |

## Принцип версий

- Версии закреплены точно (без диапазонов) в `package.json` пакетов.
- Изменение ключевой зависимости требует ADR (см. `architecture/DECISION_GUARDS.md`).
