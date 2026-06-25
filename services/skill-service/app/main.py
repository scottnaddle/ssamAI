"""FastAPI entrypoint for skill-service."""

from __future__ import annotations

import json
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncIterator, Any

import httpx
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.config import settings
from app.document_parser import parse_document
from app.models import (
    HealthResponse,
    ParseUploadResponse,
    SkillExample,
    SkillFeedbackRequest,
    SkillFeedbackResponse,
    SkillGenerateRequest,
    SkillGenerateResponse,
    SkillListResponse,
    TeacherStatsResponse,
)
from app.repository import close_driver, get_examples, get_teacher_stats, record_feedback, save_example
from app.skill_registry import SKILLS
from app.skills.lesson_plan import (
    build_lesson_plan_system_prompt,
    build_lesson_plan_user_prompt,
    validate_lesson_plan_params,
)
from app.skills.parent_letter import (
    build_parent_letter_system_prompt,
    build_parent_letter_user_prompt,
    validate_parent_letter_params,
)
from app.skills.assessment import (
    build_assessment_system_prompt,
    build_assessment_user_prompt,
    validate_assessment_params,
)
from app.skills.admin_doc import (
    build_admin_doc_system_prompt,
    build_admin_doc_user_prompt,
    validate_admin_doc_params,
)

# Map skill names to their prompt builders and validators.
_SKILL_IMPLS: dict[str, Any] = {
    "lesson-plan": {
        "system": build_lesson_plan_system_prompt,
        "user": build_lesson_plan_user_prompt,
        "validate": validate_lesson_plan_params,
    },
    "parent-letter": {
        "system": build_parent_letter_system_prompt,
        "user": build_parent_letter_user_prompt,
        "validate": validate_parent_letter_params,
    },
    "assessment": {
        "system": build_assessment_system_prompt,
        "user": build_assessment_user_prompt,
        "validate": validate_assessment_params,
    },
    "admin-doc": {
        "system": build_admin_doc_system_prompt,
        "user": build_admin_doc_user_prompt,
        "validate": validate_admin_doc_params,
    },
}


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    yield
    await close_driver()


app = FastAPI(
    title="ssamAI Skill Service",
    version=__version__,
    description="교사 문서 생성 스킬 마이크로서비스 — Neo4j 예시 저장 + LiteLLM 생성",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", service="skill-service", version=__version__)


@app.get("/skills", response_model=SkillListResponse)
async def list_skills() -> SkillListResponse:
    """Return all registered skill definitions."""
    return SkillListResponse(skills=list(SKILLS.values()))


@app.post("/skills/generate", response_model=SkillGenerateResponse)
async def generate(req: SkillGenerateRequest) -> SkillGenerateResponse:
    """Generate a document using a registered skill."""
    skill_def = SKILLS.get(req.skill_name)
    if skill_def is None:
        raise HTTPException(status_code=404, detail=f"알 수 없는 스킬: {req.skill_name}")

    impl = _SKILL_IMPLS.get(req.skill_name)
    if impl is None:
        raise HTTPException(
            status_code=501, detail=f"스킬 구현이 아직 등록되지 않았습니다: {req.skill_name}"
        )

    # Validate parameters.
    errors = impl["validate"](req.params)
    if errors:
        raise HTTPException(status_code=422, detail="; ".join(errors))

    # Retrieve few-shot examples from Neo4j.
    try:
        examples_raw = await get_examples(
            skill_name=req.skill_name,
            teacher_id=req.teacher_id,
            params=req.params,
            limit=3,
        )
    except Exception:
        examples_raw = []  # Degrade gracefully if Neo4j is unreachable.

    example_dicts = [
        {"content": ex.content, "help_count": ex.help_count} for ex in examples_raw
    ]

    # Build prompts.
    system_prompt = impl["system"](req.params, example_dicts)
    user_prompt = impl["user"](req.params)

    # Call LiteLLM.
    model = req.model or settings.skill_model
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            res = await client.post(
                f"{settings.litellm_base_url}/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.litellm_api_key}"},
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": 0.7,
                    "max_tokens": 4096,
                },
            )
            res.raise_for_status()
            data = res.json()
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="LLM 요청 시간 초과")
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"LLM 호출 실패: {exc}")

    content = data["choices"][0]["message"]["content"]

    # Save as a skill example (best-effort — don't fail the request if this errors).
    example_count = len(examples_raw)
    try:
        example = SkillExample(
            skill_name=req.skill_name,
            teacher_id=req.teacher_id,
            params=req.params,
            content=content,
            quality_score=0.5,  # initial neutral score
            help_count=0,
        )
        await save_example(example)
        example_count += 1
    except Exception:
        pass

    return SkillGenerateResponse(
        skill_name=req.skill_name,
        content=content,
        model_used=model,
        params_used=req.params,
        example_count=example_count,
    )


@app.post("/skills/examples/feedback", response_model=SkillFeedbackResponse)
async def feedback(req: SkillFeedbackRequest) -> SkillFeedbackResponse:
    """Record 👍/👎 feedback on a generated example."""
    result = await record_feedback(req.example_id, req.helpful)
    if result is None:
        raise HTTPException(status_code=404, detail="예시를 찾을 수 없습니다")
    return SkillFeedbackResponse(
        example_id=result["example_id"],
        help_count=result["help_count"],
        quality_score=result["quality_score"],
    )


@app.post("/skills/upload/parse", response_model=ParseUploadResponse)
async def upload_and_parse(
    file: UploadFile = File(...),
    teacher_id: str = Form(...),
    skill_name: str = Form(default="lesson-plan"),
):
    """Upload a .hwpx/.pptx/.hwp file, parse its structure, and store as SkillExample."""
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="빈 파일입니다.")

    filename = file.filename or "unknown"
    ext = Path(filename).suffix.lower()
    if ext not in (".hwpx", ".pptx", ".hwp"):
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 형식: {ext}. .hwpx, .pptx, .hwp 파일을 업로드해주세요.",
        )

    # Parse the document.
    doc = parse_document(data, filename)

    # Store as SkillExample.
    example_id = None
    try:
        example = SkillExample(
            skill_name=skill_name,
            teacher_id=teacher_id,
            params={"source": "upload", "filename": filename},
            content=doc.full_text,
            quality_score=0.6,  # uploaded by teacher = higher initial trust
            help_count=1,
        )
        saved = await save_example(example)
        example_id = saved.example_id
    except Exception:
        pass  # best-effort storage

    return ParseUploadResponse(
        filename=filename,
        file_type=ext.lstrip("."),
        title=doc.title,
        sections_count=len(doc.sections),
        text_preview=doc.full_text[:500],
        example_id=example_id,
    )


@app.get("/skills/examples/{skill_name}")
async def list_examples(
    skill_name: str,
    teacher_id: str | None = None,
    limit: int = 10,
) -> list[SkillExample]:
    """List stored examples for a skill (for browsing/review)."""
    return await get_examples(
        skill_name=skill_name,
        teacher_id=teacher_id or None,
        limit=min(limit, 50),
    )


@app.get("/skills/stats/{teacher_id}", response_model=TeacherStatsResponse)
async def teacher_stats(teacher_id: str) -> TeacherStatsResponse:
    """Return self-learning dashboard stats for a teacher.

    Shows total examples, per-skill breakdown, and quality metrics
    so teachers can see their knowledge base growing over time.
    """
    try:
        data = await get_teacher_stats(teacher_id)
    except Exception:
        # Neo4j unavailable — return empty stats rather than 500.
        data = {
            "teacher_id": teacher_id,
            "total_examples": 0,
            "total_skills": 0,
            "by_skill": [],
        }

    # Enrich skill names with display_name from registry.
    for item in data["by_skill"]:
        skill_def = SKILLS.get(item["skill_name"])
        item["display_name"] = skill_def.display_name if skill_def else item["skill_name"]

    return TeacherStatsResponse(**data)
