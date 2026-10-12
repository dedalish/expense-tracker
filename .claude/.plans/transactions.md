# План: модуль транзакций (доходы и расходы)

## Контекст

Задача лежит в `.claude/.prompts/transactions.md`. Нужен `TransactionsModule`, центральный модуль для учёта доходов и расходов: модель `Transaction`, CRUD, фильтры списка и сводка за месяц. Образец структуры — `apps/api/src/categories`.

Решения, согласованные с пользователем:

- **Валидация через Zod-схемы из shared и `ZodValidationPipe`**, а не через class-validator. Так уже принято в проекте, и новых зависимостей не нужно (это требование из той же задачи).
- **Черновик `Expense` удаляется.** `Transaction` с типом `EXPENSE` его заменяет.
- **Только backend.** UI транзакций будет отдельным этапом.
- После одобрения план кладётся в `.claude/.plans/transactions.md`.

Где сознательно отходим от текста задачи, чтобы следовать соглашениям проекта:

| В задаче | В плане | Почему |
|---|---|---|
| `@default(uuid())` | `@default(uuid(7)) @db.Uuid` | Так у всех моделей. UUIDv7 упорядочены по времени, индекс не фрагментируется. |
| поля без `updatedAt` | добавить `updatedAt` | Есть PATCH, и у всех моделей это поле есть. |
| `date DateTime` | `DateTime @db.Date` | Транзакции нужна дата без времени. Иначе часовой пояс сдвигает её в соседний день и в соседний месяц сводки. |
| class-validator | Zod из shared | Решение выше. |

## Модель данных (`apps/api/prisma/schema.prisma`)

```prisma
enum TransactionType {
  INCOME
  EXPENSE

  @@map("transaction_type")
}

model Transaction {
  id          String          @id @default(uuid(7)) @db.Uuid
  /// Всегда положительная, знак задаёт type.
  amount      Decimal         @db.Decimal(12, 2)
  type        TransactionType
  description String?
  date        DateTime        @db.Date
  categoryId  String          @map("category_id") @db.Uuid
  category    Category        @relation(fields: [categoryId], references: [id], onDelete: NoAction)
  userId      String          @map("user_id") @db.Uuid
  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime        @default(now()) @map("created_at")
  updatedAt   DateTime        @updatedAt @map("updated_at")

  @@index([userId, date])
  @@index([categoryId])
  @@map("transactions")
}
```

- В `User` и `Category` появляется `transactions Transaction[]`. `expenses Expense[]` и модель `Expense` удаляются.
- Связь с категорией `NoAction`, а не `Restrict`. В Postgres `RESTRICT` проверяется сразу, поэтому каскадное удаление пользователя упало бы: категории удаляются раньше транзакций. `NO ACTION` проверяется в конце оператора. Каскад от `User` проходит, а прямое удаление категории с транзакциями по-прежнему даёт P2003 и ответ 409.
- Миграция: перед ней проверить `select count(*) from expenses` (ожидаем 0), затем `npm run db:migrate -- --name add-transactions`. Если `migrate dev` упадёт в неинтерактивном shell, использовать известный обход: `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` в папку новой миграции, затем `migrate deploy`.

## Контракт (`packages/shared/src/transaction.ts`, экспорт в `index.ts`)

- `transactionTypeSchema = z.enum(['INCOME', 'EXPENSE'])`.
- `amountSchema`: принимает число или строку и приводит к строке `^\d{1,10}(\.\d{1,2})?$`, значение больше 0. Наружу сумма уходит **строкой** (`"1250.50"`), чтобы Decimal не терял точность во float.
- `dateSchema = z.iso.date()` (`YYYY-MM-DD`).
- `createTransactionSchema`: `amount`, `type`, `date`, `categoryId: z.uuid()`, `description: z.string().trim().max(500).nullish()`.
- `updateTransactionSchema`: `partial()` + refine «хотя бы одно поле», как у категорий. `description: null` очищает описание.
- `listTransactionsQuerySchema`: необязательные `dateFrom`, `dateTo` (включительно), `type`, `categoryId`. Refine: `dateFrom <= dateTo`.
- `transactionSummaryQuerySchema`: `month` 1–12 и `year` 2000–2100, оба обязательные, через `z.coerce.number().int()` (query приходит строками).
- Схемы ответов `transactionSchema` и `transactionSummarySchema`, типы через `z.infer`:
  - транзакция: `{ id, amount, type, description, date, categoryId, createdAt }` без `userId`;
  - сводка: `{ month, year, income, expense, balance, byCategory: [{ categoryId, name, color, icon, type, total, count }] }`.

## Связь с категориями (CQRS, как auth → users)

`TransactionsModule` не импортирует `CategoriesModule`. Только `CategoriesRepository` обращается к `prisma.category`, поэтому в `categories/queries` добавляются:

- `GetCategoryQuery({ id, userId })` → `Category | null`, проверка, что категория принадлежит пользователю;
- `GetUserCategoriesQuery(userId)` → `Category[]`, названия, цвета и иконки для сводки.

Их handlers регистрируются в `CategoriesModule`. В `CategoriesRepository` добавляется `findOne(key)`, а `findAllByUser` переиспользуется.

`CategoriesService.remove` при P2003 отвечает «В категории есть транзакции» вместо «траты». Тест обновить.

## Модуль `apps/api/src/transactions/`

Файлы повторяют структуру categories:

- `transactions.module.ts`: controller, service, repository. Подключается в `app.module.ts`.
- `transactions.repository.ts`: единственный доступ к `prisma.transaction`.
  - `create(userId, data)`;
  - `findMany(userId, filters)`: сортировка `date desc, id desc`;
  - `findOne(key)`: `findUnique({ where: { id, userId } })`;
  - `update(key, data)`, `delete(key)`;
  - `sumByCategory(userId, from, to)`: `groupBy(['categoryId', 'type'])` с `_sum.amount` и `_count`, условие `date >= from && date < to`.
- `transaction.mapper.ts`, `toTransactionResponse`: `amount.toFixed(2)`, `date` → `YYYY-MM-DD`, без `userId`.
- `transactions.service.ts`:
  - `create`: категория проверяется через `GetCategoryQuery`, нет категории → 400 «Категория не найдена». Строка даты превращается в `new Date('YYYY-MM-DDT00:00:00Z')`.
  - `findAll(userId, query)`.
  - `findOne`: нет транзакции → 404 «Транзакция не найдена».
  - `update`: если передан `categoryId`, проверка как в `create`. P2025 → 404.
  - `remove`: P2025 → 404.
  - `summary(userId, { month, year })`: диапазон `[1-е число, 1-е число следующего месяца)`. Суммы через `Prisma.Decimal`, без float. `balance = income − expense`. `byCategory` склеивается с категориями из `GetUserCategoriesQuery` и сортируется по `total` по убыванию.
  - Хелпер `hasCode` дублировать не нужно: вынести его из categories в `src/common/prisma-errors.ts` вместе с константами кодов и использовать в обоих модулях.
- `transactions.controller.ts`, `@Controller('transactions')`:
  - `POST /` → 201;
  - `GET /` с `@Query(new ZodValidationPipe(listTransactionsQuerySchema))`;
  - `GET /summary` объявить **до** `GET /:id`;
  - `GET /:id`, `PATCH /:id`, `DELETE /:id` → 204. `id` проверяет `idPipe` (`z.uuid()`), как в categories.

## Тесты (Vitest)

- `transaction.schemas.spec.ts`:
  - сумма: строка и число, отклоняются `0`, отрицательные числа и три знака после запятой;
  - дата;
  - `dateFrom > dateTo`;
  - `month`/`year` из строк, отклоняются `13` и пропущенное значение.
- `transactions.service.spec.ts` по образцу `categories.service.spec.ts`:
  - чужая категория → 400;
  - 404 для `findOne`, `update` и `remove`;
  - маппинг без `userId` и сумма строкой;
  - сводка считает income, expense и balance, склеивает категории;
  - границы месяца, включая декабрь → январь следующего года.
- Обновить `categories.service.spec.ts` (текст 409).

## Документация

- `CLAUDE.md`: пункт «Транзакции (api)» о том, что модуль ходит в categories через `GetCategoryQuery`/`GetUserCategoriesQuery`, суммы передаются строками, дата хранится как `@db.Date`, `summary` объявлен раньше `:id`. Упоминание `Expense` убрать.
- Память: обновить состояние проекта.

## Проверка

1. `npm run build`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run format:check`.
2. `npm run dev`, затем curl с токеном из `/auth/register`:
   - создать категорию и две транзакции (INCOME и EXPENSE) → 201, `amount` приходит строкой;
   - `GET /transactions?type=EXPENSE&dateFrom=…&dateTo=…` возвращает только подходящие;
   - `GET /transactions/summary?month=10&year=2026` даёт верные income, expense, balance и byCategory; без `year` → 400;
   - `GET/PATCH/DELETE /transactions/:id` работают; чужой id → 404, не-uuid → 400;
   - транзакция с категорией другого пользователя → 400;
   - удаление категории с транзакциями → 409;
   - удаление пользователя в БД каскадом удаляет его категории и транзакции, проверка `NoAction`.
