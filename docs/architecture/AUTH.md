# Auth

## Стек

- Auth.js v5.
- Prisma Adapter (`@auth/prisma-adapter`).
- Хранилище — PostgreSQL через `@genora/database`.

## Размещение

```
features/auth/
├── auth.config.ts   # конфигурация Auth.js
├── actions/         # вход/выход и связанные Server Actions
├── schemas/         # Zod-схемы форм auth
├── components/       # UI форм аутентификации
└── types.ts
```

## Правила

- Защита маршрутов — через `middleware.ts` приложения.
- Доступ к сессии на сервере — через хелперы Auth.js, не вручную.
- Секреты — только из переменных окружения (`.env`), пример в `.env.example`.
- Никаких токенов и секретов в коде или в клиентском бандле.

## Связанные документы

- `architecture/DATA_LAYER.md`
- `operations/ENVIRONMENTS.md`
- `decisions/adr/ADR-0003-authjs-v5.md`
