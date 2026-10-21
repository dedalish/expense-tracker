# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Трекер расходов, учебный проект. Общение, документация и комментарии в коде на русском, идентификаторы на английском.

## Пакеты

Здесь общие правила монорепозитория. Правила пакетов лежат рядом с кодом:

- `apps/api/CLAUDE.md` — бэкенд: NestJS, Prisma, модули и эндпоинты;
- `apps/web/CLAUDE.md` — фронтенд: Next.js, FSD, shadcn, формы и страницы.

Claude Code подгружает их сам, когда читает файлы пакета. Если задача затрагивает пакет, а его файлы ещё не открывались (план, команды из корня, правка сразу двух пакетов), сначала прочитать его `CLAUDE.md`.

Правила code review (что проверять, уровни замечаний, что не комментировать) лежат в `REVIEW.md`, перед ревью прочитать его.

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
Один тест (Vitest в api и web): `npm run test -w @expense-tracker/api -- src/health/health.controller.spec.ts` или `-- -t "<название теста>"`. Тесты лежат рядом с кодом как `*.spec.ts`.
Новая зависимость: `npm install <pkg> -w @expense-tracker/<пакет>`.

Перед первым запуском: `cp apps/api/.env.example apps/api/.env`, `cp apps/web/.env.example apps/web/.env.local`.

## Архитектура

- **Карта**: `packages/shared` (контракт) → `apps/api` (:3001, REST под `/api`) и `apps/web` (:3000). Web обращается к api только по HTTP с сервера Next, браузер к api не ходит. База — PostgreSQL в Docker, с ней работает только api.
- **`packages/shared`**: Zod-схемы и выведенные из них типы (`z.infer`), общий контракт web ↔ api. Это **собранный** пакет: `exports` указывают на `dist/`, а не на `src/`. Nest компилирует через tsc и не умеет брать TS-исходники из другого пакета. Поэтому после изменения shared нужен build. `npm run dev` пересобирает пакет автоматически, корневой `typecheck` собирает его первым. Порядок `workspaces: ["packages/*", "apps/*"]` в корневом `package.json` задаёт порядок сборки, его не менять.

## Зафиксированные версии (не поднимать на `@latest`)

- **TypeScript ~6.0**: на 7.x ломается typescript-eslint (поддерживает < 6.1), Nest CLI собирает на 6.0.
- **ESLint ^9**: плагины `eslint-config-next` не поддерживают ESLint 10.
- **Prisma ^7**: `prisma@latest` указывает на 8.0 RC с другим API.
- В TS 6 по умолчанию `types: []`, поэтому `types` в tsconfig задаётся явно.

## Стиль

Prettier: одинарные кавычки, `trailingComma: all`, ширина 80. Корневая `.claude/` (планы, промпты, шаблоны) исключена в `.prettierignore`, её файлы не форматировать. `prettier-plugin-tailwindcss` сортирует классы. ESLint-конфиги свои в каждом пакете (`eslint.config.mjs`).

## Ветки (GitHub flow)

- `main` всегда рабочая: проходит `build`, `lint`, `typecheck`, `test`, `format:check`. Напрямую в `main` не коммитить.
- Каждая фича или исправление делается в отдельной ветке от свежего `main`: `git switch main && git pull && git switch -c <ветка>`.
- Имя ветки: `<type>/<scope>-<кратко>` латиницей в kebab-case, `type` и `scope` те же, что в коммитах: `feat/web-home`, `fix/api-transactions-summary`, `docs/claude-md`.
- Одна ветка — одна фича. Работа, не относящаяся к ней, уходит в отдельную ветку.
- Ветка вливается в `main` через pull request после зелёных проверок. Влитая ветка удаляется.
- Ветку и PR создавать только по просьбе пользователя.

## Pull request

- Создаётся через `gh` после push ветки: `gh pr create --base main --head <ветка> --title … --body-file -`. Сливает PR пользователь.
- Перед описанием посмотреть `git log main..HEAD` и `git diff main...HEAD`: описание строится по реальному диффу, а не по памяти.
- **Заголовок** не по Conventional Commits: без `type(scope):`, обычная фраза на русском с заглавной буквы, без точки, до 72 символов. Пример: «Выбор месяца сводки на главной».
- **Описание** на русском, разделы `##` (пустые не писать):
  - «Что сделано» — что появилось или изменилось для пользователя и зачем;
  - «API» — новые и изменённые эндпоинты (метод, путь, параметры, формат ответа, коды ошибок), ломающие изменения отдельной строкой;
  - «Изменения в коде» — новые слайсы и компоненты, зависимости, миграции Prisma, правки CLAUDE.md;
  - «Проверка» — какие проверки прошли (`build`, `lint`, `typecheck`, `test`, `format:check`), что проверено вручную и что не проверено.
- В GitHub Actions работает Claude (`anthropics/claude-code-action@v1`, секрет `CLAUDE_CODE_OAUTH_TOKEN`): `claude-code-review.yml` делает ревью каждого PR при открытии и новых коммитах, `claude.yml` отвечает на `@claude` в issue, комментариях PR и ревью. Проверок `build`/`lint`/`test` в CI пока нет, их запускают локально.
- Ветку после слияния удалять только когда `gh pr view <N> --json state` показал `MERGED`. Проверка выполняется отдельной командой, а не цепочкой через `&&` с удалением.

## Коммиты

[Conventional Commits](https://www.conventionalcommits.org/ru/v1.0.0/): `<type>(<scope>): <описание>`.

- **type**: `feat` (новая функциональность), `fix`, `refactor`, `perf`, `test`, `docs`, `style` (форматирование), `build` (зависимости, сборка), `ci`, `chore`.
- **scope**: пакет или область — `api`, `web`, `shared`, `db` (схема Prisma и миграции). Изменение нескольких пакетов: scope по главному или без scope.
- **Описание** на русском, со строчной буквы, без точки в конце, до 72 символов, отвечает на вопрос «что сделано»: `feat(api): модуль транзакций`.
- **Тело** (через пустую строку) объясняет «зачем» и отступления от задачи. Ломающее изменение API помечается `!` (`feat(api)!: …`) и строкой `BREAKING CHANGE: …` в теле.
- Один коммит — одна логическая единица: фича вместе со своей миграцией, тестами и правками CLAUDE.md. Миграция Prisma не отделяется от схемы.
- Перед коммитом: `npm run build`, `lint`, `typecheck`, `test`, `format:check`. Коммитить только по просьбе пользователя, `.env` не коммитить.
