# Expense Tracker

Трекер расходов. Монорепозиторий на npm workspaces.

| Пакет             | Что внутри                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `apps/web`        | Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4, shadcn/ui, Feature-Sliced Design |
| `apps/api`        | NestJS 12 (ESM), Prisma 7, PostgreSQL 18                                                       |
| `packages/shared` | Общие Zod-схемы и типы для web и api                                                           |

## Требования

- Node.js 24 LTS (см. `.nvmrc`) и npm 11, он идёт вместе с Node
- Docker с Docker Compose

## Быстрый старт

```bash
npm install                                   # заодно соберёт packages/shared
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
npm run db:up                                 # PostgreSQL в Docker
npm run db:migrate -- --name init             # первая миграция
npm run dev                                   # shared (watch) + api + web
```

- Web: http://localhost:3000 (без входа откроется `/login`, аккаунт создаётся на `/register`)
- API: http://localhost:3001/api/health

## Скрипты (запускаются из корня)

| Команда                              | Что делает                                    |
| ------------------------------------ | --------------------------------------------- |
| `npm run dev`                        | shared в watch-режиме, api и web с hot reload |
| `npm run build`                      | сборка всех пакетов: shared → api → web       |
| `npm run lint`                       | ESLint во всех пакетах                        |
| `npm run typecheck`                  | проверка типов во всех пакетах                |
| `npm run test`                       | тесты (Vitest в api)                          |
| `npm run format` / `format:check`    | Prettier                                      |
| `npm run db:up` / `db:down`          | запустить / остановить PostgreSQL             |
| `npm run db:migrate -- --name <имя>` | создать и применить миграцию                  |
| `npm run db:generate`                | сгенерировать Prisma Client                   |
| `npm run db:studio`                  | открыть Prisma Studio                         |

Зависимость добавляется в конкретный пакет так: `npm install <пакет> -w @expense-tracker/web`.

## Валидация

Схемы запросов и ответов описываются на Zod в `packages/shared` и используются с обеих сторон: в api через `ZodValidationPipe` (`apps/api/src/common/zod-validation.pipe.ts`), в web для форм и разбора ответов API.

## Почему зафиксированы версии

- **TypeScript 6.0, а не 7.0**: typescript-eslint поддерживает только < 6.1, Nest CLI собирает на 6.0.
- **ESLint 9, а не 10**: плагины `eslint-config-next` пока не поддерживают ESLint 10.
- **Prisma 7**: `prisma@latest` указывает на RC 8.0 с другим API. При обновлении указывайте `prisma@7`.

## Актуализация документации

После изменения любых методов необходимо актуализировать или добавить JSDoc. А для dto и контроллеров добавить декораторы swagger.
