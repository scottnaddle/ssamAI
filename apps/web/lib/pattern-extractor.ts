/**
 * 패턴 추출기 — 선생님이 수정한 HWPX에서 신규/변경 패턴 추출
 *
 * 원본 생성본과 업로드본 비교:
 * - 추가된 섹션 (예: "학부모 확인란")
 * - 변경된 표현 (예: "적극 협조" → "협조 부탁")
 * - 새 차시/학기/학년 필드
 *
 * 추출된 패턴은 Neo4j Pattern 노드로 저장되고 빈도가 추적됨.
 */

export type ExtractedPattern = {
  id: string;
  type: "added_section" | "modified_term" | "new_field" | "added_consent";
  value: string;
  context: string;
};

const ADDED_SECTION_INDICATORS = [
  /^#+\s+(.+)$/gm,
  /^\*\*\[(.+)\]\*\*$/gm,
];

const CONSENT_INDICATORS = [
  /학부모\s*확인/,
  /보호자\s*서명/,
  /동의\s*항목/,
];

export function extractPatterns(original: string, edited: string, skillType: string): ExtractedPattern[] {
  const patterns: ExtractedPattern[] = [];

  // 1. 추가된 섹션 (헤딩)
  const origSections = extractSections(original);
  const editSections = extractSections(edited);

  for (const section of editSections) {
    if (!origSections.has(section)) {
      patterns.push({
        id: `${skillType}:added_section:${normalize(section)}`,
        type: "added_section",
        value: section,
        context: `원본에 없던 "${section}" 섹션 추가됨`,
      });
    }
  }

  // 2. 동의서/확인란 패턴
  for (const pattern of CONSENT_INDICATORS) {
    if (pattern.test(edited) && !pattern.test(original)) {
      const match = edited.match(pattern);
      if (match) {
        patterns.push({
          id: `${skillType}:added_consent:${normalize(match[0])}`,
          type: "added_consent",
          value: match[0],
          context: `동의서 패턴: "${match[0]}"`,
        });
      }
    }
  }

  // 3. 변경된 용어 (간단한 diff)
  const termChanges = findTermChanges(original, edited);
  for (const change of termChanges) {
    patterns.push({
      id: `${skillType}:modified_term:${normalize(change.to)}`,
      type: "modified_term",
      value: `${change.from} → ${change.to}`,
      context: `"${change.from}"를 "${change.to}"로 변경`,
    });
  }

  return patterns;
}

function extractSections(text: string): Set<string> {
  const sections = new Set<string>();
  const headingRegex = /^#+\s+(.+)$/gm;
  let match;
  while ((match = headingRegex.exec(text)) !== null) {
    sections.add(match[1].trim());
  }
  // **[...]** bold sections (often used as section markers in Korean docs)
  const boldRegex = /\*\*\[([^\]]+)\]\*\*/g;
  while ((match = boldRegex.exec(text)) !== null) {
    sections.add(match[1].trim());
  }
  return sections;
}

function findTermChanges(orig: string, edit: string): Array<{ from: string; to: string }> {
  const changes: Array<{ from: string; to: string }> = [];
  // 간단한 접근: 2-4자 한글/영어 단어쌍 비교
  const origTerms = extractNgrams(orig, 2, 4);
  const editTerms = extractNgrams(edit, 2, 4);

  for (const term of origTerms) {
    if (!editTerms.has(term) && term.length >= 3) {
      // 원본에만 있는 용어 → 변경됐을 가능성
      // 편집본에서 비슷한 길이의 단어 찾기 (휴리스틱)
      const similar = findSimilar(term, editTerms);
      if (similar && similar !== term) {
        changes.push({ from: term, to: similar });
      }
    }
  }
  return changes.slice(0, 5); // 최대 5개
}

function extractNgrams(text: string, minN: number, maxN: number): Set<string> {
  const set = new Set<string>();
  // 한국어 + 영어를 모두 지원하기 위해 공백 기준 토큰화
  const tokens = text
    .replace(/[「」『』、，。！？…\n\r]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);
  for (let n = minN; n <= maxN; n++) {
    for (let i = 0; i <= tokens.length - n; i++) {
      const ngram = tokens.slice(i, i + n).join(" ");
      if (ngram.length >= 3) set.add(ngram);
    }
  }
  return set;
}

function findSimilar(target: string, candidates: Set<string>): string | null {
  // 같은 길이 ±2 범위, 첫 글자 같은 후보 찾기
  for (const c of candidates) {
    if (Math.abs(c.length - target.length) <= 2 && c[0] === target[0]) {
      return c;
    }
  }
  return null;
}

function normalize(s: string): string {
  return s.replace(/\s+/g, "_").slice(0, 50).replace(/[^가-힣a-zA-Z0-9_]/g, "");
}