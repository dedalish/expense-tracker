# Архитектура

Трекер доходов и расходов: монорепозиторий на npm workspaces из трёх пакетов.

## Общая схема

```
┌──────────┐  HTML, Server Actions  ┌─────────────────────┐  HTTP + JSON   ┌──────────────────────┐  SQL   ┌──────────────┐
│ Браузер  │ ─────────────────────► │ apps/web            │ ─────────────► │ apps/api             │ ─────► │ PostgreSQL 18│
│          │ ◄───────────────────── │ Next.js 16, :3000   │ ◄───────────── │ NestJS 12, :3001/api │ ◄───── │ Docker, :5432│
└──────────┘  cookie access_token   └─────────────────────┘  Bearer JWT    └──────────────────────┘ Prisma └──────────────┘
                                              ▲                                      ▲
                                              └──────── packages/shared (Zod) ───────┘
```

Принципы:

- **Браузер не обращается к API.** Страницы рендерит сервер Next. Данные меняются через Server Actions, они тоже выполняются на сервере Next. Поэтому токен не нужен JavaScript в браузере: он лежит в httpOnly cookie.
- **С базой работает только API.** Web о Prisma и PostgreSQL ничего не знает.
- **Один контракт на обе стороны.** Zod-схемы из `packages/shared` проверяют формы в web, тела запросов в API и ответы API в web. Типы TypeScript выводятся из тех же схем (`z.infer`).

## Пакеты

| Пакет                     | Роль                                                       | Зависит от                 |
| ------------------------- | ---------------------------------------------------------- | -------------------------- |
| `@expense-tracker/shared` | Zod-схемы запросов и ответов, выведенные типы, константы   | `zod`                      |
| `@expense-tracker/api`    | REST API, бизнес-логика, авторизация, доступ к БД          | shared, Nest, Prisma       |
| `@expense-tracker/web`    | Интерфейс: страницы, формы, сессия пользователя            | shared, Next, React        |

### packages/shared

- Исходники в `src/` (`auth.ts`, `category.ts`, `transaction.ts`, `health.ts`), экспорт через `index.ts`.
- **Собранный пакет:** `exports` указывает на `dist/`. Nest компилирует код через `tsc` и не умеет брать TS-исходники из чужого пакета.
- Когда пакет собирается:
  - `npm install` — через `postinstall`;
  - `npm run dev` — в режиме watch;
  - `npm run typecheck` — первым шагом.
- Порядок `workspaces: ["packages/*", "apps/*"]` в корневом `package.json` задаёт порядок сборки: shared собирается раньше приложений.

Схемы делятся на три вида:

- **входные:** `createTransactionSchema`, `registerSchema` и другие. Делают trim, приводят к нижнему регистру, преобразуют типы (`z.coerce` для query);
- **ответы:** `transactionSchema`, `transactionPageSchema`, `categorySchema`, `publicUserSchema`. По ним web разбирает ответы API;
- **константы:** `TRANSACTIONS_PAGE_SIZE`.

## apps/api — NestJS

ESM (`"type": "module"`), относительные импорты пишутся с `.js`. Все роуты под глобальным префиксом `/api`.

### Модули

```
AppModule
├── ConfigModule (global)   — переменные окружения, проверка Zod-схемой config/env.ts
├── CqrsModule.forRoot()    — CommandBus / QueryBus для связи модулей
├── PrismaModule (global)   — PrismaService: клиент Prisma через @prisma/adapter-pg
├── UsersModule             — пользователи; наружу только команды и запросы
├── AuthModule              — регистрация, вход, профиль, JWT, глобальный AuthGuard
├── CategoriesModule        — CRUD категорий; запросы для других модулей
├── TransactionsModule      — CRUD транзакций, фильтры, сводка за месяц
└── HealthModule            — проверка API и БД
```

### Слои внутри модуля

```
Controller ──► Service ──► Repository ──► PrismaService ──► БД
    │             │
    │             └──► QueryBus / CommandBus ──► Handler другого модуля
    └── ZodValidationPipe (схема из shared), @CurrentUser()
```

- **Controller.** Маршрут, проверка входных данных через `ZodValidationPipe`, текущий пользователь через `@CurrentUser()`. Логики в контроллере нет.
- **Service.** Бизнес-правила: принадлежность категории, перевод ошибок Prisma в HTTP-исключения, расчёт сводки.
- **Repository.** Единственный класс, который обращается к своей модели Prisma: `prisma.transaction`, `prisma.category`, `prisma.user`. Все запросы фильтруются по паре `id` + `userId`.
- **Mapper.** Превращает запись БД в ответ API. Убирает служебные поля (`userId`, `passwordHash`, `updatedAt`), переводит `Decimal` и `Date` в строки.

### Связь модулей через CQRS

Модули не импортируют друг друга и не внедряют чужие сервисы. Данные другого модуля получают только через шину.

| Кто спрашивает       | Команда или запрос                         | Владелец          |
| -------------------- | ------------------------------------------ | ----------------- |
| `AuthService`        | `CreateUserCommand`, `UpdateUserNameCommand` | `UsersModule`     |
| `AuthService`        | `GetUserByEmailQuery`, `GetUserByIdQuery`  | `UsersModule`     |
| `CategoriesService`  | `GetUserByIdQuery`                         | `UsersModule`     |
| `TransactionsService`| `GetCategoryQuery({ id, userId })`         | `CategoriesModule`|
| `TransactionsService`| `GetUserCategoriesQuery(userId)`           | `CategoriesModule`|

Новая связь между модулями добавляется так же: командой или запросом в папке `commands/` или `queries/` модуля-владельца.

### Сквозные механизмы

- **Авторизация.** `AuthGuard` зарегистрирован как `APP_GUARD` и закрывает все роуты.
  - Он проверяет JWT (HS256, секрет `JWT_SECRET`) из заголовка `Authorization: Bearer` и кладёт payload `{ sub, email }` в `request.user`.
  - Открытые роуты помечены `@Public()`: `health`, `auth/register`, `auth/login`.
- **Валидация.** `ZodValidationPipe` проверяет данные Zod-схемой. Если проверка не прошла, ответ 400 `{ message: 'Validation failed', errors: z.flattenError(...) }`. class-validator в проекте не используется.
- **Ошибки БД.** Коды Prisma лежат в `common/prisma-errors.ts`, сервисы переводят их в HTTP-статусы:

  | Код Prisma | Что произошло                                      | HTTP |
  | ---------- | -------------------------------------------------- | ---- |
  | `P2002`    | нарушено уникальное ограничение                    | 409  |
  | `P2003`    | нарушен внешний ключ (удаление категории с транзакциями) | 409  |
  | `P2025`    | запись не найдена (`update`/`delete`)              | 404  |

- **Пароли:** argon2id (`@node-rs/argon2`). Если email не найден, при входе всё равно выполняется «пустая» проверка пароля. Так по времени ответа нельзя понять, зарегистрирован ли email.
- **Документация:** Swagger на `/api/docs`, отключён при `NODE_ENV=production`. Схемы берутся из Zod через Standard Schema.

## apps/web — Next.js

App Router, React 19, Tailwind 4, shadcn/ui на Base UI. Код организован по Feature-Sliced Design.

### Роутинг и слои

- `apps/web/app/` — только роутинг Next: тонкие `page.tsx` и `layout.tsx`, которые реэкспортируют страницы из `src/pages`.
- `apps/web/src/` — слои FSD. Слой импортирует только из слоёв ниже себя:

```
app       — глобальные стили, провайдеры, layout'ы зоны (main)
pages     — страницы: home, transactions, categories, profile, login, register, privacy
widgets   — app-sidebar, month-summary, transactions-list
features  — auth, manage-category, manage-transaction, select-month, update-profile
entities  — user, category, transaction (запросы чтения и UI-элементы)
shared    — api-клиент, конфиг, утилиты, ui-кит shadcn
```

### Поток данных

**Чтение.** Серверный компонент страницы вызывает функцию из `entities/*/api`. Она обращается к `authedFetch`, а тот к `apiFetch`:

- `apiFetch` (`shared/api/client.ts`) отправляет `fetch` на `NEXT_PUBLIC_API_URL` и разбирает ответ схемой из shared. Ошибку HTTP превращает в `ApiError`;
- `authedFetch` (`shared/api/session.ts`) берёт токен из cookie `access_token`. При ответе 401 перенаправляет на `/logout`.

**Изменение:**

1. Форма (react-hook-form + `zodResolver`) проверяет данные схемой из shared.
2. Server Action из `features/*/api/actions.ts` проверяет те же данные повторно и вызывает API через `runMutation`.
3. При успехе вызывается `refresh()`, и страница перерисовывается с новыми данными.
4. При ошибке возвращается `ActionError`, и `applyActionError` переносит ошибки полей в форму.

**Сессия:**

- **Вход и регистрация.** Server Action получает `accessToken` от API и кладёт его в httpOnly cookie `access_token`. Срок cookie совпадает со сроком токена (`exp`), флаг `secure` ставится в production.
- **`proxy.ts`.** Это бывший middleware. Он смотрит только, есть ли cookie и не истёк ли срок, подпись не проверяет. Гостя отправляет на `/login`, вошедшего — с `/login` и `/register` на `/`. `/privacy` открыта всем.
- **Выход.** Route handler `/logout` очищает cookie.

**Часовой пояс.** `TimeZoneSync` записывает пояс браузера в cookie `tz`. По нему сервер определяет «текущий месяц» на главной.

## Ключевые решения

| Решение                                          | Почему                                                                                       |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Zod из shared вместо class-validator и DTO       | один контракт для web и api, nestjs-zod не поддерживает Nest 12                              |
| Деньги в `Decimal(12, 2)`, в JSON строкой        | float теряет копейки; вычисления в сервисе через `Prisma.Decimal`                            |
| Сумма всегда больше 0, знак задаёт `type`        | нет путаницы со знаками, сводка складывает доходы и расходы отдельно                         |
| Дата транзакции — `DATE`, в API `YYYY-MM-DD`     | часовой пояс не сдвигает операцию в соседний день                                            |
| Ключ записи — пара `id` + `userId`               | чужая запись неотличима от несуществующей: 404, а не 403                                     |
| Модули общаются через CQRS                       | у каждой модели один владелец, модули не связаны напрямую                                    |
| Токен в httpOnly cookie, API вызывается с сервера | JS в браузере не видит токен; CORS и адрес API не важны для браузера                         |
| UUID v7 для первичных ключей                     | упорядочены по времени, индексы растут последовательно                                       |
