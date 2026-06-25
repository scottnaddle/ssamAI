# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick reference

Project ssamAI — 한국 교원(교사 + 에듀테크 직원) 특화 AI 에이전트 하네스 플랫폼. Phase 1 MVP: 채팅 + .pptx 처리 + 교원 페르소나 장기 메모리.

## Commands

```bash
# Install dependencies
pnpm install                          # frontend (apps/web)
(cd services/ppt-service && pip install -e ".[dev]")
(cd services/persona-service && pip install -e ".[dev]")

# Full stack
docker compose up -d --build          # all services
docker compose down                   # stop (keeps data)
docker compose down -v                # stop + wipe volumes
docker compose logs -f web librechat litellm

# Frontend only (hot reload, requires backend services running)
cd apps/web && pnpm dev               # http://localhost:3000

# Python services (local dev)
cd services/ppt-service && uvicorn app.main:app --reload --port 8200
cd services/persona-service && uvicorn app.main:app --reload --port 8100

# Quality
pnpm build                            # next build
pnpm lint                             # next lint
pnpm typecheck                        # tsc --noEmit
ruff check services/<name>            # Python lint
mypy services/<name>                  # Python type check
pytest services/<name>/tests/         # Python tests (test infra WIP)
```

**Tests**: Currently no test infrastructure exists — Phase 1 scaffold state. When adding tests, use `pytest` + `pytest-asyncio` in `services/<name>/tests/`, and Vitest in `apps/web/__tests__/` or co-located `*.test.tsx`.

## Architecture

```
Browser → apps/web (Next.js 15 App Router, :3000)
           ├── rewrites /api/librechat/* → LibreChat (:3090, API-only)
           ├── rewrites /api/ppt/*      → ppt-service (:8200, FastAPI + python-pptx)
           └── rewrites /api/persona/*  → persona-service (:8100, FastAPI + Neo4j)

  LibreChat ──→ LiteLLM router (:4000) ──→ DeepSeek / MiniMax
  ppt-service ─┘
  persona-service ───→ Neo4j 5.20 (:7687 bolt, :7474 browser)

Storage: MongoDB 7 (LibreChat user/convo data), Neo4j 5.20 (persona knowledge graph), Redis 7 (Phase 2 prep)
```

### Route groups

- `apps/web/app/(app)/` — sidebar shell wrapping authenticated pages: `chat/`, `library/`, `persona/`, `settings/`
- `apps/web/app/login/`, `signup/`, `onboarding/` — standalone pages (no sidebar)
- `apps/web/app/page.tsx` — redirects `/` → `/chat`
- `apps/web/app/(app)/layout.tsx` — auth guard: redirects unauthenticated users to `/login`

### LiteLLM model tiers

Defined in `services/litellm/config.yaml`:
- `ssamai-light` → MiniMax abab6.5s-chat (summarisation, simple edits, parsing)
- `ssamai-medium` → DeepSeek-Chat (new material generation, balanced quality)
- `ssamai-heavy` → DeepSeek-Reasoner (curriculum design, deep reasoning)
- Raw passthrough names also available: `deepseek-chat`, `deepseek-reasoner`, `minimax-abab6.5s-chat`
- Fallback chain: medium→light, heavy→medium

### Auth flow

1. LibreChat handles registration (`/api/register`) and login (`/api/login`) → returns JWT
2. Client stores JWT in localStorage (Phase 1; httpOnly cookie migration planned for Phase 2)
3. All backend calls go through Next.js rewrites (`/api/librechat/*`, `/api/ppt/*`, `/api/persona/*`)
4. Auth guard in `(app)/layout.tsx` checks for token, redirects to `/login` if missing

## Key conventions

### Frontend
- **Never call backend services directly** from browser — always use `/api/*` rewrite paths. Direct calls (`http://localhost:3090/...`) cause CORS errors and miss auth headers.
- **Never use raw hex colors** in components — always use Tailwind tokens from `tailwind.config.ts` (e.g., `bg-primary` not `bg-[#3D6B4F]`). The config is the single source of truth for the design system.
- React 19 RC — some libraries may have peer dependency conflicts.
- Font stack: `Pretendard` (CDN) → `Apple SD Gothic Neo` fallback.
- `@/*` path alias maps to `apps/web/*`.

### Backend (Python)
- Pydantic v2 with `from_attributes=True` (`ConfigDict`) for ORM/Neo4j record conversion.
- All Neo4j Cypher queries MUST include `WHERE n.group_id = $group_id` for multi-tenancy isolation.
- ruff config: line-length 100, target py311, rules E/F/I/B/UP/N/SIM.
- mypy: `--strict`.

### Infra
- Port overrides use `${VAR:-default}` pattern in docker-compose — never remove the fallback.
- Services with `depends_on: condition: service_healthy` must have a `healthcheck:` block.
- `CREDS_KEY`, `JWT_SECRET`, `JWT_REFRESH_SECRET` must be ≥32 chars (generate: `openssl rand -base64 32`).

### Security
- `.env` is gitignored — never stage it.
- Never hardcode API keys in `config.yaml` — use `os.environ/VAR_NAME`.
- CORS is `allow_origins=["*"]` on all FastAPI services (Phase 1 only — whitelist before production).

### Git
- Do not commit unless the user explicitly requests it.
- Branch naming: `feat/<scope>`, `fix/<scope>`, `refactor/<scope>`.
- Commit messages: Conventional Commits (e.g., `feat(chat): add SSE token parser error handling`).

## Deeper docs

- `AGENTS.md` — comprehensive agent instructions, PR conventions, security rules
- `ARCHITECTURE.md` — port matrix, data flow diagrams, design tokens, acceptance criteria, known tech debt
- `.harness/docs/pitfalls.md` — 13 common pitfalls with specific code examples
- `.harness/docs/team-roster.md` — team specialist routing map
