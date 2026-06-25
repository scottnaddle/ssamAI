# Project ssamAI 🌿

> 한국 교원 특화 AI 에이전트 하네스 플랫폼
> PRD v1.1 Phase 1 MVP — 채팅 + PPT 처리 + 교원 페르소나 메모리

---

## 빠른 시작

### 사전 요구사항

- **Node.js** ≥ 20.10
- **pnpm** ≥ 9 (`npm i -g corepack && corepack enable`)
- **Docker** Desktop 또는 Docker Engine + Compose v2
- **API 키**: [DeepSeek](https://platform.deepseek.com/), [MiniMax](https://www.minimaxi.com/)

### 1. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 아래 항목을 실제 값으로 채웁니다:

```bash
# LLM
DEEPSEEK_API_KEY=sk-...
MINIMAX_API_KEY=...
MINIMAX_GROUP_ID=...

# 비밀키 생성 (터미널에서 실행 후 결과 붙여넣기)
openssl rand -base64 32
CREDS_KEY=<위 결과>
JWT_SECRET=<위 결과>
JWT_REFRESH_SECRET=<위 결과>

# Neo4j 비밀번호 (원하는 값으로 변경)
NEO4J_PASSWORD=<강력한 비밀번호>

# LiteLLM 마스터 키
LITELLM_MASTER_KEY=sk-litellm-<랜덤 문자열>
LITELLM_SALT_KEY=sk-litellm-<랜덤 문자열>
```

### 2. 전체 스택 실행

```bash
# 모든 서비스 빌드 + 백그라운드 실행
docker compose up -d --build

# 로그 실시간 확인
docker compose logs -f web librechat litellm
```

최초 실행 시:
- MongoDB, Neo4j 이미지 pull (~2 min)
- LibreChat, LiteLLM 이미지 pull (~1 min)
- Next.js, FastAPI 서비스 빌드 (~3 min)

### 3. 접속

| 서비스            | URL                              |
|------------------|----------------------------------|
| **ssamAI 웹앱**   | http://localhost:3000            |
| LibreChat API    | http://localhost:3090            |
| LiteLLM 라우터   | http://localhost:4000/health     |
| Neo4j Browser    | http://localhost:7474            |
| ppt-service      | http://localhost:8200/docs       |
| persona-service  | http://localhost:8100/docs       |

첫 접속 시 `/signup`에서 **회원가입** → `/onboarding` 5단계 페르소나 설정 → `/chat` 진입.
이미 계정이 있다면 `/login` → `/chat` 바로 진입.

---

## 모노레포 구조

```
ssamAI/
├── apps/
│   ├── web/                    # Next.js 15 (App Router) — 메인 프론트엔드
│   │   ├── app/
│   │   │   ├── (app)/          # 사이드바 쉘을 공유하는 라우트 그룹
│   │   │   │   ├── chat/
│   │   │   │   ├── library/
│   │   │   │   ├── persona/
│   │   │   │   └── settings/
│   │   │   ├── login/          # 로그인 (LibreChat JWT)
│   │   │   ├── signup/         # 회원가입 (LibreChat /api/register)
│   │   │   ├── onboarding/     # 5단계 페르소나 설정 (persona-service upsert)
│   │   │   ├── layout.tsx      # 루트 레이아웃 (Pretendard 폰트, 글로벌 CSS)
│   │   │   └── page.tsx        # / → /chat 리다이렉트
│   │   ├── components/         # UI 컴포넌트 (와이어프레임 기반)
│   │   ├── lib/                # colors, types, api-client
│   │   └── Dockerfile
│   └── librechat/
│       ├── librechat.yaml      # LiteLLM 엔드포인트, 파일 정책
│       └── README.md
├── services/
│   ├── litellm/
│   │   └── config.yaml         # DeepSeek + MiniMax 라우팅 (tier 기반)
│   ├── ppt-service/            # FastAPI + python-pptx
│   │   └── app/
│   │       ├── main.py         # /ppt/parse, /ppt/create, /ppt/download
│   │       ├── pptx_service.py # python-pptx 래퍼
│   │       └── llm_client.py   # LiteLLM 호출
│   └── persona-service/        # FastAPI + Graphiti + Neo4j
│       └── app/
│           ├── main.py         # /persona CRUD, /persona/:id/related
│           ├── repository.py   # Neo4j driver
│           └── models.py
├── docker-compose.yml          # 전체 인프라 정의
├── .env.example
├── ARCHITECTURE.md             # 상세 아키텍처 (포트 매트릭스, 데이터 흐름)
└── package.json                # pnpm 워크스페이스 루트
```

---

## 개발 워크플로

### 프론트엔드만 로컬에서 (핫 리로드)

```bash
cd apps/web
pnpm install
pnpm dev          # http://localhost:3000 (나머지 서비스는 docker compose로 실행 중이어야 함)
```

### Python 서비스만 로컬에서

```bash
cd services/ppt-service
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8200
```

```bash
cd services/persona-service
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8100
```

### 전체 스택 중지 / 초기화

```bash
# 서비스 중지 (데이터 유지)
docker compose down

# 볼륨까지 삭제 (완전 초기화 — 주의!)
docker compose down -v
```

---

## API 키 발급 가이드

### DeepSeek

1. https://platform.deepseek.com/ 가입
2. API Keys 메뉴에서 신규 키 발급 (`sk-...`)
3. 충전: https://platform.deepseek.com/usage — $5면 Phase 1 테스트 충분

### MiniMax

1. https://www.minimaxi.com/ 가입
2. 콘솔 → Interface Certification → API Key 발급
3. Group ID는 콘솔 상단에서 확인

---

## 자주 발생하는 문제

### `docker compose up` 시 LiteLLM healthcheck 실패

LiteLLM 컨테이너 로그 확인:

```bash
docker compose logs litellm
```

일반적 원인:
- `DEEPSEEK_API_KEY` / `MINIMAX_API_KEY` 오타
- `LITELLM_MASTER_KEY` 누락

### LibreChat이 시작되지 않음

`CREDS_KEY`, `JWT_SECRET`, `JWT_REFRESH_SECRET`이 32자 이상인지 확인.

### Neo4j 연결 오류

`NEO4J_PASSWORD`가 `.env`와 docker-compose 양쪽에 일치하는지 확인. 초기화가 필요하면:

```bash
docker compose down -v
docker compose up -d neo4j
```

### Next.js에서 API 호출 시 CORS 오류

`next.config.mjs`의 rewrite가 활성화되어 있는지 확인. 브라우저에서 직접 마이크로서비스를 호출하지 말고 반드시 `/api/*` 경유.

---

## Phase 1 범위 / 아닌 것

**포함**:
- 이메일/JWT 인증 (LibreChat 자체)
- 1:1 채팅 + 스트리밍 응답
- .pptx 업로드 → 구조 파싱
- .pptx 신규 생성 (LLM + python-pptx)
- 교원 페르소나 5단계 온보딩 + Neo4j 저장
- 한국어 UI (Pretendard, 세이지 그린 테마)

**제외 (Phase 2/3)**:
- 커뮤니티 피드, 공동 작업 (Co-Edit), 1:1 메시지
- .hwp / .hwpx 파일 처리
- 학교 기관 구독, 관리자 대시보드
- 모바일 앱
- 소셜 로그인 (Kakao, Google)
- MCP 기반 외부 연동 (NEIS, 에듀넷)

---

## 라이선스

UBION Co., Ltd. — 기밀 (Confidential).
