"""FastAPI entrypoint for persona-service."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.models import (
    HealthResponse,
    PersonaUpsertRequest,
    RecallResponse,
    TeacherPersona,
)
from app.repository import close_driver, get_persona, search_related_facts, upsert_persona


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    yield
    await close_driver()


app = FastAPI(
    title="ssamAI Persona Service",
    version=__version__,
    description="교원 페르소나 장기 메모리 (Graphiti + Neo4j)",
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
    return HealthResponse(status="ok", service="persona-service", version=__version__)


@app.get("/persona/{teacher_id}", response_model=TeacherPersona, response_model_by_alias=True)
async def get(teacher_id: str) -> TeacherPersona:
    persona = await get_persona(teacher_id)
    if persona is None:
        raise HTTPException(status_code=404, detail="페르소나를 찾을 수 없습니다")
    return persona


@app.post("/persona", response_model=TeacherPersona, response_model_by_alias=True)
async def upsert(req: PersonaUpsertRequest) -> TeacherPersona:
    persona = TeacherPersona(
        teacher_id=req.teacher_id,
        name=req.name,
        school_level=req.school_level,
        subject=req.subject,
        school=req.school,
        teaching_style=req.teaching_style,
        philosophy=req.philosophy,
        current_class=req.current_class,
    )
    return await upsert_persona(persona)


@app.get("/persona/{teacher_id}/related", response_model=RecallResponse)
async def related(
    teacher_id: str,
    query: str = Query(..., min_length=1, max_length=500),
    limit: int = Query(5, ge=1, le=50),
) -> RecallResponse:
    result = await search_related_facts(teacher_id, query, limit=limit)
    return RecallResponse(**result)
