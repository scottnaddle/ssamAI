"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatView } from "@/components/chat-view";
import { personaApi } from "@/lib/api-client";
import { getStoredUser } from "@/lib/auth";
import type { TeacherPersona } from "@/lib/types";

type PersonaSummary = Pick<
  TeacherPersona,
  "name" | "subject" | "schoolLevel" | "teachingStyle" | "currentClass"
>;

export default function ChatPage() {
  const router = useRouter();
  const [persona, setPersona] = useState<PersonaSummary | null>(null);
  const [teacherId, setTeacherId] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "no-persona">("loading");

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    setTeacherId(user.id);

    personaApi
      .get(user.id)
      .then((p) => {
        setPersona(p);
        setStatus("ready");
      })
      .catch(() => {
        setStatus("no-persona");
      });
  }, [router]);

  if (status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center bg-bg text-text-light">
        <div className="text-[13px]">페르소나 불러오는 중…</div>
      </div>
    );
  }

  if (status === "no-persona" || !persona) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-bg px-8 text-center">
        <div className="text-4xl">🎓</div>
        <h2 className="text-[17px] font-bold text-text">아직 페르소나가 설정되지 않았어요</h2>
        <p className="max-w-sm text-[13px] leading-relaxed text-text-mid">
          ssamAI가 선생님의 교육 스타일을 학습하려면, 간단한 5단계 온보딩이 필요해요.
        </p>
        <button
          type="button"
          onClick={() => router.push("/onboarding")}
          className="cursor-pointer rounded-lg bg-primary px-6 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          온보딩 시작하기
        </button>
      </div>
    );
  }

  return (
    <>
      <ChatHeader persona={persona} />
      <ChatTabs />
      <ChatView teacherId={teacherId} persona={persona} />
    </>
  );
}

function ChatHeader({ persona }: { persona: PersonaSummary }) {
  const classLabel = persona.currentClass
    ? `${persona.currentClass.grade} ${persona.currentClass.className}`
    : "";
  return (
    <header className="flex flex-shrink-0 items-center justify-between border-b border-border bg-surface px-[22px] py-3">
      <div>
        <h1 className="text-[15.5px] font-bold">
          {persona.schoolLevel} {persona.subject}
          {classLabel && ` — ${classLabel}`} 수업 자료
        </h1>
        <div className="mt-0.5 text-[11.5px] text-text-light">
          DeepSeek / MiniMax 라우팅 사용 중
        </div>
      </div>
      <div className="flex gap-1.5">
        {["📎 파일 첨부", "🔗 공유"].map((b) => (
          <button
            key={b}
            type="button"
            className="cursor-pointer rounded-md border border-border bg-surface px-3 py-1.5 text-[12px] text-text-mid transition-colors hover:border-primary-mid"
          >
            {b}
          </button>
        ))}
      </div>
    </header>
  );
}

function ChatTabs() {
  const tabs = ["💬 대화", "🖼 미리보기", "📋 수정 이력"];
  return (
    <div className="flex flex-shrink-0 border-b border-border bg-surface px-[22px]">
      {tabs.map((label, i) => (
        <div
          key={label}
          className={`-mb-px cursor-pointer border-b-2 px-4 py-2.5 text-[13px] ${
            i === 0
              ? "border-primary font-bold text-primary"
              : "border-transparent font-normal text-text-mid"
          }`}
        >
          {label}
        </div>
      ))}
    </div>
  );
}
