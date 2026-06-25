"""Pydantic schemas for persona-service."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


SchoolLevel = Literal["초등", "중학교", "고등학교"]
TeachingStyle = Literal[
    "실험·탐구 중심",
    "강의식",
    "토론·프로젝트 중심",
    "게임·활동 중심",
]

# Accept both snake_case (Python-internal) and camelCase (JS client).
_MODEL_CONFIG = ConfigDict(populate_by_name=True, protected_namespaces=())


class CurrentClass(BaseModel):
    model_config = _MODEL_CONFIG

    grade: str
    class_name: str = Field(..., alias="className")
    student_count: int = Field(..., alias="studentCount", ge=1, le=500)


class TeacherPersona(BaseModel):
    model_config = _MODEL_CONFIG

    teacher_id: str = Field(..., alias="teacherId")
    name: str
    school_level: SchoolLevel = Field(..., alias="schoolLevel")
    subject: str
    school: str | None = None
    teaching_style: TeachingStyle = Field(..., alias="teachingStyle")
    philosophy: str | None = None
    current_class: CurrentClass | None = Field(None, alias="currentClass")
    created_at: str | None = Field(None, alias="createdAt")
    updated_at: str | None = Field(None, alias="updatedAt")


class PersonaUpsertRequest(BaseModel):
    model_config = _MODEL_CONFIG

    teacher_id: str = Field(..., alias="teacherId")
    name: str
    school_level: SchoolLevel = Field(..., alias="schoolLevel")
    subject: str
    school: str | None = None
    teaching_style: TeachingStyle = Field(..., alias="teachingStyle")
    philosophy: str | None = None
    current_class: CurrentClass | None = Field(None, alias="currentClass")


class RecallResponse(BaseModel):
    facts: list[str]
    sources: list[str]


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str
    version: str
