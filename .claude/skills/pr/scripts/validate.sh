#!/bin/bash
# Готовность текущей ветки к PR. Аргумент — целевая ветка (по умолчанию main).
base="${1:-main}"
branch=$(git branch --show-current)

if [[ -z "$branch" ]]; then
  echo "Ошибка: HEAD не на ветке (detached HEAD)."
  exit 1
fi

if [[ "$branch" == "main" || "$branch" == "$base" ]]; then
  echo "Ошибка: PR из ветки '$branch' в '$base' не создаётся."
  echo "Создайте ветку: git switch -c <type>/<scope>-<кратко>"
  exit 1
fi

if [[ ! "$branch" =~ ^(feat|fix|refactor|perf|test|docs|style|build|ci|chore)/[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "Предупреждение: имя '$branch' не по формату <type>/<scope>-<кратко>."
fi

if ! git rev-parse --verify --quiet "origin/$base" >/dev/null; then
  echo "Ошибка: нет ветки origin/$base. Выполните git fetch origin $base."
  exit 1
fi

commits=$(git rev-list --count "origin/$base..HEAD")
if [[ "$commits" -eq 0 ]]; then
  echo "Ошибка: в '$branch' нет коммитов относительно origin/$base."
  exit 1
fi

echo "Ветка '$branch' готова: $commits коммит(ов) относительно origin/$base."
