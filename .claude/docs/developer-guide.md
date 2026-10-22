# Гайд для разработчиков

Как запустить проект, как устроена работа с кодом и как добавить новую функциональность. Как всё устроено, описано в [architecture.md](architecture.md), эндпоинты — в [api.md](api.md), таблицы — в [database.md](database.md).

## 1. Первый запуск

Нужны Node.js 24 LTS (`nvm use` по `.nvmrc`), npm 11 и Docker. Порты 3000, 3001 и 5432 должны быть свободны.

```bash
npm install                                    # зависимости + сборка packages/shared
cp apps/api/.env.example apps/api/.env         # заменить JWT_SECRET: openssl rand -base64 48
cp apps/web/.env.example apps/web/.env.local
npm run db:up                                  # PostgreSQL 18 в Docker
npm run db:deploy -w @expense-tracker/api      # применить миграции
npm run dev                                    # shared (watch) + api :3001 + web :3000
```

Проверка:

- http://localhost:3001/api/health → `"status":"ok"`;
- http://localhost:3000 → страница входа; зарегистрируйтесь и создайте категорию;
- http://localhost:3001/api/docs → Swagger.

### Переменные окружения

| Файл                  | Переменная            | Обязательна | По умолчанию                | Что задаёт                                                     |
| --------------------- | --------------------- | ----------- | --------------------------- | -------------------------------------------------------------- |
| `apps/api/.env`       | `DATABASE_URL`        | да          | —                           | подключение к PostgreSQL (`postgres://` или `postgresql://`)   |
| `apps/api/.env`       | `JWT_SECRET`          | да          | —                           | секрет подписи JWT, не короче 32 символов                      |
| `apps/api/.env`       | `PORT`                | нет         | `3001`                      | порт API                                                       |
| `apps/api/.env`       | `WEB_ORIGIN`          | нет         | `http://localhost:3000`     | origin для CORS                                                |
| `apps/api/.env`       | `JWT_EXPIRES_IN`      | нет         | `1d`                        | срок жизни токена (`15m`, `12h`, `7d`)                         |
| `apps/api/.env`       | `NODE_ENV`            | нет         | `development`               | при `production` Swagger выключен                              |
| `apps/web/.env.local` | `NEXT_PUBLIC_API_URL` | нет         | `http://localhost:3001/api` | адрес API для сервера Next, подставляется при сборке           |
| `.env` в корне        | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` | нет | `expense` / `expense` / `expense_tracker` / `5432` | параметры контейнера PostgreSQL |

Переменные API проверяются Zod-схемой `apps/api/src/config/env.ts` при старте: если значение неверное, приложение не запустится и напишет, что не так. Новую переменную добавляйте в схему, в `.env.example` и в таблицу README.

## 2. Команды

Из корня репозитория:

| Команда                                    | Что делает                                          |
| ------------------------------------------ | --------------------------------------------------- |
| `npm run dev`                              | все пакеты в режиме разработки                      |
| `npm run build`                            | сборка shared → api → web                           |
| `npm run lint` / `typecheck` / `test`      | проверки во всех пакетах                            |
| `npm run format` / `format:check`          | Prettier                                            |
| `npm run db:up` / `db:down`                | запустить или остановить PostgreSQL                 |
| `npm run db:migrate -- --name <имя>`       | новая миграция по изменениям схемы                  |
| `npm run db:deploy -w @expense-tracker/api`| применить существующие миграции                     |
| `npm run db:studio`                        | Prisma Studio                                       |

Один пакет: `npm run <скрипт> -w @expense-tracker/<api|web|shared>`.
Один тест: `npm run test -w @expense-tracker/api -- src/health/health.controller.spec.ts` или `-- -t "<название теста>"`.
Новая зависимость: `npm install <пакет> -w @expense-tracker/<пакет>`.

**Подводные камни:**

- **`npm run build` при запущенном `dev` роняет api.** `nest build` очищает `apps/api/dist`, из которой работает dev-сервер. Пока работает dev, собирайте только нужный пакет.
- **Изменения в `packages/shared` не видны.** Пакет собирается в `dist/`. В `dev` он пересобирается сам, иначе выполните `npm run build -w @expense-tracker/shared`.
- **`prisma migrate dev` падает в неинтерактивной оболочке (CI, скрипты), если хочет показать предупреждение.** Обходной путь:
  1. Сгенерируйте SQL командой `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` из `apps/api`.
  2. Положите его в новую папку `prisma/migrations/<время>_<имя>/migration.sql`.
  3. Примените миграции: `db:deploy`.
- **Зафиксированные версии не поднимать:** TypeScript ~6.0, ESLint ^9, Prisma ^7. Причины описаны в README.

## 3. Процесс работы (GitHub flow)

1. Ветка от свежего `main`: `git switch main && git pull && git switch -c <type>/<scope>-<кратко>`. Например, `feat/api-budgets`, `fix/web-pagination`, `docs/readme`.
2. Одна ветка — одна фича. Посторонние правки уходят в отдельную ветку.
3. Коммиты по Conventional Commits, описание на русском со строчной буквы: `feat(api): лимиты бюджета`.
   - `type`: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `build`, `ci`, `chore`;
   - `scope`: `api`, `web`, `shared`, `db`;
   - ломающее изменение API помечается `!` и строкой `BREAKING CHANGE:` в теле коммита.
4. Перед PR должны проходить `npm run build`, `lint`, `typecheck`, `test` и `format:check`. В CI эти проверки не запускаются, их запускают локально.
5. PR создаётся через `gh pr create`. Заголовок — обычная фраза на русском. Разделы описания: «Что сделано», «API», «Изменения в коде», «Проверка».
6. Каждый PR ревьюит Claude в GitHub Actions (`claude-code-review.yml`), в обсуждениях можно позвать `@claude`. Правила ревью лежат в `REVIEW.md`.
7. Влитая ветка удаляется.

## 4. Стиль кода

- Комментарии, документация и тексты ошибок пишутся на русском, идентификаторы — на английском.
- Prettier: одинарные кавычки, `trailingComma: all`, ширина строки 80. Классы Tailwind сортирует `prettier-plugin-tailwindcss`.
- ESLint: в api включён type-aware `recommendedTypeChecked`, в web — `eslint-config-next`.
- **В api относительные импорты пишутся с `.js`** (ESM, `module: nodenext`): `import { X } from './x.js'`.
- **JSDoc обязателен** у методов api: описание, `@param`, `@returns`, `@throws` с HTTP-кодом. Изменили метод — обновите JSDoc.
- **Swagger обязателен** у контроллеров api: `@ApiTags`, `@ApiOperation` и ответы на все коды. Образец: `transactions.controller.ts`.

## 5. Как добавить эндпоинт или модуль в api

Пример: модуль `budgets`.

1. **Схемы в shared** (`packages/shared/src/budget.ts`, экспорт из `index.ts`):
   - входные: `createBudgetSchema`, `updateBudgetSchema` (`.partial().refine(...)` — хотя бы одно поле);
   - ответ: `budgetSchema`, без `userId` и служебных полей;
   - типы через `z.infer`.
2. **Модель Prisma** в `schema.prisma`:
   - поля в `camelCase`, колонки в `snake_case` через `@map`, таблица через `@@map`;
   - `id String @id @default(uuid(7)) @db.Uuid`, `createdAt`, `updatedAt`;
   - `userId` с `onDelete: Cascade`;
   - деньги в `Decimal @db.Decimal(12, 2)`, даты без времени в `@db.Date`.

   Затем `npm run db:migrate -- --name add_budgets`. Миграция коммитится вместе со схемой.
3. **Модуль** `apps/api/src/budgets/`:
   - `budgets.repository.ts` — единственный, кто обращается к `prisma.budget`. Методы принимают ключ `{ id, userId }`;
   - `budget.mapper.ts` — `toBudgetResponse`: `Decimal` и `Date` переводит в строки, `userId` убирает;
   - `budgets.service.ts` — бизнес-правила и перевод ошибок Prisma через `hasPrismaCode`: P2002 → 409, P2025 → 404, P2003 → 409 или 400;
   - `budgets.controller.ts`:
     - вход через `@Body({ schema, pipes: [new ZodValidationPipe(schema)] })`, так же для `@Query` и `@Param`;
     - пользователь через `@CurrentUser() user: JwtPayload`;
     - декораторы Swagger;
   - `budgets.module.ts`, подключить в `app.module.ts`.
4. **Данные другого модуля** получайте только через `QueryBus`/`CommandBus`. Пример: `GetCategoryQuery` в `TransactionsService`. Если нужного запроса нет, добавьте его в `queries/` модуля-владельца и зарегистрируйте handler в его модуле.
5. **Открытый роут** (без токена) помечается `@Public()`. По умолчанию все роуты закрыты.
6. **Тесты** — `*.spec.ts` рядом с кодом, см. раздел 7.
7. **Документация:** раздел «Модули» в `apps/api/CLAUDE.md`, `.claude/docs/api.md` и `.claude/docs/database.md`.

## 6. Как добавить страницу или фичу в web

Перед работой с Next прочитайте `apps/web/AGENTS.md`: API Next 16 отличается от привычного, документация лежит в `node_modules/next/dist/docs/`.

1. **Роут** в `apps/web/app/`. Только тонкий реэкспорт:

   ```tsx
   // apps/web/app/(main)/budgets/page.tsx
   export { BudgetsPage as default, metadata } from '@/pages/budgets';
   ```

   Страницы вошедшего пользователя лежат в route group `(main)`: там боковое меню и проверка сессии.
2. **Чтение данных** — `entities/<сущность>/api/get-*.ts`. Функция вызывает `authedFetch('/budgets', budgetSchema.array())` и экспортируется через `index.ts` слайса. Код с `server-only` из `index.ts` не реэкспортируется, если слайс импортируют клиентские компоненты.
3. **Изменение данных** — `features/manage-<сущность>/`:
   - `api/actions.ts` — Server Action с `'use server'`. Он проверяет данные схемой (`toValidationError`), `id` — через `validateId`, вызов API оборачивает в `runMutation`. Возвращает `ActionError | undefined`;
   - `ui/*-form-dialog.tsx` — форма на react-hook-form:

     ```ts
     useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
       resolver: zodResolver(schema),
     });
     ```

     Поля оформляются через `Field`/`FieldError` или `TextField`, ошибка сервера переносится в форму через `applyActionError`.
4. **Составной блок** из нескольких фич — `widgets/`. Страница целиком — `pages/<имя>/ui/*-page.tsx`.
5. **UI-компоненты** — shadcn: `npx shadcn@latest add <name>` из `apps/web`, затем `npm run format`. Компоненты ложатся в `src/shared/ui`.
6. **Правила импорта FSD:**
   - слой импортирует только из слоёв ниже себя: `app → pages → widgets → features → entities → shared`;
   - слайсы одного слоя друг друга не импортируют;
   - снаружи слайс доступен только через `index.ts`, `shared` импортируется по файлу.
7. **Новая открытая страница**, доступная без входа, добавляется в `PUBLIC_PATHS` в `proxy.ts`.

## 7. Тесты

Vitest в api и web, файлы `*.spec.ts` лежат рядом с кодом.

**api:**

- `Test.createTestingModule` не используется. Тестируемый класс создаётся через `new`, зависимости — объекты с `vi.fn()`, собранные в функции `setup()`.
- Ошибки Prisma имитируются через `new Prisma.PrismaClientKnownRequestError(..., { code: 'P2002', ... })`.
- Образец: `src/users/commands/update-user-name.handler.spec.ts`.

```ts
function setup() {
  const repository = { updateName: vi.fn() };
  const handler = new UpdateUserNameHandler(
    repository as unknown as UsersRepository,
  );
  return { handler, repository };
}
```

**web:**

- Тестируются чистые функции из сегментов `lib` и `shared/lib`: месяцы (`shared/lib/month.ts`), пагинация и параметры URL (`widgets/transactions-list/lib`).
- Окружение node, конфиг в `vitest.config.mts`.

Тестами покрыты сервисы, обработчики команд и запросов, схемы, guard, pipe и health. Интеграционных тестов с реальной БД нет. Изменения API проверяются вручную через curl или Swagger.

## 8. Отладка

| Симптом                                              | Причина и решение                                                                                   |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| api не стартует, «Некорректные переменные окружения» | нет `apps/api/.env`, `JWT_SECRET` < 32 символов, неверный `DATABASE_URL`                            |
| `/api/health` → `"database":"down"`                  | контейнер не запущен (`docker compose ps`) или порт 5432 занят                                       |
| «relation ... does not exist»                        | не применены миграции: `npm run db:deploy -w @expense-tracker/api`                                  |
| web бросает на `/login` сразу после входа            | истёк токен или api отклонил его (сменили `JWT_SECRET`) — войдите заново                             |
| «Cannot find module '@expense-tracker/shared'»       | shared не собран: `npm run build -w @expense-tracker/shared`                                         |
| тип из Prisma не найден                              | не сгенерирован клиент: `npm run db:generate`                                                       |
| Swagger не показывает свежие декораторы              | dev-сервер api не пересобрался, перезапустите `npm run dev`                                          |

Полезное:

- **Данные в БД:** `npm run db:studio` или `docker compose exec postgres psql -U expense expense_tracker`.
- **Токен для ручных запросов:** `accessToken` из ответа `POST /api/auth/login`. В Swagger вставляется через кнопку Authorize.
- **Сброс базы с удалением всех данных:** `docker compose down -v && npm run db:up && npm run db:deploy -w @expense-tracker/api`.
