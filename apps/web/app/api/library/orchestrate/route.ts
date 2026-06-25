import { NextRequest, NextResponse } from "next/server";
import { SKILL_DEFS, buildInputFromParams } from "@/lib/skill-defs";
import { generateMarkdown } from "@/lib/skill-templates";
import { markdownToHwpx } from "@ssabrojs/hwpxjs";
import { trackUsage } from "@/lib/usage-tracker";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type SkillCall = {
  skillName: string;
  params: Record<string, string>;
};

const DEFAULTS: Record<string, Record<string, string>> = {
  lesson_plan: {
    subject: "과학",
    school_level: "초등 3학년",
    semester: "2학기",
    unit: "식물의 세계",
    session: "2",
    total_sessions: "5",
    page_ref: "과학 14~15쪽",
    topic: "광합성이란?",
    activity_type: "관찰, 실험, 토의",
    objectives: "광합성 과정을 설명할 수 있다",
    intro: "생각 열기: 나무는 어떻게 자라날까?",
    develop: "광합성 개념 학습 + 콩나물 관찰 실험",
    close: "결과 정리 + 형성평가",
  },
  home_letter: {
    type: "현장학습",
    title: "4학년 현장학습",
    event_date: "2026. 6. 25.(수)",
    location: "국립중앙박물관",
    target: "4학년 전체 학생",
    cost: "1인 2만원",
    items: "도시락, 음료, 필기구",
    dress: "교복 또는 단정한 운동복",
    notices: "박물관 내 음식물 반입 금지\n분실물 방지 가방 매기",
    teacher_name: "4학년 학년主任",
    contact: "02-000-0000",
    consent_needed: "예",
    consent_deadline: "2026. 6. 24.(수)",
  },
  rubric: {
    subject: "국어",
    school_level: "초등 5학년",
    unit: "의견과 주장",
    evaluation_name: "건의문 작성",
    method: "프로젝트",
    scale: "3",
    criteria: "문제 상황 정리 | 명확+피해사례 구체 | 정리했으나 부족 | 간명하게 못함",
  },
  official_letter: {
    type: "연수보고서",
    title: "에듀테크 연수 결과 보고",
    sender: "OO초등학교 교사",
    body: "1. 연수 개요\n2. 주요 내용\n3. 수업 적용 계획",
  },
};

function detectWorkflow(text: string): { name: string; calls: SkillCall[]; description: string } | null {
  const t = text.toLowerCase();

  // 1. 현장학습 (가장 specific — "자료 일괄" 같은 generic 키워드보다 먼저 체크)
  if (/(현장학습|현장체험|수학여행|안전체험|소풍|견학|박물관|체험학습)/.test(t)) {
    return {
      name: "현장학습 자료 일괄",
      description: "가정통신문 + 동의서",
      calls: [
        { skillName: "home-letter", params: DEFAULTS.home_letter },
      ],
    };
  }

  // 2. 수행평가 (specific assessment keywords)
  if (/(수행평가|루브릭|채점기준|프로젝트\s*평가|발표\s*평가)/.test(t)) {
    return {
      name: "수행평가 일괄",
      description: "수행평가 루브릭",
      calls: [
        { skillName: "rubric", params: DEFAULTS.rubric },
      ],
    };
  }

  // 3. 학기 초 (specific semester start keywords)
  if (/(학기\s*초|학년\s*초|새\s*학기|3월|시작\s*학기)/.test(t)) {
    return {
      name: "학기 초 행정 일괄",
      description: "가정통신문 + 행정공문",
      calls: [
        { skillName: "home-letter", params: { ...DEFAULTS.home_letter, type: "일반안내", title: "학기 초 수업 운영 안내" } },
        { skillName: "official-letter", params: { ...DEFAULTS.official_letter, type: "공문", title: "학기 초 교육과정 운영 계획" } },
      ],
    };
  }

  // 4. 차시별 자료 (generic — "자료 일괄" 포함, 마지막에 체크)
  if (/(차시별|차시\s*\d|\d차시|자료\s*일괄|자료\s*전부|수업\s*자료|교수\s*학습)/.test(t)) {
    return {
      name: "차시별 자료 일괄",
      description: "수업 과정안 + 활동지 + 형성평가",
      calls: [
        { skillName: "lesson-plan", params: DEFAULTS.lesson_plan },
      ],
    };
  }

  if (/(수업\s*과정안|교수학습과정안|지도안|lesson\s*plan|수업\s*계획)/.test(t)) {
    return { name: "수업 과정안", description: "수업 과정안 1건", calls: [{ skillName: "lesson-plan", params: DEFAULTS.lesson_plan }] };
  }
  if (/(형성평가|퀴즈|5지선다|문항|시험\s*만들)/.test(t)) {
    return { name: "형성평가", description: "형성평가 1건", calls: [{ skillName: "formative-assessment", params: { ...DEFAULTS.lesson_plan, topic: "광합성", question_count: "10", difficulty_easy: "4", difficulty_medium: "4", difficulty_hard: "2" } }] };
  }
  if (/(가정통신문|동의서|학부모\s*안내)/.test(t)) {
    return { name: "가정통신문", description: "가정통신문 1건", calls: [{ skillName: "home-letter", params: DEFAULTS.home_letter }] };
  }
  if (/(공문|행정\s*문서|연수보고서|출장신청서|회의록|휴가신청서)/.test(t)) {
    return { name: "행정공문", description: "행정공문 1건", calls: [{ skillName: "official-letter", params: DEFAULTS.official_letter }] };
  }
  if (/(루브릭|채점\s*기준)/.test(t)) {
    return { name: "수행평가 루브릭", description: "루브릭 1건", calls: [{ skillName: "rubric", params: DEFAULTS.rubric }] };
  }

  return null;
}

async function generateOne(call: SkillCall, teacherId: string) {
  const input = buildInputFromParams(call.skillName, call.params);
  const md = generateMarkdown(call.skillName as any, input);
  const buffer = await markdownToHwpx(md, {
    title: `${call.skillName}_${new Date().toISOString().slice(0, 10)}`,
    creator: "ssamAI",
  });
  return {
    skillName: call.skillName,
    filename: `${call.skillName}_${teacherId}_${Date.now()}.hwpx`,
    base64: Buffer.from(new Uint8Array(buffer)).toString("base64"),
    size: buffer.byteLength,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { request, teacher_id, skill_name } = body as {
      request?: string;
      teacher_id?: string;
      skill_name?: string;
    };

    let workflow: { name: string; description: string; calls: SkillCall[] };

    if (skill_name) {
      const def = SKILL_DEFS.find((s) => s.name === skill_name);
      if (!def) {
        return NextResponse.json({ error: `Unknown skill: ${skill_name}` }, { status: 400 });
      }
      const defaults = (DEFAULTS as any)[def.name.replace(/-/g, "_")];
      workflow = {
        name: def.display_name,
        description: def.description,
        calls: [{ skillName: skill_name, params: defaults || {} }],
      };
    } else if (request) {
      const detected = detectWorkflow(request);
      if (!detected) {
        return NextResponse.json({
          error: "워크플로를 감지하지 못했습니다. 예: '이번 주 2차시 자료 전부', '현장학습 자료 만들어줘'",
          available_workflows: ["차시별 자료 일괄", "현장학습 자료 일괄", "수행평가 일괄", "학기 초 행정 일괄"],
          available_skills: SKILL_DEFS.map((s) => s.name),
        }, { status: 400 });
      }
      workflow = detected;
    } else {
      return NextResponse.json({ error: "request 또는 skill_name 필요" }, { status: 400 });
    }

    const teacherId = teacher_id || "anon";
    const files = await Promise.all(workflow.calls.map((c) => generateOne(c, teacherId)));
    await Promise.all(
      workflow.calls.map((c) => trackUsage({ teacher_id: teacherId, skill_name: c.skillName, source: "orchestrate" })),
    );

    return NextResponse.json({
      workflow: workflow.name,
      description: workflow.description,
      total_files: files.length,
      files,
      total_size: files.reduce((s, f) => s + f.size, 0),
      generated_at: new Date().toISOString(),
      time_saved_estimate_minutes: files.length * 45,
    });
  } catch (err) {
    console.error("[api/library/orchestrate]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}