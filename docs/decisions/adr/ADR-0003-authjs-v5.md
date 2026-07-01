# ADR-0003: Аутентификация на Auth.js v5

- Status: Accepted
- Date: 2026-06-27

## Context

Нужна аутентификация, интегрированная с App Router и собственной БД.

## Decision

Использовать Auth.js v5 (`next-auth`) с Prisma Adapter и хранением в PostgreSQL.
Конфигурация и логика — в `features/auth`, защита маршрутов — в `middleware.ts`.

## Consequences

- Нативная интеграция с App Router и Server Actions.
- Единое хранилище пользователей и сессий в основной БД.
- Зависимость от beta-версии до стабильного релиза.

## Alternatives Considered

- Внешний провайдер identity: меньше контроля и лишняя инфраструктура для v1.
