# research-gap-detection-front

React frontend for the `research-gap-detection` backend.

## Requirements

- Node 20+
- Corepack enabled (`corepack enable`)
- Backend checkout: `/home/rodrigo/Documents/research-gap-detection` (sibling repo), Django at `http://127.0.0.1:8000`

## Running with the backend

**Terminal A — Django** (from `research-gap-detection`):

```bash
cd /home/rodrigo/Documents/research-gap-detection
uv sync
uv run python manage.py migrate
uv run python manage.py runserver 127.0.0.1:8000
```

**Terminal B — frontend** (this repo):

```bash
corepack yarn install
cp .env.example .env
corepack yarn openapi:gen
corepack yarn dev
```

Frontend runs at `http://localhost:3000`.

Browser requests use same-origin `/api`; Vite forwards them to the backend (`BACKEND_ORIGIN` in `.env`, default `http://127.0.0.1:8000`). The Django project enables CORS for `http://localhost:3000` so you can also point `VITE_API_BASE_URL` at `http://127.0.0.1:8000/api` if you bypass the proxy.

**Codegen from the live backend OpenAPI** (requires Django running):

```bash
corepack yarn openapi:gen:backend
```

## API integration

- Base URL is `VITE_API_BASE_URL` (`/api` by default).
- In development, Vite proxies `/api` to `BACKEND_ORIGIN` (see `.env.example`).
- API client is generated from `openapi/schema.json`:

```bash
corepack yarn openapi:gen
```

Generated files are committed under `src/api/generated`.

## Quality commands

```bash
corepack yarn lint
corepack yarn test
corepack yarn build
```

## Git hooks

Husky is configured with a pre-commit hook running `lint-staged`.

## Docker

Development container:

```bash
docker compose up --build
```

Production image:

```bash
docker build --target prod -t research-gap-front:prod .
docker run --rm -p 8080:80 research-gap-front:prod
```

The production Nginx config proxies `/api` to `http://backend:8000`; ensure the backend is reachable by that host name in your runtime network.
