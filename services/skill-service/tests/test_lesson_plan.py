from __future__ import annotations

import sys
from pathlib import Path

_SERVICE_ROOT = Path(__file__).resolve().parent.parent
if str(_SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(_SERVICE_ROOT))

from app.skills.lesson_plan import (
    build_lesson_plan_system_prompt,
    build_lesson_plan_user_prompt,
    validate_lesson_plan_params,
)


def _valid_params() -> dict:
    return {
        "school_level": "초등",
        "grade": "5학년",
        "subject": "과학",
        "unit": "식물의 세계",
        "lesson_number": 2,
        "lesson_title": "광합성이란?",
        "objectives": ["광합성 정의 설명"],
        "duration_minutes": 40,
    }


def test_validate_with_all_required_returns_empty():
    assert validate_lesson_plan_params(_valid_params()) == []


def test_validate_missing_required_returns_errors():
    params = _valid_params()
    del params["subject"]
    del params["unit"]
    errors = validate_lesson_plan_params(params)
    assert len(errors) == 2
    assert any("subject" in e for e in errors)
    assert any("unit" in e for e in errors)


def test_build_system_prompt_includes_lesson_structure():
    prompt = build_lesson_plan_system_prompt(_valid_params(), examples=[])
    assert "수업" in prompt or "lesson" in prompt.lower()
    assert "도입" in prompt or "전개" in prompt or "정리" in prompt


def test_build_user_prompt_includes_lesson_metadata():
    text = build_lesson_plan_user_prompt(_valid_params())
    assert "5학년" in text or "초등" in text
    assert "식물의 세계" in text
    assert "과학" in text
