import { NextRequest, NextResponse } from "next/server";
import { getRecentSkillCalls, getSkillMetrics } from "@/lib/skill-metrics";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const skillName = searchParams.get("skill_name") ?? undefined;
  const sinceHours = Math.max(1, Math.min(24 * 365, Number(searchParams.get("since_hours") ?? "720")));
  const includeRecent = searchParams.get("include_recent") === "1";
  const recentLimit = Math.max(1, Math.min(200, Number(searchParams.get("recent_limit") ?? "20")));

  try {
    const [metrics, recent] = await Promise.all([
      getSkillMetrics({ skillName, sinceHours }),
      includeRecent
        ? getRecentSkillCalls({ skillName, limit: recentLimit })
        : Promise.resolve([] as Awaited<ReturnType<typeof getRecentSkillCalls>>),
    ]);

    const totalCalls = metrics.reduce((s, m) => s + m.total_calls, 0);
    const totalSuccess = metrics.reduce((s, m) => s + m.success_count, 0);
    const totalFailure = metrics.reduce((s, m) => s + m.failure_count, 0);
    const overallSuccessRate = totalCalls ? totalSuccess / totalCalls : 0;

    return NextResponse.json({
      window_hours: sinceHours,
      summary: {
        total_skills: metrics.length,
        total_calls: totalCalls,
        total_success: totalSuccess,
        total_failure: totalFailure,
        overall_success_rate: Number(overallSuccessRate.toFixed(4)),
      },
      skills: metrics,
      recent_calls: recent,
      computed_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[api/skills/metrics]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}