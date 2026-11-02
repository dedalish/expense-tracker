## Что сделано

<!-- Что появилось или изменилось для пользователя, коротко по пунктам -->

## Зачем

<!-- Какую проблему решает; можно взять из тел коммитов -->

## API

<!-- Метод, путь, параметры, ответ, коды ошибок. Ломающее изменение отдельной строкой: **Ломающее изменение:** … -->

## Изменения в коде

- Backend (`apps/api`):
- Frontend (`apps/web`):
- Контракт (`packages/shared`):
- База данных: миграция `apps/api/prisma/migrations/<папка>`
- Документация: `CLAUDE.md`, `REVIEW.md`

## Как проверить

Первый запуск:

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
npm run db:up                                # PostgreSQL в Docker
npm run db:deploy -w @expense-tracker/api    # применить миграции
```

Запуск: `npm run dev` → web http://localhost:3000, api http://localhost:3001/api (Swagger: /api/docs).

Тесты:

```bash
npm run test                                                # все пакеты
npm run test -w @expense-tracker/api -- src/<путь>.spec.ts  # один файл
```

Шаги ручной проверки:

1.

## Скриншоты

<!-- Только при визуальных изменениях: какие экраны снять; картинки добавляются вручную в GitHub -->

## Проверка

<!-- [x] только для того, что реально запускалось и прошло; пропущенное — без отметки и с причиной -->

- [ ] `npm run build`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run format:check`
- [ ] `CLAUDE.md` актуален
