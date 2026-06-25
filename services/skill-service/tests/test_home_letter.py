from __future__ import annotations

import sys
from pathlib import Path

_SERVICE_ROOT = Path(__file__).resolve().parent.parent
if str(_SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(_SERVICE_ROOT))

import pytest

from app.skills.home_letter import (
    build_home_letter_system_prompt,
    build_home_letter_user_prompt,
    validate_home_letter_params,
)


def _valid_params() -> dict:
    return {
        "school_level": "초등",
        "grade": "4학년",
        "letter_type": "현장학습",
        "title": "4학년 현장학습",
        "event_date": "2026. 6. 25.(수)",
        "location": "국립중앙박물관",
        "target": "4학년 전체 (87명)",
        "cost": "학생 1인 2만원",
        "items": "도시락, 음료",
        "dress": "교복",
        "notices": "음식물 반입 금지",
        "teacher_name": "김OO",
        "contact": "02-XXX-XXXX",
        "consent_needed": True,
        "consent_deadline": "2026. 6. 24.",
    }


def test_validate_with_all_required_returns_empty():
    errors = validate_home_letter_params(_valid_params())
    assert errors == []


def test_validate_missing_required_returns_errors():
    params = _valid_params()
    del params["title"]
    del params["letter_type"]
    errors = validate_home_letter_params(params)
    assert len(errors) == 2
    assert any("title" in e for e in errors)
    assert any("letter_type" in e for e in errors)


def test_validate_empty_params_returns_multiple_errors():
    errors = validate_home_letter_params({})
    assert len(errors) >= 4


def test_build_system_prompt_includes_korean_guidelines():
    prompt = build_home_letter_system_prompt(_valid_params(), examples=[])
    assert "가정통신문" in prompt
    assert "학부모" in prompt
    assert "존칭" in prompt or "하십시오" in prompt


def test_build_system_prompt_with_examples_appends_reference():
    examples = [{"content": "예시 1"}]
    prompt = build_home_letter_system_prompt(_valid_params(), examples=examples)
    assert "예시" in prompt or "참고" in prompt


def test_build_user_prompt_includes_key_params():
    text = build_home_letter_user_prompt(_valid_params())
    assert "4학년" in text
    assert "현장학습" in text
    assert "국립중앙박물관" in text
    assert "2026. 6. 25" in text


def test_build_user_prompt_optional_fields_omitted_when_missing():
    params = _valid_params()
    del params["event_date"]
    del params["location"]
    text = build_home_letter_user_prompt(params)
    assert "일시" not in text
    assert "장소" not in text
