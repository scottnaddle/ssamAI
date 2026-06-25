from __future__ import annotations

import sys
from pathlib import Path

_SERVICE_ROOT = Path(__file__).resolve().parent.parent
if str(_SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(_SERVICE_ROOT))

import pytest

from app.models import (
    CurrentClass,
    HealthResponse,
    PersonaUpsertRequest,
    TeacherPersona,
)


def test_current_class_accepts_camel_case():
    cls = CurrentClass.model_validate({
        "grade": "5학년",
        "className": "5-3",
        "studentCount": 28,
    })
    assert cls.grade == "5학년"
    assert cls.class_name == "5-3"
    assert cls.student_count == 28


def test_current_class_rejects_invalid_student_count():
    with pytest.raises(Exception):
        CurrentClass.model_validate({
            "grade": "5학년",
            "className": "5-3",
            "studentCount": 0,
        })
    with pytest.raises(Exception):
        CurrentClass.model_validate({
            "grade": "5학년",
            "className": "5-3",
            "studentCount": 501,
        })


def test_teacher_persona_validates_required_fields():
    persona = TeacherPersona.model_validate({
        "teacherId": "t-001",
        "name": "홍길동",
        "schoolLevel": "초등",
        "subject": "과학",
        "teachingStyle": "실험·탐구 중심",
    })
    assert persona.teacher_id == "t-001"
    assert persona.school_level == "초등"
    assert persona.teaching_style == "실험·탐구 중심"
    assert persona.school is None
    assert persona.current_class is None


def test_teacher_persona_rejects_invalid_school_level():
    with pytest.raises(Exception):
        TeacherPersona.model_validate({
            "teacherId": "t-001",
            "name": "홍길동",
            "schoolLevel": "대안학교",
            "subject": "과학",
            "teachingStyle": "실험·탐구 중심",
        })


def test_teacher_persona_rejects_invalid_teaching_style():
    with pytest.raises(Exception):
        TeacherPersona.model_validate({
            "teacherId": "t-001",
            "name": "홍길동",
            "schoolLevel": "초등",
            "subject": "과학",
            "teachingStyle": "강의식 나쁨",
        })


def test_persona_upsert_request_round_trip():
    req = PersonaUpsertRequest.model_validate({
        "teacherId": "t-001",
        "name": "홍길동",
        "schoolLevel": "중학교",
        "subject": "수학",
        "school": "서울중",
        "teachingStyle": "강의식",
        "philosophy": "개별 맞춤",
    })
    assert req.teacher_id == "t-001"
    assert req.school == "서울중"
    assert req.philosophy == "개별 맞춤"


def test_health_response_shape():
    resp = HealthResponse(status="ok", service="persona-service", version="0.1.0")
    assert resp.status == "ok"
    assert resp.service == "persona-service"
