import type { TeacherPersona } from "@/lib/types";

interface PersonaPanelProps {
  persona: Pick<
    TeacherPersona,
    "name" | "subject" | "schoolLevel" | "teachingStyle" | "currentClass"
  >;
}

/**
 * Right-rail panel shown on /chat.
 * Surface three key persona facts ssamAI remembers + related materials.
 * "연관 자료" list is stubbed until library service lands in Phase 2.
 */
export function PersonaPanel({ persona }: PersonaPanelProps) {
  const facts: Array<[string, string]> = [
    ["담당 과목", `${persona.subject} (${persona.schoolLevel})`],
    ["교육 스타일", persona.teachingStyle],
    [
      "현재 학급",
      persona.currentClass
        ? `${persona.currentClass.grade} ${persona.currentClass.className} (${persona.currentClass.studentCount}명)`
        : "미설정",
    ],
  ];

  return (
    <aside className="w-[252px] shrink-0 overflow-y-auto border-l border-border bg-sidebar px-3.5 py-[18px]">
      <div className="mb-2 text-[11px] font-bold tracking-wide text-text-light">
        🧠 ssamAI가 기억하는 나
      </div>
      {facts.map(([label, value]) => (
        <div key={label} className="mb-1.5 rounded-lg bg-primary-light px-2.5 py-1.5">
          <div className="text-[10px] font-bold text-primary-mid">{label}</div>
          <div className="text-[12px] text-text">{value}</div>
        </div>
      ))}

      <div className="mb-2 mt-[18px] text-[11px] font-bold tracking-wide text-text-light">
        📂 연관 자료
      </div>
      {/* Stub — Phase 2 library integration will populate this. */}
      {(
        [
          ["📊", "광합성_실험_2023.pptx", "PPT"],
          ["📄", "광반응_활동지.hwp", "HWP"],
          ["📊", "생태계_단원.pptx", "PPT"],
        ] as const
      ).map(([ic, nm, tag]) => (
        <div
          key={nm}
          className="mb-1.5 flex cursor-pointer items-center gap-2 rounded-[10px] border border-border bg-surface px-2.5 py-2 transition-colors hover:border-primary-mid"
        >
          <span className="text-[18px]">{ic}</span>
          <span className="flex-1 truncate text-[12px] text-text">{nm}</span>
          <span
            className={`rounded-md px-1.5 py-px text-[10px] font-semibold ${
              tag === "PPT"
                ? "bg-tag-blue text-[#1967D2]"
                : "bg-tag-green text-[#137333]"
            }`}
          >
            {tag}
          </span>
        </div>
      ))}
    </aside>
  );
}
