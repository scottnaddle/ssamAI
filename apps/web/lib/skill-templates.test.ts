import { describe, expect, it } from "vitest";
import {
  lessonPlanTemplate,
  assessmentTemplate,
  rubricTemplate,
  officialLetterTemplate,
  homeLetterTemplate,
  generateMarkdown,
} from "@/lib/skill-templates";

type SkillInput = Parameters<typeof generateMarkdown>[0];

// ─── 품질 기준 ──────────────────────────────────────────────────
// 1. 한국어 본문 필수 (ASCII only 금지)
// 2. 플레이스홀더 잔재 금지 ({{var}}, [여기에 입력], Here is...)
// 3. 필수 섹션 존재 (스킬별)
// 4. LLM 아티팩트 금지 (I cannot..., Sorry..., truncation)
// 5. 합리적 길이 (200B 이상, 50KB 미만)

const QUALITY_CHECKS = {
  hasKorean: (s: string) => /[\uAC00-\uD7AF]/.test(s),
  noPlaceholders: (s: string) =>
    !/\{\{[^}]+\}\}/.test(s) &&
    !/\[여기에[^]]*\]/.test(s) &&
    !/Here is the/i.test(s) &&
    !/Lorem ipsum/i.test(s),
  noLlmArtifacts: (s: string) =>
    !/I (cannot|can't|will not)/i.test(s) &&
    !/I'm sorry/i.test(s) &&
    !/as an AI/i.test(s),
  reasonableLength: (s: string) => s.length >= 200 && s.length < 50000,
};

function validateQuality(name: string, md: string): void {
  expect(QUALITY_CHECKS.hasKorean(md), `${name}: 한국어 본문 없음`).toBe(true);
  expect(QUALITY_CHECKS.noPlaceholders(md), `${name}: 플레이스홀더 잔재`).toBe(true);
  expect(QUALITY_CHECKS.noLlmArtifacts(md), `${name}: LLM 아티팩트`).toBe(true);
  expect(QUALITY_CHECKS.reasonableLength(md), `${name}: 길이 ${md.length}B 비정상`).toBe(true);
}

// ─── 1. 수업 과정안 (lesson-plan) ──────────────────────────────
describe("lessonPlanTemplate 품질", () => {
  const validInput: SkillInput = {
    skillName: "lesson-plan",
    input: {
      교과명: "과학",
      학년: "초등 5학년",
      학기: "1학기",
      단원명: "식물의 세계",
      차시: 2,
      전체차시: 5,
      쪽수: "과학 14~15쪽",
      학습주제: "광합성이란?",
      활동유형: ["관찰", "실험"],
      학습환경: ["교실"],
      준비물: "교과서, 실험도구",
      학습목표: ["광합성 정의를 설명할 수 있다", "식물의 구조를 관찰할 수 있다"],
      도입활동: "생각 열기: 식물은 어떻게 자라날까?",
      전개활동: "광합성 개념 학습 + 콩나물 관찰 실험",
      정리활동: "결과 정리 + 형성평가",
    },
  };

  it("필수 섹션 모두 포함: 학습목표/도입/전개/정리", () => {
    const md = lessonPlanTemplate(validInput.input as never);
    expect(md).toContain("학습목표");
    expect(md).toContain("도입");
    expect(md).toContain("전개");
    expect(md).toContain("정리");
    expect(md).toContain("광합성");
  });

  it("제목에 과목/학년/차시 메타데이터 포함", () => {
    const md = lessonPlanTemplate(validInput.input as never);
    expect(md).toContain("과학");
    expect(md).toContain("5학년");
    expect(md).toContain("2");
    expect(md).toContain("5"); // 전체차시
  });

  it("품질 기준 통과", () => {
    const md = lessonPlanTemplate(validInput.input as never);
    validateQuality("lesson-plan", md);
  });
});

// ─── 2. 형성평가 (formative-assessment) ──────────────────────
describe("assessmentTemplate 품질", () => {
  const validInput: SkillInput = {
    skillName: "formative-assessment",
    input: {
      교과명: "과학",
      학년: "초등 5학년",
      단원명: "식물의 세계",
      차시: 2,
      전체차시: 5,
      문항수: 10,
      선택형: 6,
      단답형: 2,
      서술형: 2,
      난이도_하: 3,
      난이도_중: 4,
      난이도_상: 3,
      주제: "광합성",
    },
  };

  it("정답표 섹션 존재", () => {
    const md = assessmentTemplate(validInput.input as never);
    expect(md).toMatch(/정답|답안/);
  });

  it("문항 수 반영 (선택형/단답형/서술형)", () => {
    const md = assessmentTemplate(validInput.input as never);
    expect(md).toContain("선택형");
    expect(md).toContain("단답형");
    expect(md).toContain("서술형");
    expect(md).toContain("10");
  });

  it("품질 기준 통과", () => {
    const md = assessmentTemplate(validInput.input as never);
    validateQuality("formative-assessment", md);
  });
});

// ─── 3. 수행평가 루브릭 (rubric) ───────────────────────────
describe("rubricTemplate 품질", () => {
  const validInput: SkillInput = {
    skillName: "rubric",
    input: {
      교과명: "국어",
      학년: "중등 2학년",
      단원명: "의견과 주장",
      평가명: "건의문 작성",
      평가방식: "프로젝트",
      평가일시: "2026-06-25",
      척도단계: 4,
      요소들: [
        { 이름: "문제 상황 정리", 상기술: "명확+피해사례 구체", 중기술: "정리했으나 사례 부족", 하기술: "간명하게 못함" },
        { 이름: "의견 명료성", 상기술: "논리적+근거 충분", 중기술: "근거 부족", 하기술: "주장 불명확" },
      ],
    },
  };

  it("루브릭 요소 + 척도 단계 표시", () => {
    const md = rubricTemplate(validInput.input as never);
    expect(md).toContain("문제 상황 정리");
    expect(md).toContain("의견 명료성");
    expect(md).toMatch(/4\s*단계|상|중|하/);
  });

  it("평가명/평가방식 메타데이터 포함", () => {
    const md = rubricTemplate(validInput.input as never);
    expect(md).toContain("건의문 작성");
    expect(md).toContain("프로젝트");
  });

  it("품질 기준 통과", () => {
    const md = rubricTemplate(validInput.input as never);
    validateQuality("rubric", md);
  });
});

// ─── 4. 행정공문 (official-letter) ─────────────────────────
describe("officialLetterTemplate 품질", () => {
  const validInput: SkillInput = {
    skillName: "official-letter",
    input: {
      문서종류: "공문",
      제목: "2026학년도 연수 보고서",
      수신: "서울시교육청 교육과",
      발신기관: "서울OO중등학교",
      문서번호: "서울OO중-2026-237",
      담당자: "교감 김OO",
      본문항목들: ["1. 사업 개요", "2. 추진 일정", "3. 협조 요청"],
    },
  };

  it("공문 헤더 + 발신/수신/제목 메타데이터", () => {
    const md = officialLetterTemplate(validInput.input as never);
    expect(md).toContain("2026학년도 연수 보고서");
    expect(md).toContain("서울OO중등학교");
    expect(md).toContain("서울시교육청");
  });

  it("공식 문서 양식 (문서번호/담당자)", () => {
    const md = officialLetterTemplate(validInput.input as never);
    expect(md).toContain("서울OO중-2026-237");
    expect(md).toContain("교감 김OO");
  });

  it("품질 기준 통과", () => {
    const md = officialLetterTemplate(validInput.input as never);
    validateQuality("official-letter", md);
  });
});

// ─── 5. 가정통신문 (home-letter) — 가장 중요 (학부모) ─────
describe("homeLetterTemplate 품질", () => {
  const validInput: SkillInput = {
    skillName: "home-letter",
    input: {
      문서종류: "현장학습",
      행사명: "4학년 현장학습",
      행사일시: "2026. 6. 25.(수) (당일)",
      행사장소: "국립중앙박물관",
      행사대상: "4학년 전체 학생 (87명)",
      참가비용: "학생 1인당 일금 이만원정 (￦20,000)",
      준비물: "도시락, 음료, 필기구, 돋보기",
      복장: "교복 또는 단정한 운동복",
      주의사항: ["박물관 내 음식물 반입 금지", "분실물 방지 가방 매기"],
      담당자: "4학년 학년主任 김OO",
      연락처: "02-XXX-XXXX",
      동의서필요: true,
      동의서제출기한: "2026. 6. 24.(수)",
    },
  };

  it("학부모 존칭 사용 (학부모님/댁내/평안/감사)", () => {
    const md = homeLetterTemplate(validInput.input as never);
    const hasHonorific =
      /학부모님|댁내|평안|감사드립니다|드립니다/.test(md);
    expect(hasHonorific, "학부모 존칭 없음").toBe(true);
  });

  it("필수 행사 정보: 일시/장소/대상/비용/준비물/복장/주의사항", () => {
    const md = homeLetterTemplate(validInput.input as never);
    expect(md).toContain("2026. 6. 25");
    expect(md).toContain("국립중앙박물관");
    expect(md).toContain("4학년");
    expect(md).toContain("이만원");
    expect(md).toContain("도시락");
    expect(md).toContain("교복");
    expect(md).toContain("음식물");
  });

  it("동의서 섹션 (consent_needed=true일 때)", () => {
    const md = homeLetterTemplate(validInput.input as never);
    expect(md).toMatch(/동의|서명|보호자|학부모/);
    expect(md).toContain("2026. 6. 24");
  });

  it("담당자/연락처 메타데이터", () => {
    const md = homeLetterTemplate(validInput.input as never);
    expect(md).toContain("김OO");
    expect(md).toContain("02-XXX-XXXX");
  });

  it("품질 기준 통과", () => {
    const md = homeLetterTemplate(validInput.input as never);
    validateQuality("home-letter", md);
  });
});

// ─── 6. 통합 generateMarkdown 디스패처 ───────────────────────
describe("generateMarkdown 디스패처 (위임 검증)", () => {
  const MINIMAL_INPUTS: Record<string, unknown> = {
    "lesson-plan": {
      교과명: "수학", 학년: "고1", 학기: "1학기", 단원명: "다항식",
      차시: 1, 전체차시: 8, 쪽수: "수학 12쪽", 학습주제: "다항식의 연산",
      활동유형: ["강의"], 학습환경: ["교실"], 준비물: "교과서",
      학습목표: ["다항식 정의를 안다"], 도입활동: "도입", 전개활동: "전개", 정리활동: "정리",
    },
    "formative-assessment": {
      교과명: "수학", 학년: "고1", 단원명: "다항식", 차시: 1, 전체차시: 8,
      문항수: 10, 선택형: 5, 단답형: 3, 서술형: 2,
      난이도_하: 3, 난이도_중: 4, 난이도_상: 3, 주제: "다항식",
    },
    rubric: {
      교과명: "수학", 학년: "고1", 단원명: "다항식",
      평가명: "다항식 연산 수행평가", 평가방식: "발표",
      평가일시: "2026-06-30", 척도단계: 3,
      요소들: [
        { 이름: "정확성", 상기술: "완벽", 중기술: "일부 오류", 하기술: "다수 오류" },
      ],
    },
    "official-letter": {
      문서종류: "공문", 제목: "수행평가 협조 요청",
      수신: "학부모", 발신기관: "서울고", 담당자: "교사",
      문서번호: "서울고-2026-001",
      본문항목들: ["1. 일정", "2. 평가 방법"],
    },
    "home-letter": {
      문서종류: "일반안내", 행사명: "학부모 공개수업",
      행사일시: "2026. 7. 1.(수)", 행사장소: "각 교실",
      행사대상: "전교생 학부모", 참가비용: "없음",
      준비물: "없음", 복장: "편한 복장",
      주의사항: ["교실 내 환기"], 담당자: "교사",
      연락처: "02-000-0000", 동의서필요: false,
    },
  };

  it("5개 skillName 모두 올바른 템플릿으로 디스패치 (non-empty 반환)", () => {
    for (const [name, input] of Object.entries(MINIMAL_INPUTS)) {
      const md = generateMarkdown(name as never, input as never);
      expect(md.length, `${name}: 비어있음`).toBeGreaterThan(0);
    }
  });

  it("알 수 없는 skillName → 에러", () => {
    expect(() =>
      generateMarkdown("unknown-skill" as never, {} as never),
    ).toThrow();
  });

  it("5개 skillName 모두 한국어 포함", () => {
    for (const [name, input] of Object.entries(MINIMAL_INPUTS)) {
      const md = generateMarkdown(name as never, input as never);
      expect(QUALITY_CHECKS.hasKorean(md), `${name}: 한국어 본문 없음`).toBe(true);
    }
  });
});