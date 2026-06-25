import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, runQuery } from "@/lib/neo4j";
import { extractPatterns } from "@/lib/pattern-extractor";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type UploadBody = {
  teacher_id: string;
  teacher_name?: string;
  skill_type: string;
  title: string;
  original_content: string;
  edited_content: string;
  is_anonymous?: boolean;
  school_level?: string;
  subject?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as UploadBody;
    const {
      teacher_id,
      teacher_name,
      skill_type,
      title,
      original_content,
      edited_content,
      is_anonymous = true,
      school_level,
      subject,
    } = body;

    if (!teacher_id || !skill_type || !title || !edited_content) {
      return NextResponse.json(
        { error: "teacher_id, skill_type, title, edited_content 필수" },
        { status: 400 },
      );
    }

    await ensureSchema();

    const patterns = extractPatterns(original_content || "", edited_content, skill_type);

    const templateId = `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await runQuery(
      `MERGE (t:Teacher {id: $teacher_id})
       ON CREATE SET t.name = $teacher_name, t.created_at = timestamp()
       SET t.last_seen = timestamp()`,
      { teacher_id, teacher_name: teacher_name || "익명" },
      "write",
    );

    await runQuery(
      `MATCH (t:Teacher {id: $teacher_id})
       MERGE (t)-[:UPLOADED]->(tpl:TeacherTemplate {id: $id})
       ON CREATE SET tpl.title = $title,
                     tpl.skill_type = $skill_type,
                     tpl.content = $content,
                     tpl.original_content = $original,
                     tpl.school_level = $school_level,
                     tpl.subject = $subject,
                     tpl.is_anonymous = $is_anonymous,
                     tpl.is_community = true,
                     tpl.created_at = timestamp()`,
      {
        teacher_id,
        id: templateId,
        title,
        skill_type,
        content: edited_content,
        original: original_content || "",
        school_level: school_level || null,
        subject: subject || null,
        is_anonymous,
      },
      "write",
    );

    const patternResults: Array<{ id: string; value: string; frequency: number; is_new: boolean }> = [];
    for (const p of patterns) {
      const { records } = await runQuery<{ value: string; count: number }>(
        `MERGE (pat:Pattern {id: $id})
         ON CREATE SET pat.value = $value, pat.type = $type, pat.skill_type = $skill_type, pat.created_at = timestamp()
         WITH pat
         OPTIONAL MATCH (pat)-[r:FREQ]->(pat)
         WITH pat, coalesce(r.count, 0) AS oldCount
         MERGE (pat)-[r:FREQ]->(pat)
           ON CREATE SET r.count = 1, r.last_seen = timestamp()
           ON MATCH SET r.count = oldCount + 1, r.last_seen = timestamp()
         RETURN pat.value AS value, r.count AS count`,
        { id: p.id, value: p.value, type: p.type, skill_type },
        "write",
      );
      const record = records[0];
      const freq = record ? Number(record.count) : 1;
      patternResults.push({
        id: p.id,
        value: p.value,
        frequency: freq,
        is_new: freq === 1,
      });

      await runQuery(
        `MATCH (tpl:TeacherTemplate {id: $tpl_id}), (pat:Pattern {id: $pat_id})
         MERGE (tpl)-[:EXHIBITS]->(pat)`,
        { tpl_id: templateId, pat_id: p.id },
        "write",
      );
    }

    return NextResponse.json({
      template_id: templateId,
      patterns_extracted: patterns.length,
      patterns: patternResults,
      consensus_threshold: 5,
      message:
        patternResults.filter((p) => p.frequency >= 5).length > 0
          ? `${patternResults.filter((p) => p.frequency >= 5).length}개 패턴이 5명 합의에 도달했습니다!`
          : "커뮤니티 공유 완료. 패턴 빈도가 추적됩니다.",
    });
  } catch (err) {
    console.error("[api/templates/upload]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}