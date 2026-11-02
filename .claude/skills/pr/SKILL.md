---
name: pr
description: Создание pull request на GitHub по правилам проекта — проверка ветки, локальные проверки, push, заголовок обычной фразой, описание по реальному диффу и шаблону template.md. Использовать, когда пользователь просит создать PR, открыть пулреквест, «запушь и сделай PR» или вызывает /pr. Аргументы — название PR и целевая ветка (по умолчанию main).
argument-hint: '"[название PR]" [целевая ветка, по умолчанию main]'
allowed-tools:
  - Read
  - Bash(bash ${CLAUDE_SKILL_DIR}/scripts/validate.sh:*)
  - Bash(git branch --show-current)
  - Bash(git status:*)
  - Bash(git diff:*)
  - Bash(git log:*)
  - Bash(git rev-parse:*)
  - Bash(git rev-list:*)
  - Bash(git fetch origin:*)
  - Bash(git push -u origin:*)
  - Bash(gh pr list:*)
  - Bash(gh pr view:*)
  - Bash(gh pr create:*)
  - Bash(npm run build:*)
  - Bash(npm run lint:*)
  - Bash(npm run typecheck:*)
  - Bash(npm run test:*)
  - Bash(npm run format:check:*)
---

# Pull request на GitHub

Skill пушит текущую ветку и создаёт из неё PR. Сливает PR **пользователь**. Коммит, смена ветки, rebase, merge и force push в skill не входят: если без них не обойтись — остановиться и спросить.

## Подготовка

Предварительно, относительно `origin/main` до `git fetch`:

1. Ветка: !`bash ${CLAUDE_SKILL_DIR}/scripts/validate.sh`
2. Коммиты: !`git log origin/main..HEAD --oneline`
3. Файлы: !`git diff --stat origin/main...HEAD`

## 1. Аргументы

- **Название PR** — «$0». Пусто — составить по коммитам.
- **Целевая ветка** `<base>` — «$1». Пусто — `main`.
- **Исходная ветка** `<head>` — всегда текущая.

Если название пришло без кавычек (`$ARGUMENTS`: «$ARGUMENTS»), последнее слово — `<base>`, если похоже на ветку, остальное — название. Неясно — спросить.

## 2. Ветка

1. Вывод `validate.sh`: «Ошибка» — остановиться. «Предупреждение» об имени — предложить `git branch -m <новая>` (пока ветка не запушена), без согласия не переименовывать.
2. `git fetch origin <base>`; дальше сравнивать только с `origin/<base>`. Если `<base>` не `main` — повторить `bash ${CLAUDE_SKILL_DIR}/scripts/validate.sh <base>` и упомянуть это в отчёте.
3. `gh pr list --head <head> --state all --json number,state,url`: `OPEN` — показать ссылку и предложить запушить новые коммиты в него; `MERGED` — новая работа в новой ветке от `main`; `CLOSED` — спросить, создавать ли новый.
4. `git status --short`: незакоммиченное в PR не попадёт — предложить `/commit`.
5. `git rev-list --count <head>..origin/<base>`: если не 0 — сообщить об отставании, rebase/merge не делать.

## 3. Проверки

Из корня: `npm run build`, `lint`, `typecheck`, `test`, `format:check`. Упало — PR не создавать, показать вывод, исправление через `/commit` и повторный `/pr`.

- Запущен `npm run dev` — корневой `build` роняет api: собирать только `-w @expense-tracker/web`, api проверить `typecheck`.
- Только документация (`*.md`, `.claude/`) — достаточно `format:check`.

## 4. Заголовок

Обычная фраза на русском с заглавной буквы, без `type(scope):` и точки, до 72 символов, о результате, а не о процессе: «Выбор месяца сводки на главной». Из «$0» убрать префикс и точку; что поправлено — сказать в отчёте. Длиннее 72 символов или не по-русски — предложить вариант и спросить.

## 5. Описание

По реальному диффу: `git log origin/<base>..<head> --format='%h %s%n%b'` (тела коммитов — для «Что сделано» и «Зачем») и `git diff origin/<base>...<head>`.

Заполнить [template.md](template.md) по подсказкам в его комментариях; комментарии, пустые разделы и пункты удалить. Примеры: [с API](examples/api-pr.md), [только интерфейс](examples/web-pr.md).

- Опасные операции (удаление данных, миграции с потерей данных, ломающие изменения) — с обоснованием, ревьюер это проверяет (`REVIEW.md`).
- Репозиторий публичный: без токенов, паролей, `.env`, email и личных данных; без «Generated with Claude Code», `Co-Authored-By` и других упоминаний Claude как автора.

## 6. Push и создание

```bash
git push -u origin <head>    # без --force; отклонён — показать ошибку и спросить
gh pr create --base <base> --head <head> --title '<заголовок>' --body-file - <<'EOF'
<описание>
EOF
```

## 7. Отчёт

Проверить `gh pr view <head> --json number,url,title,baseRefName` и сообщить: ссылку, заголовок (и что поправлено), `<head>` → `<base>`, какие проверки прошли и какие пропущены, отставание. Одной строкой: ревью запустит `claude-code-review.yml`, сливает пользователь; ветку удалять только после `MERGED` в `gh pr view <N> --json state`, отдельной командой, не через `&&`.
