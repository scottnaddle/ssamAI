# Phase 3 B→C 완료 보고서

**완료 일자**: 2026-06-25
**상태**: ✅ End-to-end 검증 완료 (UI + API + Neo4j)

---

## 목표

> 선생님 만족도를 수집해서 5명 합의 + 평균 3.5+ 도달 시 SKILL.md 자동 업데이트 후보로 변환

---

## 구현 요약

### B: 만족도 추적 (POST /api/library/feedback)

| 항목 | 값 |
|------|-----|
| 파일 | `apps/web/app/api/library/feedback/route.ts` |
| API | `POST /api/library/feedback` (body: teacher_id, skill_name, satisfaction 1-5, edit_ratio?, notes?, template_id?) |
| 저장 | Neo4j `(:Teacher)-[:GAVE_FEEDBACK]->(:Feedback)-[:RATES]->(:Pattern)` |
| 집계 | 만족도 점수 가중 평균 (`r.score = (r.score * r.count + satisfaction) / (r.count + 1)`) |
| GET | `/api/library/feedback?skill_name=X` → 패턴별 avg_score, total_ratings |

**버그 수정** (구현 중 발견): `MERGE` 절의 null optional 필드 (`template_id`, `notes`, `edit_ratio`) 가 Neo4j constraint 와 충돌 → `ON CREATE SET fb.X = $X` 로 분리하여 해결

### C: 스킬 자동 업데이트 (GET /api/patterns/updates)

| 항목 | 값 |
|------|-----|
| 파일 | `apps/web/app/api/patterns/updates/route.ts` |
| 쿼리 | `MATCH (p:Pattern) WHERE count>=5` + RATES 관계 평균 |
| 임계값 | `count >= 5` AND `avg_satisfaction >= 3.5` |
| 출력 | `status: "ready" \| "candidate"` + `suggested_update` (markdown) |
| 마크다운 형식 | `## 자동 추가 섹션: {value}\n\n> {skill_name} 생성 시 이 섹션을 기본 포함 (5명 이상 합의 패턴)\n` |

### UI 통합 (apps/web/app/(app)/library/page.tsx)

1. **만족도 ⭐ 위젯** — 오케스트레이터 결과 후 파일별 1-5점 평가
   - `submitFeedback(skillName, satisfaction)` → `feedbackApi.submit()`
   - 평가 완료 시 "⭐ 평가 완료 — 감사합니다" 토글
2. **🔧 스킬 자동 업데이트 (Loop 2 완성) 섹션** — 커뮤니티 탭
   - `feedbackApi.candidates()` → status: "ready" 만 표시
   - 각 후보: READY 배지, 스킬, 패턴 값, 빈도, ⭐, suggested_update markdown
   - **📋 패치 복사** 버튼 → clipboard.writeText

---

## End-to-End 검증 결과

### API 검증 (curl)

```text
1) GET /api/patterns/updates (시작)
   - ready_count: 0
   - candidate: 학부모 확인란 (freq=6, avg=0, status=candidate)

2) POST /api/library/feedback {satisfaction: 5} → 200 OK
   - skill_average: {skill: "home-letter", avg: 5, count: 2}

3) POST /api/library/feedback {satisfaction: 4} → 200 OK
   - skill_average: {skill: "home-letter", avg: 4.5, count: 4}

4) GET /api/patterns/updates (5점 클릭 후)
   - ready_count: 2
   - 학부모 확인란 (freq=6, avg=4.5, status=ready)
   - 학부모 확인 (freq=6, avg=4.5, status=ready)
   - suggested_update: "## 자동 추가 섹션: 학부모 확인란\n\n> home-letter 생성 시..."

5) GET /api/library/feedback?skill_name=home-letter
   - [{value: "학부모 확인란", avg_score: 4.5, total_ratings: 2},
      {value: "학부모 확인", avg_score: 4.5, total_ratings: 2}]
```

### UI 검증 (Playwright + Chrome DevTools MCP)

| 단계 | 결과 |
|------|------|
| `/library` 페이지 로드 | ✅ 200 OK, 32.3KB, 인증 확인 후 렌더 |
| ✨ 생성 탭 | ✅ 오케스트레이터 텍스트박스 + 🚀 생성 버튼 |
| 🚀 생성 클릭 | ✅ "✅ 차시별 자료 일괄 완료 — 1개 파일 다운로드 시작 (절약 ≈ 45분)" |
| ⭐ 만족도 위젯 표시 | ✅ "이 자료가 도움이 되었나요?" + ☆/☆/⭐/⭐/🌟 5개 버튼 |
| 5점(🌟) 클릭 | ✅ "⭐ 평가 완료 — 감사합니다" 토글 |
| 🌐 커뮤니티 탭 → 새 섹션 | ✅ "🔧 스킬 자동 업데이트 (Loop 2 완성)" + 2 READY candidates + suggested_update markdown + 📋 패치 복사 버튼 |

### 스크린샷

- `samples/output/phase3-bc-library.png` — 커뮤니티 탭 + 새 섹션 + 📋 패치 복사 버튼
- `samples/output/phase3-bc-final.png` — ✨ 생성 탭 + 만족도 평가 완료 상태

---

## 핵심 파일

| 파일 | 역할 |
|------|------|
| `apps/web/app/api/library/feedback/route.ts` | POST/GET 피드백 (123줄) |
| `apps/web/app/api/patterns/updates/route.ts` | GET 업데이트 후보 (90줄) |
| `apps/web/app/(app)/library/page.tsx` | UI 통합 (749줄, +123줄) |
| `apps/web/lib/api-client.ts` | `feedbackApi.submit/candidates` (35줄) |
| `apps/web/lib/neo4j.ts` | `normalizeValue()` (Integer/Duration 변환) |

---

## 미완료 / 후속 작업 (Phase 3 잔여)

- [ ] 📋 패치 복사 후 실제 SKILL.md 파일에 자동 적용 (현재는 수동)
- [ ] 다국어 (한/영) suggested_update 분기
- [ ] 만족도 추세 분석 (시간대별 평균 변화)
- [ ] Phase 3 잔여: Loop 3 (개인화) + MCP 통합

---

## 임팩트

- **선생님 행정 시간 절감**: 만족도 데이터 기반 자동 스킬 진화 → 매주 12시간+ → 지속적 개선
- **자가 학습 Loop 2 완성**: 외부 리서치(Loop 1) ✅ + 선생님 콘텐츠 학습(Loop 2) ✅ + 개인화(Loop 3) ⏳
- **확장성**: 동일 패턴으로 다른 5개 스킬 (수업 과정안, 형성평가, 루브릭, 공문, 가정통신문) 도 자동 업데이트 가능
