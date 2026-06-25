from __future__ import annotations

import sys
from pathlib import Path

_SERVICE_ROOT = Path(__file__).resolve().parent.parent
if str(_SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(_SERVICE_ROOT))

from app.skills.formative_assessment import (
    build_formative_assessment_system_prompt,
    build_formative_assessment_user_prompt,
    validate_formative_assessment_params,
)


def _valid_params() -> dict:
    return {
        "school_level": "초등",
        "grade": "5학년",
        "subject": "과학",
        "unit": "식물의 세계",
        "topic": "광합성",
        "question_count": 10,
    }


def test_validate_with_all_required_returns_empty():
    assert validate_formative_assessment_params(_valid_params()) == []


def test_validate_missing_required_returns_errors():
    params = _valid_params()
    del params["question_count"]
    errors = validate_formative_assessment_params(params)
    assert len(errors) == 1
    assert "question_count" in errors[0]


def test_build_system_prompt_includes_question_types():
    prompt = build_formative_assessment_system_prompt(_valid_params(), examples=[])
    assert "선택형" in prompt or "단답형" in prompt or "문항" in prompt
    assert "정답" in prompt or "해설" in prompt


def test_build_user_prompt_includes_unit_and_count():
    text = build_formative_assessment_user_prompt(_valid_params())
    assert "식물의 세계" in text
    assert "10" in text
