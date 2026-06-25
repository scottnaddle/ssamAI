# Phase 3 Loop 3 (개인화) 완료 보고서

**완료 일자**: 2026-06-25
**상태**: ✅ End-to-end 검증 완료 (사용 추적 → 추천 API → UI 위젯)

---

## 목표

> 선생님 개인의 사용 이력을 학습하여 그 선생님에게 맞는 스킬 추천 + 다음 워크플로 제안

---

## 구현 요약

### 1. 사용 추적 (lib/usage-tracker.ts)

`trackUsage({ teacher_id, skill_name, source })` 함수:
- `MERGE (t:Teacher {id: $teacher_id})` (없으면 자동 생성)
- `MERGE (t)-[u:USED]->(s:Skill {name: $skill_name})`
- USED 관계에 `count`, `first_used`, `last_used`, `last_source` 속성 저장
- ON CREATE: count=1, ON MATCH: count++

**호출 위치**:
- `orchestrate` 라우트 — `Promise.all(workflow.calls.map(trackUsage))` (source="orchestrate")
- `generate` 라우트 — buffer 생성 직후 호출 (source="single")

### 2. 추천 API (api/personalization/recommend/route.ts)

`GET /api/personalization/recommend?teacher_id=X&limit=3`:

| 필드 | 의미 |
|------|------|
| `top_skills` | 사용 횟수 상위 N개 (display_name, icon, category, reason 포함) |
| `recent_7d_count` | 최근 7일 사용 횟수 합계 |
| `total_count` | 누적 사용 횟수 |
| `time_pattern` | `morning` / `afternoon` / `evening` (사용 시간대) |
| `next_suggestion` | 다음 추천 워크플로 (WORKFLOW_ORDER 기반) |

**Cypher 핵심**:
```cypher
MATCH (t:Teacher {id: $teacher_id})-[u:USED]->(s:Skill)
WITH ..., duration.between(datetime({epochMillis: toInteger(u.last_used)}), datetime()).days AS age_days
WITH ..., CASE WHEN age_days <= 7 THEN u.count ELSE 0 END AS recent_count
WITH ..., collect({skill_name, count, last_used, last_source, hour}) AS rows, ...
RETURN [r IN rows | r.skill_name] AS skill_names, ...
```

**워크플로 순서 (다음 추천 로직)**:
```
차시별 자료 일괄 → 수행평가 일괄
수행평가 일괄 → 학기 초 행정 일괄
현장학습 자료 일괄 → 차시별 자료 일괄
학기 초 행정 일괄 → 차시별 자료 일괄
```

### 3. Library 페이지 UI (💡 추천 섹션)

create 탭 최상단에 삽입 (조건: `recommend.total_count > 0`):

| UI 요소 | 표시 |
|------|------|
| 헤더 | `💡 추천` |
| 뱃지 1 | `최근 7일 N회 사용` |
| 뱃지 2 | `🌅 오전` / `☀️ 오후` / `🌙 저녁` 활동 |
| 추천 스킬 버튼 (3개) | `💌 가정통신문 3회` — 클릭 시 handleQuickStart |
| 다음 추천 버튼 | `🔁 다음 추천: 차시별 자료 일괄` — 클릭 시 freeText 자동 채움 |

`handleQuickStart(skillName)`:
- `/api/library/orchestrate` POST with `skill_name` (단일 스킬 경로)
- 결과를 `orchestratorResult` state에 저장
- `setFeedbackSent({})` — 만족도 위젯 초기화

---

## End-to-End 검증 결과

### API 검증 (curl)

```text
1) USED 기록 0건일 때
   → top_skills: [], total_count: 0, time_pattern: "unknown"

2) home-letter 3회 + lesson-plan 2회 사용 후
   → top_skills: [가정통신문 3회, 수업 과정안 2회]
   → recent_7d_count: 5
   → time_pattern: "evening"
   → next_suggestion: {workflow: "차시별 자료 일괄", reason: "이전에 '현장학습 자료 일괄'..."}
```

### UI 검증 (Playwright + Chrome DevTools MCP)

| 단계 | 결과 |
|------|------|
| /library 페이지 로드 | ✅ "💡 추천" 섹션 최상단 표시 |
| 뱃지 표시 | ✅ "최근 7일 5회 사용" + "🌙 저녁 활동" |
| 추천 스킬 버튼 | ✅ "💌 가정통신문 3회" + "📝 수업 과정안 2회" |
| 다음 추천 버튼 | ✅ "🔁 다음 추천: 차시별 자료 일괄" |
| 버튼 클릭 (가정통신문) | ✅ orchestrator 실행 → "✅ 가정통신문 완료 — 1개 파일 다운로드 시작 (절약 ≈ 45분)" |
| 만족도 위젯 | ✅ "이 자료가 도움이 되었나요?" + 5점 척도 |

### 디버깅 과정에서 발견한 버그

1. **Teacher 노드 자동 생성 누락** — `MATCH (t:Teacher {id: ...})` 는 기존 Teacher만 매치 → 신규 teacher_id로 USED 기록 실패
   - 해결: `MERGE (t:Teacher {id: $teacher_id})` 로 변경
2. **teacherId 불일치** — localStorage의 `user.id` 가 MongoDB ObjectId (`6a3b3652a8e9f46c41ec19ed`) 라서 초기 curl 테스트의 `testteacher01` 과 다름
   - 해결: 브라우저에서 실제 user.id 확인 후 올바른 ID로 USED 생성

---

## 핵심 파일

| 파일 | 역할 |
|------|------|
| `apps/web/lib/usage-tracker.ts` | `trackUsage()` 공유 (25줄) |
| `apps/web/app/api/library/orchestrate/route.ts` | `trackUsage` 호출 (수정) |
| `apps/web/app/api/library/generate/route.ts` | `trackUsage` 호출 (수정) |
| `apps/web/app/api/personalization/recommend/route.ts` | 추천 API (150줄) |
| `apps/web/app/(app)/library/page.tsx` | "💡 추천" 섹션 + handleQuickStart |

---

## 임팩트

- **선생님별 맞춤 추천**: 매번 5개 스킬 중 고르는 대신, 자주 쓰는 스킬 1-클릭
- **다음 워크플로 제안**: "차시별 자료" → "수행평가" 순서가 자연스러운 선생님에게 자동 안내
- **시간대별 패턴 학습**: 저녁 활동이 많은 선생님 → 평일 저녁 알림 가능 (Phase 4)
- **자가 학습 Loop 3 완성**: 외부 리서치 ✅ + 선생님 콘텐츠 ✅ + **개인화** ✅

---

## 알려진 한계 / 후속 작업

- **last_used ISO 변환**: Neo4j Integer 파싱 단순화로 ms 변환 생략 → 시간 기반 reason ("오늘", "이번 주") 미작동. reason은 count만 사용 ("3회 사용")
- **핫 시간대 알림**: time_pattern 학습했지만 알림 발송은 미구현
- **추천 정확도**: 단순 count 기반. 다음 추천은 WORKFLOW_ORDER 하드코딩 (협업 필터링 등 적용 가능)
- **콜드 스타트**: 신규 선생님은 추천 없음 → 인기 스킬 기본 노출 (Phase 4)
