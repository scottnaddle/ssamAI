import { NextRequest, NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const body = (await req.json()) as { teacher_id: string };
    const { teacher_id } = body;
    if (!teacher_id) {
      return NextResponse.json({ error: "teacher_id 필수" }, { status: 400 });
    }

    const { id: sourceId } = await params;

    // 1. 원본 조회
    const srcRes = await runQuery<{ content: string; title: string; skill_type: string }>(
      `MATCH (tpl:TeacherTemplate {id: $id}) RETURN tpl.content AS content, tpl.title AS title, tpl.skill_type AS skill_type`,
      { id: sourceId },
      "read",
    );
    if (srcRes.records.length === 0) {
      return NextResponse.json({ error: "원본 템플릿을 찾을 수 없습니다" }, { status: 404 });
    }
    const src = srcRes.records[0];

    const newId = `tpl_fork_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // 2. 포크 생성 (FORKED_FROM 관계)
    await runQuery(
      `MATCH (t:Teacher {id: $teacher_id}), (src:TeacherTemplate {id: $source_id})
       MERGE (t)-[:UPLOADED]->(new:TeacherTemplate {id: $new_id})
       ON CREATE SET new.title = $title,
                     new.content = $content,
                     new.skill_type = $skill_type,
                     new.is_anonymous = true,
                     new.is_community = false,
                     new.forked_from = $source_id,
                     new.created_at = timestamp()
       MERGE (new)-[:FORKED_FROM]->(src)`,
      {
        teacher_id,
        source_id: sourceId,
        new_id: newId,
        title: `${src.title} (포크)`,
        content: src.content,
        skill_type: src.skill_type,
      },
      "write",
    );

    // 3. 패턴도 함께 복사
    await runQuery(
      `MATCH (new:TeacherTemplate {id: $new_id}), (src:TeacherTemplate {id: $source_id})
       MATCH (src)-[:EXHIBITS]->(p:Pattern)
       MERGE (new)-[:EXHIBITS]->(p)`,
      { new_id: newId, source_id: sourceId },
      "write",
    );

    return NextResponse.json({
      forked: { id: newId, title: src.title, skill_type: src.skill_type },
      message: "내 자료로 가져왔습니다",
    });
  } catch (err) {
    console.error("[api/templates/[id]/fork]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}