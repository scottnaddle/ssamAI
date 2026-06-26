import { NextRequest, NextResponse } from "next/server";
import { markdownToHwpx } from "@ssabrojs/hwpxjs";
import { generateMarkdown } from "@/lib/skill-templates";
import { trackUsage } from "@/lib/usage-tracker";
import { recordSkillCall } from "@/lib/skill-metrics";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const SKILL_DEFS = [
  {
    name: "lesson-plan",
    display_name: "수업 과정안",
    description: "교수학습과정안을 표준 10필드 + 학습목표 + 도입-전개-정리 흐름으로 생성합니다.",
    icon: "📝",
    category: "수업",
    params: [
      { key: "subject", label: "교과명", type: "text", required: true, placeholder: "예: 과학" },
      { key: "school_level", label: "학년", type: "select", required: true, options: ["초등 1학년","초등 2학년","초등 3학년","초등 4학년","초등 5학년","초등 6학년","중등 1학년","중등 2학년","중등 3학년"] },
      { key: "semester", label: "학기", type: "select", required: true, options: ["1학기", "2학기"] },
      { key: "unit", label: "단원명", type: "text", required: true, placeholder: "예: 식물의 세계" },
      { key: "session", label: "차시", type: "text", required: true, placeholder: "예: 2" },
      { key: "total_sessions", label: "전체 차시", type: "text", required: true, placeholder: "예: 5" },
      { key: "page_ref", label: "쪽수", type: "text", required: true, placeholder: "예: 과학 14~15쪽" },
      { key: "topic", label: "학습주제", type: "text", required: true, placeholder: "예: 광합성이란?" },
      { key: "activity_type", label: "활동유형", type: "text", required: false, placeholder: "예: 관찰, 실험, 토의" },
      { key: "objectives", label: "학습목표 (한 줄에 하나)", type: "textarea", required: true, placeholder: "식물의 잎에서 일어나는 광합성을 설명할 수 있다" },
      { key: "intro", label: "도입 활동", type: "textarea", required: true, placeholder: "생각 열기: 나무는 어떻게 자라날까?" },
      { key: "develop", label: "전개 활동", type: "textarea", required: true, placeholder: "광합성 개념 학습 + 콩나물 관찰 실험" },
      { key: "close", label: "정리 활동", type: "textarea", required: true, placeholder: "결과 정리 + 형성평가 + 차시 예고" },
    ],
  },
  {
    name: "formative-assessment",
    display_name: "형성평가",
    description: "선택형/단답형/서술형 문항과 정답표를 한 번에 생성합니다.",
    icon: "📊",
    category: "평가",
    params: [
      { key: "subject", label: "교과명", type: "text", required: true, placeholder: "예: 과학" },
      { key: "school_level", label: "학년", type: "select", required: true, options: ["초등 1학년","초등 2학년","초등 3학년","초등 4학년","초등 5학년","초등 6학년","중등 1학년","중등 2학년","중등 3학년"] },
      { key: "unit", label: "단원명", type: "text", required: true, placeholder: "예: 식물의 세계" },
      { key: "topic", label: "주제 키워드", type: "text", required: true, placeholder: "예: 광합성" },
      { key: "session", label: "차시", type: "text", required: true, placeholder: "예: 2" },
      { key: "total_sessions", label: "전체 차시", type: "text", required: true, placeholder: "예: 5" },
      { key: "question_count", label: "총 문항 수", type: "select", required: true, options: ["5", "10", "15", "20"] },
      { key: "difficulty_easy", label: "하 난이도 문항", type: "select", required: true, options: ["2", "3", "4", "5", "6"] },
      { key: "difficulty_medium", label: "중 난이도 문항", type: "select", required: true, options: ["2", "3", "4", "5", "6"] },
      { key: "difficulty_hard", label: "상 난이도 문항", type: "select", required: true, options: ["1", "2", "3"] },
    ],
  },
  {
    name: "rubric",
    display_name: "수행평가 루브릭",
    description: "채점 요소 + 척도(3단계/4단계) + 수행 특성 3요소 구조의 루브릭을 생성합니다.",
    icon: "📋",
    category: "평가",
    params: [
      { key: "subject", label: "교과명", type: "text", required: true, placeholder: "예: 국어" },
      { key: "school_level", label: "학년", type: "select", required: true, options: ["초등 1학년","초등 2학년","초등 3학년","초등 4학년","초등 5학년","초등 6학년","중등 1학년","중등 2학년","중등 3학년"] },
      { key: "unit", label: "단원명", type: "text", required: true, placeholder: "예: 의견과 주장" },
      { key: "evaluation_name", label: "평가명", type: "text", required: true, placeholder: "예: 건의문 작성" },
      { key: "method", label: "평가 방식", type: "select", required: true, options: ["관찰", "프로젝트", "발표", "실험보고서", "포트폴리오"] },
      { key: "scale", label: "척도 단계", type: "select", required: true, options: ["3", "4"] },
      { key: "criteria", label: "채점 요소 (한 줄에 하나: 요소명 | 상기술 | 중기술 | 하기술)", type: "textarea", required: true, placeholder: "문제 상황 정리 | 명확+피해사례 구체 | 정리했으나 사례 부족 | 간명하게 못함" },
    ],
  },
  {
    name: "official-letter",
    display_name: "행정공문",
    description: "교육청 공문 / 연수보고서 / 출장신청서 / 회의록 / 휴가신청서를 표준 양식으로 생성합니다.",
    icon: "📨",
    category: "행정",
    params: [
      { key: "type", label: "문서 종류", type: "select", required: true, options: ["공문", "연수보고서", "출장신청서", "회의록", "휴가신청서"] },
      { key: "title", label: "제목", type: "text", required: true, placeholder: "예: 2026학년도 학부모 공개수업 협조 요청" },
      { key: "sender", label: "발신자/소속", type: "text", required: true, placeholder: "예: 서울OO초등학교 교감 김OO" },
      { key: "recipient", label: "수신 (선택)", type: "text", required: false, placeholder: "예: 학부모님 / 교육과" },
      { key: "doc_number", label: "문서번호 (선택)", type: "text", required: false, placeholder: "예: 서울OO초-2026-237" },
      { key: "body", label: "본문 항목 (한 줄에 하나)", type: "textarea", required: true, placeholder: "1. 사업 개요\n2. 추진 일정\n3. 협조 요청 사항" },
    ],
  },
  {
    name: "home-letter",
    display_name: "가정통신문",
    description: "현장학습 / 안전체험 / 학교폭력 안내문 + 동의서를 표준 양식으로 생성합니다.",
    icon: "💌",
    category: "가정통신",
    params: [
      { key: "type", label: "문서 종류", type: "select", required: true, options: ["현장학습", "안전체험", "학교폭력안내", "일반안내"] },
      { key: "title", label: "행사명", type: "text", required: true, placeholder: "예: 4학년 현장학습 (국립중앙박물관)" },
      { key: "event_date", label: "행사 일시", type: "text", required: true, placeholder: "예: 2026. 6. 25.(수) (당일)" },
      { key: "location", label: "행사 장소", type: "text", required: true, placeholder: "예: 국립중앙박물관 (서울 용산구)" },
      { key: "target", label: "참가 대상", type: "text", required: true, placeholder: "예: 4학년 전체 학생 (87명)" },
      { key: "cost", label: "참가 비용", type: "text", required: true, placeholder: "예: 학생 1인당 일금 이만원정 (￦20,000)" },
      { key: "items", label: "준비물", type: "text", required: true, placeholder: "예: 도시락, 음료, 필기구, 돋보기" },
      { key: "dress", label: "복장", type: "text", required: true, placeholder: "예: 교복 또는 단정한 운동복" },
      { key: "notices", label: "주의사항 (한 줄에 하나)", type: "textarea", required: true, placeholder: "박물관 내 음식물 반입 금지\n분실물 방지 가방 매기" },
      { key: "teacher_name", label: "담당자명", type: "text", required: true, placeholder: "예: 4학년 학년主任 김OO" },
      { key: "contact", label: "연락처", type: "text", required: true, placeholder: "예: 02-XXX-XXXX" },
      { key: "consent_needed", label: "동의서 필요", type: "select", required: true, options: ["예", "아니오"] },
      { key: "consent_deadline", label: "동의서 제출 기한 (선택)", type: "text", required: false, placeholder: "예: 2026. 6. 24.(수)" },
    ],
  },
];

function buildInputFromParams(skillName: string, params: Record<string, string>): any {
  switch (skillName) {
    case "lesson-plan":
      return {
        교과명: params.subject,
        학년: params.school_level,
        학기: params.semester,
        단원명: params.unit,
        차시: parseInt(params.session, 10),
        전체차시: parseInt(params.total_sessions, 10),
        쪽수: params.page_ref,
        학습주제: params.topic,
        활동유형: params.activity_type ? params.activity_type.split(",").map((s: string) => s.trim()) : ["관찰"],
        학습환경: ["교실"],
        준비물: "교과서, 필기구",
        학습목표: params.objectives.split("\n").filter((s: string) => s.trim()),
        도입활동: params.intro,
        전개활동: params.develop,
        정리활동: params.close,
      };
    case "formative-assessment": {
      const total = parseInt(params.question_count, 10);
      const easy = parseInt(params.difficulty_easy, 10);
      const medium = parseInt(params.difficulty_medium, 10);
      const hard = parseInt(params.difficulty_hard, 10);
      const 선택형 = Math.max(1, Math.floor(total * 0.6));
      const 단답형 = Math.max(1, Math.floor(total * 0.2));
      const 서술형 = Math.max(0, total - 선택형 - 단답형);
      return {
        교과명: params.subject,
        학년: params.school_level,
        단원명: params.unit,
        차시: parseInt(params.session, 10),
        전체차시: parseInt(params.total_sessions, 10),
        문항수: total,
        선택형,
        단답형,
        서술형,
        난이도_하: easy,
        난이도_중: medium,
        난이도_상: hard,
        주제: params.topic,
      };
    }
    case "rubric": {
      const criteriaLines = params.criteria
        .split("\n")
        .filter((l: string) => l.trim())
        .map((l: string) => {
          const parts = l.split("|").map((s: string) => s.trim());
          return {
            이름: parts[0] || "",
            상기술: parts[1] || "",
            중기술: parts[2] || "",
            하기술: parts[3] || "",
            사기술: parts[4] || undefined,
          };
        });
      return {
        교과명: params.subject,
        학년: params.school_level,
        단원명: params.unit,
        평가명: params.evaluation_name,
        평가방식: params.method,
        평가일시: new Date().toISOString().slice(0, 10),
        척도단계: parseInt(params.scale, 10) as 3 | 4,
        요소들: criteriaLines,
      };
    }
    case "official-letter":
      return {
        문서종류: params.type,
        제목: params.title,
        수신: params.recipient,
        발신기관: params.sender,
        문서번호: params.doc_number,
        담당자: params.sender,
        본문항목들: params.body.split("\n").filter((s: string) => s.trim()),
      };
    case "home-letter":
      return {
        문서종류: params.type,
        행사명: params.title,
        행사일시: params.event_date,
        행사장소: params.location,
        행사대상: params.target,
        참가비용: params.cost,
        준비물: params.items,
        복장: params.dress,
        주의사항: params.notices.split("\n").filter((s: string) => s.trim()),
        담당자: params.teacher_name,
        연락처: params.contact,
        동의서필요: params.consent_needed === "예",
        동의서제출기한: params.consent_deadline,
      };
    default:
      throw new Error(`Unknown skill: ${skillName}`);
  }
}

export async function GET() {
  return NextResponse.json({ skills: SKILL_DEFS });
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { skill_name, teacher_id, params, title } = payload;

    const skill = SKILL_DEFS.find((s) => s.name === skill_name);
    if (!skill) {
      return NextResponse.json({ error: `Unknown skill: ${skill_name}` }, { status: 400 });
    }

    const missing = skill.params
      .filter((p) => p.required && !(params?.[p.key] || "").trim())
      .map((p) => p.label);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `필수 항목 누락: ${missing.join(", ")}` },
        { status: 400 },
      );
    }

    const input = buildInputFromParams(skill_name, params);
    const t0 = Date.now();
    let md: string;
    let buffer: ArrayBuffer | Uint8Array;
    try {
      md = generateMarkdown(skill_name as any, input);
      buffer = await markdownToHwpx(md, {
        title: title || `${skill.display_name}_${new Date().toISOString().slice(0, 10)}`,
        creator: "ssamAI",
      });
      await recordSkillCall({
        skill_name,
        teacher_id: teacher_id || "anon",
        source: "single",
        success: true,
        latency_ms: Date.now() - t0,
      });
    } catch (err) {
      await recordSkillCall({
        skill_name,
        teacher_id: teacher_id || "anon",
        source: "single",
        success: false,
        latency_ms: Date.now() - t0,
        error_type: err instanceof Error ? err.name : "error",
        error_message: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }

    await trackUsage({ teacher_id: teacher_id || "anon", skill_name, source: "single" });

    const filename = `${skill_name}_${teacher_id || "anon"}_${Date.now()}.hwpx`;
    const body = new Uint8Array(buffer);
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/vnd.hancom.hwpx",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "X-Skill-Name": skill_name,
        "X-Teacher-Id": teacher_id || "anon",
      },
    });
  } catch (err) {
    console.error("[api/library/generate]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}