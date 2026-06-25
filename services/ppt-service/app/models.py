"""Pydantic models for ppt-service request/response schemas."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


SchoolLevel = Literal["초등", "중학교", "고등학교"]

_MODEL_CONFIG = ConfigDict(populate_by_name=True, protected_namespaces=())


class SlideSummary(BaseModel):
    model_config = _MODEL_CONFIG

    index: int
    title: str | None = None
    text_preview: str | None = Field(None, alias="textPreview", max_length=200)


class PptOutline(BaseModel):
    model_config = _MODEL_CONFIG

    file_name: str = Field(..., alias="fileName")
    slide_count: int = Field(..., alias="slideCount")
    slides: list[SlideSummary]


class CreatePptRequest(BaseModel):
    model_config = _MODEL_CONFIG

    topic: str = Field(..., min_length=2, max_length=500)
    school_level: SchoolLevel = Field(..., alias="schoolLevel")
    subject: str
    grade: str | None = None
    slide_count: int = Field(..., alias="slideCount", ge=3, le=80)
    teacher_id: str = Field(..., alias="teacherId")
    style_hint: str | None = Field(None, alias="styleHint")


class CreatePptResponse(BaseModel):
    model_config = _MODEL_CONFIG

    ppt_url: str = Field(..., alias="pptUrl")
    outline: PptOutline


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str
    version: str
