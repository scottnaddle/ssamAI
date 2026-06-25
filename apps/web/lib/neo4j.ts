/**
 * Neo4j 연결 헬퍼 — Teacher-Template-Pattern 그래프
 * Phase 2: teacher-template-loop 백엔드
 *
 * neo4j-driver 6.1.0: Integer/Duration/Point 객체는 {low, high} 형태로 옴
 * React 렌더링 오류 방지 위해 자동으로 number/string으로 변환
 */

import neo4j, { Driver, Session, Result } from "neo4j-driver";

const NEO4J_URI = process.env.NEO4J_URI || "bolt://localhost:7687";
const NEO4J_USER = process.env.NEO4J_USER || "neo4j";
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || "change-me-neo4j-password";

let driver: Driver | null = null;

export function getDriver(): Driver {
  if (!driver) {
    driver = neo4j.driver(
      NEO4J_URI,
      neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
      { maxConnectionPoolSize: 10, connectionTimeout: 5000 },
    );
  }
  return driver;
}

export async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

async function withSession<T>(fn: (session: Session) => Promise<T>): Promise<T> {
  const session = getDriver().session();
  try {
    return await fn(session);
  } finally {
    await session.close();
  }
}

export type QueryResult<T = Record<string, unknown>> = {
  records: T[];
};

/**
 * Neo4j Integer/Duration/Point 객체를 일반 JS 값으로 변환
 */
function normalizeValue(v: unknown): unknown {
  if (v === null || v === undefined) return v;
  if (typeof v !== "object") return v;

  const obj = v as Record<string, unknown>;
  // Neo4j Integer: {low, high}
  if ("low" in obj && "high" in obj && typeof obj.low === "number" && typeof obj.high === "number") {
    // JS number safe range: -2^53 ~ 2^53
    const low = obj.low as number;
    const high = obj.high as number;
    // 큰 정수는 문자열로 보존
    if (high !== 0 || Math.abs(low) > Number.MAX_SAFE_INTEGER) {
      return high.toString() + low.toString().padStart(8, "0");
    }
    return high * 0x100000000 + (low >= 0 ? low : low + 0x100000000);
  }
  // Neo4j Duration: {months, days, seconds, nanoseconds}
  if ("months" in obj || "seconds" in obj) {
    return JSON.stringify(v);
  }
  // Neo4j Point/Node/Relationship
  if ("toString" in obj && typeof obj.toString === "function") {
    const s = (obj as { toString: () => string }).toString();
    if (s.startsWith("Node") || s.startsWith("Relationship") || s.startsWith("Point")) {
      return s;
    }
  }
  // 배열/객체는 JSON으로
  if (Array.isArray(v)) {
    return v.map(normalizeValue);
  }
  return v;
}

function recordToObject<T>(r: { keys: string[]; get: (k: string) => unknown }): T {
  const obj: Record<string, unknown> = {};
  for (const key of r.keys) {
    obj[key] = normalizeValue(r.get(key));
  }
  return obj as T;
}

export async function runQuery<T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {},
  _mode: "read" | "write" = "write",
): Promise<QueryResult<T>> {
  return withSession(async (session) => {
    const result = await session.run(cypher, params);
    const records = (result.records as Array<{ keys: string[]; get: (k: string) => unknown }>).map((r) =>
      recordToObject<T>(r),
    );
    return { records };
  });
}

export async function ensureSchema(): Promise<void> {
  await runQuery(
    `CREATE CONSTRAINT teacher_id IF NOT EXISTS FOR (t:Teacher) REQUIRE t.id IS UNIQUE`,
  );
  await runQuery(
    `CREATE CONSTRAINT template_id IF NOT EXISTS FOR (t:TeacherTemplate) REQUIRE t.id IS UNIQUE`,
  );
  await runQuery(
    `CREATE CONSTRAINT pattern_id IF NOT EXISTS FOR (p:Pattern) REQUIRE p.id IS UNIQUE`,
  );
}

export function makePatternId(skillType: string, patternType: string, value: string): string {
  const hash = value.replace(/\s+/g, "_").slice(0, 50).replace(/[^가-힣a-zA-Z0-9_]/g, "");
  return `${skillType}:${patternType}:${hash}`;
}