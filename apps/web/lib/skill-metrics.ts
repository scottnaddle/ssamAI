import { runQuery } from "./neo4j";

export type SkillCallRecord = {
  skill_name: string;
  teacher_id?: string | null;
  source: "orchestrate" | "single" | "auto-merge" | "manual" | string;
  success: boolean;
  latency_ms: number;
  error_type?: string | null;
  error_message?: string | null;
};

export type SkillMetrics = {
  skill_name: string;
  total_calls: number;
  success_count: number;
  failure_count: number;
  success_rate: number;
  avg_latency_ms: number;
  max_latency_ms: number;
  recent_24h_count: number;
  last_called_at: string | null;
  error_types: Array<{ type: string; count: number }>;
};

export async function recordSkillCall(r: SkillCallRecord): Promise<void> {
  if (!r.skill_name) return;
  try {
    await runQuery(
      `MERGE (s:Skill {name: $skill_name})
       CREATE (c:SkillCall {
         id: $call_id,
         teacher_id: $teacher_id,
         source: $source,
         success: $success,
         latency_ms: toInteger($latency_ms),
         error_type: $error_type,
         created_at: timestamp()
       })
       MERGE (s)-[:HAS_CALL]->(c)`,
      {
        call_id: `sc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        skill_name: r.skill_name,
        teacher_id: r.teacher_id ?? null,
        source: r.source,
        success: r.success,
        latency_ms: r.latency_ms,
        error_type: r.error_type ?? null,
      },
      "write",
    );
  } catch (err) {
    console.error("[skill-metrics] recordSkillCall failed:", err);
  }
}

export async function getSkillMetrics(opts: {
  skillName?: string;
  sinceHours?: number;
} = {}): Promise<SkillMetrics[]> {
  const sinceHours = opts.sinceHours ?? 24 * 30;
  const sinceMs = Date.now() - sinceHours * 3600 * 1000;
  const cypher = opts.skillName
    ? `MATCH (s:Skill {name: $skill_name})-[:HAS_CALL]->(c:SkillCall)
       WHERE c.created_at > toInteger($since_ms)
       WITH s.name AS skill_name, c
       WITH skill_name,
            count(c) AS total_calls,
            sum(CASE WHEN c.success THEN 1 ELSE 0 END) AS success_count,
            sum(CASE WHEN c.success THEN 0 ELSE 1 END) AS failure_count,
            avg(c.latency_ms) AS avg_latency_ms,
            max(c.latency_ms) AS max_latency_ms,
            max(toString(datetime({epochMillis: c.created_at}))) AS last_called_at,
            [t IN collect(CASE WHEN c.error_type IS NOT NULL THEN c.error_type ELSE null END) WHERE t IS NOT NULL] AS error_types_raw
       RETURN skill_name, total_calls, success_count, failure_count,
              avg_latency_ms, max_latency_ms, last_called_at, error_types_raw`
    : `MATCH (s:Skill)-[:HAS_CALL]->(c:SkillCall)
       WHERE c.created_at > toInteger($since_ms)
       WITH s.name AS skill_name, c
       WITH skill_name,
            count(c) AS total_calls,
            sum(CASE WHEN c.success THEN 1 ELSE 0 END) AS success_count,
            sum(CASE WHEN c.success THEN 0 ELSE 1 END) AS failure_count,
            avg(c.latency_ms) AS avg_latency_ms,
            max(c.latency_ms) AS max_latency_ms,
            max(toString(datetime({epochMillis: c.created_at}))) AS last_called_at,
            [t IN collect(CASE WHEN c.error_type IS NOT NULL THEN c.error_type ELSE null END) WHERE t IS NOT NULL] AS error_types_raw
       RETURN skill_name, total_calls, success_count, failure_count,
              avg_latency_ms, max_latency_ms, last_called_at, error_types_raw
       ORDER BY total_calls DESC`;

  const { records } = await runQuery<{
    skill_name: string;
    total_calls: number;
    success_count: number;
    failure_count: number;
    avg_latency_ms: number;
    max_latency_ms: number;
    last_called_at: string | null;
    error_types_raw: Array<string | null>;
  }>(
    cypher,
    {
      skill_name: opts.skillName ?? null,
      since_ms: sinceMs,
    },
    "read",
  );

  return records.map((r) => {
    const errorCounts = new Map<string, number>();
    for (const t of r.error_types_raw ?? []) {
      if (t) errorCounts.set(t, (errorCounts.get(t) ?? 0) + 1);
    }
    return {
      skill_name: r.skill_name,
      total_calls: Number(r.total_calls ?? 0),
      success_count: Number(r.success_count ?? 0),
      failure_count: Number(r.failure_count ?? 0),
      success_rate: r.total_calls ? Number(r.success_count ?? 0) / Number(r.total_calls) : 0,
      avg_latency_ms: Math.round(Number(r.avg_latency_ms ?? 0)),
      max_latency_ms: Number(r.max_latency_ms ?? 0),
      recent_24h_count: 0,
      last_called_at: r.last_called_at ?? null,
      error_types: Array.from(errorCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
    };
  });
}

export async function getRecentSkillCalls(opts: {
  skillName?: string;
  limit?: number;
} = {}): Promise<
  Array<{
    skill_name: string;
    teacher_id: string | null;
    source: string;
    success: boolean;
    latency_ms: number;
    error_type: string | null;
    created_at: string;
  }>
> {
  const limit = opts.limit ?? 50;
  const cypher = opts.skillName
    ? `MATCH (s:Skill {name: $skill_name})-[:HAS_CALL]->(c:SkillCall)
       RETURN s.name AS skill_name, c.teacher_id AS teacher_id, c.source AS source,
              c.success AS success, c.latency_ms AS latency_ms,
              c.error_type AS error_type,
              toString(datetime({epochMillis: c.created_at})) AS created_at
       ORDER BY c.created_at DESC LIMIT toInteger($limit)`
    : `MATCH (s:Skill)-[:HAS_CALL]->(c:SkillCall)
       RETURN s.name AS skill_name, c.teacher_id AS teacher_id, c.source AS source,
              c.success AS success, c.latency_ms AS latency_ms,
              c.error_type AS error_type,
              toString(datetime({epochMillis: c.created_at})) AS created_at
       ORDER BY c.created_at DESC LIMIT toInteger($limit)`;
  const { records } = await runQuery<{
    skill_name: string;
    teacher_id: string | null;
    source: string;
    success: boolean;
    latency_ms: number;
    error_type: string | null;
    created_at: string;
  }>(
    cypher,
    { skill_name: opts.skillName ?? null, limit },
    "read",
  );
  return records.map((r) => ({
    skill_name: r.skill_name,
    teacher_id: r.teacher_id ?? null,
    source: r.source ?? "unknown",
    success: Boolean(r.success),
    latency_ms: Number(r.latency_ms ?? 0),
    error_type: r.error_type ?? null,
    created_at: r.created_at ?? "",
  }));
}