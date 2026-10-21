# apps/api — бэкенд (NestJS 12)

Правила пакета api. Общие правила монорепозитория (команды, shared, версии, стиль, ветки, коммиты) — в корневом `CLAUDE.md`.

## Команды

Из корня: `npm run <script> -w @expense-tracker/api`.

- `dev`, `build`, `lint`, `typecheck`, `test` — каждый сначала вызывает `prisma generate`; `test:watch` — Vitest в режиме наблюдения.
- `db:migrate` (`prisma migrate dev`, из корня `npm run db:migrate -- --name <имя>`), `db:deploy`, `db:generate`, `db:studio`.
- `prisma migrate dev` падает в неинтерактивной оболочке, если показывает предупреждения. Обходной путь: `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` в новую папку `prisma/migrations/<время>_<имя>/migration.sql`, затем `db:deploy`.

## Стек

- **NestJS 12** в режиме **ESM** (`"type": "module"`, `module: nodenext`). Относительные импорты пишутся **с `.js`**. Входные данные валидируются через `ZodValidationPipe` (`src/common/zod-validation.pipe.ts`) со схемами из shared, а не через class-validator: nestjs-zod не поддерживает Nest 12. Переменные окружения проверяет Zod-схема в `src/config/env.ts` (`ConfigModule.forRoot({ validate })`). Читать их нужно через `ConfigService<Env, true>` и `get(key, { infer: true })`. Global prefix `/api`, CORS для `WEB_ORIGIN`.
- **Prisma 7**: генератор `prisma-client` пишет клиент в `src/generated/prisma`. Эта папка в .gitignore. Импорт клиента: `../generated/prisma/client.js`. Подключение идёт через driver adapter `@prisma/adapter-pg` в `PrismaService` (`@Global` `PrismaModule`). URL базы задаётся в `prisma.config.ts`, а не в `schema.prisma`. `migrate dev` в Prisma 7 не запускает generate, поэтому скрипты `dev`, `build`, `lint`, `typecheck` и `test` сначала вызывают `prisma generate`.
- **ESLint**: включён type-aware `recommendedTypeChecked`.

## Модули

Общий принцип: репозиторий модуля единственный обращается к своей модели Prisma, а другие модули получают данные только через `CommandBus`/`QueryBus` (`@nestjs/cqrs`), без импорта чужого модуля и инжекта его сервиса. Новый модуль строится так же.

- **Авторизация**: access-токен JWT (HS256, `@nestjs/jwt`), пароли argon2id (`@node-rs/argon2`). Модуль `users` владеет данными: `UsersRepository` единственный обращается к `prisma.user`, модуль ничего не экспортирует. Модуль `auth` работает с ним **только через `CommandBus`/`QueryBus`** (`@nestjs/cqrs`); команды и запросы лежат в `users/commands` и `users/queries`. Новую связь auth → users добавляйте как команду или запрос, а не инжектом сервиса. Наружу пользователь отдаётся только через `toPublicUser` (без `passwordHash`). `AuthGuard` глобальный (`APP_GUARD`): все роуты требуют `Authorization: Bearer`, открытые помечаются `@Public()` (health, register, login). Текущий пользователь — `@CurrentUser()`, его профиль: `GET /auth/me`, смена имени `PATCH /auth/me` (команда `UpdateUserNameCommand`; пользователя нет → 401, как и в `GET`). `JWT_SECRET` (≥ 32 символов) обязателен, `.env.example` содержит только заглушку. Регистрация требует `personalDataConsent: true` (согласие на обработку ПДн, 152-ФЗ). Время согласия ставит сервер в `User.personalDataConsentAt`. Поле nullable: у пользователей, зарегистрированных раньше, согласия нет.
- **Категории**: модуль `categories` (`/api/categories`, CRUD). Категория принадлежит пользователю (`userId`, `onDelete: Cascade`), название уникально в пределах пользователя. `CategoriesRepository` единственный обращается к `prisma.category`; `update`/`delete` ищут по паре `id` + `userId`, поэтому чужая категория даёт 404. Пользователя проверяет через `GetUserByIdQuery`, `UsersModule` не импортирует. Наружу категория отдаётся через `toCategoryResponse` (без `userId`). Схемы `createCategorySchema`/`updateCategorySchema` в shared. Другим модулям категории доступны только через запросы `GetCategoryQuery({ id, userId })` и `GetUserCategoriesQuery(userId)` в `categories/queries`.
- **Транзакции**: модуль `transactions` (`/api/transactions`) — доходы и расходы.
  - Эндпоинты: CRUD, фильтры списка `dateFrom`/`dateTo` (включительно), `type`, `categoryId` и сводка `GET /transactions/summary?month=&year=`. Роут `summary` объявлен раньше `:id`.
  - Список постраничный: `page` (с 1) и `pageSize` (по умолчанию `TRANSACTIONS_PAGE_SIZE` = 10, максимум 100). Ответ `{ items, total, page, pageSize }` (`transactionPageSchema`), страница за пределами данных даёт пустой `items`. Сортировка: дата, затем id по убыванию.
  - `TransactionsRepository` единственный обращается к `prisma.transaction`. Ключ — пара `id` + `userId`, поэтому чужая транзакция даёт 404.
  - Категорию проверяет через `GetCategoryQuery`, `CategoriesModule` не импортирует. Чужая или несуществующая категория в теле запроса даёт 400.
  - Суммы: в БД `Decimal(12, 2)`, всегда > 0, знак задаёт `type` (`INCOME`/`EXPENSE`). В JSON сумма передаётся **строкой** (`"1250.50"`), в сервисе считается через `Prisma.Decimal`, а не через number.
  - Дата хранится как `@db.Date`: в API это строка `YYYY-MM-DD`, в БД полночь UTC. Перевод в обе стороны: `toDbDate`/`fromDbDate` в `transaction.mapper.ts`.
  - Связь с категорией `onDelete: NoAction`, а не `Restrict`. Restrict в Postgres проверяется сразу и ломает каскадное удаление пользователя. Удалить категорию с транзакциями нельзя, ответ 409.
  - Коды ошибок Prisma и `hasPrismaCode` лежат в `src/common/prisma-errors.ts`.

## Тесты

Vitest, файлы `*.spec.ts` рядом с кодом. `Test.createTestingModule` не используется: тестируемый класс создаётся через `new`, а зависимости — объекты с `vi.fn()` в функции `setup()`, приведённые через `as unknown as <Тип>`. Ошибки Prisma имитируются через `Prisma.PrismaClientKnownRequestError` с нужным кодом. Образец: `src/users/commands/update-user-name.handler.spec.ts`.
