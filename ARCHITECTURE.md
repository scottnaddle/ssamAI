# ssamAI Architecture — Phase 1 MVP

> 한국 교원 특화 AI 에이전트 하네스 플랫폼.
> 이 문서는 PRD v1.1의 Phase 1 범위에 해당하는 구현 결정을 설명합니다.

## 1. 레이어 구성

```
┌──────────────────────────────────────────────────────────────┐
│  Browser (Chrome / Edge)                                     │
│  http://localhost:3000                                       │
└────────────────────┬─────────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────────┐
│  apps/web  —  Next.js 15 (App Router) + TailwindCSS          │
│  한국어 UI, Pretendard 폰트, 와이어프레임 기반 디자인 시스템    │
│  Port 3000                                                   │
│  • /chat         (채팅 + PPT 생성/업로드)                     │
│  • /onboarding   (5단계 페르소나 설정)                        │
│  • /login        (이메일/JWT)                                │
│  • /library /persona /settings  (Phase 2 stub)               │
└──────┬───────────────────────┬─────────────────────┬─────────┘
       │                       │                     │
       │ /api/librechat/*      │ /api/ppt/*          │ /api/persona/*
       │ (next.config rewrite) │                     │
       │                       │                     │
┌──────▼──────┐  ┌─────────────▼──────┐  ┌───────────▼──────────┐
│ LibreChat   │  │ ppt-service        │  │ persona-service      │
│ (API only)  │  │ FastAPI            │  │ FastAPI              │
│ Port 3090   │  │ Port 8200          │  │ Port 8100            │
│             │  │ python-pptx        │  │ Graphiti + Neo4j     │
│ Endpoints:  │  │                    │  │                      │
│  /register  │  │ POST /ppt/parse    │  │ POST   /persona      │
│  /login     │  │ POST /ppt/create   │  │ GET    /persona/:id  │
│  /messages  │  │ GET  /ppt/download │  │ GET    /persona/:id  │
│  /convos    │  │   /:filename       │  │   /related?query=    │
│  /models    │  │                    │  │                      │
└──────┬──────┘  └─────────┬──────────┘  └──────────┬───────────┘
       │                   │                        │
       │   OpenAI API      │   OpenAI API           │ bolt://
       └──────────┬────────┘                        │
                  │                                  │
          ┌───────▼────────┐                ┌───────▼────────┐
          │ LiteLLM Router │                │ Neo4j 5.20     │
          │ Port 4000      │                │ Port 7474/7687 │
          │                │                │ + APOC + GDS   │
          │ ssamai-light   │                │                │
          │   → MiniMax    │                │ Teacher nodes  │
          │ ssamai-medium  │                │ (Persona facts)│
          │   → DeepSeek-C │                └────────────────┘
          │ ssamai-heavy   │
          │   → DeepSeek-R │
          └───────┬────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
   ┌────▼─────┐        ┌─────▼────┐
   │ DeepSeek │        │ MiniMax  │
   │ api      │        │ api      │
   │ deepseek │        │ abab6.5s │
   │ .com     │        │ -chat    │
   └──────────┘        └──────────┘

데이터 저장소:
  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
  │ MongoDB 7    │    │ Neo4j 5.20   │    │ Redis 7      │
  │ (LibreChat   │    │ (지식 그래프) │    │ (Phase 2     │
  │  백업 저장)  │    │              │    │  캐시预备)    │
  └──────────────┘    └──────────────┘    └──────────────┘
```

## 2. 핵심 데이터 흐름

### 2.1 회원가입 / 로그인

1. 사용자가 `/login`에서 이메일/비밀번호 입력
2. Next.js → `POST /api/librechat/login` → LibreChat `/api/login`
3. LibreChat이 MongoDB에서 사용자 조회 후 JWT 발급
4. 클라이언트는 JWT를 localStorage에 저장, 후속 API 호출에 `Authorization: Bearer` 헤더로 전달

### 2.2 PPT 생성 요청

1. 사용자가 채팅 입력창에 "3학년 2반 광합성 PPT 만들어줘" 입력
2. Next.js (클라이언트)가 LibreChat `/api/messages`로 메시지 전송
3. LibreChat이 system prompt + 히스토리 구성 후 LiteLLM으로 라우팅
4. LiteLLM이 작업 유형 추정 → `ssamai-medium` (DeepSeek-Chat) 선택
5. 응답이 스트리밍으로 브라우저에 도착
6. 응답에 PPT 생성 의도가 감지되면, Next.js가 ppt-service `/ppt/create` 호출
7. ppt-service가 다시 LiteLLM 호출하여 슬라이드 아웃라인 생성 → python-pptx로 .pptx 파일 빌드
8. 다운로드 URL을 ChatView의 카드에 표시

### 2.3 페르소나 장기 기억

1. 사용자가 `/onboarding` 5단계 완료
2. Next.js → `POST /api/persona/persona` → persona-service
3. persona-service가 Neo4j에 Teacher 노드 upsert (`group_id`로 멀티테넌시 격리)
4. 이후 `/chat` 진입 시 `GET /api/persona/persona/:id`로 페르소나 fetch → 우측 패널에 표시
5. Phase 2에서는 Graphiti temporal edge 추가: "학기 변경", "선호 스타일 변화" 등을 시간 축으로 추적

## 3. 포트 매트릭스

| 서비스               | 내부 포트 | 호스트 포트   | 비고                          |
|---------------------|----------|--------------|------------------------------|
| web (Next.js)       | 3000     | 3000         | `WEB_PORT`                   |
| librechat           | 3080     | 3090         | `LIBRECHAT_PORT`             |
| litellm             | 4000     | 4000         | `LITELLM_PORT`               |
| mongo               | 27017    | 27017        | root 계정은 env 필수          |
| mongo-express       | —        | —            | (선택) 별도 추가             |
| neo4j (browser)     | 7474     | 7474         | 웹 콘솔                      |
| neo4j (bolt)        | 7687     | 7687         | driver 접속                  |
| redis               | 6379     | 6379         | Phase 2 준비                 |
| ppt-service         | 8200     | 8200         | `PPT_SERVICE_PORT`           |
| persona-service     | 8100     | 8100         | `PERSONA_SERVICE_PORT`       |

## 4. 환경변수 매트릭스

`.env.example` 참조. 핵심 변수와 기본값:

| 변수                       | 필수 | 기본값 / 예시                              | 어디서 사용                       |
|---------------------------|------|-------------------------------------------|----------------------------------|
| `DEEPSEEK_API_KEY`        | ✅   | `sk-...`                                  | LiteLLM                          |
| `MINIMAX_API_KEY`         | ✅   | `...`                                     | LiteLLM                          |
| `MINIMAX_GROUP_ID`        | ✅   | `...`                                     | LiteLLM (MiniMax 요구)            |
| `LITELLM_MASTER_KEY`      | ✅   | `sk-litellm-master-change-me`             | LibreChat ↔ LiteLLM 인증         |
| `CREDS_KEY`               | ✅   | 32자 랜덤                                  | LibreChat 자격 증명 암호화        |
| `JWT_SECRET`              | ✅   | 32자 랜덤                                  | LibreChat JWT 서명               |
| `JWT_REFRESH_SECRET`      | ✅   | 32자 랜덤                                  | LibreChat refresh token          |
| `NEO4J_PASSWORD`          | ✅   | `change-me-neo4j-password`                | persona-service, Neo4j           |
| `MONGO_URI`               | 자동 | `mongodb://mongo:27017/LibreChat`         | LibreChat                        |
| `GRAPHITI_GROUP_ID`       | ⚪   | `default-teacher-group`                   | persona-service 멀티테넌시       |

**비밀번호/키 생성 가이드**:

```bash
openssl rand -base64 32   # CREDS_KEY, JWT_SECRET, JWT_REFRESH_SECRET
```

## 5. 디자인 시스템 요약

와이어프레임(`ssamAI_wireframe_v2.jsx`)의 팔레트를 Tailwind 토큰으로 변환. 단일 진실 공급원:

| Tailwind 클래스            | HEX         | 용도                       |
|---------------------------|-------------|----------------------------|
| `bg-bg`                   | `#FBF8F3`   | 앱 배경 (크림)             |
| `bg-sidebar`              | `#FFFDF9`   | 사이드바/패널              |
| `bg-surface`              | `#FFFFFF`   | 카드/버튼                  |
| `bg-primary` / `text-*`   | `#3D6B4F`   | 세이지 그린 (CTA)          |
| `bg-primary-light`        | `#EAF2EC`   | 활성 네비/페르소나 팩트     |
| `bg-accent`               | `#D97B3A`   | 웜 오렌지 (강조/배지)       |
| `bg-accent-light`         | `#FDF0E6`   | 파일 칩/경고                |
| `border-border`           | `#E8E2D9`   | 모든 디바이더/보더          |
| `bg-tag-blue/green/...`   | 각 색       | 파일 태그                   |

폰트: `Pretendard` (CDN 로드) → `Apple SD Gothic Neo` fallback.

## 6. Phase 1 수용 기준 (Acceptance Criteria)

> "MVP가 완료되었다" = 아래 모든 항목이 로컬 Docker 환경에서 재현 가능해야 함.
> ✅ = 코드 구현됨 / ⏳ = 코드는 있으나 실제 인프라 검증 필요 (API 키 + docker compose up)

1. **인증**
   - ✅ `/register`로 이메일 계정 생성 → MongoDB에 사용자 저장 (LibreChat 자체)
   - ✅ `/auth/login`으로 JWT 발급 → 클라이언트 localStorage 저장
   - ✅ 인증 없이 `/chat` 접근 시 `/login`으로 리다이렉트 (`app/(app)/layout.tsx` 가드)
   - ⏳ 실제 LibreChat 컨테이너와의 end-to-end 인증 연동 검증 필요

2. **채팅**
   - ✅ `/chat`에서 메시지 전송 → LibreChat → LiteLLM → DeepSeek-Chat 응답 스트리밍 (SSE)
   - ✅ SSE 파서가 토큰 단위로 화면에 실시간 렌더링 (`lib/sse.ts` + `chat-view.tsx`)
   - ⏳ 대화 제목 자동 생성 (librechat.yaml에 `titleModel: deepseek-chat` 설정됨)
   - ⏳ 사이드바 "최근 대화" 목록 — 현재 STUB 데이터, 실제 LibreChat `/api/convos` 연동 필요

3. **PPT 처리**
   - ✅ `/ppt/parse`에 .pptx 업로드 → 슬라이드별 제목/미리보기 JSON 반환 (python-pptx)
   - ✅ `/ppt/create`에 주제/학년/과목 전달 → N장 분량의 .pptx 파일 생성 (LLM + python-pptx)
   - ✅ 생성된 파일이 `/api/ppt/ppt/download/:filename`에서 다운로드 가능
   - ✅ 모달 UI에서 topic/subject/grade/slideCount 입력 → SlideCard로 결과 표시
   - ⏳ 실제 LiteLLM-DeepSeek 호출 end-to-end 검증 (API 키 필요)

4. **페르소나 메모리**
   - ✅ `/onboarding` 5단계 완료 → persona-service가 Neo4j에 Teacher 노드 upsert
   - ✅ `POST /persona` 응답에 `createdAt`/`updatedAt` 포함 (Pydantic model 일관성)
   - ⏳ `/chat` 우측 패널이 persona-service에서 동적으로 fetch (현재 STUB_PERSONA 사용)
   - ⏳ `GET /persona/:id/related?query=...` 의미적 팩트 회수는 Phase 2 Graphiti 통합 후 본격 지원

5. **디자인 일관성**
   - ✅ 모든 페이지가 와이어프레임 색상/레이아웃 준수 (Tailwind 디자인 토큰)
   - ✅ 모바일 반응형은 Phase 1에서 데스크톱 우선 (와이어프레임 기준)

## 7. Phase 2 / 3 로드맵 매핑

PRD Phase와 현재 코드베이스의 대응 관계:

| PRD Phase  | 범위                                          | 현재 상태                  |
|-----------|----------------------------------------------|---------------------------|
| Phase 1   | 채팅, PPT, 페르소나, Claude → DeepSeek/MiniMax | **구현 완료 (스캐폴드)**   |
| Phase 2   | LiteLLM 멀티 라우팅, .hwp 처리, 커뮤니티 피드, DM | LiteLLM: ✅ / 나머지: ❌  |
| Phase 3   | 학교 기관 구독, Co-Edit (Yjs), MCP, 모바일 앱  | ❌                        |

## 8. 알려진 기술 부채 (Phase 1 인위적 단순화)

1. **인증**: JWT를 localStorage에 저장 — XSS 공격에 취약. Phase 2에서 httpOnly 쿠키 + SameSite로 마이그레이션.
2. **CORS**: 모든 FastAPI 서비스가 `allow_origins=["*"]` — 프로덕션 배포 전 화이트리스트 적용.
3. **Graphiti**: Phase 1은 순수 property-graph CRUD. temporal edges, hybrid search는 Phase 2에서 Graphiti 풀 스택 통합.
4. **PPT 다운로드**: 로컬 파일시스템(`/tmp/ssamAI-ppt-output`) 사용. Phase 3에서 NCloud Object Storage 마이그레이션.
5. **LLM 응답 검증**: ppt-service의 LLM JSON 응답에 대한 스키마 검증 부재. Pydantic validation 강화 필요.
6. **로그/모니터링**: 구조화 로깅, 메트릭 수집 미구현. Phase 2에서 OpenTelemetry 도입 예정.

## 9. 결정 근거 (PRD에서 변경된 부분)

### LLM: Claude API → DeepSeek + MiniMax

PRD v1.1의 "Anthropic Claude API (Sonnet / Haiku)" 대신 사용자 요청으로 DeepSeek + MiniMax 채택.

**이유**:
- 비용: DeepSeek-Chat이 Claude Sonnet 대비 약 1/10 가격. MiniMax는 한국어 처리에 강점이 있으면서 경량.
- 한국어 특화: MiniMax abab6.5s는 한국어 교육 자료 생성에 최적화.
- 라우팅: LiteLLM의 tier 기반 라우팅으로 비용/품질 균형 확보.

**트레이드오프**:
- DeepSeek-Reasoner의 논리 추론은 Claude Opus와 비견되지만 창의적 글쓰기는 약간 부족할 수 있음.
- 향후 Claude/Gemini 추가는 LiteLLM config에 모델만 추가하면 되므로 확장성 유지.
