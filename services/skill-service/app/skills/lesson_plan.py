"""Skill-specific prompt builders.

Each skill implements:
  build_system_prompt(params, examples) -> str
  build_user_prompt(params) -> str
  validate_params(params) -> list[str]  # list of validation errors (empty = ok)
"""

from __future__ import annotations

from typing import Any


def build_lesson_plan_system_prompt(
    params: dict[str, Any],
    examples: list[dict[str, Any]],
) -> str:
    """Construct the system prompt for lesson plan generation with few-shot examples."""
    base = (
        "너는 대한민국 교사를 위한 수업지도안 작성 전문가야. "
        "교육과정 성취기준에 맞춰 체계적인 차시별 교수학습과정안을 작성해.\n\n"
        "## 작성 원칙\n"
        "- 모든 내용은 한국어로 작성한다.\n"
        "- 학습목표는 구체적이고 측정 가능한 행동 동사(설명할 수 있다, 분류할 수 있다 등)로 진술한다.\n"
        "- 도입(5~10분), 전개(25~30분), 정리(5~10분)의 3단계 구조를 따른다.\n"
        "- 전개 단계는 교사 활동과 학생 활동을 구분하여 작성한다.\n"
        "- 평가계획은 학습목표와 일관되어야 하며, 구체적인 평가 방법을 명시한다.\n"
        "- 학생 수준을 고려한 개별화 지도 방안을 포함한다.\n"
        "- 준비물 목록을 빠짐없이 기재한다.\n\n"
        "## 출력 형식\n"
        "다음 마크다운 형식을 정확히 따라 작성한다:\n\n"
        "```\n"
        "# [단원명] - [차시]차시 수업지도안\n\n"
        "## 1. 수업 개요\n"
        "| 항목 | 내용 |\n"
        "|------|------|\n"
        "| 대상 | [학교급] [학년] |\n"
        "| 과목 | [과목명] |\n"
        "| 단원 | [단원명] |\n"
        "| 차시 | [차시번호] |\n"
        "| 수업 스타일 | [스타일] |\n\n"
        "## 2. 학습목표\n"
        "1. [목표 1]\n"
        "2. [목표 2]\n"
        "3. [목표 3]\n\n"
        "## 3. 준비물\n"
        "- 교사: [준비물 목록]\n"
        "- 학생: [준비물 목록]\n\n"
        "## 4. 수업 흐름\n\n"
        "### 4.1 도입 ([N]분)\n"
        "- 동기유발: [내용]\n"
        "- 학습목표 제시: [내용]\n"
        "- 전시학습 확인: [내용]\n\n"
        "### 4.2 전개 ([N]분)\n"
        "| 단계 | 교사 활동 | 학생 활동 | 시간 | 자료 및 유의점 |\n"
        "|------|-----------|-----------|------|---------------|\n"
        "| 활동1 | ... | ... | N분 | ... |\n"
        "| 활동2 | ... | ... | N분 | ... |\n"
        "| 활동3 | ... | ... | N분 | ... |\n\n"
        "### 4.3 정리 ([N]분)\n"
        "- 학습내용 정리: [내용]\n"
        "- 차시 예고: [내용]\n"
        "- 과제 제시: [내용]\n\n"
        "## 5. 평가계획\n"
        "| 평가 항목 | 평가 방법 | 평가 시기 |\n"
        "|-----------|-----------|----------|\n"
        "| ... | ... | ... |\n\n"
        "## 6. 개별화 지도 방안\n"
        "- 보충 지도: [내용]\n"
        "- 심화 지도: [내용]\n"
        "```\n"
    )

    if examples:
        examples_text = "\n\n## 참고: 동일 유형의 우수 수업지도안 예시\n\n"
        for i, ex in enumerate(examples, 1):
            examples_text += (
                f"### 예시 {i}\n{ex['content']}\n\n"
                "---\n\n"
            )
        examples_text += (
            "위 예시들의 구성, 어조, 상세함 수준을 참고하되, "
            "내용은 현재 주어진 주제에 맞게 새로 작성하라.\n"
        )
        return base + examples_text

    return base


def build_lesson_plan_user_prompt(params: dict[str, Any]) -> str:
    """Build the user prompt for lesson plan generation."""
    lines = [
        "다음 조건에 맞는 수업지도안을 작성해줘.\n",
        f"- 학교급: {params.get('school_level', '초등')}",
        f"- 학년: {params.get('grade', '')}",
        f"- 과목: {params.get('subject', '')}",
        f"- 단원명: {params.get('unit', '')}",
        f"- 차시: {params.get('lesson_number', '')}",
    ]
    if params.get("learning_objectives"):
        lines.append(f"- 학습목표: {params['learning_objectives']}")
    style = params.get("style_hint", "")
    if style and style != "특별히 없음":
        lines.append(f"- 수업 스타일: {style}")
    if params.get("extra_notes"):
        lines.append(f"- 추가 요청: {params['extra_notes']}")
    lines.append("\n위 조건에 맞춰 수업지도안을 작성해줘.")
    return "\n".join(lines)


def validate_lesson_plan_params(params: dict[str, Any]) -> list[str]:
    """Validate lesson plan parameters. Returns list of error messages."""
    errors: list[str] = []
    required = ["school_level", "grade", "subject", "unit", "lesson_number"]
    for key in required:
        if not params.get(key):
            errors.append(f"{key}은(는) 필수 항목입니다.")
    return errors


# AUTO-PATTERNS-START (do not edit manually — overwritten by ssamAI auto-merge)
# AUTO-PATTERNS-END
