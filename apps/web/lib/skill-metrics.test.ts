import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/neo4j", () => ({
  runQuery: vi.fn(),
}));

import { runQuery } from "@/lib/neo4j";
import {
  DEFAULT_VARIANTS,
  getRecentSkillCalls,
  getSkillMetrics,
  pickVariant,
  recordSkillCall,
} from "@/lib/skill-metrics";

const mockedRunQuery = runQuery as unknown as ReturnType<typeof vi.fn>;

function mockRunQuerySequence(responses: unknown[]) {
  mockedRunQuery.mockReset();
  for (const r of responses) mockedRunQuery.mockResolvedValueOnce({ records: r });
}

describe("skill-metrics helpers", () => {
  it("recordSkillCall은 runQuery에 write 모드로 호출", async () => {
    mockRunQuerySequence([]);
    await recordSkillCall({
      skill_name: "home-letter",
      teacher_id: "t-1",
      source: "single",
      success: true,
      latency_ms: 12,
    });
    expect(mockedRunQuery).toHaveBeenCalledTimes(1);
    const [cypher, params, mode] = mockedRunQuery.mock.calls[0];
    expect(cypher).toContain("MERGE (s:Skill");
    expect(cypher).toContain("MERGE (s)-[:HAS_CALL]->(c)");
    expect(params.skill_name).toBe("home-letter");
    expect(params.success).toBe(true);
    expect(params.latency_ms).toBe(12);
    expect(mode).toBe("write");
  });

  it("recordSkillCall은 skill_name 없으면 skip", async () => {
    mockRunQuerySequence([]);
    await recordSkillCall({
      skill_name: "",
      success: true,
      latency_ms: 0,
    } as never);
    expect(mockedRunQuery).not.toHaveBeenCalled();
  });

  it("getSkillMetrics는 success_rate 계산 + error_types 빈도 정렬", async () => {
    mockRunQuerySequence([
      [
        {
          skill_name: "home-letter",
          total_calls: 10,
          success_count: 8,
          failure_count: 2,
          avg_latency_ms: 50,
          max_latency_ms: 120,
          last_called_at: "2026-06-25T00:00:00.000Z",
          error_types_raw: ["TimeoutError", "TimeoutError", "ValidationError"],
        },
      ],
    ]);
    const result = await getSkillMetrics();
    expect(result).toHaveLength(1);
    const m = result[0];
    expect(m.skill_name).toBe("home-letter");
    expect(m.total_calls).toBe(10);
    expect(m.success_count).toBe(8);
    expect(m.failure_count).toBe(2);
    expect(m.success_rate).toBeCloseTo(0.8, 5);
    expect(m.avg_latency_ms).toBe(50);
    expect(m.error_types[0]).toEqual({ type: "TimeoutError", count: 2 });
    expect(m.error_types[1]).toEqual({ type: "ValidationError", count: 1 });
  });

  it("getSkillMetrics는 빈 레코드 → 빈 배열", async () => {
    mockRunQuerySequence([[]]);
    const result = await getSkillMetrics();
    expect(result).toEqual([]);
  });

  it("getRecentSkillCalls는 최대 limit 적용 + success boolean 변환", async () => {
    mockRunQuerySequence([
      [
        { skill_name: "lesson-plan", teacher_id: "t-1", source: "single", success: 1, latency_ms: 5, error_type: null, created_at: "2026-06-25T01:00:00.000Z" },
        { skill_name: "lesson-plan", teacher_id: "t-1", source: "single", success: 0, latency_ms: 5, error_type: "Error", created_at: "2026-06-25T01:00:01.000Z" },
      ],
    ]);
    const result = await getRecentSkillCalls({ limit: 2 });
    expect(result).toHaveLength(2);
    expect(result[0].success).toBe(true);
    expect(result[1].success).toBe(false);
    expect(result[1].error_type).toBe("Error");
  });
});

describe("A/B variant selection (Phase 2)", () => {
  it("pickVariant는 0 또는 1 반환 (default 2 variants)", () => {
    for (let i = 0; i < 50; i++) {
      const v = pickVariant("home-letter", `teacher-${i}`);
      expect([0, 1]).toContain(v);
    }
  });

  it("pickVariant는 totalVariants=3일 때 0/1/2 반환", () => {
    for (let i = 0; i < 100; i++) {
      const v = pickVariant("home-letter", `t-${i}`, 3);
      expect([0, 1, 2]).toContain(v);
    }
  });

  it("DEFAULT_VARIANTS는 [control, treatment]", () => {
    expect(DEFAULT_VARIANTS).toEqual(["control", "treatment"]);
    expect(DEFAULT_VARIANTS[0]).toBe("control");
    expect(DEFAULT_VARIANTS[1]).toBe("treatment");
  });

  it("pickVariant 분포는 50/50 근처 (±20% 허용)", () => {
    const counts = [0, 0];
    const N = 1000;
    for (let i = 0; i < N; i++) {
      counts[pickVariant("home-letter", `t-${i}`)]++;
    }
    const ratio0 = counts[0] / N;
    const ratio1 = counts[1] / N;
    expect(ratio0).toBeGreaterThan(0.3);
    expect(ratio0).toBeLessThan(0.7);
    expect(ratio1).toBeGreaterThan(0.3);
    expect(ratio1).toBeLessThan(0.7);
  });

  it("동일 teacher_id + skill_name은 동일 minute에서 같은 variant", () => {
    const a = pickVariant("home-letter", "t-1");
    const b = pickVariant("home-letter", "t-1");
    expect(a).toBe(b);
  });
});