from __future__ import annotations

import sys
from pathlib import Path

_SERVICE_ROOT = Path(__file__).resolve().parent.parent
if str(_SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(_SERVICE_ROOT))

from app.skills.official_letter import (
    build_official_letter_system_prompt,
    build_official_letter_user_prompt,
    validate_official_letter_params,
)


def _valid_params() -> dict:
    return {
        "school_level": "중등",
        "doc_type": "공문",
        "title": "2026학년도 연수 보고서",
        "sender": "서울OO중 교감 김OO",
        "body": ["1. 사업 개요", "2. 추진 일정", "3. 협조 요청"],
    }


def test_validate_with_all_required_returns_empty():
    assert validate_official_letter_params(_valid_params()) == []


def test_validate_missing_required_returns_errors():
    params = _valid_params()
    del params["doc_type"]
    del params["title"]
    errors = validate_official_letter_params(params)
    assert len(errors) == 2


def test_build_system_prompt_includes_official_tone():
    prompt = build_official_letter_system_prompt(_valid_params(), examples=[])
    assert "공문" in prompt or "행정" in prompt or "공식" in prompt


def test_build_user_prompt_includes_metadata():
    text = build_official_letter_user_prompt(_valid_params())
    assert "2026학년도 연수 보고서" in text
    assert "중등" in text
    assert "공문" in text
