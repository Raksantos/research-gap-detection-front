# Plano — Autenticação (JWT) + Projetos por usuário

Feature que abrange os **dois repos**: `research-gap-detection` (Django) e
`research-gap-detection-front` (React). Decidido com o usuário em 2026-05-24.

## Decisões

- **Auth**: JWT via `djangorestframework-simplejwt` (já está nas deps do backend).
  Login retorna `access`/`refresh`; access vai em `Authorization: Bearer`.
- **Projeto**: instância que um usuário cria para uma pesquisa específica. As
  features atuais (search/ingest, mapping/jobs, gaps, feasibility) passam a ser
  escopadas por projeto.
- **Corpus por projeto**: `Document` continua global e deduplicado por
  `(source, external_id)`. A associação a um projeto é feita por um through-model
  explícito `ProjectDocument(project, document, added_at, added_via_job)`.
  Corpus do projeto X = `Document.objects.filter(projects=X)`.
- **Owner scoping**: todo queryset filtra por `project__owner=request.user`.
- **Logout**: por enquanto client-side (descarta tokens). `token_blacklist`
  (invalidação server-side do refresh) fica para depois, se necessário.

## Fases (cada uma é um estado coerente e shippável)

1. **Backend auth** — wire SimpleJWT; endpoints `/api/auth/register/`,
   `/api/auth/token/`, `/api/auth/token/refresh/`, `/api/auth/me/`. Permissão
   default permanece aberta (`AllowAny`) — endpoints existentes não mudam.
2. **Frontend auth** — páginas login/register, storage de tokens, interceptor
   axios (Bearer + 401→refresh→retry), `<RequireAuth>`. Páginas atuais seguem
   funcionando.
3. **Backend Project CRUD** — app `projects`, modelo `Project{owner,name,description}`,
   viewset filtrado por `owner=request.user` (exige auth explicitamente). Pipeline
   ainda global.
4. **Frontend Projects** — listar/criar/selecionar projeto; `selectedProjectId`
   em contexto/URL. Páginas atuais seguem funcionando sem projeto.
5. **Backend scoping (fase disruptiva)** — FK `project` em `IngestionJob`,
   `MappingJob`, `GapDetectionJob`; through-model `ProjectDocument`; flip do
   permission default para `IsAuthenticated`; querysets filtram por
   `project__owner=request.user`. **Re-confirmar com o usuário antes de iniciar.**
6. **Frontend wiring** — propagar `project_id` em Search/Jobs/Gaps.

## Observações / riscos

- Testes existentes em `*/tests/` quebram na fase 5 (flip de permissão) —
  auditar antes e atualizar junto.
- Migrações da fase 5: FK nullable + backfill, depois tornar non-null. Dev usa
  sqlite (reset barato), mas confirmar antes de apagar dados.
- `openapi/schema.json` commitado já está defasado (faltam `gaps`/`feasibility`).
  Ao rodar `yarn openapi:gen:backend` esses endpoints entram junto — efeito
  colateral esperado, não escopo desta feature.

## Status

- [x] Fase 1 — Backend auth
- [x] Fase 2 — Frontend auth
- [x] Fase 3 — Backend Project CRUD
- [x] Fase 4 — Frontend Projects
- [x] Fase 5 — Backend scoping (2026-05-25)
- [x] Fase 6 — Frontend wiring (2026-05-25)

## Notas da fase 5/6 (como ficou)

- **`IngestionJob` era dead code** — nunca instanciado. Não recebeu FK `project`;
  `added_via_job` em `ProjectDocument` é FK nullable a `IngestionJob`, deixada
  null (busca persiste síncrono, sem job).
- **Transporte do `project_id`**: body em POSTs (`/ingest/search/`,
  `/mapping/run/`), query param obrigatório em GETs de lista (`/mapping/jobs/`,
  `/mapping/topics/`, `/mapping/entities/`, `/mapping/cooccurrences/`,
  `/gaps/jobs/`). Endpoints de detalhe (`/mapping/jobs/<id>/`, `/gaps/<id>/`,
  summary) NÃO levam project_id — o queryset filtra por `project__owner=user`
  e dá 404 quando não é do usuário. `/gaps/run/` herda o project do mapping_job.
- **Migração**: FK non-null direta (sem backfill). Banco `research_gap` no
  Postgres foi criado do zero e migrado; dados antigos (que estavam num
  `db.sqlite3` residual) foram descartados, conforme combinado.
- **Helpers novos**: `projects/scoping.py` (`get_owned_project`,
  `require_owned_project`) e `projects/testing.py` (`make_project`/`make_user`
  para fixtures de teste).
- **Bug latente corrigido**: ordenação de "último job" usava `-finished_at`, que
  no Postgres coloca NULL primeiro (no sqlite era por último). Trocado por
  `F("finished_at").desc(nulls_last=True)` em topics/cooccurrences.
- **Front**: Search e Jobs exigem projeto selecionado (`selectedProjectId`);
  sem projeto, mostram aviso e desabilitam ações. Gaps (summary) é por job_id,
  owner-scoped, sem mudança. Schema OpenAPI e SDK gerado regenerados.

## Pendência de infra (fora do escopo desta feature)

- O serviço `db` no `docker-compose.yml` só define `POSTGRES_PASSWORD`; não cria
  o banco `research_gap` nem persiste dados em volume. Por isso o app caía em
  sqlite. Sugestão: adicionar `POSTGRES_DB=research_gap`/`POSTGRES_USER=postgres`
  ao serviço `db` e um volume nomeado para `/var/lib/postgresql/data`.
