from __future__ import annotations

import sys
from pathlib import Path

_SERVICE_ROOT = Path(__file__).resolve().parent.parent
if str(_SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(_SERVICE_ROOT))

import pytest

from app.skills.rubric import (
    build_rubric_system_prompt,
    build_rubric_user_prompt,
    validate_rubric_params,
)


def _valid_params() -> dict:
    return {
        "school_level": "중등",
        "grade": "2학년",
        "subject": "국어",
        "unit": "의견과 주장",
        "evaluation_name": "건의문 작성",
        "method": "프로젝트",
        "scale": 4,
    }


def test_validate_with_all_required_returns_empty():
    assert validate_rubric_params(_valid_params()) == []


def test_validate_missing_required_returns_errors():
    params = _valid_params()
    del params["scale"]
    del params["method"]
    errors = validate_rubric_params(params)
    assert len(errors) == 2
    assert any("scale" in e for e in errors)


def test_build_system_prompt_includes_rubric_structure():
    prompt = build_rubric_system_prompt(_valid_params(), examples=[])
    assert "루브릭" in prompt or "rubric" in prompt.lower()
    assert "척도" in prompt or "단계" in prompt


def test_build_user_prompt_includes_evaluation_name():
    text = build_rubric_user_prompt(_valid_params())
    assert "건의문 작성" in text
    assert "의견과 주장" in text
