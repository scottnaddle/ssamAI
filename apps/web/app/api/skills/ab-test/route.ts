import { NextRequest, NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { DEFAULT_VARIANTS } from "@/lib/skill-metrics";

export const dynamic = "force-dynamic";

const MIN_SAMPLES_PER_VARIANT = 5;

async function ensureVariants(skillName: string): Promise<string[]> {
  await runQuery(
    `MATCH (s:Skill {name: $skill_name})
     MERGE (s)-[:HAS_VARIANT]->(v:PromptVersion {variant: 'control', skill_name: $skill_name, created_at: timestamp()})
       ON CREATE SET v.id = 'pv_' + toString(timestamp()) + '_control'
     MERGE (s)-[:HAS_VARIANT]->(w:PromptVersion {variant: 'treatment', skill_name: $skill_name, created_at: timestamp()})
       ON CREATE SET w.id = 'pv_' + toString(timestamp()) + '_treatment'
     RETURN s.name AS skill_name`,
    { skill_name: skillName },
    "write",
  );
  return [...DEFAULT_VARIANTS];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { skill_name?: string };
    const skillName = body.skill_name;
    if (!skillName) {
      return NextResponse.json({ error: "skill_name 필수" }, { status: 400 });
    }
    const variants = await ensureVariants(skillName);
    return NextResponse.json({
      skill_name: skillName,
      variants,
      status: "started",
      message: "control + treatment variants active. 각 호출이 자동 분배됩니다.",
      started_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[api/skills/ab-test/start]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const skillName = searchParams.get("skill_name");
    if (!skillName) {
      return NextResponse.json({ error: "skill_name 필수" }, { status: 400 });
    }
    const sinceMs = Date.now() - 30 * 24 * 3600 * 1000;

    const { records } = await runQuery<{
      variant: string;
      total_calls: number;
      success_count: number;
      avg_latency_ms: number;
    }>(
      `MATCH (s:Skill {name: $skill_name})-[:HAS_CALL]->(c:SkillCall)
       WHERE c.created_at > toInteger($since_ms)
         AND c.variant IS NOT NULL
       WITH c.variant AS variant,
            count(c) AS total_calls,
            sum(CASE WHEN c.success THEN 1 ELSE 0 END) AS success_count,
            avg(c.latency_ms) AS avg_latency_ms
       RETURN variant, total_calls, success_count, avg_latency_ms
       ORDER BY variant`,
      { skill_name: skillName, since_ms: sinceMs },
      "read",
    );

    const variants = records.map((r) => ({
      variant: r.variant ?? "control",
      total_calls: Number(r.total_calls ?? 0),
      success_count: Number(r.success_count ?? 0),
      success_rate: r.total_calls ? Number(r.success_count ?? 0) / Number(r.total_calls) : 0,
      avg_latency_ms: Math.round(Number(r.avg_latency_ms ?? 0)),
    }));

    const sufficient = variants.every((v) => v.total_calls >= MIN_SAMPLES_PER_VARIANT);
    let winner: string | null = null;
    let recommendation: string | "collecting" = "collecting";
    if (sufficient && variants.length >= 2) {
      const sorted = [...variants].sort((a, b) => b.success_rate - a.success_rate);
      winner = sorted[0].variant;
      const gap = sorted[0].success_rate - sorted[1].success_rate;
      if (gap >= 0.1) {
        recommendation = `승자: ${winner} (success_rate ${(sorted[0].success_rate * 100).toFixed(1)}% vs ${(sorted[1].success_rate * 100).toFixed(1)}%, 격차 ${(gap * 100).toFixed(1)}pp). promote 권장.`;
      } else {
        recommendation = `격차 ${(gap * 100).toFixed(1)}pp < 10pp → 표본 추가 필요.`;
        winner = null;
      }
    }

    return NextResponse.json({
      skill_name: skillName,
      window_days: 30,
      min_samples_per_variant: MIN_SAMPLES_PER_VARIANT,
      variants,
      sufficient_samples: sufficient,
      winner,
      recommendation,
      computed_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[api/skills/ab-test/results]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      skill_name?: string;
      variant?: string;
    };
    const { skill_name: skillName, variant } = body;
    if (!skillName || !variant) {
      return NextResponse.json(
        { error: "skill_name, variant 필수" },
        { status: 400 },
      );
    }
    await runQuery(
      `MATCH (s:Skill {name: $skill_name})-[:HAS_VARIANT]->(v:PromptVersion {variant: $variant})
       SET v.is_promoted = true, v.promoted_at = timestamp()
       WITH s, v
       MATCH (s)-[:HAS_VARIANT]->(other:PromptVersion)
       WHERE other.variant <> $variant
       SET other.is_promoted = false
       RETURN v.variant AS promoted`,
      { skill_name: skillName, variant },
      "write",
    );
    return NextResponse.json({
      skill_name: skillName,
      promoted: variant,
      message: `${skillName} → ${variant} 승격 완료. 이후 모든 호출은 ${variant} 기본 사용 (호출 측 라우팅 로직 추가 필요).`,
    });
  } catch (err) {
    console.error("[api/skills/ab-test/promote]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}