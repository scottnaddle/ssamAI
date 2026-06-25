"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SchoolLevel, TeachingStyle } from "@/lib/types";
import { personaApi } from "@/lib/api-client";
import { getStoredUser } from "@/lib/auth";

const SCHOOL_LEVELS: SchoolLevel[] = ["초등", "중학교", "고등학교"];
const SUBJECTS = ["국어", "수학", "과학", "영어", "사회", "역사", "체육", "음악", "미술", "기술·가정", "정보", "전문교과"];
const STYLES: TeachingStyle[] = ["실험·탐구 중심", "강의식", "토론·프로젝트 중심", "게임·활동 중심"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [style, setStyle] = useState<TeachingStyle | null>(null);
  const [className, setClassName] = useState("");
  const [studentCount, setStudentCount] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const steps = [
    { title: "이름이 어떻게 되세요?", subtitle: "ssamAI가 선생님을 어떻게 부를까요?" },
    { title: "어느 학교급을 담당하시나요?", subtitle: "맞춤 자료 추천에 사용됩니다." },
    { title: "담당 과목은 무엇인가요?", subtitle: "과정에 맞는 자료를 생성합니다." },
    { title: "선호하는 수업 스타일은?", subtitle: "AI가 선생님의 스타일을 학습합니다." },
    { title: "현재 맡은 학급 정보", subtitle: "학기 설정 — 나중에 변경할 수 있어요." },
  ];

  async function next() {
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }
    await submitAndRedirect();
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  async function submitAndRedirect() {
    if (!schoolLevel || !subject || !style) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      // Parse "3학년 2반" → { grade: "3학년", className: "2반" }.
      // Accepts space-separated tokens; first token is grade, rest is class.
      const tokens = className.trim().split(/\s+/).filter(Boolean);
      const currentClass =
        tokens.length >= 2 && typeof studentCount === "number"
          ? { grade: tokens[0], className: tokens.slice(1).join(" "), studentCount }
          : undefined;

      const user = getStoredUser();
      if (!user) {
        setSubmitError("로그인 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
        return;
      }
      const teacherId = user.id;

      await personaApi.upsert({
        teacherId,
        name: name.trim(),
        schoolLevel,
        subject,
        teachingStyle: style,
        currentClass,
      });
      router.push("/chat");
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? `저장 실패: ${err.message}`
          : "페르소나 저장 중 알 수 없는 오류가 발생했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const canProceed = (() => {
    if (submitting) return false;
    switch (step) {
      case 0: return name.trim().length > 0;
      case 1: return schoolLevel !== null;
      case 2: return subject !== null;
      case 3: return style !== null;
      case 4: return true;
      default: return false;
    }
  })();

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-mid text-xl">
            🌿
          </div>
          <div>
            <div className="text-xl font-extrabold text-primary">ssamAI</div>
            <div className="text-[11px] text-text-light">AI 교원 조교 — 페르소나 설정</div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6 flex gap-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Step */}
        <div className="rounded-ssamAI border border-border bg-surface p-7 shadow-card">
          <h2 className="text-[20px] font-bold text-text">{steps[step].title}</h2>
          <p className="mb-6 mt-1 text-[13px] text-text-mid">{steps[step].subtitle}</p>

          {step === 0 && (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && canProceed && next()}
              placeholder="예: 김지영"
              className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-[14px] text-text outline-none focus:border-primary"
            />
          )}

          {step === 1 && (
            <div className="grid grid-cols-3 gap-2">
              {SCHOOL_LEVELS.map((lv) => (
                <button
                  key={lv}
                  type="button"
                  onClick={() => setSchoolLevel(lv)}
                  className={`cursor-pointer rounded-lg border px-4 py-3 text-[14px] font-medium transition-colors ${
                    schoolLevel === lv
                      ? "border-primary bg-primary-light text-primary"
                      : "border-border bg-surface text-text-mid hover:border-primary-mid"
                  }`}
                >
                  {lv}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-4 gap-2">
              {SUBJECTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSubject(s)}
                  className={`cursor-pointer rounded-lg border px-3 py-2.5 text-[13px] font-medium transition-colors ${
                    subject === s
                      ? "border-primary bg-primary-light text-primary"
                      : "border-border bg-surface text-text-mid hover:border-primary-mid"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-2">
              {STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStyle(s)}
                  className={`cursor-pointer rounded-lg border px-4 py-3 text-left text-[14px] font-medium transition-colors ${
                    style === s
                      ? "border-primary bg-primary-light text-primary"
                      : "border-border bg-surface text-text-mid hover:border-primary-mid"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-text-mid">학급 (예: 3학년 2반)</label>
                <input
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="3학년 2반"
                  className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-[14px] outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-text-mid">학생 수</label>
                <input
                  type="number"
                  value={studentCount}
                  onChange={(e) => setStudentCount(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="28"
                  className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-[14px] outline-none focus:border-primary"
                />
              </div>
              <p className="text-[11.5px] text-text-light">
                이 정보는 ssamAI의 장기 메모리(Graphiti)에 저장되며, 학기가 바뀌어도 이전 기록은 보존됩니다.
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="mt-7 flex justify-between">
            <button
              type="button"
              onClick={back}
              disabled={step === 0 || submitting}
              className="cursor-pointer rounded-lg border border-border bg-surface px-5 py-2 text-[13px] text-text-mid transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30"
            >
              이전
            </button>
            <button
              type="button"
              onClick={() => void next()}
              disabled={!canProceed}
              className="cursor-pointer rounded-lg bg-primary px-6 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "저장 중..." : step === steps.length - 1 ? "완료하고 시작하기" : "다음"}
            </button>
          </div>

          {submitError && (
            <div className="mt-3 rounded-lg bg-accent-light px-3 py-2 text-[12px] text-accent">
              {submitError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
