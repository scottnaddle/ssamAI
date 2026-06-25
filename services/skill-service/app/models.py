"""Pydantic models for skill-service."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


# ── Skill definition ──────────────────────────────────────
class SkillParamField(BaseModel):
    """A single parameter field in a skill form."""
    key: str
    label: str
    type: str = "text"  # text | select | number | textarea
    required: bool = True
    placeholder: str | None = None
    options: list[str] | None = None  # for select type


class SkillDef(BaseModel):
    """Skill metadata exposed to the frontend."""
    name: str
    display_name: str
    description: str
    category: str  # 수업, 행정, 평가, 소통
    icon: str
    params: list[SkillParamField]
    requires_teacher_context: bool = True


# ── Skill execution ───────────────────────────────────────
class SkillGenerateRequest(BaseModel):
    skill_name: str
    teacher_id: str
    model: str | None = None  # override the default model
    params: dict[str, Any] = Field(default_factory=dict)


class SkillGenerateResponse(BaseModel):
    skill_name: str
    content: str  # generated document content (markdown)
    model_used: str
    params_used: dict[str, Any]
    example_count: int  # how many few-shot examples were used


# ── Skill example storage ─────────────────────────────────
class SkillExample(BaseModel):
    """A teacher-created or teacher-approved document stored as a few-shot example."""
    model_config = ConfigDict(from_attributes=True)

    example_id: str | None = None
    skill_name: str
    teacher_id: str
    params: dict[str, Any] = Field(default_factory=dict)
    content: str  # the full document text
    quality_score: float = 0.0  # 0.0 → 1.0, driven by feedback
    help_count: int = 0
    created_at: str | None = None


class SkillFeedbackRequest(BaseModel):
    example_id: str
    helpful: bool = True  # True=👍, False=👎


class SkillFeedbackResponse(BaseModel):
    example_id: str
    help_count: int
    quality_score: float


class SkillListResponse(BaseModel):
    skills: list[SkillDef]


# ── Document upload / parsing ───────────────────────────────
class ParseUploadResponse(BaseModel):
    """Result of parsing an uploaded document."""
    filename: str
    file_type: str  # hwpx, pptx, hwp
    title: str | None = None
    sections_count: int = 0
    text_preview: str = ""  # first 500 chars
    example_id: str | None = None  # populated if auto-saved to Neo4j


class UploadToSkillRequest(BaseModel):
    """Convert a parsed document into a SkillExample."""
    skill_name: str
    teacher_id: str
    params: dict[str, str] = Field(default_factory=dict)
    # The parsed content to store (from parse response)
    content: str


# ── Self-learning stats / dashboard ─────────────────────────
class SkillStats(BaseModel):
    """Per-skill statistics for a teacher."""
    skill_name: str
    display_name: str
    total_examples: int
    own_examples: int
    avg_quality_score: float
    total_help_count: int


class TeacherStatsResponse(BaseModel):
    """Dashboard stats for self-learning overview."""
    teacher_id: str
    total_examples: int
    total_skills: int
    by_skill: list[SkillStats]
