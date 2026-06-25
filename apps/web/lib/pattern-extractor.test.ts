import { describe, expect, it } from "vitest";
import { extractPatterns } from "@/lib/pattern-extractor";

describe("extractPatterns", () => {
  describe("added sections", () => {
    it("detects markdown heading that exists only in edited", () => {
      const original = "# 인사\n\n안녕하세요.";
      const edited = "# 인사\n\n안녕하세요.\n\n# 학부모 확인란\n\n서명: __________";
      const patterns = extractPatterns(original, edited, "home-letter");
      const section = patterns.find((p) => p.type === "added_section");
      expect(section).toBeDefined();
      expect(section?.value).toBe("학부모 확인란");
      expect(section?.id).toBe("home-letter:added_section:학부모_확인란");
    });

    it("does not flag headings present in both versions", () => {
      const original = "# 인사\n\n# 일정";
      const edited = "# 인사\n\n# 일정\n\n추가 내용";
      const patterns = extractPatterns(original, edited, "home-letter");
      expect(patterns.filter((p) => p.type === "added_section")).toHaveLength(0);
    });

    it("returns empty array when no differences", () => {
      const text = "# 인사\n\n내용입니다.";
      const patterns = extractPatterns(text, text, "home-letter");
      expect(patterns).toEqual([]);
    });
  });

  describe("added consent patterns", () => {
    it("detects '학부모 확인' that exists only in edited", () => {
      const original = "현장학습 안내드립니다.";
      const edited = "현장학습 안내드립니다.\n\n학부모 확인란 서명 부탁드립니다.";
      const patterns = extractPatterns(original, edited, "home-letter");
      const consent = patterns.find((p) => p.type === "added_consent");
      expect(consent).toBeDefined();
      expect(consent?.value).toContain("학부모");
    });

    it("detects '보호자 서명' pattern", () => {
      const original = "동의서";
      const edited = "동의서\n\n보호자 서명: __________";
      const patterns = extractPatterns(original, edited, "home-letter");
      expect(patterns.some((p) => p.type === "added_consent")).toBe(true);
    });

    it("does not flag consent patterns already in original", () => {
      const original = "학부모 확인란 서명";
      const edited = "학부모 확인란 서명\n\n추가 내용";
      const patterns = extractPatterns(original, edited, "home-letter");
      expect(patterns.filter((p) => p.type === "added_consent")).toHaveLength(0);
    });
  });

  describe("modified terms", () => {
    it("returns at most 5 modified term changes", () => {
      const original = "일정 안내 안내 안내 안내 안내 안내 안내";
      const edited = "일정 통보 통보 통보 통보 통보 통보 통보";
      const patterns = extractPatterns(original, edited, "official-letter");
      const terms = patterns.filter((p) => p.type === "modified_term");
      expect(terms.length).toBeLessThanOrEqual(5);
    });

    it("emits id with skill_type prefix and normalized 'to' value", () => {
      const original = "적극 협조 부탁드립니다";
      const edited = "적극 협력 부탁드립니다";
      const patterns = extractPatterns(original, edited, "official-letter");
      const term = patterns.find((p) => p.type === "modified_term");
      if (term) {
        expect(term.id).toMatch(/^official-letter:modified_term:/);
        expect(term.value).toContain("→");
      }
    });
  });

  describe("integration", () => {
    it("returns multiple pattern types in real-world scenario", () => {
      const original = `# 현장학습 안내

일시: 2026. 6. 25.
장소: 국립중앙박물관

협조 부탁드립니다.`;

      const edited = `# 현장학습 안내

일시: 2026. 6. 25.
장소: 국립중앙박물관

# 학부모 확인란

서명: __________

학부모 확인 부탁드립니다.

협조 요청드립니다.`;

      const patterns = extractPatterns(original, edited, "home-letter");
      expect(patterns.length).toBeGreaterThan(0);
      const types = new Set(patterns.map((p) => p.type));
      expect(types.has("added_section")).toBe(true);
      expect(types.has("added_consent")).toBe(true);
    });
  });
});
