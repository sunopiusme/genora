# ADR-0004: Prisma + PostgreSQL как слой данных

- Status: Accepted
- Date: 2026-06-27

## Context

Нужен типобезопасный доступ к данным с миграциями и единой схемой.

## Decision

Использовать Prisma с PostgreSQL. Схема и клиент инкапсулированы в пакете `@genora/database`.
Чтение — в Server Components, мутации — в Server Actions.

## Consequences

- Типобезопасные запросы и управляемые миграции.
- Единый источник схемы для всех приложений.
- Доступ к БД только через пакет, без локальных клиентов в приложении.

## Alternatives Considered

- Query builder без ORM: больше ручной работы и слабее типобезопасность.
