"use client";

import { useEffect, useRef, useState } from "react";
import type { SkillDef, SkillGenerateResponse } from "@/lib/types";
import { skillApi } from "@/lib/api-client";

interface SkillDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerated: (result: SkillGenerateResponse) => void;
  onUploaded?: (result: { filename: string; title: string | null; textPreview: string; exampleId: string | null }) => void;
  teacherId: string;
  defaultSubject?: string;
  defaultSchoolLevel?: string;
}

type Step = "pick" | "fill" | "generating" | "uploading";

export function SkillDialog({
  open,
  onClose,
  onGenerated,
  onUploaded,
  teacherId,
  defaultSubject,
  defaultSchoolLevel,
}: SkillDialogProps) {
  const [skills, setSkills] = useState<SkillDef[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>("pick");
  const [selectedSkill, setSelectedSkill] = useState<SkillDef | null>(null);
  const [params, setParams] = useState<Record<string, string>>({});
  const [genError, setGenError] = useState<string | null>(null);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSkillName, setUploadSkillName] = useState("lesson-plan");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setStep("pick");
    setSelectedSkill(null);
    setParams({});
    setGenError(null);
    setUploadFile(null);
    setUploadError(null);

    if (skills.length > 0) return;
    setLoadingSkills(true);
    setLoadError(null);
    skillApi
      .list()
      .then((res) => setSkills(res.skills))
      .catch((err) => setLoadError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoadingSkills(false));
  }, [open, skills.length]);

  function handlePickSkill(skill: SkillDef) {
    setSelectedSkill(skill);
    setGenError(null);
    const prefill: Record<string, string> = {};
    for (const p of skill.params) {
      if (p.key === "school_level" && defaultSchoolLevel) {
        prefill[p.key] = defaultSchoolLevel;
      } else if (p.key === "subject" && defaultSubject) {
        prefill[p.key] = defaultSubject;
      } else {
        prefill[p.key] = "";
      }
    }
    setParams(prefill);
    setStep("fill");
  }

  function handleParamChange(key: string, value: string) {
    setParams((prev) => ({ ...prev, [key]: value }));
  }

  async function handleGenerate() {
    if (!selectedSkill) return;
    setStep("generating");
    setGenError(null);
    try {
      const result = await skillApi.generate({
        skill_name: selectedSkill.name,
        teacher_id: teacherId,
        params,
      });
      onGenerated(result);
      onClose();
    } catch (err) {
      setGenError(err instanceof Error ? err.message : String(err));
      setStep("fill");
    }
  }

  async function handleUpload() {
    if (!uploadFile) return;
    setStep("uploading");
    setUploadError(null);
    try {
      const result = await skillApi.uploadParse(uploadFile, teacherId, uploadSkillName);
      if (onUploaded) {
        onUploaded({
          filename: result.filename,
          title: result.title,
          textPreview: result.text_preview,
          exampleId: result.example_id,
        });
      }
      onClose();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : String(err));
      setStep("pick");
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadError(null);
    }
  }

  function handleBack() {
    if (step === "fill") {
      setStep("pick");
      setSelectedSkill(null);
      setGenError(null);
    }
  }

  if (!open) return null;

  const acceptedFormats = ".hwpx,.pptx,.hwp";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-[16px] font-bold text-text">
            {step === "pick" && "문서 템플릿 선택"}
            {step === "fill" && selectedSkill?.display_name}
            {step === "generating" && "생성 중..."}
            {step === "uploading" && "업로드 중..."}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md border-none bg-transparent text-[18px] text-text-light hover:text-text-mid"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4">
          {/* Step: Pick skill or upload */}
          {step === "pick" && (
            <>
              {loadingSkills ? (
                <div className="py-8 text-center text-[13px] text-text-light">
                  스킬 목록을 불러오는 중...
                </div>
              ) : loadError ? (
                <div className="py-4 rounded-lg bg-accent-light px-3 py-2 text-[12px] text-accent">
                  스킬 목록을 불러오지 못했습니다: {loadError}
                </div>
              ) : (
                <>
                  {/* AI Generate — skill cards */}
                  <div className="mb-1 text-[11.5px] font-bold text-text-light">
                    🤖 AI 생성
                  </div>
                  <div className="grid gap-2">
                    {skills.map((skill) => (
                      <button
                        key={skill.name}
                        type="button"
                        onClick={() => handlePickSkill(skill)}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-bg p-3.5 text-left transition-colors hover:border-primary-mid"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-[18px]">
                          {skill.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[14px] font-bold text-text">
                            {skill.display_name}
                          </div>
                          <div className="mt-0.5 text-[12px] leading-relaxed text-text-mid">
                            {skill.description}
                          </div>
                          <div className="mt-1">
                            <span className="inline-block rounded-full bg-accent-light px-2 py-0.5 text-[10.5px] font-medium text-accent">
                              {skill.category}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="my-4 flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[11px] text-text-light">또는</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  {/* Upload existing document */}
                  <div className="mb-1 text-[11.5px] font-bold text-text-light">
                    📁 내 자료 올리기
                  </div>
                  <div className="rounded-lg border border-dashed border-primary-mid bg-primary-light/20 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <label className="text-[12px] font-semibold text-text-mid">문서 유형:</label>
                      <select
                        value={uploadSkillName}
                        onChange={(e) => setUploadSkillName(e.target.value)}
                        className="cursor-pointer rounded border border-border bg-surface px-2 py-1 text-[12px] text-text outline-none"
                      >
                        {skills.map((s) => (
                          <option key={s.name} value={s.name}>
                            {s.display_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={acceptedFormats}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-border bg-surface py-4 transition-colors hover:border-primary"
                    >
                      <div className="text-[24px]">📎</div>
                      <div className="text-[12.5px] font-medium text-text">
                        {uploadFile ? uploadFile.name : ".hwpx / .pptx / .hwp 파일 선택"}
                      </div>
                      <div className="text-[11px] text-text-light">
                        {uploadFile
                          ? `${(uploadFile.size / 1024).toFixed(1)} KB — 클릭해서 변경`
                          : "기존에 작성한 수업지도안을 올리면 AI가 구조를 학습합니다"}
                      </div>
                    </button>
                    {uploadFile && (
                      <button
                        type="button"
                        onClick={() => void handleUpload()}
                        className="mt-3 w-full cursor-pointer rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                      >
                        📤 이 파일 업로드하고 학습하기
                      </button>
                    )}
                    {uploadError && (
                      <div className="mt-2 rounded bg-accent-light px-3 py-1.5 text-[11.5px] text-accent">
                        {uploadError}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-center text-[10.5px] text-text-light">
                    지원 형식: .hwpx (한글), .pptx (파워포인트), .hwp (한글 구버전)
                  </div>
                </>
              )}

              {!loadingSkills && skills.length === 0 && (
                <div className="py-8 text-center text-[13px] text-text-light">
                  아직 등록된 스킬이 없습니다.
                </div>
              )}
            </>
          )}

          {/* Step: Fill params */}
          {step === "fill" && selectedSkill && (
            <>
              <div className="mb-4 text-[12.5px] leading-relaxed text-text-mid">
                {selectedSkill.description}
              </div>
              <div className="flex flex-col gap-3">
                {selectedSkill.params.map((p) => (
                  <div key={p.key}>
                    <label className="mb-1 block text-[12px] font-semibold text-text-mid">
                      {p.label}
                      {p.required && <span className="ml-0.5 text-accent">*</span>}
                    </label>
                    {p.type === "select" ? (
                      <select
                        value={params[p.key] || ""}
                        onChange={(e) => handleParamChange(p.key, e.target.value)}
                        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-[13.5px] text-text outline-none focus:border-primary"
                      >
                        <option value="">선택하세요</option>
                        {p.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : p.type === "textarea" ? (
                      <textarea
                        value={params[p.key] || ""}
                        onChange={(e) => handleParamChange(p.key, e.target.value)}
                        placeholder={p.placeholder}
                        rows={3}
                        className="w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-[13.5px] text-text outline-none focus:border-primary placeholder:text-text-light"
                      />
                    ) : (
                      <input
                        type={p.type === "number" ? "number" : "text"}
                        value={params[p.key] || ""}
                        onChange={(e) => handleParamChange(p.key, e.target.value)}
                        placeholder={p.placeholder}
                        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-[13.5px] text-text outline-none focus:border-primary placeholder:text-text-light"
                      />
                    )}
                  </div>
                ))}
              </div>
              {genError && (
                <div className="mt-3 rounded-lg bg-accent-light px-3 py-2 text-[12px] text-accent">
                  {genError}
                </div>
              )}
            </>
          )}

          {/* Step: Generating spinner */}
          {step === "generating" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary-light border-t-primary" />
              <div className="text-[13px] text-text-mid">
                AI가 문서를 작성하고 있습니다...
              </div>
            </div>
          )}

          {/* Step: Uploading spinner */}
          {step === "uploading" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-accent-light border-t-accent" />
              <div className="text-[13px] text-text-mid">
                {uploadFile?.name} 파싱 중...
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== "generating" && step !== "uploading" && (
          <div className="flex justify-between border-t border-border px-5 py-3">
            <button
              type="button"
              onClick={step === "fill" ? handleBack : onClose}
              className="cursor-pointer rounded-lg border border-border bg-surface px-4 py-2 text-[13px] text-text-mid transition-opacity hover:opacity-80"
            >
              {step === "fill" ? "← 뒤로" : "취소"}
            </button>
            {step === "fill" && selectedSkill && (
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={
                  selectedSkill.params.filter((p) => p.required).some((p) => !params[p.key]?.trim())
                }
                className="cursor-pointer rounded-lg bg-primary px-5 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                생성하기
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
