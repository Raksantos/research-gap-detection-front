# research-gap-detection-front

React frontend for the `research-gap-detection` backend.

## Requirements

- Node 20+
- Corepack enabled (`corepack enable`)
- Backend running at `http://localhost:8000` for local development

## Local setup

```bash
corepack yarn install
cp .env.example .env
corepack yarn openapi:gen
corepack yarn dev
```

Frontend runs at `http://localhost:3000`.

## API integration

- Base URL is `VITE_API_BASE_URL` (`/api` by default).
- In development, Vite proxies `/api` to `http://localhost:8000`.
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
