import { NextRequest, NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";

export const dynamic = "force-dynamic";

type FeedbackBody = {
  teacher_id: string;
  teacher_name?: string;
  template_id?: string;
  skill_name: string;
  satisfaction: 1 | 2 | 3 | 4 | 5;
  edit_ratio?: number;
  notes?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as FeedbackBody;
    const { teacher_id, teacher_name, template_id, skill_name, satisfaction, edit_ratio, notes } = body;

    if (!teacher_id || !skill_name || !satisfaction) {
      return NextResponse.json({ error: "teacher_id, skill_name, satisfaction 필수" }, { status: 400 });
    }
    if (satisfaction < 1 || satisfaction > 5) {
      return NextResponse.json({ error: "satisfaction 1~5" }, { status: 400 });
    }

    const feedbackId = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    await runQuery(
      `MATCH (t:Teacher {id: $teacher_id})
       MERGE (t)-[:GAVE_FEEDBACK]->(fb:Feedback {id: $feedback_id})
         ON CREATE SET fb.skill_name = $skill_name,
                       fb.satisfaction = $satisfaction,
                       fb.edit_ratio = $edit_ratio,
                       fb.notes = $notes,
                       fb.template_id = $template_id,
                       fb.created_at = timestamp()
       WITH fb
       MATCH (pat:Pattern {skill_type: $skill_name})
       MERGE (fb)-[r:RATES]->(pat)
         ON CREATE SET r.score = $satisfaction, r.count = 1, r.last_rated = timestamp()
         ON MATCH SET r.score = (r.score * r.count + $satisfaction) / (r.count + 1),
                       r.count = r.count + 1,
                       r.last_rated = timestamp()`,
      {
        teacher_id,
        teacher_name: teacher_name || "익명",
        feedback_id: feedbackId,
        skill_name,
        template_id: template_id || null,
        satisfaction,
        edit_ratio: edit_ratio ?? null,
        notes: notes || null,
      },
      "write",
    );

    const { records } = await runQuery<{ skill_name: string; avg_sat: number; count: number }>(
      `MATCH (:Feedback)-[r:RATES]->(:Pattern {skill_type: $skill_name})
       RETURN $skill_name AS skill_name, avg(r.score) AS avg_sat, sum(r.count) AS count`,
      { skill_name },
      "read",
    );

    return NextResponse.json({
      feedback_id: feedbackId,
      recorded: true,
      skill_average: records[0] ? { skill: records[0].skill_name, avg: Number(records[0].avg_sat), count: Number(records[0].count) } : null,
      message: satisfaction >= 4 ? "만족하셨다니 다행입니다" : "개선에 참고하겠습니다",
    });
  } catch (err) {
    console.error("[api/library/feedback]", err);
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

    const cypher = skillName
      ? `MATCH (fb:Feedback)-[r:RATES]->(p:Pattern {skill_type: $skill_name})
         WITH p, avg(r.score) AS avg_score, sum(r.count) AS total_ratings
         RETURN p.id AS pattern_id, p.value AS value, p.skill_type AS skill_name,
                avg_score, total_ratings
         ORDER BY avg_score DESC LIMIT toInteger($limit)`
      : `MATCH (fb:Feedback)-[r:RATES]->(p:Pattern)
         WITH p, avg(r.score) AS avg_score, sum(r.count) AS total_ratings
         RETURN p.id AS pattern_id, p.value AS value, p.skill_type AS skill_name,
                avg_score, total_ratings
         ORDER BY total_ratings DESC, avg_score DESC LIMIT toInteger($limit)`;

    const { records } = await runQuery<{
      pattern_id: string;
      value: string;
      skill_name: string;
      avg_score: number;
      total_ratings: number;
    }>(cypher, { skill_name: skillName, limit: 50 }, "read");

    return NextResponse.json({
      feedback: records.map((r) => ({
        pattern_id: r.pattern_id,
        value: r.value,
        skill_name: r.skill_name,
        avg_score: Number(r.avg_score),
        total_ratings: Number(r.total_ratings),
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}