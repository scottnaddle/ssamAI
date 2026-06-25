"""Thin LiteLLM client — calls the OpenAI-compatible endpoint."""

from __future__ import annotations

import json
import re
from typing import Any

import httpx

from app.config import settings

_CODE_FENCE_RE = re.compile(r"^```(?:json)?\s*\n(.*?)\n```\s*$", re.DOTALL)


def _extract_json(content: str) -> Any:
    """LLMs occasionally wrap JSON in markdown fences — strip them before parsing."""
    fenced = _CODE_FENCE_RE.match(content.strip())
    if fenced:
        content = fenced.group(1)
    return json.loads(content)


async def generate_ppt_outline(
    topic: str,
    school_level: str,
    subject: str,
    grade: str | None,
    slide_count: int,
    style_hint: str | None,
) -> list[dict]:
    system = (
        "너는 한국 교육용 PPT를 설계하는 전문가야. "
        "각 슬라이드는 명확한 제목과 3~5개의 핵목을 가져야 해. "
        "학생 친화적 언어, 교육과정에 맞는 내용, 한국어로 답해."
    )
    user_msg = (
        f"주제: {topic}\n"
        f"학교급: {school_level}\n"
        f"과목: {subject}\n"
        f"학년: {grade or '명시 안 됨'}\n"
        f"슬라이드 수: {slide_count}장\n"
        f"스타일 힌트: {style_hint or '기본'}\n\n"
        f'JSON 객체만 반환해. 형식: {{"slides": [{{"title": str, "bullets": [str, ...]}}]}}'
    )

    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.post(
            f"{settings.litellm_base_url}/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.litellm_api_key}"},
            json={
                "model": settings.outline_model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user_msg},
                ],
                "temperature": 0.7,
                "response_format": {"type": "json_object"},
            },
        )
        res.raise_for_status()
        data = res.json()

    content = data["choices"][0]["message"]["content"]
    parsed = _extract_json(content)
    if isinstance(parsed, dict) and "slides" in parsed:
        slides = parsed["slides"]
        if isinstance(slides, list):
            return slides
    if isinstance(parsed, list):
        return parsed
    raise ValueError(f"Unexpected LLM response shape: {type(parsed)}")
