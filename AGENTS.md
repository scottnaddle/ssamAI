# AGENTS.md

Project ssamAI — 한국 교원(현직 교사 + 에듀테크 직원) 특화 AI 에이전트 하네스 플랫폼.
Phase 1 MVP는 **채팅 + .pptx 처리 + 교원 페르소나 장기 메모리 + 교사 문서 생성 스킬**로 구성되며, LiteLLM 멀티 라우팅/Neo4j 지식 그래프를 기반으로 동작합니다.
이 문서는 AI 코딩 에이전트가 프로젝트를 이해하고 작업을 시작하기 위해 반드시 읽어야 하는 내용을 담고 있습니다.

---

## 1. Project overview

ssamAI는 교사 한 사람의 수업 맥락(학교급, 과목, 학급, 수업 스타일)을 기억하는 AI 조교입니다.
LibreChat을 인증·채팅 엔진으로 두되, 한국 교사용 UI는 Next.js 15로 직접 구현했습니다.
LLM 호출은 LiteLLM 단일 OpenAI 호환 엔드포인트를 통해 DeepSeek / MiniMax로 라우팅되며,
PPT 생성, 페르소나 저장, 문서 생성 등은 별도 FastAPI 마이크로서비스로 분리되어 있습니다.

핵심 흐름:
- `/signup` → LibreChat 이메일 회원가입 → JWT 발급
- `/onboarding` → 5단계 페르소나 입력 → `persona-service`가 Neo4j에 저장
- `/chat` → LibreChat/LiteLLM 스트리밍 채팅 + PPT/문서 생성 다이얼로그

---

## 2. Project layout and module divisions

```
ssamAI/
├── apps/
│   ├── web/                    # Next.js 15 App Router — 메인 프론트엔드 (포트 3000)
│   │   ├── app/                # App Router 라우트/레이아웃
│   │   │   ├── (app)/          # 사이드바 쉘: chat, library, persona, settings
│   │   │   ├── login/          # 이메일 로그인
│   │   │   ├── signup/         # 회원가입
│   │   │   ├── onboarding/     # 5단계 페르소나 설정
│   │   │   ├── layout.tsx      # 루트 레이아웃 (Pretendard, globals.css)
│   │   │   └── page.tsx        # / → /chat 리다이렉트
│   │   ├── components/         # UI 컴포넌트 (chat-view, sidebar, dialogs 등)
│   │   ├── lib/                # api-client, auth, colors, sse, types
│   │   └── public/             # favicon 등 정적 자산
│   └── librechat/
│       └── librechat.yaml      # LibreChat API-only 설정 (모델 목록, 파일 정책)
├── services/
│   ├── litellm/
│   │   └── config.yaml         # LiteLLM model_list, fallback, 라우팅 설정
│   ├── ppt-service/            # FastAPI + python-pptx (포트 8200)
│   │   └── app/
│   │       ├── main.py         # /ppt/parse, /ppt/create, /ppt/download, /health
│   │       ├── pptx_service.py # .pptx 파싱/빌드/저장
│   │       ├── llm_client.py   # LiteLLM 아웃라인 생성
│   │       ├── models.py       # Pydantic v2 스키마
│   │       └── config.py       # 환경변수 설정
│   ├── persona-service/        # FastAPI + Neo4j (포트 8100)
│   │   └── app/
│   │       ├── main.py         # /persona, /persona/:id, /persona/:id/related, /health
│   │       ├── repository.py   # Neo4j async driver + CRUD
│   │       ├── models.py
│   │       └── config.py
│   └── skill-service/          # FastAPI + Neo4j + LiteLLM (포트 8300)
│       └── app/
│           ├── main.py         # /skills, /skills/generate, /skills/upload/parse,
│           │                   # /skills/examples/feedback, /skills/stats/:id, /health
│           ├── skill_registry.py   # 스킬 정의 (수업지도안, 가정통신문, 평가문항, 행정문서)
│           ├── skills/         # 스킬별 prompt builder + validator
│           ├── repository.py   # SkillExample CRUD + 피드백/통계
│           ├── document_parser.py  # .hwpx / .pptx / .hwp 파싱
│           ├── models.py
│           └── config.py
├── docker-compose.yml          # 전체 인프라 정의
├── .env.example                # 환경변수 템플릿
├── ARCHITECTURE.md             # 포트 매트릭스, 데이터 흐름, 디자인 시스템, Phase 수용 기준
├── CLAUDE.md                   # Claude Code 전용 요약 + 컨벤션
└── package.json                # pnpm 워크스페이스 루트
```

`pnpm-workspace.yaml`은 `apps/*`와 `packages/*`를 워크스페이스로 등록하고 있으나, 현재 `packages/` 디렉터리는 비어 있습니다.

---

## 3. Technology stack

| 영역 | 기술 | 버전/비고 |
|------|------|----------|
| 프론트엔드 | Next.js 15 App Router | `output: "standalone"` |
| 프론트엔드 | React | 19.0.0-rc-66855b96-20241106 (RC) |
| 프론트엔드 | TypeScript | strict mode, target ES2022 |
| 프론트엔드 | TailwindCSS | 3.4.15 + Pretendard 폰트 |
| 채팅/인증 엔진 | LibreChat | ghcr.io/danny-avila/librechat:latest, API-only |
| LLM 라우터 | LiteLLM | `litellm/litellm:latest` |
| LLM 업스트림 | DeepSeek | `deepseek-chat`, `deepseek-reasoner` |
| LLM 업스트림 | MiniMax | `MiniMax-M2.5-highspeed` |
| PPT 처리 | python-pptx | ppt-service |
| 지식 그래프 | Neo4j 5.20 Community | APOC 플러그인, async Python driver |
| 인증 저장 | MongoDB 7 | LibreChat 백업 저장 |
| 캐시 | Redis 7 | Phase 2 준비 (현재 거의 미사용) |
| 컨테이너 | Docker Compose v2 | 로컬 개발 / 통합 실행 |

---

## 4. Build, test and run commands

### 4.1 의존성 설치

```bash
# 프론트엔드 (루트에서)
pnpm install

# Python 서비스 (각각)
cd services/ppt-service && pip install -e ".[dev]"
cd services/persona-service && pip install -e ".[dev]"
cd services/skill-service && pip install -e ".[dev]"
```

### 4.2 전체 스택 실행

```bash
# .env 작성 후 (DEEPSEEK_API_KEY, MINIMAX_API_KEY, MINIMAX_GROUP_ID 필수)
docker compose up -d --build

# 로그 확인
docker compose logs -f web librechat litellm ppt-service persona-service skill-service

# 중지 (데이터 유지)
docker compose down

# 중지 + 볼륨 삭제 (완전 초기화 — 주의!)
docker compose down -v
```

### 4.3 프론트엔드 단독 개발

```bash
cd apps/web
pnpm dev   # http://localhost:3000
```

### 4.4 Python 서비스 단독 실행

```bash
cd services/ppt-service && uvicorn app.main:app --reload --port 8200
cd services/persona-service && uvicorn app.main:app --reload --port 8100
cd services/skill-service && uvicorn app.main:app --reload --port 8300
```

### 4.5 빌드 / 린트 / 타입체크

```bash
# 루트에서
pnpm build      # Next.js standalone 빌드
pnpm lint       # next lint
pnpm typecheck  # tsc --noEmit

# Python
ruff check services/ppt-service services/persona-service services/skill-service
mypy services/ppt-service services/persona-service services/skill-service
```

### 4.6 환경변수 준비

`.env.example`을 복사해 `.env`를 만들고 아래 항목을 채웁니다.

```bash
cp .env.example .env
```

필수 외부 키:
- `DEEPSEEK_API_KEY`
- `MINIMAX_API_KEY`
- `MINIMAX_GROUP_ID`

필수 난수 키 (각각 32자 이상 권장):
- `CREDS_KEY`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `LITELLM_MASTER_KEY`
- `LITELLM_SALT_KEY`

생성 예시:

```bash
openssl rand -base64 32
```

---

## 5. Code style guidelines

### 5.1 TypeScript / React

- `strict: true`, target `ES2022`, module resolution `bundler`.
- 경로 별칭은 `@/*` → `apps/web/*`.
- React 19 RC를 사용 중이므로 `"use client"` 지시어를 클라이언트 컴포넌트에 명시합니다.
- App Router 기반. 공통 쉘은 `app/(app)/layout.tsx`, 독립 페이지는 `login/`, `signup/`, `onboarding/`에 각각 배치.

### 5.2 Python

- Python 3.11+ 타입 힌트 (`from __future__ import annotations` 권장).
- Pydantic v2 사용. Neo4j record 변환 등에는 `ConfigDict(from_attributes=True)` 적용.
- ruff 설정 (`pyproject.toml`):
  - line-length: 100
  - target-version: py311
  - select: `E`, `F`, `I`, `B`, `UP`, `N`, `SIM`
- mypy: `--strict`.

### 5.3 Tailwind / 디자인 시스템

- 디자인 토큰의 단일 진실은 `apps/web/tailwind.config.ts`입니다.
- 컴포넌트나 inline style에서 **raw hex 직접 사용 금지**.
- 대표 토큰:
  - `bg-bg` (#FBF8F3) — 앱 배경
  - `bg-primary` (#3D6B4F) / `bg-primary-light` (#EAF2EC)
  - `bg-accent` (#D97B3A) / `bg-accent-light` (#FDF0E6)
  - `border-border` (#E8E2D9)
- 폰트: Pretendard (jsDelivr CDN) → Apple SD Gothic Neo fallback.
- 새 색상/컴포넌트 추가 전 `ARCHITECTURE.md` §5 디자인 시스템과 와이어프레임 `ssamAI_wireframe_v2.jsx`를 확인.

### 5.4 아키텍처 컨벤션

- 브라우저는 반드시 Next.js rewrite 경로(`/api/librechat/*`, `/api/ppt/*`, `/api/skills/*`, `/api/persona/*`)를 통해 백엔드에 접근합니다. 직접 `localhost:3090` 등을 호출하면 CORS/인증 문제가 발생합니다.
- FastAPI 서비스는 Phase 1 한정으로 `allow_origins=["*"]`로 개방되어 있습니다. 프로덕션 배포 전 반드시 화이트리스트로 변경해야 합니다.
- Neo4j 기반 서비스에서는 `teacher_id`를 기본 격리 키로 사용하고, `group_id`를 함께 저장합니다. 멀티테넌시를 위해 읽기/쓰기 쿼리에 `teacher_id` 기반 필터를 적용해야 합니다.

---

## 6. Testing instructions

> **현재 테스트 인프라는 미구축 상태입니다.** Phase 1은 스캐폴드이며, 아직 `pytest`/`vitest` 설정이나 테스트 파일이 존재하지 않습니다.

향후 테스트 추가 시 다음 위치와 방식을 사용합니다.

### 6.1 Python 서비스

- 위치: `services/<name>/tests/`
- 프레임워크: `pytest` + `pytest-asyncio` (비동기 endpoint 테스트)
- HTTP mock: `pytest-httpx`
- 실행: `pytest services/<name>/tests/`

### 6.2 프론트엔드

- 위치: `apps/web/__tests__/` 또는 컴포넌트 옆 `*.test.tsx`
- 권장: Vitest
- API mock: MSW

### 6.3 통합 smoke test

`docker compose up -d` 이후 아래 endpoint가 정상 응답해야 합니다.

```bash
curl http://localhost:3000
curl http://localhost:3090/api/auth/me
curl http://localhost:4000/health/liveness
curl http://localhost:8200/health
curl http://localhost:8100/health
curl http://localhost:8300/health
```

---

## 7. Security considerations

- **비밀 절대 커밋 금지**: `.env`, `.env.local`, API 키, JWT secret은 `.gitignore`로 보호되어 있습니다. 절대 staging에 추가하지 마세요.
- **`.env` 파일은 이미 repo root에 존재**합니다. 실수로 commit하지 않도록 주의하세요.
- **인증**: Phase 1은 JWT를 `localStorage`에 저장합니다. 이는 XSS 공격에 취약하므로, Phase 2에서 httpOnly + SameSite 쿠키로 마이그레이션할 예정입니다.
- **CORS**: 모든 FastAPI 서비스가 `allow_origins=["*"]` (Phase 1 한정). 프로덕션 배포 전 도메인 화이트리스트를 적용해야 합니다.
- **멀티테넌시**: `persona-service`와 `skill-service`는 `teacher_id` 기반으로 데이터를 분리합니다. `GRAPHITI_GROUP_ID`(`default-teacher-group`)도 함께 저장되며, 다른 교사 데이터 노출을 방지하기 위해 모든 Cypher 쿼리에 적절한 필터를 적용해야 합니다.
- **LiteLLM config**: `services/litellm/config.yaml`에 API 키를 하드코딩하지 마세요. 반드시 `os.environ/VAR_NAME` 형식을 사용하세요.
- **PRD 문서 격리**: `Project_ssamAI_PRD_v1.1.docx`는 기밀입니다. 외부 작업 시 sanitized spec만 참조하고 원문을 LLM 입력에 직접 사용하지 마세요.

---

## 8. PR & commit conventions

- 브랜치: `feat/<scope>`, `fix/<scope>`, `refactor/<scope>`
- 기본 브랜치: `main`
- 커밋 메시지: Conventional Commits (예: `feat(chat): SSE 토큰 파서 에러 핸들링 추가`)
- scope는 디렉터리/모듈명을 사용합니다.
- PR 전 반드시 통과해야 할 명령:

```bash
pnpm typecheck && pnpm lint
ruff check services/ppt-service services/persona-service services/skill-service
mypy services/ppt-service services/persona-service services/skill-service
```

- 단일 PR은 단일 concern으로 유지합니다. 프론트 + 백엔드 동시 변경이 필요하면 두 PR로 분리하는 것을 권장합니다.
- 인증 surface 변경 시 `code-reviewer` 통과를 필수로 합니다.

---

## 9. Runtime architecture and deployment

### 9.1 서비스 포트 매트릭스

| 서비스 | 내포트 | 호스트 포트 | 비고 |
|--------|--------|------------|------|
| web (Next.js) | 3000 | `${WEB_PORT:-3000}` | standalone output |
| librechat | 3080 | `${LIBRECHAT_PORT:-3090}` | API only |
| litellm | 4000 | `${LITELLM_PORT:-4000}` | 라우터 |
| mongo | 27017 | 27017 | LibreChat 백업 |
| neo4j browser | 7474 | 7474 | 웹 콘솔 |
| neo4j bolt | 7687 | 7687 | driver 접속 |
| redis | 6379 | 6379 | Phase 2 준비 |
| ppt-service | 8200 | `${PPT_SERVICE_PORT:-8200}` | python-pptx |
| persona-service | 8100 | `${PERSONA_SERVICE_PORT:-8100}` | Neo4j |
| skill-service | 8300 | `${SKILL_SERVICE_PORT:-8300}` | 문서 생성/파싱 |

### 9.2 주요 API 흐름

1. **회원가입/로그인**
   - `/signup` 또는 `/login` → Next.js → LibreChat `/api/register` 또는 `/api/auth/login` → MongoDB 조회 → JWT 발급
   - 클라이언트는 JWT를 localStorage에 저장하고, 이후 `Authorization: Bearer` 헤더로 전달

2. **채팅**
   - `/chat` → LibreChat `/api/agents/chat` POST → `{streamId}` 반환 → `/api/agents/chat/stream/:streamId` SSE 수신
   - `lib/sse.ts`가 SSE 프레임을 파싱해 UI에 실시간 렌더링

3. **PPT 생성**
   - 사용자 입력 → LibreChat 응답 스트리밍 중 PPT 의도 감지 → `ppt-service` `/ppt/create`
   - `ppt-service`가 LiteLLM에 슬라이드 아웃라인 요청 → `python-pptx`로 파일 빌드 → `/ppt/download/:filename` 제공

4. **페르소나 저장/조회**
   - `/onboarding` 완료 → `persona-service` `/persona` POST → Neo4j `Teacher` 노드 upsert
   - `/chat` 진입 시 `GET /persona/:id`로 우측 패널에 표시

5. **문서 생성 스킬**
   - `/chat`의 "문서 작성" 칩 → `SkillDialog` → `skill-service` `/skills/generate`
   - `skill-service`는 Neo4j에서 few-shot 예시를 조회해 프롬프트에 주입하고 LiteLLM로 생성
   - `/skills/upload/parse`로 `.hwpx`/`.pptx`/`.hwp` 업로드 및 파싱 후 예시로 저장

### 9.3 LiteLLM tier 라우팅

`services/litellm/config.yaml`에 정의:

- `ssamai-light` → MiniMax `MiniMax-M2.5-highspeed`
- `ssamai-medium` → DeepSeek `deepseek-chat`
- `ssamai-heavy` → DeepSeek `deepseek-reasoner`
- raw 이름도 사용 가능: `deepseek-chat`, `deepseek-reasoner`, `MiniMax-M2.5-highspeed`
- fallback: `ssamai-medium` → `ssamai-light`, `ssamai-heavy` → `ssamai-medium`

### 9.4 배포

- Phase 1은 Docker Compose 기반 로컬 실행을 전제로 합니다.
- `apps/web/Dockerfile`은 multi-stage standalone 빌드입니다.
- Phase 3에서는 PPT/업로드 파일 저장을 NCloud Object Storage로 마이그레이션할 예정입니다.

---

## 10. Important reference documents

작업 전 아래 문서를 함께 참조하세요.

- `ARCHITECTURE.md` — 상세 아키텍처, 포트/환경변수 매트릭스, 데이터 흐름, 디자인 토큰, Phase 수용 기준, 기술 부채
- `CLAUDE.md` — Claude Code 요약, 명령어, 주요 컨벤션
- `.harness/docs/pitfalls.md` — 13개 흔한 함정과 해결 방법
- `.harness/docs/team-roster.md` — frontend/backend/infra/llm/code-reviewer 라우팅 규칙

---

## 11. Known gaps and caveats

- **테스트 인프라 부재**: `pytest`/`vitest` 설정과 테스트 파일이 없습니다.
- **JWT 저장**: `localStorage` 사용 (Phase 2에서 httpOnly 쿠키로 변경 예정).
- **CORS 개방**: FastAPI 서비스가 `allow_origins=["*"]`로 개방됨.
- **Graphiti**: Phase 1은 Neo4j 속성 그래프 CRUD 수준. temporal edges, hybrid search는 Phase 2에서 확장.
- **PPT 저장**: 로컬 파일시스템 `/tmp/ssamAI-ppt-output` 사용. Phase 3에서 Object Storage로 마이그레이션.
- **LLM JSON 검증**: `ppt-service`의 LLM 응답에 대한 스키마 검증이 약합니다. 새 LLM 연동 시 Pydantic validation을 강화하세요.
- **.fuse_hidden 파일들**: 작업 디렉터리에 다수의 `.fuse_hidden*` 임시 파일이 있습니다. 실제 소스는 해당 경로의 일반 파일이며, 임시 파일을 직접 수정하거나 커밋하지 마세요.
