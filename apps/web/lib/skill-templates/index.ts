/**
 * 5개 스킬 마크다운 템플릿 — ssamAI Phase 2
 *
 * 각 함수는 사용자 입력을 받아 마크다운을 생성한다.
 * markdownToHwpx로 전달되어 HWPX로 변환된다.
 */

export type LessonPlanInput = {
  교과명: string;
  학년: string;
  학기: string;
  단원명: string;
  차시: number;
  전체차시: number;
  쪽수: string;
  학습주제: string;
  활동유형: string[];
  학습환경: string[];
  준비물: string;
  학습목표: string[];
  도입활동: string;
  전개활동: string;
  정리활동: string;
};

export function lessonPlanTemplate(input: LessonPlanInput): string {
  return `# ${input.단원명} — ${input.차시}차시 교수학습과정안

## 기본 정보

| 항목 | 내용 |
| --- | --- |
| 교과명 | ${input.교과명} |
| 학년 | ${input.학년} |
| 학기 | ${input.학기} |
| 단원명 | ${input.단원명} |
| 차시 | ${input.차시} / ${input.전체차시} |
| 쪽수 | ${input.쪽수} |
| 학습주제 | ${input.학습주제} |
| 활동유형 | ${input.활동유형.join(", ")} |
| 학습환경 | ${input.학습환경.join(", ")} |
| 준비물 | ${input.준비물} |

## 학습목표

${input.학습목표.map((목표, i) => `${i + 1}. ${목표}`).join("\n")}

## 학습활동

### 도입 (5분)

${input.도입활동}

### 전개 (25분)

${input.전개활동}

### 정리 (10분)

${input.정리활동}
`;
}

export type AssessmentInput = {
  교과명: string;
  학년: string;
  단원명: string;
  차시: number;
  전체차시: number;
  문항수: number;
  선택형: number;
  단답형: number;
  서술형: number;
  난이도_하: number;
  난이도_중: number;
  난이도_상: number;
  주제: string;
};

export function assessmentTemplate(input: AssessmentInput): string {
  const lines: string[] = [];
  lines.push(`# 형성평가 — ${input.단원명} (${input.차시}/${input.전체차시}차시)`);
  lines.push("");
  lines.push("## 평가 정보");
  lines.push("");
  lines.push("| 항목 | 내용 |");
  lines.push("| --- | --- |");
  lines.push(`| 교과명 | ${input.교과명} |`);
  lines.push(`| 학년 | ${input.학년} |`);
  lines.push(`| 단원명 | ${input.단원명} |`);
  lines.push(`| 평가 유형 | 형성평가 |`);
  lines.push(`| 문항 수 | ${input.문항수}문항 |`);
  lines.push(`| 총 배점 | 100점 |`);
  lines.push(`| 난이도 | 하 ${input.난이도_하} / 중 ${input.난이도_중} / 상 ${input.난이도_상} |`);
  lines.push("");
  lines.push("## 문항");
  lines.push("");

  let qNum = 1;

  for (let i = 0; i < input.선택형; i++) {
    const diff = i < input.난이도_하 ? "하" : i < input.난이도_하 + input.난이도_중 ? "중" : "상";
    lines.push(`**[${qNum}] ${input.주제}에 대한 설명으로 옳은 것은?** [${diff}]`);
    lines.push("");
    lines.push("① " + input.주제 + "의 정의");
    lines.push("② " + input.주제 + "의 원리");
    lines.push("③ " + input.주제 + "의 예시");
    lines.push("④ " + input.주제 + "의 한계");
    lines.push("⑤ " + input.주제 + "의 응용");
    lines.push("");
    qNum++;
  }

  for (let i = 0; i < input.단답형; i++) {
    const diff = i < input.난이도_중 ? "중" : "상";
    lines.push(`**[${qNum}] ${input.주제}의 핵심 개념 한 가지를 쓰시오.** [${diff}]`);
    lines.push("");
    lines.push("→ 정답: ___________");
    lines.push("");
    qNum++;
  }

  for (let i = 0; i < input.서술형; i++) {
    lines.push(`**[${qNum}] ${input.주제}에 대해 2~3문장으로 설명하시오.** [상]`);
    lines.push("");
    lines.push("→ 모범답안: ____________________________________________");
    lines.push("");
    qNum++;
  }

  lines.push("## 정답표");
  lines.push("");
  lines.push("| 번호 | 정답 | 배점 | 난이도 | 유형 |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (let i = 1; i <= input.문항수; i++) {
    const type = i <= input.선택형 ? "선택형" : i <= input.선택형 + input.단답형 ? "단답형" : "서술형";
    const diff = i <= input.난이도_하 ? "하" : i <= input.난이도_하 + input.난이도_중 ? "중" : "상";
    lines.push(`| ${i} | ③ | 10 | ${diff} | ${type} |`);
  }

  return lines.join("\n");
}

export type RubricInput = {
  교과명: string;
  학년: string;
  단원명: string;
  평가명: string;
  평가방식: string;
  평가일시: string;
  척도단계: 3 | 4;
  요소들: { 이름: string; 상기술: string; 중기술: string; 하기술: string; 사기술?: string }[];
};

export function rubricTemplate(input: RubricInput): string {
  const scaleLabels = input.척도단계 === 4
    ? ["4 (상)", "3 (중상)", "2 (중하)", "1 (하)"]
    : ["3 (상)", "2 (중)", "1 (하)"];

  const lines: string[] = [];
  lines.push(`# 수행평가 루브릭 — ${input.평가명}`);
  lines.push("");
  lines.push("## 평가 정보");
  lines.push("");
  lines.push("| 항목 | 내용 |");
  lines.push("| --- | --- |");
  lines.push(`| 교과명 | ${input.교과명} |`);
  lines.push(`| 학년 | ${input.학년} |`);
  lines.push(`| 단원명 | ${input.단원명} |`);
  lines.push(`| 평가명 | ${input.평가명} |`);
  lines.push(`| 평가 방식 | ${input.평가방식} |`);
  lines.push(`| 평가 일시 | ${input.평가일시} |`);
  lines.push(`| 채점 척도 | ${input.척도단계}단계 (${scaleLabels.join(" / ")}) |`);
  lines.push("");
  lines.push("## 채점 기준표");
  lines.push("");
  lines.push("| 채점 요소 | " + scaleLabels.join(" | ") + " |");
  lines.push("| --- | " + scaleLabels.map(() => "---").join(" | ") + " |");

  for (const elem of input.요소들) {
    if (input.척도단계 === 4 && elem.사기술) {
      lines.push(`| ${elem.이름} | ${elem.상기술} | ${elem.중기술} | ${elem.하기술} | ${elem.사기술} |`);
    } else {
      lines.push(`| ${elem.이름} | ${elem.상기술} | ${elem.중기술} | ${elem.하기술} |`);
    }
  }

  lines.push("");
  lines.push("## 점수 산출");
  lines.push("");
  lines.push(`- 요소별 만점: ${input.척도단계}점 × ${input.요소들.length}개 = ${input.척도단계 * input.요소들.length}점`);
  lines.push("- 100점 환산: (실점 / 만점) × 100");
  lines.push("- 학점 환산: 90↑ A / 80↑ B / 70↑ C / 60↑ D / 60↓ E");
  lines.push("");
  lines.push("## 채점자 관찰 가이드");
  lines.push("");
  lines.push("- 학생의 수행을 관찰하고 채점 기준표에 따라 평가");
  lines.push("- 각 요소별로 관찰된 수행 특성을 해당 척도에 표시");
  lines.push("- 채점자 간 일치도 검증 권장 (2인 이상 채점)");

  return lines.join("\n");
}

export type OfficialLetterInput = {
  문서종류: "공문" | "연수보고서" | "출장신청서" | "회의록" | "휴가신청서";
  제목: string;
  수신?: string;
  발신기관?: string;
  문서번호?: string;
  발신일?: string;
  담당자?: string;
  연락처?: string;
  본문항목들: string[];
};

export function officialLetterTemplate(input: OfficialLetterInput): string {
  const today = input.발신일 || new Date().toISOString().slice(0, 10).replace(/-/g, ". ") + ".";
  const lines: string[] = [];
  lines.push(`# ${input.문서종류} — ${input.제목}`);
  lines.push("");
  lines.push("## 문서 정보");
  lines.push("");
  lines.push("| 항목 | 내용 |");
  lines.push("| --- | --- |");
  if (input.문서번호) lines.push(`| 문서번호 | ${input.문서번호} |`);
  lines.push(`| 제목 | ${input.제목} |`);
  if (input.수신) lines.push(`| 수신 | ${input.수신} |`);
  lines.push(`| 발신일 | ${today} |`);
  if (input.발신기관) lines.push(`| 발신 | ${input.발신기관} |`);
  if (input.담당자) lines.push(`| 담당자 | ${input.담당자} |`);
  if (input.연락처) lines.push(`| 연락처 | ${input.연락처} |`);
  lines.push("");
  lines.push("## 본문");
  lines.push("");
  input.본문항목들.forEach((항목, i) => {
    lines.push(`${i + 1}. ${항목}`);
  });
  lines.push("");
  lines.push("## 맺음");
  lines.push("");
  lines.push("위와 같이 " + input.문서종류 + "를 제출/보고합니다.");
  lines.push("");
  lines.push(today);
  lines.push("");
  if (input.발신기관) lines.push(input.발신기관);
  if (input.담당자) lines.push(input.담당자 + " (서명)");
  return lines.join("\n");
}

export type HomeLetterInput = {
  문서종류: "현장학습" | "안전체험" | "학교폭력안내" | "일반안내";
  행사명: string;
  행사일시: string;
  행사장소: string;
  행사대상: string;
  참가비용: string;
  준비물: string;
  복장: string;
  주의사항: string[];
  담당자: string;
  연락처: string;
  동의서필요: boolean;
  동의서제출기한?: string;
};

export function homeLetterTemplate(input: HomeLetterInput): string {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, ". ") + ".";
  const lines: string[] = [];
  lines.push(`# 가정통신문 — ${input.행사명}`);
  lines.push("");
  lines.push("## 발신 정보");
  lines.push("");
  lines.push("| 항목 | 내용 |");
  lines.push("| --- | --- |");
  lines.push(`| 발신 학교 | ${input.담당자.split(" ").slice(0, 2).join(" ")}`);
  lines.push(`| 발신일 | ${today} |`);
  lines.push("| 수신 | 학부모님 |");
  lines.push(`| 담당 | ${input.담당자} |`);
  lines.push(`| 연락처 | ${input.연락처} |`);
  lines.push("");
  lines.push("만물이 생동하는 여름입니다. 학부모님 댁내 평안하신지요?");
  lines.push("");
  lines.push("그간 학교에 보내주신 성원에 감사드립니다. 학부모님의 소중한 자녀에게 유익한 경험과 추억을 만들어 주기 위해 아래와 같이 행사를 실시하고자 합니다.");
  lines.push("");
  lines.push("## 행사 개요");
  lines.push("");
  lines.push("| 항목 | 내용 |");
  lines.push("| --- | --- |");
  lines.push(`| 행사명 | ${input.행사명} |`);
  lines.push(`| 행사 일시 | ${input.행사일시} |`);
  lines.push(`| 행사 장소 | ${input.행사장소} |`);
  lines.push(`| 행사 대상 | ${input.행사대상} |`);
  lines.push(`| 참가 비용 | ${input.참가비용} |`);
  lines.push(`| 준비물 | ${input.준비물} |`);
  lines.push(`| 복장 | ${input.복장} |`);
  lines.push("");
  lines.push("## 주의사항");
  lines.push("");
  input.주의사항.forEach((항목, i) => {
    lines.push(`${i + 1}. ${항목}`);
  });
  lines.push("");

  if (input.동의서필요) {
    lines.push("## 동의서 제출");
    lines.push("");
    lines.push(`- 제출 기한: ${input.동의서제출기한 || "행사 1주 전까지"}`);
    lines.push("- 제출 방법: 학생 편에 제출 (담임에게)");
    lines.push(`- 문의: ${input.담당자} (${input.연락처})`);
    lines.push("");
    lines.push("---");
    lines.push("");
    lines.push("## 별지: 참가 동의서");
    lines.push("");
    lines.push("| 항목 | 내용 |");
    lines.push("| --- | --- |");
    lines.push("| 학생 성명 | |");
    lines.push("| 학년 / 반 / 번호 | |");
    lines.push("| 보호자 성명 | |");
    lines.push("| 보호자 연락처 | |");
    lines.push("");
    lines.push("**동의 항목**:");
    lines.push("");
    lines.push("- [ ] 본인은 행사 참가에 동의합니다.");
    lines.push("- [ ] 본인은 안전 수칙 준수에 동의합니다.");
    lines.push("- [ ] 본인은 귀가 시 보호자 인계에 동의합니다.");
    lines.push("");
    lines.push(today);
    lines.push("");
    lines.push("보호자: ___________ (서명/날인)");
  }

  return lines.join("\n");
}

export type SkillType = "lesson-plan" | "formative-assessment" | "rubric" | "official-letter" | "home-letter";

export function generateMarkdown(
  skillType: SkillType,
  input: LessonPlanInput | AssessmentInput | RubricInput | OfficialLetterInput | HomeLetterInput,
): string {
  switch (skillType) {
    case "lesson-plan":
      return lessonPlanTemplate(input as LessonPlanInput);
    case "formative-assessment":
      return assessmentTemplate(input as AssessmentInput);
    case "rubric":
      return rubricTemplate(input as RubricInput);
    case "official-letter":
      return officialLetterTemplate(input as OfficialLetterInput);
    case "home-letter":
      return homeLetterTemplate(input as HomeLetterInput);
    default:
      throw new Error(`Unknown skill type: ${skillType}`);
  }
}