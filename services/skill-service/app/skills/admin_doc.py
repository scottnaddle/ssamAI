"""Administrative document (행정문서) skill — prompt builders and validators."""

from __future__ import annotations

from typing import Any


def build_admin_doc_system_prompt(
    params: dict[str, Any],
    examples: list[dict[str, Any]],
) -> str:
    base = (
        "너는 대한민국 초·중·고등학교 교사를 위한 행정문서 작성 전문가야. "
        "학교 업무에 필요한 각종 행정 문서, 보고서, 계획서, 결과보고서를 작성해.\n\n"
        "## 작성 원칙\n"
        "- 모든 내용은 한국어로 작성한다.\n"
        "- 공문서 격식에 맞춰 간결하고 명확하게 작성한다.\n"
        "- 목적, 추진 배경, 세부 내용, 기대 효과의 구조를 갖춘다.\n"
        "- 수치, 일정, 예산 등 구체적인 정보는 표로 정리한다.\n"
        "- 학교급과 문서 유형에 맞는 적절한 행정 용어를 사용한다.\n"
        "- 개인정보, 구체적인 인명 등은 [담당자], [학교명] 등으로 표시한다.\n\n"
        "## 출력 형식\n"
        "다음 마크다운 형식을 정확히 따라 작성한다:\n\n"
        "```\n"
        "# [문서 제목]\n\n"
        "## 1. 추진 배경 및 목적\n\n"
        "### 1.1 추진 배경\n"
        "- [배경 1]\n"
        "- [배경 2]\n\n"
        "### 1.2 목적\n"
        "[1~2문장으로 명확한 목적 기술]\n\n"
        "## 2. 추진 개요\n\n"
        "| 구분 | 내용 |\n"
        "|------|------|\n"
        "| 기간 | [YYYY.M.D ~ YYYY.M.D] |\n"
        "| 대상 | [대상] |\n"
        "| 장소 | [장소] |\n"
        "| 예산 | [예산 (원)] |\n"
        "| 담당 | [담당 부서/교사] |\n\n"
        "## 3. 세부 추진 계획\n\n"
        "| 순서 | 일시 | 활동 내용 | 담당 | 비고 |\n"
        "|------|------|----------|------|------|\n"
        "| 1 | [일시] | [내용] | [담당] | [비고] |\n"
        "| 2 | [일시] | [내용] | [담당] | [비고] |\n\n"
        "## 4. 세부 내용\n\n"
        "### 4.1 [세부 항목 1]\n"
        "[상세 내용]\n\n"
        "### 4.2 [세부 항목 2]\n"
        "[상세 내용]\n\n"
        "## 5. 소요 예산\n\n"
        "| 항목 | 산출 근거 | 금액 (원) | 비고 |\n"
        "|------|----------|----------|------|\n"
        "| [항목] | [산출근거] | [금액] | [비고] |\n"
        "| 합계 | | [총액] | |\n\n"
        "## 6. 기대 효과\n\n"
        "- [기대 효과 1]\n"
        "- [기대 효과 2]\n"
        "- [기대 효과 3]\n\n"
        "## 7. 향후 추진 일정\n\n"
        "| 일정 | 추진 내용 | 비고 |\n"
        "|------|----------|------|\n"
        "| [YYYY.M] | [내용] | |\n"
        "| [YYYY.M] | [내용] | |\n\n"
        "## 8. 참고자료\n\n"
        "- [참고자료 목록]\n"
        "```\n"
    )

    if examples:
        examples_text = "\n\n## 참고: 동일 유형의 우수 행정문서 예시\n\n"
        for i, ex in enumerate(examples, 1):
            examples_text += (
                f"### 예시 {i}\n{ex['content']}\n\n---\n\n"
            )
        examples_text += (
            "위 예시들의 구성, 어조, 형식의 완성도를 참고하되, "
            "내용은 현재 주어진 주제에 맞게 새로 작성하라.\n"
        )
        return base + examples_text

    return base


def build_admin_doc_user_prompt(params: dict[str, Any]) -> str:
    lines = [
        "다음 조건에 맞는 행정문서를 작성해줘.\n",
        f"- 학교급: {params.get('school_level', '초등')}",
        f"- 문서 유형: {params.get('doc_type', '')}",
        f"- 제목: {params.get('title', '')}",
    ]
    if params.get("start_date"):
        lines.append(f"- 기간: {params['start_date']}")
    if params.get("target_audience"):
        lines.append(f"- 대상: {params['target_audience']}")
    if params.get("budget_hint"):
        lines.append(f"- 예산: {params['budget_hint']}")
    if params.get("extra_notes"):
        lines.append(f"- 추가 요청사항: {params['extra_notes']}")
    lines.append("\n위 조건에 맞춰 행정문서를 작성해줘.")
    return "\n".join(lines)


def validate_admin_doc_params(params: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    required = ["school_level", "doc_type", "title"]
    for key in required:
        if not params.get(key):
            errors.append(f"{key}은(는) 필수 항목입니다.")
    return errors


# AUTO-PATTERNS-START (do not edit manually — overwritten by ssamAI auto-merge)
# AUTO-PATTERNS-END
