"""Parent letter (가정통신문) skill — prompt builders and validators."""

from __future__ import annotations

from typing import Any


def build_parent_letter_system_prompt(
    params: dict[str, Any],
    examples: list[dict[str, Any]],
) -> str:
    base = (
        "너는 대한민국 초·중·고등학교 교사를 위한 가정통신문 작성 전문가야. "
        "학교에서 학부모님께 발송하는 공식 안내문을 작성해.\n\n"
        "## 작성 원칙\n"
        "- 모든 내용은 한국어로 작성한다.\n"
        "- 학부모님을 존칭('학부모님', '~하십시오', '~바랍니다')으로 표현한다.\n"
        "- 간결하고 정중한 어조를 유지한다.\n"
        "- 날짜, 시간, 장소, 준비물 등 필수 정보를 빠짐없이 기재한다.\n"
        "- 학년과 학교급에 맞는 용어와 수준을 사용한다.\n"
        "- 학교 로고/연락처 자리는 [학교명] [담당자] [연락처] 플레이스홀더로 표시한다.\n\n"
        "## 출력 형식\n"
        "다음 마크다운 형식을 정확히 따라 작성한다:\n\n"
        "```\n"
        "# [제목]\n\n"
        "안녕하십니까? [학교명] [담당자]입니다.\n\n"
        "## 1. 안내 배경\n\n"
        "[안내 배경 및 목적을 2~3문장으로 작성]\n\n"
        "## 2. 행사/일정 상세\n\n"
        "| 항목 | 내용 |\n"
        "|------|------|\n"
        "| 일시 | [YYYY년 M월 D일 (요일) HH:MM~HH:MM] |\n"
        "| 장소 | [장소] |\n"
        "| 대상 | [대상] |\n"
        "| 준비물 | [준비물] |\n\n"
        "## 3. 세부 내용\n\n"
        "- [세부 사항 1]\n"
        "- [세부 사항 2]\n"
        "- [세부 사항 3]\n\n"
        "## 4. 신청/참여 방법\n\n"
        "[참가 신청 방법, 기한, 제출 서류 등]\n\n"
        "## 5. 유의사항 및 당부 말씀\n\n"
        "- [유의사항 1]\n"
        "- [유의사항 2]\n\n"
        "## 6. 문의처\n\n"
        "- 담당자: [담당교사 이름]\n"
        "- 연락처: [학교 교무실 연락처]\n"
        "- 이메일: [교사 이메일]\n\n"
        "감사합니다.\n\n"
        "[YYYY년 M월 D일]\n"
        "[학교명]장 [교장 이름] 배상\n"
        "```\n"
    )

    if examples:
        examples_text = "\n\n## 참고: 동일 유형의 우수 가정통신문 예시\n\n"
        for i, ex in enumerate(examples, 1):
            examples_text += (
                f"### 예시 {i}\n{ex['content']}\n\n---\n\n"
            )
        examples_text += (
            "위 예시들의 구성, 어조, 상세함 수준을 참고하되, "
            "내용은 현재 주어진 주제에 맞게 새로 작성하라.\n"
        )
        return base + examples_text

    return base


def build_parent_letter_user_prompt(params: dict[str, Any]) -> str:
    lines = [
        "다음 조건에 맞는 가정통신문을 작성해줘.\n",
        f"- 학교급: {params.get('school_level', '초등')}",
        f"- 학년: {params.get('grade', '')}",
        f"- 통신문 유형: {params.get('letter_type', '')}",
        f"- 제목: {params.get('title', '')}",
    ]
    if params.get("event_date"):
        lines.append(f"- 일시: {params['event_date']}")
    if params.get("location"):
        lines.append(f"- 장소: {params['location']}")
    if params.get("recipient"):
        lines.append(f"- 대상: {params['recipient']}")
    if params.get("extra_notes"):
        lines.append(f"- 추가 요청사항: {params['extra_notes']}")
    lines.append("\n위 조건에 맞춰 가정통신문을 작성해줘.")
    return "\n".join(lines)


def validate_parent_letter_params(params: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    required = ["school_level", "grade", "letter_type", "title"]
    for key in required:
        if not params.get(key):
            errors.append(f"{key}은(는) 필수 항목입니다.")
    return errors


# AUTO-PATTERNS-START (do not edit manually — overwritten by ssamAI auto-merge)
# ## 동의서 패턴 추가: 학부모 확인
#
# > home-letter 생성 시 동의란 자동 포함
#
#
# AUTO-PATTERNS-END
