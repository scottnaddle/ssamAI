import { NextRequest, NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const skillType = searchParams.get("skill_type");
    const limit = Math.floor(parseInt(searchParams.get("limit") || "20", 10));

    const cypher = skillType
      ? `MATCH (t:Teacher)-[:UPLOADED]->(tpl:TeacherTemplate {is_community: true, skill_type: $skill_type})
         OPTIONAL MATCH (tpl)-[:EXHIBITS]->(p:Pattern)
         WITH tpl, t, count(DISTINCT p) AS pattern_count
         RETURN tpl.id AS id, tpl.title AS title, tpl.skill_type AS skill_type,
                tpl.school_level AS school_level, tpl.subject AS subject,
                tpl.is_anonymous AS is_anonymous, tpl.created_at AS created_at,
                pattern_count,
                CASE WHEN tpl.is_anonymous THEN '익명 선생님' ELSE coalesce(t.name, '익명') END AS author
         ORDER BY tpl.created_at DESC LIMIT toInteger($limit)`
      : `MATCH (t:Teacher)-[:UPLOADED]->(tpl:TeacherTemplate {is_community: true})
         OPTIONAL MATCH (tpl)-[:EXHIBITS]->(p:Pattern)
         WITH tpl, t, count(DISTINCT p) AS pattern_count
         RETURN tpl.id AS id, tpl.title AS title, tpl.skill_type AS skill_type,
                tpl.school_level AS school_level, tpl.subject AS subject,
                tpl.is_anonymous AS is_anonymous, tpl.created_at AS created_at,
                pattern_count,
                CASE WHEN tpl.is_anonymous THEN '익명 선생님' ELSE coalesce(t.name, '익명') END AS author
         ORDER BY tpl.created_at DESC LIMIT toInteger($limit)`;

    const { records } = await runQuery<{
      id: string; title: string; skill_type: string;
      school_level: string | null; subject: string | null;
      is_anonymous: boolean; created_at: string; pattern_count: number; author: string;
    }>(cypher, { skill_type: skillType, limit }, "read");

    return NextResponse.json({ templates: records, total: records.length });
  } catch (err) {
    console.error("[api/templates/community]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}