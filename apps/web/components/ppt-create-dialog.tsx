"use client";

import { useState } from "react";
import type { SchoolLevel } from "@/lib/types";
import { pptApi } from "@/lib/api-client";
import type { PptOutline } from "@/lib/types";

interface PptCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (result: { pptUrl: string; outline: PptOutline; topic: string }) => void;
  defaultSubject?: string;
  defaultSchoolLevel?: SchoolLevel;
  teacherId: string;
}

const SCHOOL_LEVELS: SchoolLevel[] = ["초등", "중학교", "고등학교"];
const SUBJECTS = ["국어", "수학", "과학", "영어", "사회", "역사", "체육", "음악", "미술", "기술·가정", "정보", "전문교과"];

export function PptCreateDialog({
  open,
  onClose,
  onCreated,
  defaultSubject = "과학",
  defaultSchoolLevel = "중학교",
  teacherId,
}: PptCreateDialogProps) {
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState<string>(defaultSubject);
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel>(defaultSchoolLevel);
  const [grade, setGrade] = useState("");
  const [slideCount, setSlideCount] = useState(15);
  const [styleHint, setStyleHint] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit() {
    if (!topic.trim()) {
      setError("주제를 입력하세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await pptApi.create({
        topic: topic.trim(),
        subject,
        schoolLevel,
        grade: grade.trim() || undefined,
        slideCount,
        teacherId,
        styleHint: styleHint.trim() || undefined,
      });
      onCreated({ ...result, topic: topic.trim() });
      onClose();
      // Reset for next open.
      setTopic("");
      setStyleHint("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "PPT 생성 실패.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-ssamAI border border-border bg-surface shadow-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div>
            <h2 className="text-[15px] font-bold text-text">📊 PPT 생성</h2>
            <p className="text-[11.5px] text-text-light">주제를 입력하면 DeepSeek/MiniMax가 슬라이드를 설계합니다.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="닫기"
            className="cursor-pointer text-[18px] text-text-light hover:text-text-mid disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <div className="flex max-h-[70vh] flex-col gap-3.5 overflow-y-auto p-5">
          <Field label="주제 *">
            <input
              autoFocus
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="예: 3학년 2반 광합성 단원 (실험 활동 포함)"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[14px] outline-none focus:border-primary"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="학교급">
              <select
                value={schoolLevel}
                onChange={(e) => setSchoolLevel(e.target.value as SchoolLevel)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[14px] outline-none focus:border-primary"
              >
                {SCHOOL_LEVELS.map((lv) => (
                  <option key={lv} value={lv}>
                    {lv}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="과목">
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[14px] outline-none focus:border-primary"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="학년 (선택)">
              <input
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="예: 3학년"
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[14px] outline-none focus:border-primary"
              />
            </Field>
            <Field label={`슬라이드 수: ${slideCount}장`}>
              <input
                type="range"
                min={5}
                max={30}
                value={slideCount}
                onChange={(e) => setSlideCount(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </Field>
          </div>

          <Field label="스타일 힌트 (선택)">
            <input
              value={styleHint}
              onChange={(e) => setStyleHint(e.target.value)}
              placeholder="예: 실험·탐구 중심, 학생 친화적 언어"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[14px] outline-none focus:border-primary"
            />
          </Field>

          {error && (
            <div className="rounded-lg bg-accent-light px-3 py-2 text-[12px] text-accent">{error}</div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="cursor-pointer rounded-lg border border-border bg-surface px-4 py-2 text-[13px] text-text-mid transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting || !topic.trim()}
            className="cursor-pointer rounded-lg bg-primary px-5 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "생성 중..." : "PPT 만들기"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[12px] font-semibold text-text-mid">{label}</label>
      {children}
    </div>
  );
}
