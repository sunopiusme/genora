# Repo Structure

## Структура

```
genora/
├── apps/
│   └── web/                  # Next.js приложение
│       ├── app/              # маршрутизация (route groups)
│       ├── features/         # бизнес-логика по фичам
│       ├── components/       # shared и providers
│       └── styles/
├── packages/
│   ├── ui/                   # собственная UI библиотека
│   ├── design-tokens/        # colors, spacing, typography
│   ├── config/               # eslint / typescript / tailwind пресеты
│   ├── database/             # Prisma client и schema
│   └── utils/
└── docs/                     # Documentation OS
```

## Правила размещения

- Прикладной код приложения живёт в `apps/web`.
- Переиспользуемое между приложениями выносится в `packages/*`.
- Бизнес-логика фичи живёт внутри `apps/web/features/<feature>`, а не в `app/`.
- `app/*` отвечает только за маршрутизацию и композицию.
- UI без бизнес-логики — в `@genora/ui`.
- Контракты данных и доступ к БД — в `@genora/database`.

## Планируемое расширение

- `apps/admin` или `apps/landing` как отдельные приложения при необходимости.
- `apps/mobile` или Telegram mini app поверх общих пакетов.
- Каждое расширение переиспользует `packages/*` без дублирования.
