# Carpigiani Ukraine website

New website for carpigiani.com.ua, the official Ukrainian dealer of Carpigiani, IFI and ISA ice cream equipment. Replaces the old Joomla site.

Built on the Next.js + FastAPI + PostgreSQL boilerplate: Next.js frontend, FastAPI backend and PostgreSQL database, all in Docker. Ready so far: site header and footer, fonts and colors from the approved design. Pages are added block by block.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 · React · TypeScript · Tailwind CSS v4 · shadcn/ui · next-intl · Zod |
| Backend | Python 3.14 · FastAPI · SQLAlchemy 2 · Alembic · Poetry |
| Database | PostgreSQL 18 |
| Dev environment | Docker Compose with watch mode |

## Features

- **Same addresses as the old site** — `/maestro`, `/news`, `/contacts` and so on; old `/ru/...` links open the same page in Ukrainian
- **Two languages** — Ukrainian (main, no prefix: `/news`) and English (`/en/news`) with a language switcher. The site always opens in Ukrainian; browser language is ignored
- **Database ready on first start** — migrations run automatically, no manual setup
- **Auto-reload in Docker** — code changes apply instantly; adding a package rebuilds the container automatically
- **Health check** — `GET /api/health` checks both the API and the database
- **Swagger docs** — interactive API docs at `/docs`
- **Carpigiani design** — cream background, caramel accents, Cormorant Garamond headings and Manrope text with Cyrillic support

## Quick start

Requirements: [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
# 1. Create your settings file
cp .env.example .env

# 2. Start everything
docker compose up --build --watch
```

All settings live in `.env`: database name, user, password and `CORS_ORIGINS` — the frontend addresses allowed to call the API (add your domain there in production).

Open:

| What | Address |
|---|---|
| Website | http://localhost:3000 |
| API docs (Swagger) | http://localhost:8000/docs |
| Health check | http://localhost:8000/api/health |
| Emails (Mailpit) | http://localhost:8025 |

Stop with `Ctrl + C`, or `docker compose down`.

## Project structure

```text
frontend/
  app/
    [locale]/
      layout.tsx         root layout: fonts, header, footer, page title
      page.tsx           home page
    globals.css          global styles, Carpigiani colors, background
    favicon.ico
  components/
    site-header.tsx      header: logo, brands, menu, burger on phones
    site-footer.tsx      footer: contacts, links, AO Studio credit
    ui/                  shadcn/ui components (button, input, card, dialog, ...)
  i18n/
    routing.ts           list of languages, the default one (uk)
    request.ts           loads translations for the current language
    navigation.ts        language-aware Link, redirect, router
  messages/
    en.json              English texts
    uk.json              Ukrainian texts
  lib/
    api.ts               API client (calls to the backend)
    utils.ts             helpers for shadcn/ui
  public/images/         logo and footer image
  proxy.ts               picks the language from the address (/en = English)
  next.config.ts         settings, redirects for old /ru links
  components.json        shadcn/ui settings
  AGENTS.md              notes for AI coding assistants
  Dockerfile

backend/
  app/
    main.py              FastAPI app, CORS, routers
    db/session.py        database connection
    models/item.py       database table (SQLAlchemy)
    schemas/item.py      request and response shapes (Pydantic)
    routers/
      health_router.py   GET /api/health
      items_router.py    CRUD endpoints for items
    services/            place for your business logic
  alembic/
    env.py               migration settings
    versions/            migration files
  alembic.ini
  pyproject.toml         Python packages (Poetry)
  Dockerfile

docker-compose.yml       all services for local development
.env.example             settings template — copy to .env
```

**How a request flows:** page → `lib/api.ts` → `routers/items_router.py` → `models/item.py` → PostgreSQL. The `items` API is the boilerplate example; it stays until the first real entity (slides) replaces it.

To add your own entity (e.g. `products`):

1. Copy `models/item.py`, `schemas/item.py` and `routers/items_router.py`, then rename the class, table and route names.
2. Import the new model in `backend/app/models/__init__.py` — otherwise migrations won't see the table.
3. Register the new router in `backend/app/main.py` with `app.include_router(...)`.
4. Create a migration (see *Change the database structure* below).

In endpoints, get a database session with `db: DbSession` (from `app.db.session`).

## Admin panel

Hidden address: `/fofkas-adminpanel` (login page: `/fofkas-adminpanel/login`). It is not linked anywhere on the site and is closed for Google.

- Two admins are created on the first start from `.env`: `OLEH_ADMIN_EMAIL` / `OLEH_ADMIN_PASSWORD` and `FOFKA_ADMIN_EMAIL` / `FOFKA_ADMIN_PASSWORD`. An existing admin is not changed.
- `JWT_SECRET` in `.env` signs the login tokens. Use a long random string.
- "Forgot password" sends an email with a one-time link (valid 1 hour). Locally all emails go to Mailpit: open http://localhost:8025 to read them.
- For the live site set `SITE_URL`, `COOKIE_SECURE=true` and real `SMTP_*` values.
- Admin pages use Antd (`frontend/components/admin/antd-provider.tsx` sets the Carpigiani colors).
- Uploaded photos are converted to WebP and kept in the Docker volume `uploads` (`/app/uploads` in the backend). The browser gets them at `/uploads/...`; the site passes `/api/...` and `/uploads/...` on to FastAPI (`frontend/next.config.ts`).

### Admin sections

- **Equipment for ice cream production** (equipment categories, table `equipment_categories`): each category is a card on the home page (photo, title in Ukrainian and English, page address, order, show/hide). With no categories the block is not shown on the site.

## Common tasks

### Add a language

1. Add the language code to `locales` in `frontend/i18n/routing.ts`
2. Copy `frontend/messages/en.json` to a new file, e.g. `de.json`, and translate it

### Change fonts

Fonts are set once in `frontend/app/[locale]/layout.tsx`. Replace the font names there; keep the `cyrillic` subset if you need Cyrillic text.

### Change the database structure

After editing your models, create a migration:

```bash
docker compose exec backend alembic revision --autogenerate -m "describe your change"
```

It is applied automatically on the next start. To apply it right away:

```bash
docker compose exec backend alembic upgrade head
```

### Add a package

- Frontend: `npm install <package>` inside `frontend/`
- Backend: `poetry add <package>` inside `backend/`

With `--watch` running, the container rebuilds by itself.

### Reset the database

```bash
docker compose down -v
```

This deletes all data of this project and starts with a clean database next time.

## FAQ

**I see a "Cache disabled" badge in the corner.**
That is the Next.js dev indicator. It appears when "Disable cache" is turned on in your browser DevTools (Network tab). It is not shown in production.

**Port 5432 is already in use.**
Another PostgreSQL is running on your computer. Change the left number in `docker-compose.yml` under `db → ports`, e.g. `"5433:5432"`.

## Starting a new project from this boilerplate

After copying, rename:

- container names in `docker-compose.yml`
- `name` in `backend/pyproject.toml` and `frontend/package.json`
- site title in `frontend/messages/*.json` (`Metadata` section)
- API title in `backend/app/main.py`

---

© 2026 · Made by [AO Studio](https://aostudio.art)