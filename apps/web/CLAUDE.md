@AGENTS.md

# apps/web — фронтенд (Next.js 16)

Правила пакета web. Общие правила монорепозитория (команды, shared, версии, стиль, ветки, коммиты) — в корневом `CLAUDE.md`. Импорт `AGENTS.md` выше подключает правило Next: перед кодом читать документацию из `node_modules/next/dist/docs/`, API Next 16 отличается от привычного.

## Команды

Из корня: `npm run <script> -w @expense-tracker/web`.

- `dev`, `build`, `lint` (`eslint .`), `typecheck` (сначала `next typegen`), `test`, `test:watch`.
- Новый компонент shadcn: `npx shadcn@latest add <name>` из `apps/web`, потом `npm run format` из корня.
- Корневой `npm run build` при запущенном `npm run dev` удаляет `apps/api/dist` (nest build чистит папку) и роняет api. Пока работает dev, собирать только web.

## Стек и тесты

- **Next.js 16**, App Router, Turbopack. Tailwind 4 подключён через лоадер `@tailwindcss/turbopack` в `next.config.ts`, файла `postcss.config` нет. В Next 16 нет `next lint`: линтер запускается как `eslint .`, а `typecheck` сначала выполняет `next typegen` (глобальные типы `LayoutProps`/`PageProps`).
- **Vitest**: `vitest.config.mts` (`.mts`, потому что пакет не ESM; алиас `@/*`, окружение node). Пока тестируются чистые функции из `lib`-сегментов и `shared/lib`, например пагинация в `widgets/transactions-list/lib` и месяцы в `shared/lib/month.ts`.

## Архитектура: Feature-Sliced Design

- Роутинг Next лежит в `apps/web/app` (корень пакета, не `src`). Там только тонкие `page.tsx`/`layout.tsx`/`route.ts`: реэкспорт страницы из `@/pages/*` (`export { LoginPage as default, metadata } from '@/pages/login'`). Логику и разметку туда не писать.
- Страницы вошедшего пользователя лежат в route group `app/(main)/` (`/`, `/transactions`, `/categories`, `/profile`). Его `layout`/`loading`/`error` реэкспортируют `src/app/layouts/main-*`: боковое меню `widgets/app-sidebar`, скелетон и экран ошибки (в Next 16 проп `retry`, а не `reset`). Layout проверяет пользователя и рендерит `Toaster` (sonner).
- Слои в `apps/web/src` (алиас `@/*`), сверху вниз: `app` (глобальные стили `app/styles/globals.css`, провайдеры) → `pages` → `widgets` → `features` → `entities` → `shared`. Слой импортирует только из слоёв ниже себя. Слайсы одного слоя друг друга не импортируют.
- Слайс (`features/auth`, `entities/user`, `pages/login`) делится на сегменты `ui`, `api`, `model`, `lib`, `config`. Снаружи слайс доступен только через `index.ts`. Внутри слайса импорты относительные.
- `shared` без слайсов и без `index.ts`: импорт по файлу (`@/shared/ui/button`, `@/shared/api/client`).
- Пустая `apps/web/pages/` (с README) обязательна: без неё Next принял бы `src/pages` за Pages Router.

## UI: shadcn/ui

Стиль `base-nova`, примитивы Base UI, иконки lucide. Компоненты лежат в `src/shared/ui`, `components.json` направляет туда алиасы. Там же собственные общие компоненты (`page-header`, `confirm-dialog`, `text-field`, `form-error`). Сгенерированные компоненты руками не переписывать без нужды. Исключение: `shared/lib/hooks/use-mobile.ts` переписан на `useSyncExternalStore`, потому что сгенерированная версия нарушает `react-hooks/set-state-in-effect`; при `shadcn add` его не перезаписывать. То же с `shared/ui/toggle.tsx`: в `toggleVariants` добавлен вариант `segmented` (сегменты на серой плашке, как переключатель типа транзакции). `PaginationLink` shadcn рендерит `<a>`, поэтому ссылки пагинации собраны из `Button` с `render={<Link />}`. Из-за папки `pages` Next типизирует `usePathname`/`useSearchParams` как nullable.

## Авторизация

JWT хранится в httpOnly cookie `access_token` (`shared/config/session.ts`), JS в браузере его не видит. Cookie ставят Server Actions из `features/auth/api/actions.ts` (`loginAction`, `registerAction`, `logoutAction`), срок cookie берётся из `exp` токена. Запросы к api идут только с сервера Next через `apiFetch` (`shared/api/client.ts`, `server-only`): ответ разбирается схемой из shared, ошибка HTTP превращается в `ApiError` со `status`, `message` и `fieldErrors`. Запросы от имени пользователя идут через `authedFetch` (`shared/api/session.ts`): берёт токен из cookie, при 401 делает `redirect('/logout')`. Там же `clearSessionCookie` для route handler `/logout`. Index слайса не должен реэкспортировать `server-only` код: его импортируют и клиентские компоненты. Текущий пользователь — `getCurrentUser()` из `entities/user` (`/auth/me`, кэш на запрос). `proxy.ts` (бывший middleware) по наличию и сроку cookie отправляет гостя на `/login`, а вошедшего с `/login`/`/register` на `/`. Страницы, открытые всем (`/privacy` с политикой обработки ПДн), перечислены в `PUBLIC_PATHS`. Подпись в proxy не проверяется. Если api токен не принял, страница перенаправляет на `/logout` (route handler чистит cookie).

## Формы

react-hook-form + `zodResolver` со схемами из shared, поля через `Field`/`FieldError` shadcn. Типы формы — `useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>`, потому что схемы делают trim/lowercase. Server Action проверяет ту же схему повторно (`toValidationError`; `shared/api/action-error.ts` подключает русскую локаль Zod и на сервере), а `id` из аргументов — через `validateId`, потому что он попадает в путь запроса к api. Server Action и возвращает `ActionError | undefined`. Изменение данных оборачивается в `runMutation` (`shared/api/action-error.ts`): ошибку api превращает в `ActionError`, при успехе вызывает `refresh()` из `next/cache`, а `redirect` из `authedFetch` пропускает через `unstable_rethrow`. Ошибку в форму переносит `applyActionError` (`shared/lib/action-error.ts`). Общие поля и блоки форм лежат в shared: `TextField`, `FormError`, `ConfirmDialog` (подтверждение удаления с toast). Форма в диалоге — отдельный внутренний компонент: Base UI размонтирует содержимое закрытого диалога, и форма каждый раз открывается со свежими значениями.

Русские тексты ошибок Zod задаются глобально в `shared/config/zod.ts` (импорт ради побочного эффекта в клиентских формах), не в схемах shared. Исключение — предметные проверки вроде `refine` согласия: их текст задан в самой схеме.

## Страницы

- **Главная**: месяц сводки в `?month=YYYY-MM` (`features/select-month`, список последних 12 месяцев), без параметра — текущий месяц. «Текущий» считается в часовом поясе браузера: `TimeZoneSync` (`src/app/providers`) пишет его в cookie `tz`, сервер читает через `getUserTimeZone()` (`shared/api/time-zone.ts`), без cookie — пояс сервера. Работа с месяцами — `shared/lib/month.ts`. Битый `month` убирается редиректом на `/`.
- **Транзакции**: параметры URL (`type`, `categoryId`, `page`) проверяет по одному `normalizeTransactionsSearch` из `widgets/transactions-list`; лишние и битые убираются редиректом, `pageSize` из URL не берётся (всегда `TRANSACTIONS_PAGE_SIZE`). Страница за пределами списка перенаправляет на последнюю.
