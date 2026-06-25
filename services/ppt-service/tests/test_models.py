from __future__ import annotations

import sys
from pathlib import Path

_SERVICE_ROOT = Path(__file__).resolve().parent.parent
if str(_SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(_SERVICE_ROOT))

import pytest

from app.models import (
    CreatePptRequest,
    HealthResponse,
    PptOutline,
    SlideSummary,
)


def test_slide_summary_accepts_camel_case():
    s = SlideSummary.model_validate({
        "index": 0,
        "title": "광합성이란?",
        "textPreview": "식물이 빛으로 양분을 만든다",
    })
    assert s.index == 0
    assert s.title == "광합성이란?"
    assert s.text_preview == "식물이 빛으로 양분을 만든다"


def test_slide_summary_rejects_long_text_preview():
    with pytest.raises(Exception):
        SlideSummary.model_validate({
            "index": 0,
            "title": "t",
            "textPreview": "x" * 201,
        })


def test_create_ppt_request_validates_slide_count():
    base = {
        "topic": "광합성",
        "schoolLevel": "초등",
        "subject": "과학",
        "teacherId": "t-001",
    }
    CreatePptRequest.model_validate({**base, "slideCount": 3})
    CreatePptRequest.model_validate({**base, "slideCount": 80})

    with pytest.raises(Exception):
        CreatePptRequest.model_validate({**base, "slideCount": 2})
    with pytest.raises(Exception):
        CreatePptRequest.model_validate({**base, "slideCount": 81})


def test_create_ppt_request_validates_topic_length():
    base = {
        "topic": "광합성",
        "schoolLevel": "초등",
        "subject": "과학",
        "teacherId": "t-001",
        "slideCount": 10,
    }
    with pytest.raises(Exception):
        CreatePptRequest.model_validate({**base, "topic": "a"})
    with pytest.raises(Exception):
        CreatePptRequest.model_validate({**base, "topic": "x" * 501})


def test_ppt_outline_round_trip():
    outline = PptOutline.model_validate({
        "fileName": "test.pptx",
        "slideCount": 2,
        "slides": [
            {"index": 0, "title": "t1"},
            {"index": 1, "title": "t2"},
        ],
    })
    assert outline.file_name == "test.pptx"
    assert outline.slide_count == 2
    assert len(outline.slides) == 2


def test_health_response_shape():
    resp = HealthResponse(status="ok", service="ppt-service", version="0.1.0")
    assert resp.status == "ok"
    assert resp.service == "ppt-service"
