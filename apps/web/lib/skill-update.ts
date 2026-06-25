export type PatternType = "added_section" | "modified_term" | "added_consent" | string;

export function generateUpdate(type: PatternType, value: string, skillName: string): string {
  if (type === "added_section") {
    return `## 자동 추가 섹션: ${value}\n\n> ${skillName} 생성 시 이 섹션을 기본 포함 (5명 이상 합의 패턴)\n\n`;
  }
  if (type === "modified_term") {
    return `## 표현 변경: ${value}\n\n> ${skillName} 생성 시 적용 (5명 이상 합의 패턴)\n\n`;
  }
  if (type === "added_consent") {
    return `## 동의서 패턴 추가: ${value}\n\n> ${skillName} 생성 시 동의란 자동 포함\n\n`;
  }
  return `## 패턴 적용: ${value}\n\n`;
}
