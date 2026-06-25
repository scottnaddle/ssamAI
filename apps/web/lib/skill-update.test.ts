import { describe, expect, it } from "vitest";
import { generateUpdate } from "@/lib/skill-update";

describe("generateUpdate", () => {
  it("returns added_section markdown for added_section type", () => {
    const md = generateUpdate("added_section", "학부모 확인란", "home-letter");
    expect(md).toContain("## 자동 추가 섹션: 학부모 확인란");
    expect(md).toContain("home-letter");
    expect(md).toContain("5명 이상 합의");
  });

  it("returns modified_term markdown for modified_term type", () => {
    const md = generateUpdate("modified_term", "적극 협조", "official-letter");
    expect(md).toContain("## 표현 변경: 적극 협조");
    expect(md).toContain("official-letter");
  });

  it("returns added_consent markdown for added_consent type", () => {
    const md = generateUpdate("added_consent", "학부모 확인", "home-letter");
    expect(md).toContain("## 동의서 패턴 추가: 학부모 확인");
    expect(md).toContain("동의란 자동 포함");
  });

  it("returns generic fallback for unknown type", () => {
    const md = generateUpdate("unknown_type", "foo", "lesson-plan");
    expect(md).toContain("## 패턴 적용: foo");
  });

  it("ends with double newline for all types", () => {
    const types: Array<"added_section" | "modified_term" | "added_consent"> = [
      "added_section",
      "modified_term",
      "added_consent",
    ];
    for (const t of types) {
      expect(generateUpdate(t, "x", "y")).toMatch(/\n\n$/);
    }
  });
});
