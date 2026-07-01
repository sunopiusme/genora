# Next.js Standards

## Назначение

Базовые стандарты разработки веб-части Genora Pro на Next.js 15.

## Обязательные правила

- App Router для всех страниц и модулей.
- Server Components по умолчанию; `"use client"` только там, где нужна интерактивность.
- Мутации через Server Actions, а не через ручные API-роуты, где это применимо.
- TypeScript strict mode, без `ignoreBuildErrors`.
- Линт через `eslint-config-next` (core-web-vitals).
- Явная стратегия caching/revalidation для каждого источника данных.
- Контроль Core Web Vitals как release gate.

## Границы слоёв

- `app/*` — маршрутизация и композиция, без бизнес-логики.
- `features/*` — бизнес-логика фичи (см. `architecture/FEATURE_STRUCTURE.md`).
- `@genora/ui` — визуальный слой, без бизнес-логики.

## Связанные документы

- `standards/CODE_STANDARD.md`
- `standards/TYPESCRIPT_STANDARDS.md`
- `architecture/DATA_LAYER.md`
