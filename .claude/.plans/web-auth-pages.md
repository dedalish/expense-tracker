# План: страницы логина и регистрации (web, shadcn/ui, FSD)

## Контекст

В api готовы `POST /api/auth/register`, `POST /api/auth/login` (ответ `AuthResponse`: `accessToken` + `user`) и `GET /api/auth/me`. В `apps/web` пока только health-страница. Нужны страницы входа и регистрации на shadcn/ui. Код web переводится на Feature-Sliced Design, и это фиксируется в `CLAUDE.md`.

Решения, согласованные с пользователем:

- **Токен в httpOnly cookie.** Server Action вызывает api с сервера Next и ставит cookie. JS в браузере токен не видит.
- **Формы: react-hook-form + `zodResolver`** со схемами `loginSchema`/`registerSchema` из shared и компонентами shadcn `Field`. Отправка вызывает Server Action, который проверяет данные той же схемой ещё раз.
- **FSD по официальному гайду для Next.js:** роутинг в `apps/web/app` (корень пакета), слои в `apps/web/src`, пустая `apps/web/pages/README.md`, чтобы Next не принял `src/pages` за Pages Router.
- **Главная `/` защищена:** имя пользователя из `/auth/me`, кнопка «Выйти» и блок статуса сервисов. `proxy.ts` отправляет гостя на `/login`, а вошедшего с `/login`/`/register` на `/`.
- После одобрения план копируется в `.claude/.plans/web-auth-pages.md`.

## Структура `apps/web`

```
app/                                  # только роутинг Next, тонкие файлы
  layout.tsx                          # импорт стилей и провайдеров из @/app
  page.tsx                            # export { HomePage as default } from '@/pages/home'
  (auth)/layout.tsx                   # центрированная колонка для форм
  (auth)/login/page.tsx               # → @/pages/login
  (auth)/register/page.tsx            # → @/pages/register
  logout/route.ts                     # GET: удалить cookie, redirect /login (для протухшего токена)
pages/README.md                       # заглушка: Pages Router не используется
proxy.ts                              # Next 16 (бывший middleware): редиректы по cookie
components.json                       # конфиг shadcn с алиасами на FSD-слои
src/
  app/styles/globals.css              # tailwind + тема shadcn (CSS-переменные)
  pages/home/      { ui/home-page.tsx, index.ts }
  pages/login/     { ui/login-page.tsx, index.ts }
  pages/register/  { ui/register-page.tsx, index.ts }
  widgets/header/  { ui/header.tsx, index.ts }          # имя пользователя + LogoutButton
  features/auth/
    api/actions.ts                    # 'use server': loginAction, registerAction, logoutAction
    model/session.ts                  # server-only: setSessionCookie / clearSessionCookie
    ui/login-form.tsx                 # 'use client', RHF + zodResolver(loginSchema)
    ui/register-form.tsx              # 'use client', RHF + zodResolver(registerSchema)
    ui/logout-button.tsx
    index.ts                          # публичный API слайса
  entities/user/
    api/get-current-user.ts           # server-only, React cache(): cookie → GET /auth/me → PublicUser | null
    index.ts
  shared/
    api/client.ts                     # apiFetch(path, init, schema), ApiError (status, message, fieldErrors)
    api/health.ts                     # getHealth (перенос из src/lib/api.ts)
    config/env.ts                     # API_URL
    config/session.ts                 # SESSION_COOKIE = 'access_token'
    lib/utils.ts                      # cn() от shadcn
    lib/jwt.ts                        # getTokenExpiry(token): exp из payload без проверки подписи
    ui/*.tsx                          # компоненты shadcn: button, input, label, card, field, alert
```

Удаляются: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css` (переезжает в `src/app/styles`), `src/lib/api.ts`. Алиас `@/*` → `./src/*` остаётся, файлы `app/` импортируют `@/pages/...`.

Правила FSD: импорт только из нижележащих слоёв (`app → pages → widgets → features → entities → shared`), между слайсами одного слоя нельзя, снаружи слайса только через его `index.ts`. `shared/ui` и `shared/lib` без `index.ts`: импорт по файлу (`@/shared/ui/button`), так генерирует shadcn.

## shadcn/ui

1. `components.json`: `rsc: true`, `tailwind.css: "src/app/styles/globals.css"`, `tailwind.config: ""` (Tailwind 4), алиасы `components`/`ui` → `@/shared/ui`, `utils` → `@/shared/lib/utils`, `lib` → `@/shared/lib`, `hooks` → `@/shared/lib/hooks`, `iconLibrary: lucide`.
2. `npx shadcn@latest init` из `apps/web` в неинтерактивном режиме (базовый цвет neutral). Если CLI не справится с монорепо или с отсутствием postcss, настраиваю вручную: тема в `globals.css`, `cn` в `shared/lib/utils.ts`, зависимости `class-variance-authority clsx tailwind-merge lucide-react tw-animate-css`.
3. `npx shadcn@latest add button input label card field alert`.
4. Зависимости в web: `react-hook-form`, `@hookform/resolvers`, `server-only`, `zod` той же версии, что в shared (нужен `z.input` для типов полей формы: схемы делают trim/lowercase, вход и выход различаются).

## Поток авторизации

- **Форма** (`login-form.tsx`): `useForm<z.input<typeof loginSchema>, unknown, LoginInput>({ resolver: zodResolver(loginSchema) })`. Поля через `Field`/`FieldLabel`/`FieldError`, кнопка с `disabled` на время отправки. Сообщения Zod по умолчанию английские, поэтому для полей задаю русские тексты в форме (через `error` map в resolver или свои сообщения в UI по коду ошибки). Ссылка на `/register` и обратно.
- **`loginAction(input)`**: `loginSchema.safeParse` → `apiFetch('/auth/login', POST, authResponseSchema)`. Ошибки api:
  - 400 (`{ message, errors: { fieldErrors } }` из `ZodValidationPipe`) → ошибки по полям, форма вызывает `setError`;
  - 401/409 → текст из `message` (api уже отдаёт русские: «Неверный email или пароль», «Пользователь с таким email уже существует»), показывается в `Alert` над формой;
  - сеть/5xx → «Сервис недоступен, попробуйте позже».

  При успехе `setSessionCookie(token)`: `httpOnly`, `sameSite: 'lax'`, `secure` в production, `path: '/'`, `expires` из `exp` токена. Затем `redirect('/')`. Возвращает `{ ok: false, message?, fieldErrors? }`, при успехе не возвращается.

- **`registerAction`**: то же с `/auth/register` и `registerSchema`.
- **`logoutAction`**: удаляет cookie, `redirect('/login')`. Токен stateless, в api вызывать нечего.
- **`getCurrentUser()`** (entities/user): читает cookie, `GET /auth/me` с `Authorization: Bearer`, `cache: 'no-store'`, разбирает `publicUserSchema`. 401 → `null`.
- **`proxy.ts`**: cookie есть и `exp` в будущем → сессия «похожа на живую». Гость на `/` → `/login`, «живой» на `/login`/`/register` → `/`. `matcher` исключает `_next`, статику, `logout`. Подпись не проверяется: это только UX, доступ к данным проверяет api.
- **Главная**: `getCurrentUser()`; `null` при наличии cookie (пользователь удалён, секрет сменился) → `redirect('/logout')`. Route handler удаляет cookie и ведёт на `/login`, так нет петли с proxy.

## CLAUDE.md

Пункт `apps/web` переписать:

- Next.js 16, App Router, Turbopack. Архитектура **Feature-Sliced Design**: роутинг в `apps/web/app` (только тонкие `page.tsx`/`layout.tsx`/`route.ts`, реэкспорт из `@/pages/*`), слои в `src/`: `app` (стили, провайдеры), `pages`, `widgets`, `features`, `entities`, `shared`. Правила импорта, публичный API через `index.ts`, сегменты `ui`/`api`/`model`/`lib`/`config`. Пустая `apps/web/pages/` нужна, чтобы Next не подхватил `src/pages`.
- UI: shadcn/ui, компоненты в `src/shared/ui` (добавлять `npx shadcn@latest add <name>` из `apps/web`, `components.json` направляет туда), `cn` в `shared/lib/utils`.
- Авторизация в web: JWT в httpOnly cookie `access_token`, ставят Server Actions в `features/auth`. Запросы к api с сервера через `shared/api/client.ts` (`apiFetch`, ответы разбираются схемами shared). Текущий пользователь — `getCurrentUser()` из `entities/user`. `proxy.ts` делает редиректы по наличию и сроку cookie.
- Формы: react-hook-form + `zodResolver` со схемами из shared.

Также обновить README (раздел web), если там описана структура.

## Проверка

1. `npm run lint`, `npm run typecheck`, `npm run build`, `npm run format:check` из корня.
2. `npm run db:up`, `npm run dev`, затем curl: `GET /` без cookie → 307 на `/login`; `/login` и `/register` отдают 200.
3. В браузере (через навык run / Chrome, если доступен, иначе вручную):
   - регистрация нового пользователя → редирект на `/`, видно имя, в DevTools cookie `access_token` с флагом HttpOnly;
   - повторная регистрация с тем же email → «Пользователь с таким email уже существует»;
   - пустые поля и короткий пароль → ошибки под полями без запроса к api;
   - «Выйти» → `/login`, `/` снова недоступна; вход с неверным паролем → «Неверный email или пароль», с верным → `/`;
   - с живой cookie `/login` перекидывает на `/`.
4. Тесты api (`npm run test`) не затронуты, прогнать для контроля.
