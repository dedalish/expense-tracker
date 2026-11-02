<!-- Пример PR с изменением API. Заголовок PR: «Сводка транзакций за месяц по категориям» -->

## Что сделано

- Добавлен эндпоинт `GET /api/transactions/summary`: итоги за месяц.
- Суммы доходов и расходов за месяц и баланс.
- Разбивка по категориям, отдельно для `INCOME` и `EXPENSE`, по убыванию суммы.

## Зачем

Главной странице нужны данные для итогов месяца и графика расходов по категориям. Без сводки web загружал бы все транзакции месяца и считал суммы сам.

## API

`GET /api/transactions/summary?month=<1–12>&year=<2000–2100>`, нужен `Authorization: Bearer <token>`.

Ответ `200`:

```json
{
  "month": 1,
  "year": 2026,
  "income": "85000.00",
  "expense": "15000.00",
  "balance": "70000.00",
  "byCategory": [
    {
      "categoryId": "<uuid>",
      "name": "Продукты",
      "color": "#6a8a72",
      "icon": "🛒",
      "type": "EXPENSE",
      "total": "15000.00",
      "count": 3
    }
  ]
}
```

Суммы — строки, чтобы Decimal из БД не терял точность. Ошибки: `400` при неверных `month` или `year` (поля с ошибками в `errors.fieldErrors`), `401` без токена.

## Изменения в коде

- Backend (`apps/api`): `transactions.controller.ts` (маршрут объявлен раньше `:id`), `transactions.service.ts`, `transactions.repository.ts` (агрегация через `groupBy`), тесты в `transactions.service.spec.ts`.
- Контракт (`packages/shared`): `transactionSummaryQuerySchema`, `transactionSummarySchema`.
- База данных: схема не менялась.

## Как проверить

Запуск: `npm run db:up && npm run dev`.

```bash
# токен
curl -s localhost:3001/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"<email>","password":"<пароль>"}'

# сводка
curl -s 'localhost:3001/api/transactions/summary?month=1&year=2026' \
  -H 'Authorization: Bearer <token>'
```

Тесты:

```bash
npm run test -w @expense-tracker/api -- src/transactions/transactions.service.spec.ts
```

Шаги ручной проверки:

1. Без токена — `401`.
2. `month=13` — `400`, в `errors.fieldErrors.month` описание ошибки.
3. Месяц без транзакций — нули и пустой `byCategory`.

## Проверка

- [x] `npm run build`
- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm run test`
- [x] `npm run format:check`
- [x] `CLAUDE.md` актуален

Вручную: запросы `curl` на локальной базе. Не проверено: web, страница использует сводку в следующем PR.
