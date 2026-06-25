import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { records } = await runQuery<{
      id: string;
      value: string;
      type: string;
      skill_type: string;
      count: number;
      last_seen: string;
      avg_satisfaction: number;
      rating_count: number;
    }>(
      `MATCH (p:Pattern)-[r:FREQ]->(p)
       WHERE r.count >= 5
       OPTIONAL MATCH (fb:Feedback)-[rr:RATES]->(p)
       WITH p, r, avg(rr.score) AS avg_sat, count(rr) AS rating_count
       RETURN p.id AS id, p.value AS value, p.type AS type, p.skill_type AS skill_type,
              r.count AS count, r.last_seen AS last_seen,
              coalesce(avg_sat, 0.0) AS avg_satisfaction,
              coalesce(rating_count, 0) AS rating_count
       ORDER BY r.count DESC, avg_sat DESC, r.last_seen DESC
       LIMIT 50`,
      {},
      "read",
    );

    const formatted = records.map((r) => ({
      id: r.id,
      value: r.value,
      type: r.type,
      skill_type: r.skill_type,
      count: Number(r.count),
      last_seen: r.last_seen,
      avg_satisfaction: Number(r.avg_satisfaction),
      rating_count: Number(r.rating_count),
    }));

    return NextResponse.json({
      consensus_patterns: formatted,
      threshold: 5,
      total: formatted.length,
    });
  } catch (err) {
    console.error("[api/patterns/consensus]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}