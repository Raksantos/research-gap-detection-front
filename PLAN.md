# Plano de implementacao — research-gap-detection-front

Frontend em React que consome a API Django do projeto `../research-gap-detection`.

## Contexto do backend (snapshot em 2026-04-20)

- Django 6 + DRF + drf-spectacular
- Prefixo global: `/api/`
- Endpoints hoje:
  - `POST /api/ingest/search/` — busca multi-source (OpenAlex, arXiv), normaliza, dedupe, filtra, opcionalmente persiste
  - `GET /api/schema/` — OpenAPI 3
  - `GET /api/docs/` — Swagger UI
  - `GET /api/redoc/` — ReDoc
- Roadmap declarado (pages placeholder a prever): jobs assincronos, embedding-based dedup, multi-agent gap detection
- Backend roda em `http://localhost:8000`

### Contrato do `POST /api/ingest/search/`

Request:

```json
{
  "query": "string (1..500)",
  "sources": ["openalex", "arxiv"],
  "limit": 50,
  "dedupe": true,
  "persist": true,
  "year_min": 2020,
  "year_max": 2026,
  "require_abstract": false
}
```

Response:

```json
{
  "documents": [
    {
      "source": "string",
      "external_id": "string",
      "title": "string",
      "abstract": "string|null",
      "authors": ["string"],
      "year": "int|null",
      "doi": "string|null",
      "keywords": ["string"],
      "url": "string|null"
    }
  ],
  "per_source_counts": { "openalex": 25, "arxiv": 18 },
  "filtered_out": 4,
  "duplicates_collapsed": 7,
  "persisted": 32
}
```

## Decisoes confirmadas com o usuario

- TypeScript
- Chakra UI v3
- Yarn Berry (v4) com `nodeLinker: node-modules` (sem PnP)
- axios como HTTP client
- React Router v6 (estrutura multi-pagina ja prevendo roadmap)
- Gerar client/types a partir do OpenAPI
- ESLint (alem de Prettier + Husky)
- Vitest (mesmo sem grande fa de testes no front)
- Frontend em `localhost:3000`
- Dockerfile + docker-compose

## Stack final

- React 18 + TypeScript 5 + Vite 5
- Chakra UI v3 + `@emotion/react` + `next-themes` (requisito do Chakra v3 p/ color mode)
- React Router v6
- axios
- `@hey-api/openapi-ts` (codegen a partir de `/api/schema/`)
- ESLint flat config + `typescript-eslint` + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`
- Prettier + `eslint-config-prettier`
- Husky + lint-staged
- Vitest + `@testing-library/react` + `@testing-library/jest-dom` + jsdom
- Yarn 4 (Berry), `nodeLinker: node-modules`
- Node 20 LTS
- Dockerfile multistage (dev com Vite / prod com nginx) + docker-compose

## Estrutura de diretorios

```
research-gap-detection-front/
├── .husky/
├── .yarn/ + .yarnrc.yml        # yarn 4, nodeLinker node-modules
├── .dockerignore
├── .env.example                # VITE_API_BASE_URL
├── eslint.config.js            # flat config
├── .prettierrc
├── Dockerfile                  # multistage: builder / dev / prod(nginx)
├── docker-compose.yml
├── nginx.conf                  # SPA fallback + proxy /api
├── package.json
├── tsconfig.json / tsconfig.node.json
├── vite.config.ts              # porta 3000, proxy /api -> :8000
├── index.html
├── openapi-ts.config.ts        # config do codegen
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── router.tsx
│   ├── theme/                  # Chakra v3 system (createSystem)
│   ├── api/
│   │   ├── client.ts           # instancia axios com baseURL=/api
│   │   ├── generated/          # output do openapi-ts (commitado)
│   │   └── endpoints/          # wrappers tipados (ex. search.ts)
│   ├── pages/
│   │   ├── Home/               # landing com atalhos
│   │   ├── Search/             # formulario + resultados + stats
│   │   ├── Jobs/               # placeholder (roadmap)
│   │   ├── Gaps/               # placeholder (roadmap)
│   │   └── NotFound/
│   ├── components/
│   │   ├── layout/             # AppShell, Navbar, Sidebar
│   │   └── ui/
│   ├── hooks/                  # useAsync (wrapper loading/error)
│   ├── types/
│   └── test/setup.ts
```

## Integracao backend

- Vite em `localhost:3000`, proxy `/api` -> `http://localhost:8000` (evita CORS em dev)
- axios com `baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api'` — mesma config funciona em dev (proxy), prod (nginx) e Docker
- Script `yarn openapi:gen` lendo `/api/schema/`, output em `src/api/generated/`

## Docker

- `Dockerfile` com 3 targets:
  - `dev` -> node:20-alpine, `yarn dev --host 0.0.0.0`
  - `builder` -> `yarn build`
  - `prod` -> nginx:alpine servindo `dist/`, com `nginx.conf` (SPA fallback + `proxy_pass /api -> http://backend:8000`)
- `docker-compose.yml` com servico `frontend` (target dev) e bind mount; backend referenciado como servico externo opcional via comentario

## Ordem de execucao da implementacao

1. `yarn set version berry`, setar `nodeLinker: node-modules` no `.yarnrc.yml`
2. Scaffold manual do Vite (nao usar template para nao inflar)
3. Instalar deps runtime:
   - `react`, `react-dom`, `react-router-dom@6`, `axios`
   - `@chakra-ui/react`, `@emotion/react`, `next-themes`
4. Instalar dev deps:
   - `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`
   - `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
   - `prettier`, `eslint-config-prettier`
   - `husky`, `lint-staged`
   - `vitest`, `@vitest/ui`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
   - `@hey-api/openapi-ts`
5. tsconfig com alias `@/*` -> `src/*`
6. `vite.config.ts` com porta 3000 + proxy
7. Chakra v3 `Provider` no `main.tsx` (dark mode on)
8. Router com rotas `/`, `/search`, `/jobs`, `/gaps`, `*`
9. AppShell com Navbar/Sidebar
10. Pagina `Search`: form (query, sources multi-select, limit, year_min/max, checkboxes) + lista de cards de documentos + painel de stats
11. Hook `useAsync` simples para loading/error
12. Config ESLint flat + Prettier + lint-staged pre-commit + `husky init`
13. Vitest config + 1 teste do formulario de search
14. Dockerfile + nginx.conf + compose
15. Atualizar README com instrucoes

## Defaults assumidos (usuario pode discordar depois)

1. Commit do `src/api/generated/` no repo (build nao depende de backend rodando)
2. Dark mode on por default (Chakra v3 + `next-themes`)
3. Sem GitHub Actions nesta primeira leva
4. Hook `useAsync` minimalista em vez de React Query
5. `docker-compose.yml` so do frontend, com comentario de como conectar ao backend
6. `next-themes` obrigatorio pelo Chakra v3 (nao opcional)
7. Sem commitlint — so lint-staged no pre-commit

## Status

- [x] Plano aprovado pelo usuario
- [ ] Implementacao iniciada
