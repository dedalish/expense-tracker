# Expense Tracker

Учебный трекер личных финансов: доходы и расходы по категориям, список операций с фильтрами и постраничным выводом, сводка за месяц с балансом и разбивкой по категориям.

Монорепозиторий на npm workspaces из трёх пакетов. Браузер общается только с Next.js, а Next.js обращается к API со своего сервера. С базой данных работает только API.

```
браузер ──► apps/web (Next.js, :3000) ──HTTP──► apps/api (NestJS, :3001/api) ──► PostgreSQL (:5432)
                    └──────── packages/shared (Zod-схемы и типы) ────────┘
```

## Стек

| Пакет             | Технологии                                                                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web`        | Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4, shadcn/ui (Base UI), react-hook-form, Feature-Sliced Design, Vitest            |
| `apps/api`        | NestJS 12 (ESM), Prisma 7 + PostgreSQL 18, CQRS (`@nestjs/cqrs`), JWT (`@nestjs/jwt`), argon2, Swagger (`@nestjs/swagger`), Vitest           |
| `packages/shared` | Zod 4: схемы запросов и ответов и выведенные из них типы. Общий контракт web и api: один и тот же код проверяет данные в формах и на сервере |

Общее: TypeScript 6.0, ESLint 9, Prettier.

## Требования

- **Node.js 24 LTS** (версия указана в `.nvmrc`: `nvm use`) и **npm 11**, он идёт вместе с Node.
- **Docker** с Docker Compose: в нём запускается PostgreSQL.
- Свободные порты **3000** (web), **3001** (api) и **5432** (PostgreSQL).

## Быстрый старт

```bash
# 1. Зависимости. postinstall сразу собирает packages/shared.
npm install

# 2. Переменные окружения (подробно в разделе ниже)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# В apps/api/.env замените JWT_SECRET: openssl rand -base64 48

# 3. PostgreSQL в Docker
npm run db:up

# 4. Применить миграции из репозитория
npm run db:deploy -w @expense-tracker/api

# 5. Запуск: shared (watch) + api + web
npm run dev
```

После запуска:

- **Web:** http://localhost:3000. Без входа откроется `/login`, аккаунт создаётся на `/register`.
- **API:** http://localhost:3001/api/health, ожидается ответ `{"status":"ok","database":"up",…}`.
- **Swagger UI:** http://localhost:3001/api/docs, JSON-спецификация на http://localhost:3001/api/docs-json. Для защищённых роутов нажмите **Authorize** и вставьте `accessToken` из ответа `POST /api/auth/login`.

Чтобы пользоваться приложением, создайте хотя бы одну категорию на `/categories`: транзакция всегда относится к категории.

## Переменные окружения

Каждое приложение читает свой файл. Примеры с комментариями лежат рядом: `.env.example`. Файлы `.env` и `.env.local` в git не попадают.

### `apps/api/.env`

API проверяет переменные Zod-схемой (`apps/api/src/config/env.ts`) при старте. Если значение неверное, приложение не запустится и выведет список ошибок.

| Переменная       | Обязательна | По умолчанию            | Описание                                                                                                                         |
| ---------------- | ----------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`   | да          | —                       | Строка подключения к PostgreSQL, протокол `postgres://` или `postgresql://`. Значение из примера подходит к `docker-compose.yml` |
| `JWT_SECRET`     | да          | —                       | Секрет подписи JWT (HS256), **не короче 32 символов**. В примере заглушка, замените её: `openssl rand -base64 48`                |
| `PORT`           | нет         | `3001`                  | Порт API                                                                                                                         |
| `WEB_ORIGIN`     | нет         | `http://localhost:3000` | Origin фронтенда, для него разрешён CORS                                                                                         |
| `JWT_EXPIRES_IN` | нет         | `1d`                    | Срок жизни access-токена в формате `ms`: `15m`, `12h`, `7d`. Refresh-токена нет, по истечении срока нужно войти заново           |
| `NODE_ENV`       | нет         | `development`           | `development`, `production` или `test`. При `production` Swagger UI (`/api/docs`) выключен                                       |

Пример (`apps/api/.env.example`):

```dotenv
DATABASE_URL="postgresql://expense:expense@localhost:5432/expense_tracker?schema=public"
PORT=3001
WEB_ORIGIN=http://localhost:3000
JWT_SECRET=change-me-to-a-random-string-of-at-least-32-chars
JWT_EXPIRES_IN=1d
NODE_ENV=development
```

Prisma CLI (`migrate`, `studio`) берёт `DATABASE_URL` из этого же файла через `prisma.config.ts`.

### `apps/web/.env.local`

| Переменная            | Обязательна | По умолчанию                | Описание                                                                                   |
| --------------------- | ----------- | --------------------------- | ------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL` | нет         | `http://localhost:3001/api` | Базовый URL API вместе с префиксом `/api`. Запросы к нему делает сервер Next, а не браузер |

Значение подставляется при сборке (`next build`). После изменения переменной перезапустите `dev` или пересоберите web.

### PostgreSQL (`docker-compose.yml`)

Менять ничего не нужно. Если нужны другие учётные данные или порт, задайте переменные в `.env` в корне репозитория (его читает Docker Compose) и поправьте `DATABASE_URL` под них.

| Переменная          | По умолчанию      |
| ------------------- | ----------------- |
| `POSTGRES_USER`     | `expense`         |
| `POSTGRES_PASSWORD` | `expense`         |
| `POSTGRES_DB`       | `expense_tracker` |
| `POSTGRES_PORT`     | `5432`            |

Данные хранятся в Docker volume `postgres-data`, поэтому `npm run db:down` их не удаляет.

## Структура проекта

```
.
├── apps/
│   ├── api/                      # NestJS, REST под /api
│   │   ├── prisma/               # schema.prisma и migrations/
│   │   └── src/
│   │       ├── auth/             # регистрация, вход, JWT, глобальный AuthGuard, @CurrentUser()
│   │       ├── users/            # данные пользователей; команды и запросы CQRS
│   │       ├── categories/       # CRUD категорий; запросы для других модулей
│   │       ├── transactions/     # CRUD транзакций, фильтры, сводка за месяц
│   │       ├── health/           # проверка API и базы
│   │       ├── prisma/           # PrismaService (глобальный модуль)
│   │       ├── common/           # ZodValidationPipe, коды ошибок Prisma, схемы ошибок для Swagger
│   │       ├── config/env.ts     # проверка переменных окружения
│   │       └── main.ts           # префикс /api, CORS, Swagger
│   └── web/                      # Next.js
│       ├── app/                  # роутинг: только тонкие page.tsx и layout.tsx
│       ├── proxy.ts              # редирект гостя на /login, вошедшего на /
│       └── src/                  # слои FSD: app → pages → widgets → features → entities → shared
├── packages/
│   └── shared/src/               # Zod-схемы: auth, category, transaction, health
├── docker-compose.yml            # PostgreSQL 18
├── CLAUDE.md, REVIEW.md          # правила разработки и code review
└── package.json                  # workspaces и общие скрипты
```

`packages/shared` — собранный пакет: api и web импортируют его из `dist/`. `npm install` и `npm run dev` собирают его сами. Если вы изменили shared и запускаете только один пакет, сначала выполните `npm run build -w @expense-tracker/shared`.

### Страницы web

| Путь            | Что там                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| `/login`        | вход                                                                     |
| `/register`     | регистрация с согласием на обработку персональных данных                 |
| `/privacy`      | политика обработки персональных данных, открыта без входа                |
| `/`             | сводка за месяц (`?month=YYYY-MM`): доход, расход, баланс, по категориям |
| `/transactions` | список транзакций с фильтрами и страницами, создание и изменение         |
| `/categories`   | категории: название, цвет, иконка                                        |
| `/profile`      | профиль, смена имени                                                     |
| `/logout`       | выход: очищает cookie сессии                                             |

## API

Все пути начинаются с `/api`. Тела запросов и ответов в JSON. Полное описание схем находится в Swagger: http://localhost:3001/api/docs.

**Авторизация.** Все роуты, кроме `register`, `login` и `health`, требуют заголовок `Authorization: Bearer <accessToken>`. Без токена или с невалидным токеном ответ 401. Пользователь видит только свои данные, чужая запись даёт 404.

| Метод    | Путь                                 | Описание                                                                                      |
| -------- | ------------------------------------ | --------------------------------------------------------------------------------------------- |
| `GET`    | `/health`                            | состояние API и базы, без авторизации                                                         |
| `POST`   | `/auth/register`                     | регистрация `{ name, email, password, personalDataConsent: true }` → `{ accessToken, user }`  |
| `POST`   | `/auth/login`                        | вход `{ email, password }` → `{ accessToken, user }`                                          |
| `GET`    | `/auth/me`                           | текущий пользователь                                                                          |
| `PATCH`  | `/auth/me`                           | смена имени `{ name }`                                                                        |
| `GET`    | `/categories`                        | категории пользователя                                                                        |
| `POST`   | `/categories`                        | создать `{ name, color: "#rrggbb", icon }`, название уникально у пользователя (иначе 409)     |
| `PATCH`  | `/categories/:id`                    | изменить одно или несколько полей                                                             |
| `DELETE` | `/categories/:id`                    | удалить, ответ 204; если у категории есть транзакции, ответ 409                               |
| `GET`    | `/transactions`                      | список: `?page&pageSize&type&categoryId&dateFrom&dateTo` → `{ items, total, page, pageSize }` |
| `GET`    | `/transactions/summary?month=&year=` | сводка за месяц: `income`, `expense`, `balance`, `byCategory`                                 |
| `GET`    | `/transactions/:id`                  | одна транзакция                                                                               |
| `POST`   | `/transactions`                      | создать `{ amount, type, date, categoryId, description? }`                                    |
| `PATCH`  | `/transactions/:id`                  | изменить одно или несколько полей                                                             |
| `DELETE` | `/transactions/:id`                  | удалить, ответ 204                                                                            |

Форматы данных:

- **Сумма** (`amount`) всегда больше нуля, до двух знаков после точки. В запросе можно передать число или строку, в ответе это строка: `"1250.50"`. Доход или расход задаёт поле `type`: `INCOME` или `EXPENSE`.
- **Дата** (`date`, `dateFrom`, `dateTo`) передаётся в формате `YYYY-MM-DD`. Границы фильтра включаются в выборку.
- **Пагинация:** `page` начинается с 1, `pageSize` по умолчанию 10, не больше 100.
- **Ошибка валидации** — 400 с телом `{ "message": "Validation failed", "errors": { "formErrors": [], "fieldErrors": { "<поле>": ["…"] } } }`. Другие ошибки возвращаются в формате Nest: `{ "statusCode", "message", "error" }`.

Пример:

```bash
TOKEN=$(curl -s -X POST localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"me@example.com","password":"secret123"}' | jq -r .accessToken)

curl -s "localhost:3001/api/transactions/summary?month=10&year=2026" \
  -H "Authorization: Bearer $TOKEN"
```

## Скрипты

Запускаются из корня репозитория.

| Команда                              | Что делает                                                    |
| ------------------------------------ | ------------------------------------------------------------- |
| `npm run dev`                        | shared в режиме watch, api и web с hot reload                 |
| `npm run build`                      | сборка всех пакетов: shared → api → web                       |
| `npm run lint`                       | ESLint во всех пакетах                                        |
| `npm run typecheck`                  | проверка типов (сначала собирает shared)                      |
| `npm run test`                       | тесты Vitest в api и web                                      |
| `npm run format` / `format:check`    | Prettier                                                      |
| `npm run db:up` / `db:down`          | запустить или остановить PostgreSQL                           |
| `npm run db:migrate -- --name <имя>` | создать миграцию по изменениям `schema.prisma` и применить её |
| `npm run db:generate`                | сгенерировать Prisma Client                                   |
| `npm run db:studio`                  | открыть Prisma Studio                                         |

Один пакет: `npm run <скрипт> -w @expense-tracker/<api|web|shared>`. Например, `npm run db:deploy -w @expense-tracker/api` применяет миграции без создания новых.
Один тест: `npm run test -w @expense-tracker/api -- src/health/health.controller.spec.ts`.
Новая зависимость: `npm install <пакет> -w @expense-tracker/<пакет>`.

## Частые проблемы

- **API не стартует с ошибкой «Некорректные переменные окружения».** Нет `apps/api/.env`, или `JWT_SECRET` короче 32 символов, или `DATABASE_URL` не начинается с `postgres(ql)://`.
- **`/api/health` возвращает `"database":"down"`.** Не запущен контейнер (`npm run db:up`, проверить через `docker compose ps`) или порт 5432 занят другим PostgreSQL.
- **Ошибки «таблица не существует».** Не применены миграции: `npm run db:deploy -w @expense-tracker/api`.
- **web или api не видят изменений в `packages/shared`.** Пересоберите пакет: `npm run build -w @expense-tracker/shared`. При `npm run dev` это происходит автоматически.
- **api падает, если запустить `npm run build` одновременно с `npm run dev`.** Сборка api очищает `apps/api/dist`, из которой работает dev-сервер. Пока работает dev, собирайте только нужный пакет, например `npm run build -w @expense-tracker/web`.

## Почему зафиксированы версии

- **TypeScript 6.0, а не 7.0**: typescript-eslint поддерживает только < 6.1, Nest CLI собирает на 6.0.
- **ESLint 9, а не 10**: плагины `eslint-config-next` пока не поддерживают ESLint 10.
- **Prisma 7**: `prisma@latest` указывает на RC 8.0 с другим API. При обновлении указывайте `prisma@7`.

## Разработка

- Работа ведётся по GitHub flow: ветка от `main`, затем pull request. Коммиты пишутся по Conventional Commits. Подробные правила лежат в `CLAUDE.md`, `apps/api/CLAUDE.md` и `apps/web/CLAUDE.md`, правила ревью — в `REVIEW.md`.
- Перед PR должны проходить `npm run build`, `lint`, `typecheck`, `test` и `format:check`.

## Актуализация документации

После изменения любых методов необходимо актуализировать или добавить JSDoc. А для dto и контроллеров добавить декораторы swagger.
