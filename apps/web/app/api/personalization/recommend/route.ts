import { NextRequest, NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { SKILL_DEFS } from "@/lib/skill-defs";

export const dynamic = "force-dynamic";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const SKILL_BY_NAME = Object.fromEntries(SKILL_DEFS.map((s) => [s.name, s]));

type SkillUsage = {
  skill_name: string;
  count: number;
  last_used: number;
  last_source: string | null;
};

type Recommendation = {
  teacher_id: string;
  top_skills: Array<SkillUsage & { display_name: string; icon: string; category: string; reason: string }>;
  recent_7d_count: number;
  total_count: number;
  time_pattern: "morning" | "afternoon" | "evening" | "unknown";
  next_suggestion: { workflow: string; icon: string; reason: string } | null;
  computed_at: string;
};

const WORKFLOW_ORDER: Record<string, string> = {
  "차시별 자료 일괄": "수행평가 일괄",
  "수행평가 일괄": "학기 초 행정 일괄",
  "현장학습 자료 일괄": "차시별 자료 일괄",
  "학기 초 행정 일괄": "차시별 자료 일괄",
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get("teacher_id") || "anon";
    const limit = Math.max(1, Math.min(10, parseInt(searchParams.get("limit") || "3", 10)));
    const now = Date.now();

    const { records } = await runQuery<{
      skill_names: string[];
      counts: number[];
      last_useds: (number | { low: number; high: number })[];
      last_sources: (string | null)[];
      hours: (number | null)[];
      total: number;
      recent_total: number;
    }>(
      `MATCH (t:Teacher {id: $teacher_id})-[u:USED]->(s:Skill)
       WITH t, s, u,
            duration.between(datetime({epochMillis: toInteger(u.last_used)}), datetime()).days AS age_days
       WITH t, s, u, age_days,
            CASE WHEN age_days <= 7 THEN u.count ELSE 0 END AS recent_count
       WITH t, collect({
         skill_name: s.name,
         count: u.count,
         last_used: u.last_used,
         last_source: u.last_source,
         hour: datetime({epochMillis: toInteger(u.last_used)}).hour
       }) AS rows,
            sum(u.count) AS total,
            sum(recent_count) AS recent_total
       RETURN [r IN rows | r.skill_name] AS skill_names,
              [r IN rows | r.count] AS counts,
              [r IN rows | r.last_used] AS last_useds,
              [r IN rows | r.last_source] AS last_sources,
              [r IN rows | r.hour] AS hours,
              total, recent_total`,
      { teacher_id: teacherId },
      "read",
    );

    const row = records[0];
    if (!row) {
      return NextResponse.json(emptyRecommendation(teacherId, now));
    }

    const skillNames = (row.skill_names as string[]) || [];
    const counts = (row.counts as number[]) || [];
    const lastUseds = (row.last_useds as (number | { low: number; high: number })[]) || [];
    const lastSources = (row.last_sources as (string | null)[]) || [];
    const hours = (row.hours as (number | null)[]) || [];

    const usages: SkillUsage[] = skillNames.map((name, i) => ({
      skill_name: name,
      count: Number(counts[i] ?? 0),
      last_used: toMs(lastUseds[i]),
      last_source: lastSources[i] ?? null,
    }));

    const top = [...usages].sort((a, b) => b.count - a.count).slice(0, limit);
    const topWithMeta = top.map((u) => {
      const def = SKILL_BY_NAME[u.skill_name];
      const ageDays = u.last_used ? Math.max(0, (now - u.last_used) / (24 * 60 * 60 * 1000)) : null;
      const reason = buildReason(u, ageDays);
      return {
        ...u,
        display_name: def?.display_name ?? u.skill_name,
        icon: def?.icon ?? "📄",
        category: def?.category ?? "기타",
        reason,
      };
    });

    const hourValues = hours.filter((h): h is number => h != null);
    const timePattern = inferTimePattern(hourValues);

    const topSkillName = top[0]?.skill_name;
    const recentWorkflow = top[0]?.last_source === "orchestrate" ? inferWorkflow(top[0]?.skill_name) : null;
    const nextWorkflow = recentWorkflow ? WORKFLOW_ORDER[recentWorkflow] : null;
    const nextSuggestion = nextWorkflow
      ? {
          workflow: nextWorkflow,
          icon: "🔁",
          reason: `이전에 '${recentWorkflow}' 워크플로를 사용하셨으니 '${nextWorkflow}'가 자연스럽습니다`,
        }
      : null;

    const result: Recommendation = {
      teacher_id: teacherId,
      top_skills: topWithMeta,
      recent_7d_count: Number(row.recent_total ?? 0),
      total_count: Number(row.total ?? 0),
      time_pattern: timePattern,
      next_suggestion: nextSuggestion,
      computed_at: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/personalization/recommend]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

function toMs(v: number | { low: number; high: number } | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  return v.low + v.high * 0x100000000;
}

function inferTimePattern(hours: number[]): Recommendation["time_pattern"] {
  if (hours.length === 0) return "unknown";
  const morning = hours.filter((h) => h >= 5 && h < 12).length;
  const afternoon = hours.filter((h) => h >= 12 && h < 18).length;
  const evening = hours.filter((h) => h >= 18 || h < 5).length;
  if (morning >= afternoon && morning >= evening) return "morning";
  if (afternoon >= evening) return "afternoon";
  return "evening";
}

function inferWorkflow(skillName: string | undefined): string | null {
  if (!skillName) return null;
  if (skillName === "lesson-plan" || skillName === "formative-assessment" || skillName === "rubric") {
    return "차시별 자료 일괄";
  }
  if (skillName === "home-letter") return "현장학습 자료 일괄";
  if (skillName === "official-letter") return "학기 초 행정 일괄";
  return null;
}

function buildReason(usage: SkillUsage, ageDays: number | null): string {
  if (ageDays == null) return `${usage.count}회 사용`;
  if (ageDays < 1) return `오늘 ${usage.count}회 사용`;
  if (ageDays < 7) return `이번 주 ${usage.count}회 사용`;
  if (ageDays < 30) return `한 달 누적 ${usage.count}회`;
  return `누적 ${usage.count}회`;
}

function emptyRecommendation(teacherId: string, now: number): Recommendation {
  return {
    teacher_id: teacherId,
    top_skills: [],
    recent_7d_count: 0,
    total_count: 0,
    time_pattern: "unknown",
    next_suggestion: null,
    computed_at: new Date(now).toISOString(),
  };
}
