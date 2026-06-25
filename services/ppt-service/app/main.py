"""FastAPI entrypoint for ppt-service."""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.llm_client import generate_ppt_outline
from app.models import CreatePptRequest, CreatePptResponse, HealthResponse, PptOutline
from app.pptx_service import build_pptx, parse_pptx_bytes, save_pptx

app = FastAPI(
    title="ssamAI PPT Service",
    version=__version__,
    description=".pptx 파싱/생성 마이크로서비스 (python-pptx 기반)",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Phase 1: permissive — tighten before production.
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

OUTPUT_DIR = Path("/tmp/ssamAI-ppt-output")


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", service="ppt-service", version=__version__)


@app.post("/ppt/parse", response_model=PptOutline, response_model_by_alias=True)
async def parse_ppt(file: UploadFile = File(...)) -> PptOutline:
    """Extract structural outline from an uploaded .pptx file."""
    if not (file.filename or "").lower().endswith((".pptx",)):
        raise HTTPException(status_code=400, detail="Only .pptx files are supported in Phase 1.")
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    try:
        return parse_pptx_bytes(data, file.filename or "upload.pptx")
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"파싱 실패: {exc}") from exc


@app.post("/ppt/create", response_model=CreatePptResponse, response_model_by_alias=True)
async def create_ppt(req: CreatePptRequest) -> CreatePptResponse:
    """Generate a new .pptx file via LLM outline + python-pptx build."""
    slides = await generate_ppt_outline(
        topic=req.topic,
        school_level=req.school_level,
        subject=req.subject,
        grade=req.grade,
        slide_count=req.slide_count,
        style_hint=req.style_hint,
    )
    if len(slides) != req.slide_count:
        # Best-effort: pad or trim so the file matches the request.
        slides = slides[: req.slide_count] or [{"title": req.topic, "bullets": []}]

    pptx_bytes = build_pptx(slides, topic=req.topic)
    safe_topic = "".join(c if c.isalnum() or c in "-_" else "_" for c in req.topic)[:40]
    filename = f"{safe_topic}_{req.teacher_id}.pptx"
    path = save_pptx(pptx_bytes, OUTPUT_DIR, filename)

    outline = PptOutline(
        file_name=filename,
        slide_count=len(slides),
        slides=[
            {"index": i + 1, "title": s.get("title"), "text_preview": " / ".join(s.get("bullets", []))[:200] or None}
            for i, s in enumerate(slides)
        ],
    )
    return CreatePptResponse(ppt_url=f"/ppt/download/{filename}", outline=outline)


@app.get("/ppt/download/{filename}")
async def download_ppt(filename: str):
    """Serve a generated .pptx file. Phase 3 → replace with NCloud Object Storage."""
    path = OUTPUT_DIR / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다")
    return FileResponse(path, media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation", filename=filename)
