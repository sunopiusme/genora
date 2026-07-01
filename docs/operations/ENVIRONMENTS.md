# Environments

## Переменные окружения

Контракт переменных хранится в `.env.example` (без секретов). Локальные значения — в `.env`.

| Переменная | Назначение |
| --- | --- |
| `DATABASE_URL` | строка подключения PostgreSQL |
| `AUTH_SECRET` | секрет Auth.js |
| `AUTH_URL` | базовый URL приложения для Auth.js |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | OAuth-провайдер |
| `YOOKASSA_SHOP_ID` / `YOOKASSA_SECRET_KEY` | платежи ЮKassa |
| `CLOUDPAYMENTS_PUBLIC_ID` / `CLOUDPAYMENTS_API_SECRET` | платежи CloudPayments |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | мониторинг ошибок |

## Правила

- Секреты не попадают в репозиторий и в клиентский бандл.
- Только переменные с префиксом `NEXT_PUBLIC_` доступны на клиенте.
- При добавлении переменной обновляется `.env.example`.

## Окружения

- `development` — локальная разработка.
- `production` — боевое окружение.
- Различия задаются значениями переменных, а не ветвлением кода.
