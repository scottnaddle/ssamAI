# Phase 2 오픈 체크리스트

> ssamAI Phase 2 (자료 라이브러리 + 문서 생성 스킬) 오픈을 위한 종합 체크리스트
> 작성일: 2026-06-24

---

## 1. 코드 완성도 ✅

### 1-1. 5개 콘텐츠 스킬 (런타임)
- [x] `lesson-plan-generator` (수업 과정안) — 13필드, HWPX 생성 검증
- [x] `formative-assessment-generator` (형성평가) — 10필드, 10문항 + 정답표
- [x] `rubric-generator` (수행평가 루브릭) — 7필드, 3요소 × 3~4척도
- [x] `official-letter-generator` (행정공문) — 6필드, 5종 (공문/연수/출장/회의록/휴가)
- [x] `home-letter-generator` (가정통신문) — 13필드, 4종 + 동의서

### 1-2. 인프라 스킬 (메타)
- [x] `ssamai-pipeline-orchestrator` — 마스터 라우팅 + 5종 워크플로
- [x] `continuous-research-agent` — 매일 자동 외부 리서치
- [x] `teacher-template-loop` — 선생님 콘텐츠 → 스킬 강화

### 1-3. 백엔드 (Next.js API Routes)
- [x] `GET /api/library/skills` — 5개 스킬 정의 반환
- [x] `POST /api/library/generate` — HWPX 바이너리 반환 (브라우저 자동 다운로드)
- [x] `@ssabrojs/hwpxjs` 통합 (markdownToHwpx)
- [x] `apps/web/lib/skill-defs.ts` 공유 모듈

### 1-4. 프론트엔드
- [x] `apps/web/app/(app)/library/page.tsx` — Phase 2 완전 구현
  - 탭 1: ✨ 생성 (5스킬 카드 + 4빠른 워크플로)
  - 탭 2: 📁 내 자료 (localStorage 이력 30건)
  - 빈 상태 / 로그인 가드 / 활용 팁 섹션
- [x] `apps/web/components/skill-dialog.tsx` — 통합 (기존 컴포넌트 재활용)
- [x] `apps/web/lib/api-client.ts` — SKILL_BASE → `/api/library` 변경

---

## 2. 인프라 ✅

- [x] **launchd 등록** — `com.ssamai.edu-research.daily` 매일 오전 6시 자동 실행
  - 위치: `~/Library/LaunchAgents/com.ssamai.edu-research.daily.plist`
  - 트리거: StartCalendarInterval (Hour: 6, Minute: 0)
- [x] **daily-research.sh** — 일일 트리거 스크립트
- [x] **install-launchd.sh** — 설치/해제/상태 CLI

---

## 3. 검증 ✅

| 항목 | 검증 방법 | 결과 |
|------|----------|------|
| 5개 스킬 API 호출 | curl POST → 5/5 HTTP 200 | ✅ |
| HWPX 표/행 구조 | unzip + grep | ✅ 9표 65행 (186KB) |
| Library 페이지 UI | 브라우저 스냅샷 | ✅ 5카드 + 4워크플로 + 2탭 |
| 모달 + 폼 | 브라우저 클릭 + 스냅샷 | ✅ 12필드 모두 표시 |
| 빠른 워크플로 버튼 | 브라우저 확인 | ✅ 4개 (차시/현장/수행/학기초) |
| localStorage 이력 | 코드 + 동작 확인 | ✅ `ssamai.library.history` 키 |

---

## 4. 🔴 운영 전 필수 해결 (BLOCKER)

### 4-1. Docker 빌드 이슈
**문제**: `docker compose build web` 시 pnpm install이 398/440 패키지에서 멈춤 (네트워크 이슈로 추정)

**영향**: 운영 컨테이너는 Phase 1 빌드만 포함 — Phase 2 Library 페이지 코드가 배포 안 됨

**해결 방법 (우선순위 순)**:
1. `pnpm install --offline` (네트워크 우회)
2. Docker layer cache 활용한 점진 빌드 (deps stage만 캐시)
3. Dockerfile의 `pnpm install --no-frozen-lockfile` → `pnpm install --frozen-lockfile=false --prefer-offline`
4. 마지막 수단: `pnpm` → `npm` 전환 + package-lock.json 생성

**임시 우회**: 호스트 dev 모드 (`pnpm dev` on port 3030)로 Phase 2 UI 동작 확인됨

### 4-2. launchd 트리거 스크립트 출력 검증
**상태**: 스크립트는 등록됐으나 실제 트리거 → background agent 호출 연결 미검증

**필요**: Phase 2 오픈 후 첫 자동 트리거 (오전 6시) 모니터링

---

## 5. Phase 2 오픈 후 즉시 작업 (첫 1주)

### 5-1. 모니터링 (Day 1-3)
- [ ] launchd 자동 트리거 1회차 실행 결과 확인 (`samples/research/logs/`)
- [ ] 첫 선생님 사용자 가입 → Library 페이지 진입 → 첫 문서 생성 E2E
- [ ] 만족도 ⭐ 추적 시작 (현재 localStorage에는 미수집)
- [ ] API 응답 시간 측정 (목표: 5초 이내)

### 5-2. KPI 첫 측정 (Day 4-7)
- [ ] 일일 활성 선생님 수
- [ ] 스킬별 사용 비율 (5종 중 어느 게 가장 많이 쓰이나)
- [ ] 평균 생성 → 다운로드 완료 시간
- [ ] 생성 문서 평균 크기

### 5-3. 콘텐츠 피드백 수집
- [ ] 만족도 1⭐~5⭐ 위젯 추가 (현재 localStorage만 저장)
- [ ] 편집률 측정 (다운로드 후 몇 %가 수정되는지)
- [ ] 재사용률 측정 (같은 스킬을 며칠 내 재요청하는지)

---

## 6. Phase 2.5 (1~2개월 후)

### 6-1. teacher-template-loop 백엔드
- [ ] PostgreSQL `templates` 테이블 + `pattern_frequency` Neo4j
- [ ] Library 페이지 → [커뮤니티] 탭 추가
- [ ] 5명 합의 패턴 → 스킬 자동 업데이트 PR 워크플로

### 6-2. 만족도/개인화
- [ ] 만족도 API (`/api/library/feedback`)
- [ ] 선생님 프로필 (자주 만드는 학년/과목/문항 유형)
- [ ] "OOO 선생님, 자주 만드시던 X 형식으로 할까요?" 추천

### 6-3. 만족도 → 1인칭 추천 강화
- [ ] Loop 3 (운영 → 개인화) 백엔드 구현

---

## 7. Phase 3 (3~6개월 후)

### 7-1. MCP 연동
- [ ] 에듀넷 MCP (실시간 자료)
- [ ] NEIS MCP (학사일정/성적)
- [ ] 학교 공지 MCP

### 7-2. 멀티모달
- [ ] 이미지 → 도식 자동 생성 (강의자료용)
- [ ] 음성 입력 → 평가 자동

### 7-3. 커뮤니티 확장
- [ ] 선생님 베스트 템플릿 갤러리
- [ ] 인기도 랭킹 (주간/월간)
- [ ] 기여 시스템 (뱃지/크레딧)

---

## 8. 위험 & 대응

| 위험 | 영향 | 대응 |
|------|------|------|
| Docker 빌드 지연 | 운영 배포 지연 | host dev 임시 운영 + 빌드 재시도 |
| launchd 트리거 실패 | 자동 리서치 중단 | 수동 실행 + cron 백업 |
| hwpxjs ESM 호환 이슈 | 빌드/런타임 오류 | Next.js 15 + dynamic import로 우회 |
| teacher_id 누락 (JWT 만료) | Library 진입 차단 | 로그인 페이지로 자동 리다이렉트 (구현됨) |

---

## 9. 연락 & 책임

| 항목 | 책임 |
|------|------|
| 코드 변경 | 자동 (git commits) |
| 인프라 (Docker/launchd) | 수동 운영 |
| 만족도/지표 | 자동 수집 + 주간 리뷰 |
| 스킬 업데이트 | continuous-research-agent (자동) + 사용자 승인 |

---

## 10. 체크리스트 상태

```
[Phase 2 오픈 준비도]

코드 완성도       ████████████████████ 100%
인프라 준비       ████████████████████ 100%
검증              ████████████████████ 100%
운영 준비 (BLOCKER) ████████░░░░░░░░░░░░  40%  ← Docker 빌드 이슈
모니터링 셋업     ░░░░░░░░░░░░░░░░░░░░  0%   ← Day 1부터 시작
콘텐츠 피드백     ░░░░░░░░░░░░░░░░░░░░  0%   ← 첫 사용 후 시작

Phase 2 오픈 가능 여부: ✅ 가능 (dev 모드)
                       ⚠️ 운영 배포: Docker 빌드 해결 후
```

---

## 11. 즉시 사용자 액션 (오늘)

| 우선순위 | 액션 | 명령 |
|---------|------|------|
| 🔴 1 | Docker 빌드 이슈 해결 | `cd apps/web && pnpm install --prefer-offline` (호스트에서) → `docker compose build web` 재시도 |
| 🟡 2 | Phase 2 UI 직접 체험 | 호스트에서 `cd apps/web && pnpm dev` (port 3030) → http://localhost:3030/library |
| 🟢 3 | 매일 자동 리서치 확인 | 다음 오전 6시 이후 `tail samples/research/logs/` |
| 🟢 4 | 만족도 추적 시작 | 첫 선생님 사용자 발견 시 localStorage → DB 마이그레이션 |