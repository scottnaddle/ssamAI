# ssamAI 개발 스택 (Development Stack)

**최종 갱신**: 2026-06-25
**버전**: v0.1.0 (Phase 1+2+3 완료, 테스트 인프라 구축)
**미션 진행률**: 82% (3-Loop 자가학습 시스템 전체 가동)

---

## 1. 아키텍처 한눈에

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ssamAI 플랫폼                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [Frontend]  apps/web (Next.js 15)                                  │
│       │                                                               │
│       ├─→ [Chat]  →  LibreChat (API-only)  →  MongoDB 7             │
│       │                                                               │
│       ├─→ [Library/PPT]  →  ppt-service (FastAPI)  →  python-pptx   │
│       │                                                               │
│       ├─→ [Persona]  →  persona-service  →  Neo4j 5.20              │
│       │                                                               │
│       └─→ [Skills/Library]  →  skill-service  →  Neo4j 5.20          │
│                                       │                              │
│                                       └─→  LiteLLM  →  DeepSeek +     │
│                                                       MiniMax        │
│                                                                       │
│  [Infra]  Docker Compose v2 (8 서비스)                               │
│  [Test]  pytest (Python 36) + Vitest (Web 14) = 50/50 passing       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. 기술 스택 (Layer별)

### 2.1 Frontend

| 항목 | 기술 | 버전 | 비고 |
|------|------|------|------|
| **프레임워크** | [Next.js](https://nextjs.org) | 15.0.3 | App Router, standalone output |
| **UI 라이브러리** | [React](https://react.dev) | 19.0.0-rc-66855b96-20241106 | RC 채널 |
| **언어** | [TypeScript](https://www.typescriptlang.org) | ^5.6.3 | strict mode, target ES2022 |
| **스타일링** | [TailwindCSS](https://tailwindcss.com) | ^3.4.15 | Pretendard 폰트 |
| **상태 관리** | React built-in (useState, useEffect) | - | 외부 상태 라이브러리 없음 |
| **API 클라이언트** | fetch + `apps/web/lib/api-client.ts` | - | 단순 fetch wrapper |
| **Neo4j 클라이언트** | [neo4j-driver](https://www.npmjs.com/package/neo4j-driver) | ^6.1.0 | 서버 측에서만 사용 |
| **유틸** | [clsx](https://github.com/lukeed/clsx) | ^2.1.1 | 조건부 className |
| **빌드** | next build (standalone) | - | Docker 이미지 200MB 이하 |

### 2.2 인증 / 채팅 엔진

| 항목 | 기술 | 버전 | 역할 |
|------|------|------|------|
| **채팅 UI 백엔드** | [LibreChat](https://www.librechat.ai) | ghcr.io/danny-avila/librechat:latest | API-only 모드 (UI 없음) |
| **인증 저장** | [MongoDB](https://www.mongodb.com) | 7 | JWT 사용자 백업 저장 |
| **인증 방식** | JWT (Bearer) | - | Phase 2: httpOnly 쿠키 예정 |
| **멀티테넌시** | `teacher_id` (격리 키) + `group_id` | - | Neo4j 쿼리 필터 적용 |

### 2.3 LLM 라우팅 / 모델

| 항목 | 기술 | 모델 | 용도 |
|------|------|------|------|
| **라우터** | [LiteLLM](https://github.com/BerriAI/litellm) | litellm/litellm:latest | OpenAI 호환 단일 엔드포인트 |
| **Tier 1 (Light)** | MiniMax | MiniMax-M2.5-highspeed | 빠른 응답, 단순 작업 |
| **Tier 2 (Medium)** | DeepSeek | deepseek-chat | 균형잡힌 성능 |
| **Tier 3 (Heavy)** | DeepSeek | deepseek-reasoner | 복잡한 추론 |
| **Fallback** | - | medium → light, heavy → medium | 자동 폴백 |
| **한국어 모델** | o3-mini (옵션) | - | 한글 HWPX 검증용 |

### 2.4 Backend 마이크로서비스 (3개)

| 서비스 | 포트 | 프레임워크 | 핵심 의존성 | 역할 |
|--------|------|-----------|------------|------|
| **ppt-service** | 8200 | FastAPI 0.115 | python-pptx 1.0, python-multipart | .pptx 파싱/생성 |
| **persona-service** | 8100 | FastAPI 0.115 | neo4j 5.25 | 교원 페르소나 CRUD (Neo4j) |
| **skill-service** | 8300 | FastAPI 0.115 | neo4j 5.25 | 5개 문서 생성 스킬 (한글 HWPX) |

**공통 의존성**:
- `fastapi>=0.115.4` + `uvicorn[standard]>=0.32.0`
- `pydantic>=2.9.2` + `pydantic-settings>=2.6.1`
- `httpx>=0.27.2` (외부 LLM 호출)

### 2.5 데이터 저장소

| DB | 버전 | 용도 | Cypher/SQL 특징 |
|----|------|------|-----------------|
| **[Neo4j](https://neo4j.com)** | 5.20-community + APOC | 지식 그래프 | Teacher, Template, Pattern, Feedback 노드 |
| **[MongoDB](https://www.mongodb.com)** | 7 | LibreChat 백업 | 사용자/대화 백업 |
| **[Redis](https://redis.io)** | 7-alpine | 캐시 (Phase 2 준비) | 현재 거의 미사용 |

**Neo4j 그래프 스키마**:
```
(:Teacher {id, name, school_level, subject, ...})
(:Teacher)-[:UPLOADED]->(:Template)
(:Template)-[:HAS_PATTERN]->(:Pattern {value, type, skill_type, applied_at, applied_to})
(:Teacher)-[:USED {count, last_used, last_source}]->(:Skill {name})
(:Teacher)-[:GAVE_FEEDBACK]->(:Feedback)-[:RATES {score, count}]->(:Pattern)
(:Pattern)-[:FREQ {count}]->(:Pattern)  // self-loop for frequency
```

### 2.6 문서 생성

| 형식 | 라이브러리 | 용도 |
|------|-----------|------|
| **PPTX** | [python-pptx](https://python-pptx.readthedocs.io) 1.0+ | PPT 파싱/생성 (ppt-service) |
| **HWPX** | [@ssabrojs/hwpxjs](https://www.npmjs.com/package/@ssabrojs/hwpxjs) ^0.4.0 | 한글 문서 생성 (skill-service) |
| **Markdown** | 직접 생성 (TypeScript) | Phase 2 스킬 중간 형식 |

**HWPX 생성 파이프라인**:
```
1. TypeScript: skill-templates/index.ts → Markdown
2. TypeScript: @ssabrojs/hwpxjs → HWPX bytes
3. FastAPI: skill-service → LLM 호출 (LiteLLM)
4. FastAPI: LLM 응답 → Markdown 변환 → HWPX bytes
5. 프론트엔드: 파일 다운로드 (Content-Disposition)
```

### 2.7 컨테이너 / 배포

| 항목 | 기술 | 비고 |
|------|------|------|
| **컨테이너** | [Docker](https://www.docker.com) + Compose v2 | 8 서비스 |
| **이미지 빌드** | Multi-stage Dockerfile | `apps/web/Dockerfile` (standalone) |
| **오케스트레이션** | docker-compose.yml | `ssamai-net` 네트워크 |
| **포트 매트릭스** | (아래 표) | env var로 오버라이드 가능 |

| 서비스 | 내포트 | 호스트포트 | 이미지 |
|--------|--------|------------|--------|
| web (Next.js) | 3000 | `${WEB_PORT:-3000}` | build (Dockerfile) |
| librechat | 3080 | `${LIBRECHAT_PORT:-3090}` | ghcr.io/danny-avila/librechat:latest |
| litellm | 4000 | `${LITELLM_PORT:-4000}` | litellm/litellm:latest |
| mongo | 27017 | 27017 | mongo:7 |
| neo4j browser | 7474 | 7474 | neo4j:5.20-community |
| neo4j bolt | 7687 | 7687 | (동일) |
| redis | 6379 | 6379 | redis:7-alpine |
| ppt-service | 8200 | `${PPT_SERVICE_PORT:-8200}` | build (Dockerfile) |
| persona-service | 8100 | `${PERSONA_SERVICE_PORT:-8100}` | build (Dockerfile) |
| skill-service | 8300 | `${SKILL_SERVICE_PORT:-8300}` | build (Dockerfile) |

### 2.8 테스트 인프라

| 영역 | 도구 | 버전 | 테스트 수 | 커버리지 |
|------|------|------|----------|----------|
| **Python** | [pytest](https://pytest.org) + pytest-asyncio + pytest-httpx | 8.3+ | **36** | 3 서비스 × 모델/prompt |
| **Frontend** | [Vitest](https://vitest.io) + @testing-library/react + happy-dom | 2.1 | **14** | 순수 함수 2 파일 |
| **합계** | - | - | **50** | - |

**Python 테스트 구조**:
```
pytest.ini                                          (루트, testpaths = services/*/tests)
conftest.py                                         (루트, 공유 fixtures)
scripts/test-python.sh                              (wrapper, 서비스별 cwd에서 실행)

services/{persona,ppt,skill}-service/tests/
├── test_models.py (persona: 7, ppt: 6)
├── test_home_letter.py (7)
├── test_lesson_plan.py (4)
├── test_formative_assessment.py (4)
├── test_official_letter.py (4)
└── test_rubric.py (4)
```

**Vitest 설정**:
```ts
// apps/web/vitest.config.ts
{
  environment: "happy-dom",
  setupFiles: ["./__tests__/setup.ts"],
  include: ["__tests__/**/*.test.{ts,tsx}", "lib/**/*.test.{ts,tsx}"]
}
```

**실행 명령어**:
```bash
# 전체
npm test                          # Python 36 + Vitest 14

# 개별
npm run test:python               # bash scripts/test-python.sh
npm run test:web                  # cd apps/web && npm test

# 서비스별
cd services/skill-service && python3 -m pytest tests/
```

### 2.9 코드 품질

| 항목 | 도구 | 설정 위치 |
|------|------|----------|
| **Python 린트** | [ruff](https://github.com/astral-sh/ruff) | `pyproject.toml [tool.ruff]` (line-length: 100) |
| **Python 타입** | [mypy](https://mypy-lang.org) | `pyproject.toml [tool.mypy]` (strict) |
| **TypeScript 린트** | [ESLint](https://eslint.org) 9 + next/core-web-vitals | `apps/web/.eslintrc.json` |
| **TypeScript 타입** | [TypeScript](https://www.typescriptlang.org) | `apps/web/tsconfig.json` (strict: true) |
| **Prettier** | (설정 안 됨) | - | Phase 4 추가 예정 |

### 2.10 디자인 시스템

| 항목 | 값 | 비고 |
|------|-----|------|
| **폰트** | [Pretendard](https://github.com/orioncactus/pretendard) | jsDelivr CDN, Apple SD Gothic Neo fallback |
| **주요 색상** | `bg-bg #FBF8F3` (앱 배경) | 세이지 그린 테마 |
| | `bg-primary #3D6B4F` (메인) | |
| | `bg-primary-light #EAF2EC` | |
| | `bg-accent #D97B3A` (강조) | |
| | `bg-accent-light #FDF0E6` | |
| | `border-border #E8E2D9` | |
| **디자인 토큰** | `apps/web/tailwind.config.ts` | raw hex 직접 사용 금지 |
| **와이어프레임** | `ssamAI_wireframe_v2.jsx` | 초기 디자인 시안 |

---

## 3. 외부 연동

| 서비스 | 용도 | 키 |
|--------|------|-----|
| DeepSeek API | LLM chat/reasoner | `DEEPSEEK_API_KEY` |
| MiniMax API | LLM 고속 | `MINIMAX_API_KEY` + `MINIMAX_GROUP_ID` |
| Jina Reader | 외부 사이트 크롤링 (r.jina.ai) | API 키 불필요 (read-only) |
| launchd | daily-research 스케줄링 | macOS cron 대체 |

---

## 4. 자동화 / 스케줄링

| 스케줄 | 명령 | 빈도 |
|--------|------|------|
| `com.ssamai.edu-research.daily` | `daily-research-runner.py` | 매일 6AM |
| Neo4j Pattern merge | API 호출 시 | 온디맨드 |
| SKILL.md auto-apply | 수동 (UI 모달) | 5명 합의 도달 시 |
| USED 추적 | orchestrate/generate 호출 시 | 온디맨드 |

---

## 5. 디렉토리 구조

```
ssamAI/
├── apps/
│   └── web/                          Next.js 15 (포트 3000)
│       ├── app/                      App Router
│       │   ├── (app)/                사이드바 쉘 (chat, library, persona, settings)
│       │   ├── login/                로그인
│       │   ├── signup/               회원가입
│       │   ├── onboarding/           5단계 페르소나 설정
│       │   └── api/                  BFF 라우트
│       │       ├── auth/             (Phase 2 예정)
│       │       ├── library/          skills, generate, orchestrate, feedback
│       │       ├── patterns/         consensus, updates, apply
│       │       ├── personalization/  recommend (Loop 3)
│       │       ├── templates/        upload, community, fork
│       │       └── ppt/, persona/    (Phase 1 백엔드 프록시)
│       ├── components/               UI 컴포넌트
│       ├── lib/                      api-client, auth, types, neo4j, skill-defs
│       ├── __tests__/                Vitest setup
│       └── lib/*.test.ts             Vitest 테스트 (skill-update, pattern-extractor)
├── services/
│   ├── ppt-service/                  FastAPI + python-pptx (포트 8200)
│   ├── persona-service/              FastAPI + Neo4j (포트 8100)
│   └── skill-service/                FastAPI + Neo4j + LiteLLM (포트 8300)
│       └── app/skills/               5개 한글 스킬 + AUTO-PATTERNS 마커
├── docs/                             보고서 (PHASE1/2/3, MISSION-REFLECTION, TEST-INFRA)
├── samples/
│   ├── output/                       HWPX 샘플, 스크린샷
│   └── research/                     daily-research 출력
├── scripts/
│   └── test-python.sh                pytest wrapper
├── docker-compose.yml                8 서비스 정의
├── pytest.ini                        Python 테스트 설정
├── conftest.py                       루트 pytest fixtures
├── package.json                      npm workspaces (apps/*)
├── apps/web/vitest.config.ts         Vitest 설정
├── ARCHITECTURE.md                   상세 아키텍처
├── CLAUDE.md                         Claude Code 요약
├── AGENTS.md                         에이전트 가이드
└── README.md                         프로젝트 소개
```

---

## 6. 환경변수 (`.env.example` 기준)

```bash
# LLM
DEEPSEEK_API_KEY=sk-...
MINIMAX_API_KEY=...
MINIMAX_GROUP_ID=...

# 비밀키 (openssl rand -base64 32로 생성)
CREDS_KEY=<32자>
JWT_SECRET=<32자>
JWT_REFRESH_SECRET=<32자>

# Neo4j
NEO4J_PASSWORD=change-me-neo4j-password

# LiteLLM
LITELLM_MASTER_KEY=sk-litellm-<랜덤>
LITELLM_SALT_KEY=sk-litellm-<랜덤>

# 선택적 포트 오버라이드
WEB_PORT=3000
LIBRECHAT_PORT=3090
LITELLM_PORT=4000
PPT_SERVICE_PORT=8200
PERSONA_SERVICE_PORT=8100
SKILL_SERVICE_PORT=8300
```

---

## 7. Phase별 누적

| Phase | 완료 | 핵심 산출물 |
|-------|------|-------------|
| **Phase 1** (MVP) | ✅ | 8 서비스 Docker Compose + 인증 + 페르소나 + PPT |
| **Phase 2** (스킬) | ✅ | 5개 HWPX 스킬 + Library 페이지 + 오케스트레이터 + Neo4j Template/Pattern 그래프 |
| **Phase 3 B** (만족도) | ✅ | `/api/library/feedback` + ⭐ 위젯 |
| **Phase 3 C** (auto-merge) | ✅ | `/api/patterns/apply` dry-run + confirm + 4 Python skill 파일에 AUTO-PATTERNS 마커 |
| **Phase 3 Loop 3** (개인화) | ✅ | `/api/personalization/recommend` + 💡 추천 섹션 |
| **테스트 인프라** | ✅ | pytest (36) + Vitest (14) = 50/50 통과 |

미션 진행률 82%. 남은 18%: CORS/쿠키(보안), CI/CD(운영), MCP/다국어(확장).

---

## 8. 의도적 제외 / 미구현

| 항목 | 상태 | 비고 |
|------|------|------|
| CORS 화이트리스트 | ❌ | Phase 1 한정 `allow_origins=["*"]` |
| httpOnly 쿠키 | ❌ | 현재 localStorage |
| GitHub Actions CI | ❌ | Issue #3 (P1) |
| Sentry 모니터링 | ❌ | Phase 4 |
| Object Storage | ❌ | PPT/업로드 파일 로컬 |
| 다국어 (i18n) | ❌ | 한국어만 |
| 관리자 대시보드 | ❌ | Phase 4 |
| Graphiti (시간 인식) | ❌ | 현재 Neo4j 속성 그래프 |

---

## 9. 참고 문서

- `ARCHITECTURE.md` — 상세 아키텍처
- `CLAUDE.md` — Claude Code 요약
- `AGENTS.md` — 에이전트 가이드
- `.harness/docs/team-roster.md` — 5 expert 라우팅 규칙
- `.harness/docs/pitfalls.md` — 13개 함정
- `docs/MISSION-REFLECTION.md` — 3-Loop 자가학습 미션 (82%)
- `docs/PHASE3-COMPLETION.md` — auto-merge 보고서
- `docs/PHASE3-LOOP3-COMPLETION.md` — Loop 3 보고서
- `docs/TEST-INFRA-COMPLETION.md` — 테스트 인프라 보고서
- `Project_ssamAI_PRD_v1.1.docx` — PRD 원본 (기밀)

---

**마지막 검증**: 2026-06-25, `npm test` 50/50 통과
**GitHub**: https://github.com/scottnaddle/ssamAI (3 commits)
