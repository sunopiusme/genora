# Genora Pro

Монорепозиторий AI SaaS-платформы Genora Pro: магазин подписок на AI-сервисы
(Claude, ChatGPT, Cursor), личный кабинет, подписки и админка развиваются независимо.

## Стек

- Monorepo: Turborepo + pnpm workspace
- Web: Next.js 15 App Router, React 19, TypeScript strict
- UI: собственная библиотека `@genora/ui` на Radix primitives + Tailwind
- State: Zustand (клиент) + TanStack Query (сервер)
- Data: Server Actions -> Prisma -> PostgreSQL
- Auth: Auth.js v5 + Prisma Adapter
- Payments: ЮKassa / CloudPayments
- Monitoring: Sentry

Полный список с версиями: `docs/stack/TECH_STACK.md`.

## Структура

```
genora/
├── apps/
│   └── web/            # Next.js приложение
├── packages/
│   ├── ui/             # собственная UI библиотека
│   ├── design-tokens/  # цвета, отступы, типографика
│   ├── config/         # eslint / typescript / tailwind пресеты
│   ├── database/       # Prisma client и schema
│   └── utils/          # переиспользуемые утилиты
└── docs/               # Documentation OS
```

## Документация

Документация организована как Documentation OS. Точка входа: `docs/README.md`.

Главный стандарт разработки — `docs/standards/CODE_STANDARD.md`. Он обязателен к чтению
до написания любого кода.

## Запуск

```bash
corepack enable
pnpm install
pnpm dev
```

Скрипты монорепозитория: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`,
`pnpm storybook`, `pnpm db:migrate`.
