# План: согласие на обработку персональных данных

## Контекст

Пользователь попросил добавить на форму согласие на обработку персональных данных. Решения, согласованные через меню:

- **Чекбокс только на регистрации.** Данные (имя, email) собираются при регистрации, поэтому согласие даётся один раз. На странице входа только ссылка на политику.
- **Согласие хранится в БД.** По 152-ФЗ оператор должен уметь доказать, что согласие получено.
- **Текст на отдельной публичной странице `/privacy`.** Ссылка из подписи чекбокса открывается в новой вкладке.

## shared

`registerSchema.personalDataConsent`: `z.boolean().refine((v) => v, { error: 'Нужно согласие на обработку персональных данных' })`. Используется `boolean`, а не `z.literal(true)`: так у формы есть начальное значение `false`.

## api

- `schema.prisma`, `User.personalDataConsentAt DateTime? @map("personal_data_consent_at")`. Поле nullable, потому что у уже зарегистрированных пользователей согласия нет. Миграция `personal_data_consent`.
- `CreateUserData.personalDataConsentAt: Date`. Время ставит `AuthService.register` (`new Date()`), а не клиент.
- `PublicUser` не меняется.
- В тестах обновить `auth.service.spec` и добавить проверку `registerSchema` без согласия.

## web

- `npx shadcn add checkbox`.
- В `RegisterForm` поле-чекбокс через `Controller`, подпись со ссылкой на `/privacy`.
- Слайс `pages/privacy` с текстом-шаблоном политики, роут `app/privacy/page.tsx`.
- `proxy.ts`: `/privacy` открыт всем (`PUBLIC_PATHS`).
- На странице входа ссылка на политику.

## Проверка

lint, typecheck, test, build, format:check. curl: `/privacy` открывается без cookie. Регистрация в api без согласия отвечает 400, с согласием 201, `personal_data_consent_at` заполнено в БД.
