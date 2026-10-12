# План: категории трат (CRUD, привязка к пользователю)

## Контекст

Авторизация готова (JWT, глобальный `AuthGuard`, модуль `users` за `CommandBus`/`QueryBus`). Теперь нужны пользовательские категории трат: у каждого пользователя свой набор с названием, цветом и иконкой. Требования лежат в `.claude/.plans/category.md`.

В `schema.prisma` уже есть черновик `Category` с глобально уникальным `name` и без связи с `User`. Его надо довести до нужной модели.

Решения, согласованные с пользователем:

- **Валидация через Zod-схемы из `packages/shared` и `ZodValidationPipe`**, а не через class-validator: так принято в проекте, и web переиспользует те же схемы.
- **CQRS с users**: перед созданием категории сервис проверяет пользователя через `GetUserByIdQuery` (QueryBus). Если пользователя нет, отвечаем 401, как в `/auth/me`. Сам CRUD категорий делается обычным сервисом.
- После одобрения план копируется в `.claude/.plans/categories.md`.

## Модель данных (`apps/api/prisma/schema.prisma`)

```prisma
model Category {
  id        String    @id @default(uuid(7)) @db.Uuid
  name      String
  color     String    // hex #rrggbb, в нижнем регистре
  icon      String    // emoji или имя иконки
  userId    String    @map("user_id") @db.Uuid
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  expenses  Expense[]

  @@unique([userId, name])   // имя уникально в пределах пользователя
  @@map("categories")
}
```

В `User` добавить `categories Category[]`. Глобальный `@unique` у `name` убрать. Связь `Expense → Category` (`onDelete: Restrict`) остаётся: категорию с тратами удалить нельзя, ответ 409.

Миграция: `npm run db:migrate -- --name categories_per_user`. Если в `categories` есть строки, NOT NULL `user_id` не применится. В dev-базе таблица пустая; если нет, делаем `prisma migrate reset`.

## Контракт (`packages/shared/src/category.ts`)

- `categoryNameSchema`: `z.string().trim().min(1).max(50)`.
- `categoryColorSchema`: `z.string().trim().toLowerCase().pipe(z.string().regex(/^#[0-9a-f]{6}$/))`.
- `categoryIconSchema`: `z.string().trim().min(1).max(32)`.
- `createCategorySchema = z.object({ name, color, icon })`.
- `updateCategorySchema = createCategorySchema.partial()` с `.refine`, чтобы объект не был пустым.
- `categorySchema` (ответ API): `id`, `name`, `color`, `icon`, `createdAt` (`z.iso.datetime()`). `userId` наружу не отдаём.
- Типы `CreateCategoryInput`, `UpdateCategoryInput`, `Category` через `z.infer`. Экспорт добавить в `src/index.ts`.

## API (`apps/api/src/categories/`)

Повторяем структуру `users`/`auth`:

| Файл                       | Назначение                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `categories.repository.ts` | Единственное место с `prisma.category`: `create`, `findAllByUser` (сортировка по `name`), `update({ id, userId }, data)`, `delete({ id, userId })`. Prisma 7 разрешает в `where` уникального запроса сочетать `id` и `userId`, поэтому чужая категория даёт P2025.                                                                                                                                                                                   |
| `category.mapper.ts`       | `toCategoryResponse(category)`: `Date` переводится в ISO, `userId` отбрасывается (как `toPublicUser` в `users/user.mapper.ts`).                                                                                                                                                                                                                                                                                                                      |
| `categories.service.ts`    | `create(userId, input)`: сначала `queryBus.execute(new GetUserByIdQuery(userId))`, без пользователя `UnauthorizedException`. Затем `findAll(userId)`, `update(userId, id, input)`, `remove(userId, id)`. Ошибки Prisma переводятся так же, как в `users/commands/create-user.handler.ts`: P2002 → `ConflictException` («Категория с таким названием уже есть»), P2025 → `NotFoundException`, P2003 → `ConflictException` («В категории есть траты»). |
| `categories.controller.ts` | `@Controller('categories')`: `POST /` (201), `GET /`, `PATCH /:id`, `DELETE /:id` (`@HttpCode(204)`). Тело проверяется через `new ZodValidationPipe(createCategorySchema / updateCategorySchema)`, `:id` через `new ZodValidationPipe(z.uuid())`, пользователь берётся из `@CurrentUser()` (`user.sub`). Роуты защищены глобальным `AuthGuard`, `@Public()` не ставим.                                                                               |
| `categories.module.ts`     | Controller, service, repository. `UsersModule` не импортируем: связь только через QueryBus (`CqrsModule.forRoot()` уже в `AppModule`).                                                                                                                                                                                                                                                                                                               |

Подключить `CategoriesModule` в `apps/api/src/app.module.ts`.

Чужая категория при PATCH/DELETE даёт 404, а не 403: так не раскрывается, существует ли id.

## Чек-лист задач

- [x] Скопировать этот план в `.claude/.plans/categories.md`
- [x] Prisma: обновить `Category` и `User` в `schema.prisma`
- [x] Prisma: миграция `categories_per_user`, проверить SQL (drop `categories_name_key`, unique `(user_id, name)`, FK с cascade)
- [x] shared: `src/category.ts` со схемами и типами, экспорт в `index.ts`, `npm run build -w @expense-tracker/shared`
- [x] api: `categories.repository.ts`
- [x] api: `category.mapper.ts`
- [x] api: `categories.service.ts` с проверкой пользователя через `GetUserByIdQuery` и маппингом ошибок Prisma
- [x] api: `categories.controller.ts` (POST / GET / PATCH / DELETE)
- [x] api: `categories.module.ts`, регистрация в `app.module.ts`
- [x] Тесты: `categories.service.spec.ts` (Vitest, моки репозитория и QueryBus, как в `auth.service.spec.ts`): создание, 401 без пользователя, P2002 → 409, P2025 → 404, P2003 → 409, ответ без `userId`
- [x] Тесты: схемы shared (цвет нормализуется в нижний регистр, пустой PATCH отклоняется) в spec рядом с сервисом
- [x] CLAUDE.md: строка про модуль `categories` в «Архитектуре»
- [x] `npm run typecheck && npm run lint && npm run test && npm run format:check`
- [x] Ручная проверка через curl (см. ниже)

## Проверка

1. `npm run db:up`, миграция, `npm run dev`.
2. Регистрация двух пользователей (`POST /api/auth/register`), сохранить оба токена.
3. Под пользователем A:
   - `POST /api/categories {"name":"Еда","color":"#FF8800","icon":"🍔"}` → 201, `color` = `#ff8800`;
   - повтор с тем же `name` → 409;
   - `color: "red"` → 400;
   - `GET /api/categories` → массив из одной категории;
   - `PATCH /api/categories/:id {"icon":"🥗"}` → 200.
4. Под пользователем B: `GET` → `[]`, `PATCH`/`DELETE` категории A → 404. Создать категорию «Еда» у B → 201 (уникальность только внутри пользователя).
5. Без токена любой роут `/api/categories` → 401. `DELETE` под A → 204, затем `GET` → `[]`.

Вне рамок задачи: UI категорий в `apps/web` и стартовые категории при регистрации.
