import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { runQuery } from "@/lib/neo4j";
import { generateUpdate } from "@/lib/skill-update";

export const dynamic = "force-dynamic";

const SKILL_ROOT = path.resolve(process.cwd(), "..", "..", "services", "skill-service", "app", "skills");

const SKILL_FILE_MAP: Record<string, string> = {
  "home-letter": "parent_letter.py",
  "lesson-plan": "lesson_plan.py",
  "formative-assessment": "assessment.py",
  "official-letter": "admin_doc.py",
};

const MARKER_START = "# AUTO-PATTERNS-START (do not edit manually — overwritten by ssamAI auto-merge)";
const MARKER_END = "# AUTO-PATTERNS-END";

function toCommentBlock(markdown: string): string {
  return markdown
    .split("\n")
    .map((line) => (line.trim() === "" ? "#" : `# ${line}`))
    .join("\n");
}

function unifiedDiff(oldText: string, newText: string, label: string): string {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const maxLen = Math.max(oldLines.length, newLines.length);
  const out: string[] = [`--- ${label} (before)`, `+++ ${label} (after)`, `@@ -1,${oldLines.length} +1,${newLines.length} @@`];
  for (let i = 0; i < maxLen; i++) {
    const o = oldLines[i];
    const n = newLines[i];
    if (o === n) {
      if (o !== undefined) out.push(` ${o}`);
    } else {
      if (o !== undefined) out.push(`-${o}`);
      if (n !== undefined) out.push(`+${n}`);
    }
  }
  return out.join("\n");
}

function buildPatchedContent(original: string, suggestedUpdate: string): string {
  const block = toCommentBlock(suggestedUpdate);
  if (original.includes(MARKER_START) && original.includes(MARKER_END)) {
    const re = new RegExp(`${escapeRegex(MARKER_START)}[\\s\\S]*?${escapeRegex(MARKER_END)}`);
    return original.replace(re, `${MARKER_START}\n${block}\n${MARKER_END}`);
  }
  return `${original.trimEnd()}\n\n${MARKER_START}\n${block}\n${MARKER_END}\n`;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validateTarget(skillName: string): { ok: true; filePath: string } | { ok: false; error: string } {
  const fileName = SKILL_FILE_MAP[skillName];
  if (!fileName) return { ok: false, error: `unknown skill_name: ${skillName}` };
  const fullPath = path.resolve(SKILL_ROOT, fileName);
  if (!fullPath.startsWith(SKILL_ROOT + path.sep) && fullPath !== SKILL_ROOT) {
    return { ok: false, error: `path traversal detected: ${fullPath}` };
  }
  return { ok: true, filePath: fullPath };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { pattern_id?: string; confirmed?: boolean };
    const { pattern_id, confirmed = false } = body;
    if (!pattern_id) {
      return NextResponse.json({ error: "pattern_id 필수" }, { status: 400 });
    }

    const { records } = await runQuery<{
      id: string;
      value: string;
      type: string;
      skill_name: string;
      frequency: number;
      avg_satisfaction: number;
      suggested_update: string | null;
      applied_at: number | null;
    }>(
      `MATCH (p:Pattern {id: $pattern_id})
         OPTIONAL MATCH (p)-[r:FREQ]->(p)
         RETURN p.id AS id, p.value AS value, p.type AS type, p.skill_type AS skill_name,
                coalesce(r.count, 0) AS frequency,
                p.suggested_update AS suggested_update,
                p.applied_at AS applied_at`,
      { pattern_id },
      "read",
    );

    const pattern = records[0];
    if (!pattern) return NextResponse.json({ error: `pattern not found: ${pattern_id}` }, { status: 404 });
    if (pattern.applied_at) {
      return NextResponse.json({ error: "이미 적용된 패턴", applied_at: pattern.applied_at }, { status: 409 });
    }
    const suggestedUpdate = generateUpdate(pattern.type, pattern.value, pattern.skill_name);

    const validation = validateTarget(pattern.skill_name);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { filePath } = validation;

    const original = await fs.readFile(filePath, "utf-8");
    const patched = buildPatchedContent(original, suggestedUpdate);
    const diff = unifiedDiff(original, patched, path.basename(filePath));

    if (!confirmed) {
      return NextResponse.json({
        dry_run: true,
        pattern_id,
        target_file: filePath.replace(process.cwd(), "").replace(/^\/+/, ""),
        diff,
        lines_added: patched.split("\n").length - original.split("\n").length,
        preview_first_30_lines: patched.split("\n").slice(0, 30).join("\n"),
      });
    }

    const backupPath = `${filePath}.bak.${Date.now()}`;
    await fs.copyFile(filePath, backupPath);
    await fs.writeFile(filePath, patched, "utf-8");

    await runQuery(
      `MATCH (p:Pattern {id: $pattern_id})
         SET p.applied_at = timestamp(),
             p.applied_to = $applied_to,
             p.applied_diff_lines = $diff_lines`,
      {
        pattern_id,
        applied_to: filePath,
        diff_lines: patched.split("\n").length - original.split("\n").length,
      },
      "write",
    );

    return NextResponse.json({
      dry_run: false,
      applied: true,
      pattern_id,
      target_file: filePath.replace(process.cwd(), "").replace(/^\/+/, ""),
      backup_path: backupPath.replace(process.cwd(), "").replace(/^\/+/, ""),
      lines_added: patched.split("\n").length - original.split("\n").length,
      diff,
    });
  } catch (err) {
    console.error("[api/patterns/apply]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
