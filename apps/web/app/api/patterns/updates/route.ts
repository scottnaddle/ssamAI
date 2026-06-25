import { NextRequest, NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { generateUpdate } from "@/lib/skill-update";

export const dynamic = "force-dynamic";

/**
 * C. 스킬 자동 업데이트 (Loop 2 완성)
 *
 * 5명 합의 도달 + 평균 만족도 >= 4.0 패턴을 자동 SKILL.md 패치로 변환
 * - diff 생성 (사용자 검토 후 승인 가능)
 * - 합의 미달성 시 "candidate" 표시
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const skillFilter = searchParams.get("skill_name");
    const limit = Math.floor(parseInt(searchParams.get("limit") || "20", 10));

    // 합의 도달 + 만족도 >= 3.5 인 패턴
    const cypher = skillFilter
      ? `MATCH (p:Pattern)-[r:FREQ]->(p)
         WHERE r.count >= 5 AND p.skill_type = $skill_name
         OPTIONAL MATCH (fb:Feedback)-[rr:RATES]->(p)
         WITH p, r, avg(rr.score) AS avg_sat, count(rr) AS rating_count
         RETURN p.id AS id, p.value AS value, p.type AS type, p.skill_type AS skill_type,
                r.count AS frequency, coalesce(avg_sat, 0.0) AS avg_satisfaction,
                coalesce(rating_count, 0) AS rating_count, p.applied_at AS applied_at
         ORDER BY r.count DESC, avg_satisfaction DESC LIMIT toInteger($limit)`
      : `MATCH (p:Pattern)-[r:FREQ]->(p)
         WHERE r.count >= 5
         OPTIONAL MATCH (fb:Feedback)-[rr:RATES]->(p)
         WITH p, r, avg(rr.score) AS avg_sat, count(rr) AS rating_count
         RETURN p.id AS id, p.value AS value, p.type AS type, p.skill_type AS skill_type,
                r.count AS frequency, coalesce(avg_sat, 0.0) AS avg_satisfaction,
                coalesce(rating_count, 0) AS rating_count, p.applied_at AS applied_at
         ORDER BY r.count DESC, avg_satisfaction DESC LIMIT toInteger($limit)`;

    const { records } = await runQuery<{
      id: string;
      value: string;
      type: string;
      skill_type: string;
      frequency: number;
      avg_satisfaction: number;
      rating_count: number;
      applied_at: unknown;
    }>(cypher, { skill_name: skillFilter, limit }, "read");

    const isApplied = (v: unknown): boolean => {
      if (v == null) return false;
      if (typeof v === "string") return v !== "" && v !== "0-0";
      if (typeof v === "number") return v > 0;
      if (typeof v === "object" && v !== null && "low" in v && "high" in v) {
        const o = v as { low: number; high: number };
        return o.low !== 0 || o.high !== 0;
      }
      return false;
    };

    const candidates = records.map((r) => {
      const applied = isApplied(r.applied_at);
      const ready = r.frequency >= 5 && Number(r.avg_satisfaction) >= 3.5 && !applied;
      return {
        id: r.id,
        value: r.value,
        type: r.type,
        skill_name: r.skill_type,
        frequency: Number(r.frequency),
        avg_satisfaction: Number(r.avg_satisfaction),
        rating_count: Number(r.rating_count),
        status: applied ? "applied" as const : ready ? "ready" as const : "candidate" as const,
        applied_at_raw: r.applied_at == null ? null : String(r.applied_at),
        suggested_update: ready ? generateUpdate(r.type, r.value, r.skill_type) : null,
      };
    });

    return NextResponse.json({
      update_candidates: candidates,
      ready_count: candidates.filter((c) => c.status === "ready").length,
      threshold: { count: 5, satisfaction: 3.5 },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}