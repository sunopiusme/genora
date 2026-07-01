# Genora Documentation OS

Эта документация организована как система сопровождения разработки: не просто «справка»,
а рабочий слой принятия решений для платформы Genora Pro.

## Что это даёт

- Единые правила для продуктовых и технических решений.
- Быстрый вход в задачу через маршруты чтения.
- Предсказуемая разработка без потери контекста.

## Разделы

- `_system` — протокол документации: порядок чтения, маршрутизация, приоритеты.
- `standards` — стандарты кода и технологий. Содержит главный документ `CODE_STANDARD.md`.
- `foundations` — продуктовая основа.
- `architecture` — системная и репозиторная архитектура, фичи, данные, состояние, auth.
- `stack` — закреплённый технический стек и версии.
- `decisions` — архитектурные решения (ADR).
- `playbooks` — операционные сценарии работы.
- `operations` — окружения и эксплуатационные процедуры.
- `templates` — шаблоны для быстрой фиксации решений.

## Стартовый маршрут

1. `_system/MANIFEST.md`
2. `standards/CODE_STANDARD.md`
3. `_system/READING_ORDER.md`
4. `_system/ROUTING.md`

## Маршруты по доменам

- Архитектура: `architecture/SYSTEM_OVERVIEW.md` -> `architecture/REPO_STRUCTURE.md` -> `architecture/MONOREPO.md`.
- UI: `standards/UI_STANDARDS.md` -> `architecture/UI_LIBRARY.md`.
- Фичи и данные: `architecture/FEATURE_STRUCTURE.md` -> `architecture/DATA_LAYER.md` -> `architecture/STATE_MANAGEMENT.md`.
- Web качество: `standards/NEXTJS_STANDARDS.md` -> `standards/TYPESCRIPT_STANDARDS.md`.

## Главное правило

Главный документ — `standards/CODE_STANDARD.md`. Любой код в репозитории подчиняется ему
без исключений.
