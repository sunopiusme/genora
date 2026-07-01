# Monorepo

## Инструменты

- Turborepo — оркестрация задач и кеш сборки.
- pnpm workspace — управление зависимостями и связыванием пакетов.

## Workspace

- `apps/*` и `packages/*` объявлены в `pnpm-workspace.yaml`.
- Внутренние пакеты подключаются через `workspace:*`.
- Имя пакета — `@genora/<name>`.

## Задачи Turbo

- `dev`, `build`, `lint`, `typecheck`, `test`, `storybook`.
- Граф зависимостей задаётся через `dependsOn` в `turbo.json`.
- Сборка пакета предшествует сборке зависящего приложения (`^build`).

## Правила пакетов

- У каждого пакета явный публичный вход `index.ts` и поле `exports`.
- Пакеты не импортируют внутренние пути друг друга в обход `exports`.
- Общие конфиги берутся из `@genora/config`.

## Связанные документы

- `architecture/REPO_STRUCTURE.md`
- `stack/TECH_STACK.md`
