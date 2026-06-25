# ssamAI — Team Roster

오케스트레이터가 작업을 라우팅할 때 참고하는 팀 구성.

## Specialists (reins)

| Rein | Owns | Out of scope | Notes |
|------|------|--------------|-------|
| `frontend-expert` | `apps/web/**` | services, docker-compose | Next.js 15 + Tailwind + Pretendard 한국어 UI |
| `backend-expert` | `services/ppt-service/**`, `services/persona-service/**` | apps/web, docker-compose, litellm config (단순 호출은 OK) | FastAPI + Pydantic v2 + Neo4j |
| `infra-expert` | `docker-compose.yml`, `.env.example`, Dockerfile, `services/litellm/config.yaml` 인프라 측면 | 앱 소스, 프롬프트 | LiteLLM 라우팅 **정책**은 llm-expert |
| `llm-expert` | `services/litellm/config.yaml` model_list/routing, 프롬프트, 모델 선택 | 인프라, UI, 앱 로직 | 한국어 품질, 비용/품질 trade-off |
| `code-reviewer` | read-only review | 직접 코드 수정 금지 | 보안/계약/멀티테넌시/PR 게이트 |

## Common docs

- [`pitfalls.md`](./pitfalls.md) — 새 agent가 알아야 할 함정 13개
- [`ARCHITECTURE.md`](../../ARCHITECTURE.md) — 포트 매트릭스, 데이터 흐름, 디자인 시스템 (root)
- [`AGENTS.md`](../../AGENTS.md) — 모든 agent가 먼저 읽어야 할 root 문서

## Reroute 규칙

작업 분류가 애매하면:

- "Next.js에서 X 컴포넌트 수정" → `frontend-expert`
- "FastAPI에 새 endpoint 추가" → `backend-expert`
- "docker-compose에 서비스 추가" → `infra-expert`
- "프롬프트/모델 변경" → `llm-expert`
- "PR review" → `code-reviewer`
- "여러 영역 동시" → 오케스트레이터가 multi-track plan

## 새 rein 추가

새 specialist가 필요하면 orchestrator에게 제안 → 사용자 동의 후 `.harness/reins/<name>/agent.md` 작성.