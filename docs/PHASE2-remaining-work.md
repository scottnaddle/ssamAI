# Phase 2 잔여작업 & 마무리 (2026-06-24)

## Phase 2 완료 상태

| 작업 | 상태 | 비고 |
|------|------|------|
| 5개 콘텐츠 스킬 (런타임) | ✅ 완료 | lesson-plan/formative-assessment/rubric/official-letter/home-letter |
| 3개 인프라 스킬 (메타) | ✅ 완료 | ssamai-pipeline-orchestrator / continuous-research-agent / teacher-template-loop |
| Next.js API (skills/generate/community/fork/consensus) | ✅ 완료 | 7개 엔드포인트 |
| Library 페이지 (3 탭) | ✅ 완료 | 생성 + 커뮤니티 + 내 자료 |
| 자연어 오케스트레이터 | ✅ 완료 | 8/8 워크플로 패턴 |
| 일일 리서치 인프라 | ✅ 완료 | daily-research-runner.py + launchd |
| Neo4j 템플릿/패턴 그래프 | ✅ 완료 | 5명 합의 감지 작동 확인 |

---

## 미션 반영도 최종: 69%

| 미션 | 현재 | 다음 단계 |
|------|------|----------|
| ① 스킬로 업무 줄이기 | 75% | 만족도 추적 + 개인화 |
| ② 에이전트 파이프라인 | 65% | LiteLLM 기반 의도 감지 |
| ③ 지속적 리서치 → 스킬 강화 | 70% | 패턴 → SKILL.md 자동 패치 |
| ④ 선생님 콘텐츠 → 스킬 강화 | 65% | 자동 PR 워크플로 |

---

# 잔여작업 (Phase 3 진입 후 또는 백로그)

## 🔴 즉시 (Tier 3, 1~2주)

### 1. 자동 SKILL.md 업데이트 (Loop 2 완성)
- **목표**: 5명 합의 패턴 → 자동 PR 생성 → 사용자 승인 → SKILL.md 패치
- **현재**: 합의 감지는 작동, 자동 PR 생성 미구현
- **작업**:
  - `apps/web/app/api/skills/auto-update/route.ts` 생성
  - 합의 패턴 → SKILL.md 패치 생성 (diff)
  - Git PR 자동 생성 (`gh pr create` 또는 webhook)
  - 사용자 승인 후 머지

### 2. Loop 3 개인화 추천
- **목표**: "OOO 선생님, 자주 만시던 형식으로..." 추천
- **현재**: 패턴 추적은 작동, 개인화 추천 미구현
- **작업**:
  - 선생님 사용 이력 분석 (어떤 학년/과목/문항 유형 자주 사용하는지)
  - 추천 양식 자동 학습
  - Library 진입 시 개인화 추천 표시

### 3. 만족도 추적 시스템
- **목표**: ⭐ 1~5점 → 만족도 평균 → 패턴 학습 가중치
- **현재**: 만족도 저장만 (localStorage), 분석 없음
- **작업**:
  - `POST /api/library/feedback` 라우트
  - 만족도 + 편집 비율 → Neo4j 패턴 가중치
  - 만족도 < 3점인 패턴은 합의에서 제외

## 🟡 단기 (Tier 4, 1~2개월)

### 4. Loop 1 외부 리서치 강화
- daily-research-runner.py에 Jina Reader 외 Exa Search 통합
- 패턴 자동 추출 (외부 자료 → ssamAI 형식 표준화)
- SKILL.md 자동 패치 (외부 합의 패턴만)

### 5. 멀티모달 — 이미지/도식 생성
- 차시별 PPT에 자동 도식 삽입 (Mermaid → PNG)
- 활동지에 그림 자동 삽입
- 음성 입력 (수업 중 녹음 → 평가 자동 생성)

### 6. 공동 작업 (Co-Edit)
- 같은 문서를 여러 선생님이 동시 편집
- 변경 이력 추적
- 코멘트/검토 기능

## 🟢 중기 (Tier 5, 2~6개월)

### 7. MCP 연동 (외부 시스템)
- 에듀넷 MCP — 실시간 차시 자료
- NEIS MCP — 학사 일정/성적
- 학교 공지 MCP — 자동 알림

### 8. 학교 기관 구독
- 학교 단위 결제 모델
- 관리자 대시보드 (전체 교사 사용 통계)
- 학교별 커스텀 스킬/양식

### 9. 모바일 앱
- iOS/Android 네이티브 앱
- 푸시 알림 (가정통신문 발송)
- 음성 입력

### 10. 소셜 로그인
- 카카오/네이버/Google OAuth
- 학교 이메일 자동 인증

---

# Phase 2 산출물 (참조)

| 위치 | 내용 |
|------|------|
| `/Users/scott/.config/opencode/skills/` | 8개 스킬 (5 콘텐츠 + 3 인프라) |
| `/Users/scott/ssamAI/apps/web/lib/` | neo4j.ts, pattern-extractor.ts, skill-defs.ts, skill-templates/ |
| `/Users/scott/ssamAI/apps/web/app/api/` | library/{skills,generate,orchestrate,templates/,patterns/} |
| `/Users/scott/ssamAI/apps/web/app/(app)/library/page.tsx` | Library 페이지 Phase 2 |
| `/Users/scott/ssamAI/samples/output/` | 5개 샘플 HWPX (186KB) |
| `/Users/scott/ssamAI/samples/research/` | 일일 리서치 + 패턴 리포트 |
| `/Users/scott/ssamAI/ARCHITECTURE-pipeline.md` | 3대 자가 학습 루프 |
| `/Users/scott/ssamAI/docs/PHASE2-open-checklist.md` | Phase 2 오픈 체크리스트 |
| `/Users/scott/ssamAI/docs/PHASE2-library-page-spec.md` | Library 페이지 명세 |

---

# Phase 2 → Phase 3 전환 노트

## Phase 2가 해결한 것
- ✅ 스킬 정의 + 실행 가능
- ✅ 자동 워크플로 (자연어 → 복수 스킬)
- ✅ 일일 외부 리서치 + 자동 수집
- ✅ 선생님 콘텐츠 → 패턴 추출 + 5명 합의 감지
- ✅ Library 페이지 (3 탭) 완전 동작

## Phase 3가 해결해야 할 것
1. **운영화**: Docker 빌드 이슈 해결, 배포 자동화
2. **고도화**: 5명 합의 → 자동 SKILL.md 업데이트 루프 완성
3. **개인화**: 선생님별 추천 (Loop 3)
4. **확장**: 커뮤니티 확장 (뱃지/크레딧), 학교 구독 모델
5. **연동**: MCP (에듀넷/NEIS), 모바일, 소셜 로그인

## 즉시 차단 이슈
- ⚠️ **Docker 빌드 `pnpm install` 398/440 정체** — 운영 배포 전 해결 필수
  - Phase 2 코드는 dev 모드(`pnpm dev -p 3030`)에서만 동작
  - 컨테이너는 Phase 1 빌드 그대로 실행 중
  - 해결책: `pnpm install --offline` 또는 Dockerfile 수정