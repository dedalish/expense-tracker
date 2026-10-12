# Авторизация в api: модуль пользователей + JWT-аутентификация через CQRS

## Контекст

В api пока есть только health и черновые модели `Category`/`Expense`. Нужна авторизация:

- модуль пользователей с репозиторием (имя, email, хэш пароля);
- отдельный модуль auth, который выдаёт JWT;
- эндпоинты регистрации и логина.

Модули общаются через CQRS (`@nestjs/cqrs`): auth не инжектит сервисы users, а отправляет команды и запросы.

Согласовано:

- только access-токен;
- пароли хэшируются через `@node-rs/argon2`;
- модули взаимодействуют через CQRS.

Вопрос о способе защиты эндпоинтов остался без ответа. Беру рекомендованный вариант: свой глобальный guard и декоратор `@Public()`.

Совместимость с Nest 12 проверена в npm:

- `@nestjs/cqrs` 12.1.0 (ESM);
- `@nestjs/jwt` 12.0.2;
- `@node-rs/argon2` 2.2.2 ставится из готовых бинарников, install-скриптов у него нет.

## Задачи

- [x] 1. Установить зависимости (`@nestjs/cqrs`, `@nestjs/jwt`, `@node-rs/argon2`)
- [x] 2. shared: схемы и типы auth
- [x] 3. Prisma: модель `User`
- [x] 4. Конфиг: `JWT_SECRET`, `JWT_EXPIRES_IN` в `env.ts` и `.env.example`
- [x] 5. Модуль users: repository, команда, запросы, mapper, module
- [x] 6. Модуль auth: password.service, auth.service, guard, декораторы, controller, module
- [x] 7. Подключить модули в `app.module.ts`, `@Public()` на health
- [x] 8. Тесты: auth.service, auth.guard, create-user.handler
- [x] 9. Обновить `CLAUDE.md`
- [x] 10. Проверка: generate, lint, typecheck, test, миграция, curl

## Новые зависимости (apps/api)

`@nestjs/cqrs ^12.1.0`, `@nestjs/jwt ^12.0.2`, `@node-rs/argon2 ^2.2.2`. Passport не нужен.

## Shared: контракт (`packages/shared/src/auth.ts`, реэкспорт из `index.ts`)

- `registerSchema`:
  - `name`: строка 2–100 символов, с trim;
  - `email`: email, приводится к trim + lowercase;
  - `password`: 8–128 символов.
- `loginSchema`: `{ email, password }`, email нормализуется так же.
- `publicUserSchema`: `{ id, name, email, createdAt }`. Без хэша пароля.
- `authResponseSchema`: `{ accessToken, user: publicUserSchema }`.
- Типы выводятся через `z.infer`: `RegisterInput`, `LoginInput`, `PublicUser`, `AuthResponse`.

## Prisma: модель `User` (`apps/api/prisma/schema.prisma`)

```prisma
model User {
  id           String   @id @default(uuid(7)) @db.Uuid
  name         String
  email        String   @unique
  passwordHash String   @map("password_hash")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  @@map("users")
}
```

Связь пользователя с `Category`/`Expense` пока не трогаем, это отдельный шаг. Миграций ещё не было, поэтому первая будет `init` и создаст все три таблицы.

## Модуль users (`apps/api/src/users/`)

- `users.repository.ts`: `UsersRepository` поверх `PrismaService` (из глобального `PrismaModule`). Методы `findById`, `findByEmail`, `create`. Это единственное место, где идёт обращение к `prisma.user`.
- `commands/create-user.command.ts` + `create-user.handler.ts`:
  - команда `CreateUserCommand extends Command<User>` принимает `{ name, email, passwordHash }`;
  - если email занят (Prisma `P2002`), handler бросает `ConflictException`.
- `queries/get-user-by-email.query.ts` + handler (`Query<User | null>`): нужен auth для логина, возвращает запись вместе с хэшем.
- `queries/get-user-by-id.query.ts` + handler (`Query<User | null>`): нужен для `/auth/me`.
- `user.mapper.ts`: `toPublicUser(user): PublicUser` отрезает `passwordHash`. Наружу пользователь отдаётся только через него.
- `users.module.ts`: регистрирует repository и handlers, ничего не экспортирует. Связь с другими модулями только через шину.

Типизированные `Command<T>`/`Query<T>` из `@nestjs/cqrs` делают результат `commandBus.execute()`/`queryBus.execute()` типизированным без кастов.

## Модуль auth (`apps/api/src/auth/`)

- `password.service.ts`: `hash` и `verify` через `@node-rs/argon2`, алгоритм argon2id с параметрами по умолчанию.
- `auth.service.ts`:
  - `register(input)`: хэширует пароль → `CreateUserCommand` → подписывает токен → возвращает `AuthResponse`.
  - `login(input)`: `GetUserByEmailQuery` → `verify` → токен. Если пользователь не найден или пароль неверный, ответ одинаковый: `UnauthorizedException('Неверный email или пароль')`.
  - Payload токена: `{ sub: user.id, email }`.
- `auth.controller.ts` (`/api/auth`):
  - `POST /register` (201) с телом через `new ZodValidationPipe(registerSchema)`;
  - `POST /login` (`@HttpCode(200)`) с `loginSchema`;
  - `GET /me` возвращает `PublicUser` через `GetUserByIdQuery`, 401 если пользователь удалён.
- `auth.guard.ts`: глобальный guard (`APP_GUARD`):
  - пропускает роуты с `@Public()`;
  - для остальных берёт `Authorization: Bearer`, делает `jwtService.verifyAsync` и кладёт payload в `request.user`;
  - если токена нет или он невалиден, отвечает 401.
- `decorators/public.decorator.ts` (`Reflector.createDecorator<boolean>()` или `SetMetadata`) и `decorators/current-user.decorator.ts` (`createParamDecorator`, отдаёт `JwtPayload`).
- `auth.module.ts`: `JwtModule.registerAsync` с секретом и сроком из `ConfigService<Env, true>`, плюс `PasswordService`, `AuthService` и guard как `APP_GUARD`.

## Изменения в существующих файлах

- `src/app.module.ts`: добавить `CqrsModule.forRoot()`, `UsersModule`, `AuthModule`.
- `src/health/health.controller.ts`: пометить `@Public()`.
- `src/config/env.ts`:
  - `JWT_SECRET`: `z.string().min(32)`;
  - `JWT_EXPIRES_IN`: строка, по умолчанию `'1d'`.
- `apps/api/.env.example`: добавить обе переменные. Для секрета указать placeholder и подсказку `openssl rand -base64 48`.
- Существующие утилиты переиспользуем: `ZodValidationPipe` (`src/common/zod-validation.pipe.ts`), `PrismaService`, `ConfigService<Env, true>`.
- Все относительные импорты пишутся с `.js` (Nest 12 работает как ESM).
- `CLAUDE.md`: короткий абзац про CQRS-границу между модулями и `@Public()`.

## Тесты (Vitest, прямое создание классов с моками)

- `auth.service.spec.ts`:
  - register вызывает команду с хэшем, а не с паролем;
  - login с неверным паролем и с неизвестным email бросает 401;
  - успешный login возвращает токен.
- `auth.guard.spec.ts`: роут `@Public` пропускается; без заголовка 401; с валидным токеном payload попадает в `request.user`.
- `create-user.handler.spec.ts`: Prisma `P2002` превращается в `ConflictException`.

## Сейчас не делаем

Refresh-токены, logout, роли, привязку категорий и расходов к пользователю, страницы логина в web, rate limiting.

## Проверка

1. `npm install` в корне (новые зависимости), `cp apps/api/.env.example apps/api/.env` и заполнить `JWT_SECRET`.
2. `npm run db:migrate -- --name init`: миграция создаёт таблицы `users`, `categories` и `expenses`.
3. `npm run lint`, `npm run typecheck`, `npm run test` проходят.
4. `npm run dev -w @expense-tracker/api` (или общий `npm run dev`), затем по curl:
   - `POST /api/auth/register` → 201 + `accessToken`; повтор с тем же email → 409;
   - `POST /api/auth/login`: с неверным паролем 401, с верным 200 + токен;
   - `GET /api/auth/me` без токена → 401, с `Authorization: Bearer <token>` → пользователь без `passwordHash`;
   - `GET /api/health` без токена по-прежнему → 200.
