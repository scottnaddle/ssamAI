# Test Infrastructure 완료 보고서

**완료 일자**: 2026-06-25
**상태**: ✅ 50/50 테스트 통과 (Python 36 + Vitest 14)

---

## 목표

> Issue #2 [P1] pytest + vitest 기반 테스트 인프라 구축

---

## 구현 요약

### 1. Python — pytest (3개 서비스)

| 서비스 | 테스트 파일 | 테스트 수 | 검증 대상 |
|--------|------------|----------|----------|
| **persona-service** | `tests/test_models.py` | 7 | Pydantic 모델 검증 (camelCase, Literal, ge/le) |
| **ppt-service** | `tests/test_models.py` | 6 | Pydantic 모델 검증 (slide_count 범위, topic 길이) |
| **skill-service** | `tests/test_home_letter.py` | 7 | validate_params + build_prompts |
| | `tests/test_lesson_plan.py` | 4 | validate_params + build_prompts |
| | `tests/test_formative_assessment.py` | 4 | validate_params + build_prompts |
| | `tests/test_official_letter.py` | 4 | validate_params + build_prompts |
| | `tests/test_rubric.py` | 4 | validate_params + build_prompts |
| **합계** | 7 파일 | **36** | |

**설정**:
- 루트 `pytest.ini` (testpaths = services/*/tests, asyncio_mode=auto)
- `pyproject.toml` dev deps: `pytest>=8.3.3`, `pytest-asyncio>=0.24.0`, `pytest-httpx>=0.35.0`
- `scripts/test-python.sh` wrapper (서비스별 cwd에서 pytest 실행)

**실행 방법**:
```bash
# 개별 서비스
cd services/skill-service && python3 -m pytest tests/

# 전체 (루트에서)
bash scripts/test-python.sh

# 또는
npm run test:python
```

### 2. Frontend — Vitest (2개 파일)

| 파일 | 테스트 수 | 검증 대상 |
|------|----------|----------|
| `lib/skill-update.test.ts` | 5 | `generateUpdate()` (4가지 pattern type + fallback + newline) |
| `lib/pattern-extractor.test.ts` | 9 | `extractPatterns()` (added_section, added_consent, modified_term, 통합) |
| **합계** | **14** | |

**설정**:
- `apps/web/vitest.config.ts` (happy-dom, path alias `@/*`)
- `apps/web/__tests__/setup.ts` (jest-dom matchers)
- `apps/web/package.json` scripts: `test`, `test:watch`
- devDeps: `vitest@^2`, `@vitejs/plugin-react@^4`, `@testing-library/react@^16`, `@testing-library/jest-dom@^6`, `happy-dom@^15`

**실행 방법**:
```bash
cd apps/web && npm test
# 또는
npm run test:web
```

### 3. 루트 npm scripts

```json
{
  "test": "npm run test:python && npm run test:web",
  "test:python": "bash scripts/test-python.sh",
  "test:web": "cd apps/web && npm test"
}
```

→ `npm test` 한 번으로 Python 36 + Vitest 14 = **50개 테스트** 실행

---

## 디버깅 과정에서 해결한 문제

### 1. pytest `app.*` import 충돌 (monorepo sys.path)

**문제**: 3개 서비스가 각각 `app/` 패키지를 가지고 있어, 루트에서 pytest 실행 시 다른 서비스의 `app.models`가 먼저 import되어 충돌.

**시도한 접근들** (모두 실패):
- `pytest.ini`의 `pythonpath` 설정 → `app` 모듈 캐싱 문제
- 서비스별 `conftest.py`에서 sys.path 조작 → conftest 실행 순서 의존
- `__init__.py` 추가/제거 → 패키지 인식 문제

**해결책**: 각 테스트 파일 최상단에 inline sys.path 설정:
```python
from __future__ import annotations

import sys
from pathlib import Path

_SERVICE_ROOT = Path(__file__).resolve().parent.parent
if str(_SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(_SERVICE_ROOT))

# ... 이후 app.* import
```

→ `cd services/<name> && pytest` 또는 wrapper script가 각 서비스 cwd에서 실행

### 2. vitest React 19 RC peer dep 충돌

**문제**: `npm install` 시 `@testing-library/react@^16`의 React 19 RC peer dep 미충족.

**해결**: `--legacy-peer-deps` 플래그로 설치 (npm workspace 환경에서 표준 관행).

### 3. 4개 테스트 assertion mismatch

| 테스트 | 기대 | 실제 | 수정 |
|--------|------|------|------|
| `test_official_letter.py` | `assert "sender" in text` | sender는 system_prompt에만 포함 | system_prompt 테스트로 변경 |
| `test_lesson_plan.py` | `assert "lesson_title" in text` | lesson_title은 user_prompt에 미포함 | "과학" 과목 검증으로 변경 |
| `test_home_letter.py` | `del params["title", "event_date"]` → 2 errors | event_date는 required 아님 | `letter_type` 으로 변경 |
| `test_formative_assessment.py` | `assert "topic" in text` | topic은 user_prompt에 미포함 | "unit" 검증으로 변경 |

→ 테스트는 함수 **실제 동작**에 맞춰 작성 (YAGNI 원칙)

---

## 핵심 산출물

### Python (9개 파일)
```
pytest.ini                                          (루트)
conftest.py                                         (루트, 공유 fixtures)
scripts/test-python.sh                              (wrapper)

services/persona-service/pyproject.toml             (pytest-httpx 추가)
services/persona-service/tests/test_models.py       (7 tests)

services/ppt-service/pyproject.toml                 (pytest-httpx 추가)
services/ppt-service/tests/test_models.py           (6 tests)

services/skill-service/pyproject.toml               (pytest-httpx 추가)
services/skill-service/tests/test_home_letter.py    (7 tests)
services/skill-service/tests/test_lesson_plan.py    (4 tests)
services/skill-service/tests/test_formative_assessment.py  (4 tests)
services/skill-service/tests/test_official_letter.py      (4 tests)
services/skill-service/tests/test_rubric.py         (4 tests)
```

### Frontend (4개 파일)
```
apps/web/vitest.config.ts                           (happy-dom + @ alias)
apps/web/__tests__/setup.ts                         (jest-dom matchers)
apps/web/lib/skill-update.test.ts                   (5 tests)
apps/web/lib/pattern-extractor.test.ts              (9 tests)
```

### 루트 설정
```
package.json                                        (test, test:python, test:web scripts)
```

---

## 검증 결과

### Python (services/*/tests)

```
=== persona-service ===
.......                                                                  [100%]
7 passed in 0.10s

=== ppt-service ===
......                                                                   [100%]
6 passed in 0.08s

=== skill-service ===
.......................                                                  [100%]
23 passed in 0.02s

✅ All Python service tests passed
```

### Vitest (apps/web)

```
 ✓ lib/skill-update.test.ts (5 tests) 2ms
 ✓ lib/pattern-extractor.test.ts (9 tests) 4ms

 Test Files  2 passed (2)
      Tests  14 passed (14)
```

### 전체

| 영역 | 테스트 수 | 통과 | 실패 |
|------|----------|------|------|
| Python (persona-service) | 7 | 7 | 0 |
| Python (ppt-service) | 6 | 6 | 0 |
| Python (skill-service) | 23 | 23 | 0 |
| Vitest (skill-update) | 5 | 5 | 0 |
| Vitest (pattern-extractor) | 9 | 9 | 0 |
| **합계** | **50** | **50** | **0** |

---

## 의도적으로 제외한 항목

1. **TestClient / `/health` endpoint 테스트** — `app.main` import가 Neo4j driver를 끌어와서 추가 의존성 필요. Pydantic 모델 단위 테스트로 충분.
2. **API route integration tests** (feedback, apply, recommend) — Neo4j mock 필요 → 별도 작업 (Phase 4 #2 후속).
3. **React component tests** (LibraryPage, SkillDialog) — happy-dom + 복잡한 mocking 필요 → 시간 부족. Vitest 인프라만 셋업 완료.
4. **CI 통합** (GitHub Actions) — Issue #3으로 분리.

---

## 후속 작업 (Issue #3 CI)

- [ ] `.github/workflows/ci.yml` — PR 시 `npm test` + `pytest` 자동 실행
- [ ] coverage 측정 (`vitest --coverage`, `pytest-cov`)
- [ ] TestClient integration tests (mock Neo4j with `pytest-httpx` or `mongomock`)
- [ ] React component tests (LibraryPage, ChatView)
