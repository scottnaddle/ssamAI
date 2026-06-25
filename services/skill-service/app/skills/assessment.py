"""Assessment item (평가문항) skill — prompt builders and validators."""

from __future__ import annotations

from typing import Any


def build_assessment_system_prompt(
    params: dict[str, Any],
    examples: list[dict[str, Any]],
) -> str:
    base = (
        "너는 대한민국 초·중·고등학교 교사를 위한 평가문항 출제 전문가야. "
        "교육과정 성취기준에 부합하는 양질의 평가 문항을 설계해.\n\n"
        "## 작성 원칙\n"
        "- 모든 내용은 한국어로 작성한다.\n"
        "- 교육과정 성취기준과 학습목표에 부합하는 문항을 출제한다.\n"
        "- 학교급과 학년에 적합한 난이도와 어휘를 사용한다.\n"
        "- 선택형(객관식) 문항은 5지선다형을 기본으로 한다.\n"
        "- 서술형/논술형 문항은 채점 기준표를 반드시 포함한다.\n"
        "- 문항 난이도 비율: 하 30%, 중 50%, 상 20% (요청 시 조정 가능).\n"
        "- 각 문항은 단원의 핵심 개념과 사고력을 평가할 수 있어야 한다.\n"
        "- 정답과 해설을 반드시 별도 섹션에 포함한다.\n\n"
        "## 출력 형식\n"
        "다음 마크다운 형식을 정확히 따라 작성한다:\n\n"
        "```\n"
        "# [단원명] 평가문항\n\n"
        "## 1. 평가 개요\n\n"
        "| 항목 | 내용 |\n"
        "|------|------|\n"
        "| 대상 | [학교급] [학년] |\n"
        "| 과목 | [과목명] |\n"
        "| 단원 | [단원명] |\n"
        "| 문항 유형 | [객관식/서술형/혼합] |\n"
        "| 총 문항 수 | [N]문항 |\n"
        "| 총 배점 | [N]점 |\n\n"
        "## 2. 평가목표 및 성취기준\n\n"
        "| 평가목표 | 관련 성취기준 | 반영 문항 |\n"
        "|---------|-------------|----------|\n"
        "| [목표1] | [성취기준 코드 및 내용] | 1~3번 |\n"
        "| [목표2] | [성취기준 코드 및 내용] | 4~5번 |\n\n"
        "## 3. 문항\n\n"
        "### [객관식 문항은 이 양식을 따른다]\n"
        "**N번.** [문항 내용 (난이도: 하/중/상)]\n"
        "① [선택지1]\n"
        "② [선택지2]\n"
        "③ [선택지3]\n"
        "④ [선택지4]\n"
        "⑤ [선택지5]\n\n"
        "### [서술형 문항은 이 양식을 따른다]\n"
        "**N번.** [문항 내용 (난이도: 하/중/상, 배점: N점)]\n\n"
        "| 평가 요소 | 배점 | 부분 점수 기준 |\n"
        "|----------|------|-------------|\n"
        "| [요소1] | [N]점 | [기준] |\n"
        "| [요소2] | [N]점 | [기준] |\n\n"
        "## 4. 정답 및 해설\n\n"
        "| 문항 | 정답 | 해설 |\n"
        "|------|------|------|\n"
        "| 1 | [정답] | [해설] |\n"
        "| 2 | [정답] | [해설] |\n\n"
        "## 5. 이원목적분류표 (요약)\n\n"
        "| 문항 | 내용영역 | 행동영역 | 난이도 | 배점 | 문항 유형 |\n"
        "|------|---------|---------|--------|------|----------|\n"
        "| 1 | [영역] | [지식/이해/적용/분석/종합/평가] | 하 | [N] | 객관식 |\n"
        "```\n"
    )

    if examples:
        examples_text = "\n\n## 참고: 동일 유형의 우수 평가문항 예시\n\n"
        for i, ex in enumerate(examples, 1):
            examples_text += (
                f"### 예시 {i}\n{ex['content']}\n\n---\n\n"
            )
        examples_text += (
            "위 예시들의 구성, 난이도 배분, 평가 기준의 상세함을 참고하되, "
            "내용은 현재 주어진 주제에 맞게 새로 작성하라.\n"
        )
        return base + examples_text

    return base


def build_assessment_user_prompt(params: dict[str, Any]) -> str:
    lines = [
        "다음 조건에 맞는 평가문항을 출제해줘.\n",
        f"- 학교급: {params.get('school_level', '초등')}",
        f"- 학년: {params.get('grade', '')}",
        f"- 과목: {params.get('subject', '')}",
        f"- 단원명: {params.get('unit', '')}",
        f"- 문항 유형: {params.get('question_type', '혼합')}",
        f"- 문항 수: {params.get('question_count', '10')}문항",
    ]
    if params.get("difficulty_hint") and params.get("difficulty_hint") != "기본 비율 (하30/중50/상20)":
        lines.append(f"- 난이도 배분: {params['difficulty_hint']}")
    if params.get("focus_areas"):
        lines.append(f"- 중점 평가 영역: {params['focus_areas']}")
    if params.get("extra_notes"):
        lines.append(f"- 추가 요청사항: {params['extra_notes']}")
    lines.append("\n위 조건에 맞춰 평가문항을 출제해줘.")
    return "\n".join(lines)


def validate_assessment_params(params: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    required = ["school_level", "grade", "subject", "unit", "question_count"]
    for key in required:
        if not params.get(key):
            errors.append(f"{key}은(는) 필수 항목입니다.")
    return errors


# AUTO-PATTERNS-START (do not edit manually — overwritten by ssamAI auto-merge)
# AUTO-PATTERNS-END
