# Главный экран, навигация, транзакции, категории, профиль (web + доработки api)

## Контекст

В web сейчас есть только вход, регистрация и заглушка главной: приветствие и статус сервисов. API уже умеет CRUD категорий и транзакций и отдаёт сводку за месяц, но пользоваться этим из интерфейса нельзя. Нужно:
- главный экран со сводкой;
- боковое меню: Главная, Транзакции, Категории, Профиль;
- полный CRUD транзакций и категорий;
- список транзакций с пагинацией по 10 штук, номерами страниц через `?page=N`;
- профиль с просмотром данных и сменой имени.

Пагинации и смены имени в API нет, их нужно добавить.

Решения пользователя: полный CRUD, номера страниц, профиль «просмотр + смена имени», боковое меню.

Ветка: `feat/web-home`, создана от `main`. Правка `CLAUDE.md` о ветках лежит в `docs/claude-md` и затрагивает другой раздел, поэтому конфликтов при слиянии не будет.

После утверждения план копируется в `.claude/.plans/web-home.md`.

## Часть 1. API

### 1.1 Пагинация `GET /transactions` (ломающее изменение)

- **shared** `packages/shared/src/transaction.ts`:
  - в `listTransactionsQuerySchema` добавить `page: z.coerce.number().int().min(1).default(1)` и `pageSize: z.coerce.number().int().min(1).max(100).default(10)`;
  - новая схема `transactionPageSchema = { items: transactionSchema[], total, page, pageSize }`;
  - тип `TransactionPage`.
- **repository** `apps/api/src/transactions/transactions.repository.ts`: `findMany(userId, filters, { skip, take })` возвращает `{ items, total }`. Внутри `prisma.$transaction([findMany, count])` с общим `where`, его вынести в приватный метод.
- **service** `findAll` возвращает `TransactionPage`, `skip = (page - 1) * pageSize`. Если страница за пределами данных, отдаётся пустой `items`, а не ошибка.
- **controller**: тип ответа `TransactionPage`.
- Коммит помечается `feat(api)!` с `BREAKING CHANGE` в теле: ответ становится объектом вместо массива. Потребителей в web пока нет.

### 1.2 Смена имени `PATCH /auth/me`

- **shared** `auth.ts`: `updateProfileSchema = z.object({ name })`. Правило для имени вынести из `registerSchema` в общую константу `nameSchema`.
- **users**: `users/commands/update-user-name.command.ts` и `.handler.ts` по образцу `create-user.*`, плюс `UsersRepository.updateName(id, name)`. P2025 превращается в `NotFoundException` через `hasPrismaCode` из `src/common/prisma-errors.ts`. Хендлер зарегистрировать в `UsersModule`.
- **auth**: `AuthService.updateProfile(userId, input)` через `CommandBus` по правилу CLAUDE.md, ответ через `toPublicUser`. `@Patch('me')` в `auth.controller.ts`.

### 1.3 Тесты (Vitest)

- `transactions.service.spec.ts`: skip/take считаются из page/pageSize, ответ `{ items, total, page, pageSize }`, страница за пределами даёт пустой список. Мок `findMany` вернёт `{ items, total }`.
- `transaction.schemas.spec.ts`: дефолты `page=1`, `pageSize=10`, отказ на `pageSize=101` и `page=0`.
- `update-user-name.handler.spec.ts`: успех, P2025 → 404.
- `auth.service.spec.ts`: `updateProfile` отправляет команду.

## Часть 2. Web (FSD)

Перед кодом прочитать `apps/web/node_modules/next/dist/docs/`, этого требует `apps/web/AGENTS.md`. Особенно разделы про route groups, `searchParams` как Promise, `revalidatePath`/`refresh` в Server Actions, `loading.tsx`/`error.tsx`.

### 2.1 shadcn-компоненты

Из `apps/web` выполнить `npx shadcn@latest add sidebar dialog alert-dialog select pagination badge skeleton sonner textarea`, затем `npm run format`. `sidebar` подтянет `sheet`, `tooltip` и `use-mobile` в `shared/lib/hooks`.

### 2.2 Общее: вынести из `features/auth` в `shared`

Слайсы одного слоя не импортируют друг друга, поэтому общий код переезжает в `shared`:
- `features/auth/model/types.ts` (`AuthActionError`) → `shared/lib/action-error.ts` как `ActionError`. Туда же `applyActionError` и `toActionError`, который сейчас лежит в `actions.ts`.
- `features/auth/ui/text-field.tsx` → `shared/ui/text-field.tsx`; `form-error.tsx` → `shared/ui/form-error.tsx`.
- **Новое** `shared/api/session.ts` (`server-only`): `getSessionToken()` читает cookie; `authedFetch(path, schema, opts)` вызывает `apiFetch` с токеном и при 401 делает `redirect('/logout')`. `getCurrentUser` берёт токен отсюда.
- **Новое** `shared/lib/format.ts`: `formatMoney(amount: string)` через `Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' })`. Number используется только для отображения, расчёты остаются в API. Там же `formatDate('YYYY-MM-DD')`.

### 2.3 Маршруты (`apps/web/app`, только реэкспорты)

Route group `app/(main)/` с общим layout и сайдбаром:
- `layout.tsx` → `export { MainLayout as default } from '@/app/layouts/main-layout'`;
- `page.tsx` (переносится из `app/page.tsx`), `transactions/page.tsx`, `categories/page.tsx`, `profile/page.tsx`;
- `loading.tsx` со скелетоном и `error.tsx` с кнопкой «Повторить».

`src/app/layouts/main-layout.tsx`: `getCurrentUser()`, при отсутствии пользователя `redirect('/logout')`, затем `SidebarProvider` + `AppSidebar` + `<main>` + `Toaster`. Проверку пользователя убрать из `HomePage`: её делает layout.

### 2.4 Entities

- `entities/transaction`: `api/get-transactions.ts` (`getTransactions(query)` → `TransactionPage`, `getSummary(month, year)`), `ui/transaction-amount.tsx` (зелёный `+` для дохода, обычный `−` для расхода), `ui/transaction-row.tsx` (дата, категория-бейдж, описание, сумма, слот `actions`).
- `entities/category`: `api/get-categories.ts` (`getCategories()` с `cache` из React), `ui/category-badge.tsx` (цветная точка, emoji, название).
- `entities/user`: без изменений, кроме использования `getSessionToken`.

### 2.5 Features

У каждой фичи свои `api/actions.ts` (`'use server'`) и `ui`. Формы следуют шаблону из CLAUDE.md: `useForm<z.input, unknown, z.output>`, `zodResolver`, повторная проверка схемы в action, `applyActionError`. После успеха вызывается `revalidatePath('/', 'layout')` и показывается toast из `sonner`.
- `features/manage-transaction`:
  - `TransactionFormDialog`: создание и редактирование. Поля: тип (переключатель Доход/Расход), сумма, дата (`input type=date`, по умолчанию сегодня), категория (`Select` из списка категорий), описание (`Textarea`).
  - `DeleteTransactionButton` с `AlertDialog`.
  - Если категорий нет, вместо формы показывается ссылка «Сначала создайте категорию».
- `features/manage-category`: `CategoryFormDialog` (название, цвет `input type=color`, иконка-emoji) и `DeleteCategoryButton`. Ответ 409 показывается как текст api: «нельзя удалить категорию с транзакциями».
- `features/update-profile`: `ProfileNameForm` с `updateProfileSchema`, отправляет `PATCH /auth/me`.
- `features/auth`: импорты переезжают на shared, `LogoutButton` остаётся.

### 2.6 Widgets

- `widgets/app-sidebar`: shadcn `Sidebar` со ссылками и иконками lucide (`LayoutDashboard`, `ArrowLeftRight`, `Tags`, `User`). Активный пункт определяется через `usePathname`, это маленький клиентский компонент. В футере имя пользователя и `LogoutButton`. На мобильном меню открывает `SidebarTrigger` в шапке контента.
- `widgets/month-summary`: три карточки (Доходы, Расходы, Баланс) плюс топ-5 расходных категорий с полосками в цвет категории (CSS-ширина от доли, без библиотеки графиков).
- `widgets/transactions-table`: строки `TransactionRow` с действиями редактирования и удаления, пустое состояние, пагинация.
  - Пагинация: shadcn `Pagination` со ссылками `?page=N`, остальные searchParams сохраняются. Показываются первая, последняя, текущая ±1 и многоточия.
  - Фильтры: тип и категория через `Select`, пишутся в URL с `page` сброшенным на 1.
  - Если `page` больше числа страниц, `redirect` на последнюю.
- `widgets/header` удаляется: его заменяет сайдбар.

### 2.7 Pages

- `pages/home`: приветствие, `MonthSummary` текущего месяца, «Последние операции» (`getTransactions({ pageSize: 5 })`) со ссылкой «Все транзакции», кнопка «Добавить транзакцию». Карточку health и `shared/api/health.ts` удалить, они больше нигде не используются.
- `pages/transactions`: заголовок, кнопка «Добавить», фильтры и таблица. `searchParams` разбираются `listTransactionsQuerySchema.safeParse`, при ошибке используются дефолты.
- `pages/categories`: сетка карточек категорий с кнопками изменить и удалить, кнопка «Добавить», пустое состояние.
- `pages/profile`: карточка с email и датой регистрации, форма имени, кнопка выхода.

### 2.8 CLAUDE.md

Дополнить разделы:
- «Транзакции (api)»: пагинация, формат ответа.
- «Авторизация (api)»: `PATCH /auth/me`.
- Web: route group `(main)`, `authedFetch`, общие `ActionError`/`TextField` в shared, `revalidatePath` после мутаций.

## Коммиты (по просьбе пользователя)

1. `feat(api)!: пагинация списка транзакций и смена имени` с тестами и `BREAKING CHANGE`.
2. `feat(web): главный экран, меню, транзакции, категории и профиль`.

## Проверка

1. `npm run build && npm run lint && npm run typecheck && npm run test && npm run format:check`.
2. `npm run db:up && npm run dev`, затем в браузере на :3000 (через skill `run`):
   - войти и создать 2–3 категории;
   - создать 25 транзакций, проверить страницы 1/2/3 по 10/10/5, переход по номерам, `?page=99` перенаправляет на последнюю;
   - фильтр по типу и категории сбрасывает страницу на 1, работает пагинация внутри фильтра;
   - редактирование и удаление транзакции; удаление категории с транзакциями показывает ошибку 409;
   - главная: суммы карточек совпадают с `GET /api/transactions/summary`, последние 5 операций;
   - профиль: смена имени обновляет имя в сайдбаре;
   - узкое окно: меню сворачивается и открывается по кнопке.
3. `curl` к `GET /api/transactions?page=2` с токеном: проверить форму ответа.
