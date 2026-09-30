# Cheat sheet for bodybuilders

Пет-проект: адаптивные тренировки, чек-ины восстановления и расчёт КБЖУ.

Приложение подстраивает нагрузку под самочувствие: чек-ин за сон, энергию и
крепатуру меняет объём и повторения в сгенерированной программе.

## Стек

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 ·
shadcn/ui · Supabase (Postgres + Auth + RLS) · Vitest

## Возможности

- **Генератор тренировок** — 46 упражнений, 2–6 дней в неделю, цели сила / масса /
  выносливость, спортзал или дом. Детерминирован: одинаковые параметры дают
  одинаковую программу.
- **Чек-ины** — сон, энергия, крепатура по семи мышечным группам, заметка.
  Повторный чек-ин за день перезаписывает предыдущий.
- **Адаптация нагрузки** — сон <5 ч срезает объём на 20%, энергия 1–2 на 25%,
  крепатура бьёт по конкретной группе. Итог зажат в диапазон 0.6–1.15.
- **КБЖУ** — BMR по Миффлину-Сан Жеору, TDEE, белок/жиры/углеводы.
- **Публичные профили** — `/u/<username>`, только тренировки с `is_public = true`.

## Запуск

```bash
npm install
cp .env.example .env.local   # подставь свои значения
npm run dev
```

Приложение на `http://localhost:3000`.

### Переменные окружения

| Переменная | Назначение |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL проекта Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable (anon) ключ |

## База данных

Схема, RLS-политики и триггер профиля — в `supabase/migrations/001_init.sql`.
Применить на новом проекте:

```bash
supabase db push
```

Каталог упражнений хранится в коде (`src/lib/exercise-catalog.ts`) и заливается
в базу генератором:

```bash
npm run db:seed    # перезаписывает существующие упражнения по имени
```

## Команды

| Команда | Что делает |
| --- | --- |
| `npm run dev` | Дев-сервер |
| `npm run build` | Прод-сборка |
| `npm run lint` | ESLint |
| `npm test` | Vitest, 99 тестов |
| `npm run test:watch` | Vitest в watch |
| `npm run db:seed` | Перегенерировать `supabase/seed.sql` и залить каталог |

## Безопасность

RLS включён везде: `profiles` читаются публично, `workouts` — только свои или с
`is_public = true`, `checkins` и `checkins`-запросы доступны лишь владельцу.
Ключ в `.env.local` — publishable, он предназначен для браузера; секретный
`service_role` в приложение попадать не должен.

## Деплой на Vercel

```bash
npm i -g vercel
vercel
```

В Variable Environment Variables добавить `NEXT_PUBLIC_SUPABASE_URL` и
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Vercel подхватит Next.js автоматически,
дополнительных настроек сборки не нужно.
