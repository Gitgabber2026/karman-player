# Electronic Music World Atlas

Интерактивный мировой атлас электронной музыки, клубной культуры и фестивалей.
Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · MapLibre GL · PostgreSQL 16 + PostGIS 3 · Drizzle ORM · TanStack Query · Zod · Vitest.

## Быстрый старт

```bash
cd atlas
cp .env.example .env            # при необходимости поправьте DATABASE_URL
docker compose up -d            # PostgreSQL + PostGIS (или свой сервер с расширением postgis)
npm install
npm run db:setup                # миграции + наполнение seed-набором
npm run dev                     # http://localhost:3000 → /ru
```

Без `DATABASE_URL` приложение работает на встроенном seed-наборе (в интерфейсе показывается баннер).

| Команда | Что делает |
|---|---|
| `npm run build && npm start` | продакшн-сборка |
| `npm test` | unit-тесты (данные, поиск, фильтры, история, адаптер Ticketmaster) |
| `npm run typecheck` | проверка типов |
| `npm run data:validate` | ссылочная целостность seed-набора |
| `npm run db:generate` | новая миграция после изменения `src/db/schema.ts` |

## Ключи API

* `TICKETMASTER_API_KEY` — Consumer Key из https://developer.ticketmaster.com/. Без ключа адаптер помечен «not-configured», события не выдумываются.
* `NEXT_PUBLIC_MAP_STYLE_URL` — стиль MapLibre (по умолчанию CARTO Dark Matter). Если стиль недоступен, карта переходит на офлайн-подложку с границами Natural Earth.

## Админ-панель

`/ru/admin` — нужны `DATABASE_URL` и `ADMIN_SESSION_SECRET` (не менее 32 символов). Пользователь:

```bash
npm run admin:create -- editor@example.org 'длинный-пароль' editor   # admin | editor | researcher
```

Researcher добавляет события и выпуски фестивалей (только с официальным источником) — они уходят на модерацию; editor публикует их и меняет статусы проверки.

## Структура

```
src/app/[locale]/…     страницы (ru — основной язык, en — дополнительный)
src/app/api/…          search, map (GeoJSON), events, health
src/components/map/    интерактивная карта (кластеры, тепловая карта, drill-down, историческая карта)
src/data/              редакционный seed-набор с источниками и статусами проверки
src/db/schema.ts       реляционная модель (36 таблиц, PostGIS)
src/lib/atlas.ts       индекс атласа: связи, поиск, граф связей, фильтры событий, календарь
src/lib/integrations/  адаптеры внешних источников
drizzle/               SQL-миграции
```

См. также `IMPLEMENTATION_PLAN.md` и `PROGRESS.md`.
