# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Трекер расходов, учебный проект. Общение, документация и комментарии в коде на русском, идентификаторы на английском.

## Команды

Запускаются из корня (npm workspaces, Node 24 LTS, npm 11):

```bash
npm install                          # postinstall собирает packages/shared
npm run db:up                        # PostgreSQL 18 в Docker (docker-compose.yml)
npm run db:migrate -- --name <имя>   # prisma migrate dev в apps/api
npm run dev                          # concurrently: shared (tsc --watch) + api :3001 + web :3000
npm run build | lint | typecheck | test
npm run format | format:check        # Prettier на весь репозиторий
```

Один пакет: `npm run <script> -w @expense-tracker/api` (или `web`, `shared`).
Один тест (Vitest в api и web): `npm run test -w @expense-tracker/api -- src/health/health.controller.spec.ts` или `-- -t "<название теста>"`. Тесты лежат рядом с кодом как `*.spec.ts`. В web (`vitest.config.mts`: `.mts`, потому что пакет не ESM; алиас `@/*`, окружение node) пока тестируются чистые функции из `lib`-сегментов, например пагинация в `widgets/transactions-list/lib`.
Новая зависимость: `npm install <pkg> -w @expense-tracker/<пакет>`.

Перед первым запуском: `cp apps/api/.env.example apps/api/.env`, `cp apps/web/.env.example apps/web/.env.local`.

## Архитектура

- **`packages/shared`**: Zod-схемы и выведенные из них типы (`z.infer`), общий контракт web ↔ api. Это **собранный** пакет: `exports` указывают на `dist/`, а не на `src/`. Nest компилирует через tsc и не умеет брать TS-исходники из другого пакета. Поэтому после изменения shared нужен build. `npm run dev` пересобирает пакет автоматически, корневой `typecheck` собирает его первым. Порядок `workspaces: ["packages/*", "apps/*"]` в корневом `package.json` задаёт порядок сборки, его не менять.
- **`apps/api`**: NestJS 12 в режиме **ESM** (`"type": "module"`, `module: nodenext`). Относительные импорты пишутся **с `.js`**. Входные данные валидируются через `ZodValidationPipe` (`src/common/zod-validation.pipe.ts`) со схемами из shared, а не через class-validator: nestjs-zod не поддерживает Nest 12. Переменные окружения проверяет Zod-схема в `src/config/env.ts` (`ConfigModule.forRoot({ validate })`). Читать их нужно через `ConfigService<Env, true>` и `get(key, { infer: true })`. Global prefix `/api`, CORS для `WEB_ORIGIN`.
- **Prisma 7** (в `apps/api`): генератор `prisma-client` пишет клиент в `src/generated/prisma`. Эта папка в .gitignore. Импорт клиента: `../generated/prisma/client.js`. Подключение идёт через driver adapter `@prisma/adapter-pg` в `PrismaService` (`@Global` `PrismaModule`). URL базы задаётся в `prisma.config.ts`, а не в `schema.prisma`. `migrate dev` в Prisma 7 не запускает generate, поэтому скрипты api `dev`, `build`, `lint`, `typecheck` и `test` сначала вызывают `prisma generate`.
- **Авторизация (api)**: access-токен JWT (HS256, `@nestjs/jwt`), пароли argon2id (`@node-rs/argon2`). Модуль `users` владеет данными: `UsersRepository` единственный обращается к `prisma.user`, модуль ничего не экспортирует. Модуль `auth` работает с ним **только через `CommandBus`/`QueryBus`** (`@nestjs/cqrs`); команды и запросы лежат в `users/commands` и `users/queries`. Новую связь auth → users добавляйте как команду или запрос, а не инжектом сервиса. Наружу пользователь отдаётся только через `toPublicUser` (без `passwordHash`). `AuthGuard` глобальный (`APP_GUARD`): все роуты требуют `Authorization: Bearer`, открытые помечаются `@Public()` (health, register, login). Текущий пользователь — `@CurrentUser()`, его профиль: `GET /auth/me`, смена имени `PATCH /auth/me` (команда `UpdateUserNameCommand`; пользователя нет → 401, как и в `GET`). `JWT_SECRET` (≥ 32 символов) обязателен, `.env.example` содержит только заглушку. Регистрация требует `personalDataConsent: true` (согласие на обработку ПДн, 152-ФЗ). Время согласия ставит сервер в `User.personalDataConsentAt`. Поле nullable: у пользователей, зарегистрированных раньше, согласия нет.
- **Категории (api)**: модуль `categories` (`/api/categories`, CRUD). Категория принадлежит пользователю (`userId`, `onDelete: Cascade`), название уникально в пределах пользователя. `CategoriesRepository` единственный обращается к `prisma.category`; `update`/`delete` ищут по паре `id` + `userId`, поэтому чужая категория даёт 404. Пользователя проверяет через `GetUserByIdQuery`, `UsersModule` не импортирует. Наружу категория отдаётся через `toCategoryResponse` (без `userId`). Схемы `createCategorySchema`/`updateCategorySchema` в shared. Другим модулям категории доступны только через запросы `GetCategoryQuery({ id, userId })` и `GetUserCategoriesQuery(userId)` в `categories/queries`.
- **Транзакции (api)**: модуль `transactions` (`/api/transactions`) — доходы и расходы.
  - Эндпоинты: CRUD, фильтры списка `dateFrom`/`dateTo` (включительно), `type`, `categoryId` и сводка `GET /transactions/summary?month=&year=`. Роут `summary` объявлен раньше `:id`.
  - Список постраничный: `page` (с 1) и `pageSize` (по умолчанию `TRANSACTIONS_PAGE_SIZE` = 10, максимум 100). Ответ `{ items, total, page, pageSize }` (`transactionPageSchema`), страница за пределами данных даёт пустой `items`. Сортировка: дата, затем id по убыванию.
  - `TransactionsRepository` единственный обращается к `prisma.transaction`. Ключ — пара `id` + `userId`, поэтому чужая транзакция даёт 404.
  - Категорию проверяет через `GetCategoryQuery`, `CategoriesModule` не импортирует. Чужая или несуществующая категория в теле запроса даёт 400.
  - Суммы: в БД `Decimal(12, 2)`, всегда > 0, знак задаёт `type` (`INCOME`/`EXPENSE`). В JSON сумма передаётся **строкой** (`"1250.50"`), в сервисе считается через `Prisma.Decimal`, а не через number.
  - Дата хранится как `@db.Date`: в API это строка `YYYY-MM-DD`, в БД полночь UTC. Перевод в обе стороны: `toDbDate`/`fromDbDate` в `transaction.mapper.ts`.
  - Связь с категорией `onDelete: NoAction`, а не `Restrict`. Restrict в Postgres проверяется сразу и ломает каскадное удаление пользователя. Удалить категорию с транзакциями нельзя, ответ 409.
  - Коды ошибок Prisma и `hasPrismaCode` лежат в `src/common/prisma-errors.ts`.
- **`apps/web`**: Next.js 16, App Router, Turbopack. Tailwind 4 подключён через лоадер `@tailwindcss/turbopack` в `next.config.ts`, файла `postcss.config` нет. В Next 16 нет `next lint`: линтер запускается как `eslint .`, а `typecheck` сначала выполняет `next typegen` (глобальные типы `LayoutProps`/`PageProps`).
- **Архитектура web: Feature-Sliced Design.**
  - Роутинг Next лежит в `apps/web/app` (корень пакета, не `src`). Там только тонкие `page.tsx`/`layout.tsx`/`route.ts`: реэкспорт страницы из `@/pages/*` (`export { LoginPage as default, metadata } from '@/pages/login'`). Логику и разметку туда не писать.
  - Страницы вошедшего пользователя лежат в route group `app/(main)/` (`/`, `/transactions`, `/categories`, `/profile`). Его `layout`/`loading`/`error` реэкспортируют `src/app/layouts/main-*`: боковое меню `widgets/app-sidebar`, скелетон и экран ошибки (в Next 16 проп `retry`, а не `reset`). Layout проверяет пользователя и рендерит `Toaster` (sonner).
  - Слои в `apps/web/src` (алиас `@/*`), сверху вниз: `app` (глобальные стили `app/styles/globals.css`, провайдеры) → `pages` → `widgets` → `features` → `entities` → `shared`. Слой импортирует только из слоёв ниже себя. Слайсы одного слоя друг друга не импортируют.
  - Слайс (`features/auth`, `entities/user`, `pages/login`) делится на сегменты `ui`, `api`, `model`, `lib`, `config`. Снаружи слайс доступен только через `index.ts`. Внутри слайса импорты относительные.
  - `shared` без слайсов и без `index.ts`: импорт по файлу (`@/shared/ui/button`, `@/shared/api/client`).
  - Пустая `apps/web/pages/` (с README) обязательна: без неё Next принял бы `src/pages` за Pages Router.
- **UI web: shadcn/ui** (стиль `base-nova`, примитивы Base UI, иконки lucide). Компоненты лежат в `src/shared/ui`, `components.json` направляет туда алиасы. Там же собственные общие компоненты (`page-header`, `confirm-dialog`, `text-field`, `form-error`). Новый компонент: `npx shadcn@latest add <name>` из `apps/web`, потом `npm run format`. Сгенерированные компоненты руками не переписывать без нужды. Исключение: `shared/lib/hooks/use-mobile.ts` переписан на `useSyncExternalStore`, потому что сгенерированная версия нарушает `react-hooks/set-state-in-effect`; при `shadcn add` его не перезаписывать. `PaginationLink` shadcn рендерит `<a>`, поэтому ссылки пагинации собраны из `Button` с `render={<Link />}`. Из-за папки `pages` Next типизирует `usePathname`/`useSearchParams` как nullable.
- **Авторизация web**: JWT хранится в httpOnly cookie `access_token` (`shared/config/session.ts`), JS в браузере его не видит. Cookie ставят Server Actions из `features/auth/api/actions.ts` (`loginAction`, `registerAction`, `logoutAction`), срок cookie берётся из `exp` токена. Запросы к api идут только с сервера Next через `apiFetch` (`shared/api/client.ts`, `server-only`): ответ разбирается схемой из shared, ошибка HTTP превращается в `ApiError` со `status`, `message` и `fieldErrors`. Запросы от имени пользователя идут через `authedFetch` (`shared/api/session.ts`): берёт токен из cookie, при 401 делает `redirect('/logout')`. Там же `clearSessionCookie` для route handler `/logout`. Index слайса не должен реэкспортировать `server-only` код: его импортируют и клиентские компоненты. Текущий пользователь — `getCurrentUser()` из `entities/user` (`/auth/me`, кэш на запрос). `proxy.ts` (бывший middleware) по наличию и сроку cookie отправляет гостя на `/login`, а вошедшего с `/login`/`/register` на `/`. Страницы, открытые всем (`/privacy` с политикой обработки ПДн), перечислены в `PUBLIC_PATHS`. Подпись в proxy не проверяется. Если api токен не принял, страница перенаправляет на `/logout` (route handler чистит cookie).
- **Формы web**: react-hook-form + `zodResolver` со схемами из shared, поля через `Field`/`FieldError` shadcn. Типы формы — `useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>`, потому что схемы делают trim/lowercase. Server Action проверяет ту же схему повторно (`toValidationError`; `shared/api/action-error.ts` подключает русскую локаль Zod и на сервере), а `id` из аргументов — через `validateId`, потому что он попадает в путь запроса к api. Server Action и возвращает `ActionError | undefined`. Изменение данных оборачивается в `runMutation` (`shared/api/action-error.ts`): ошибку api превращает в `ActionError`, при успехе вызывает `refresh()` из `next/cache`, а `redirect` из `authedFetch` пропускает через `unstable_rethrow`. Ошибку в форму переносит `applyActionError` (`shared/lib/action-error.ts`). Общие поля и блоки форм лежат в shared: `TextField`, `FormError`, `ConfirmDialog` (подтверждение удаления с toast). Форма в диалоге — отдельный внутренний компонент: Base UI размонтирует содержимое закрытого диалога, и форма каждый раз открывается со свежими значениями.
- **Страница транзакций**: параметры URL (`type`, `categoryId`, `page`) проверяет по одному `normalizeTransactionsSearch` из `widgets/transactions-list`; лишние и битые убираются редиректом, `pageSize` из URL не берётся (всегда `TRANSACTIONS_PAGE_SIZE`). Страница за пределами списка перенаправляет на последнюю. Русские тексты ошибок Zod задаются глобально в `shared/config/zod.ts` (импорт ради побочного эффекта в клиентских формах), не в схемах shared. Исключение — предметные проверки вроде `refine` согласия: их текст задан в самой схеме.

## Зафиксированные версии (не поднимать на `@latest`)

- **TypeScript ~6.0**: на 7.x ломается typescript-eslint (поддерживает < 6.1), Nest CLI собирает на 6.0.
- **ESLint ^9**: плагины `eslint-config-next` не поддерживают ESLint 10.
- **Prisma ^7**: `prisma@latest` указывает на 8.0 RC с другим API.
- В TS 6 по умолчанию `types: []`, поэтому `types` в tsconfig задаётся явно.

## Стиль

Prettier: одинарные кавычки, `trailingComma: all`, ширина 80. Корневая `.claude/` (планы, промпты, шаблоны) исключена в `.prettierignore`, её файлы не форматировать. `prettier-plugin-tailwindcss` сортирует классы. ESLint-конфиги свои в каждом пакете (`eslint.config.mjs`). В api включён type-aware `recommendedTypeChecked`.

## Ветки (GitHub flow)

- `main` всегда рабочая: проходит `build`, `lint`, `typecheck`, `test`, `format:check`. Напрямую в `main` не коммитить.
- Каждая фича или исправление делается в отдельной ветке от свежего `main`: `git switch main && git pull && git switch -c <ветка>`.
- Имя ветки: `<type>/<scope>-<кратко>` латиницей в kebab-case, `type` и `scope` те же, что в коммитах: `feat/web-home`, `fix/api-transactions-summary`, `docs/claude-md`.
- Одна ветка — одна фича. Работа, не относящаяся к ней, уходит в отдельную ветку.
- Ветка вливается в `main` через pull request после зелёных проверок. Влитая ветка удаляется.
- Ветку и PR создавать только по просьбе пользователя.

## Коммиты

[Conventional Commits](https://www.conventionalcommits.org/ru/v1.0.0/): `<type>(<scope>): <описание>`.

- **type**: `feat` (новая функциональность), `fix`, `refactor`, `perf`, `test`, `docs`, `style` (форматирование), `build` (зависимости, сборка), `ci`, `chore`.
- **scope**: пакет или область — `api`, `web`, `shared`, `db` (схема Prisma и миграции). Изменение нескольких пакетов: scope по главному или без scope.
- **Описание** на русском, со строчной буквы, без точки в конце, до 72 символов, отвечает на вопрос «что сделано»: `feat(api): модуль транзакций`.
- **Тело** (через пустую строку) объясняет «зачем» и отступления от задачи. Ломающее изменение API помечается `!` (`feat(api)!: …`) и строкой `BREAKING CHANGE: …` в теле.
- Один коммит — одна логическая единица: фича вместе со своей миграцией, тестами и правками CLAUDE.md. Миграция Prisma не отделяется от схемы.
- Перед коммитом: `npm run build`, `lint`, `typecheck`, `test`, `format:check`. Коммитить только по просьбе пользователя, `.env` не коммитить.
