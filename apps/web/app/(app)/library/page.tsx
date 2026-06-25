"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SkillDialog } from "@/components/skill-dialog";
import { getStoredUser } from "@/lib/auth";
import { feedbackApi } from "@/lib/api-client";
import type { SkillDef } from "@/lib/types";

type SkillSummary = {
  name: string;
  display_name: string;
  description: string;
  icon: string;
  category: string;
};

type OrchestratorFile = {
  skillName: string;
  filename: string;
  base64: string;
  size: number;
};

type OrchestratorResult = {
  workflow: string;
  description: string;
  total_files: number;
  files: OrchestratorFile[];
  total_size: number;
  generated_at: string;
  time_saved_estimate_minutes: number;
};

type HistoryItem = {
  workflow: string;
  filename: string;
  generatedAt: string;
  timeSaved: number;
};

type CommunityTemplate = {
  id: string;
  title: string;
  skill_type: string;
  school_level: string | null;
  subject: string | null;
  is_anonymous: boolean;
  created_at: string;
  pattern_count: number;
  author: string;
};

type ConsensusPattern = {
  id: string;
  value: string;
  type: string;
  skill_type: string;
  count: number;
  last_seen: string;
  avg_satisfaction: number;
  rating_count: number;
};

const QUICK_WORKFLOWS = [
  { title: "차시별 자료 일괄", desc: "수업 과정안 + 활동지 + 형성평가 한 번에", request: "이번 주 2차시 자료 전부 만들어줘", emoji: "📚" },
  { title: "현장학습 자료 일괄", desc: "가정통신문 + 동의서 + 안전 안내", request: "6월 25일 현장학습 자료 만들어줘", emoji: "🏞️" },
  { title: "수행평가 일괄", desc: "루브릭 + 평가 안내문", request: "5학년 국어 수행평가 채점기준 만들어줘", emoji: "📋" },
  { title: "학기 초 행정 일괄", desc: "학기 계획 + 가정통신문 + 공문", request: "3월 학기 초 자료 일괄", emoji: "🎒" },
];

function base64ToBlob(b64: string, mime: string): Blob {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function LibraryPage() {
  const [teacherId, setTeacherId] = useState<string>("");
  const [skills, setSkills] = useState<SkillSummary[]>([]);
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [tab, setTab] = useState<"create" | "community" | "history">("create");

  // Orchestrator
  const [freeText, setFreeText] = useState("");
  const [orchestrating, setOrchestrating] = useState(false);
  const [orchestratorResult, setOrchestratorResult] = useState<OrchestratorResult | null>(null);
  const [orchestratorError, setOrchestratorError] = useState<string | null>(null);

  // Community (real backend)
  const [communityTemplates, setCommunityTemplates] = useState<CommunityTemplate[]>([]);
  const [consensusPatterns, setConsensusPatterns] = useState<ConsensusPattern[]>([]);
  const [updateCandidates, setUpdateCandidates] = useState<Array<{
    id: string; value: string; type: string; skill_name: string;
    frequency: number; avg_satisfaction: number; rating_count: number;
    status: "ready" | "candidate"; suggested_update: string | null;
  }>>([]);
  const [communityLoading, setCommunityLoading] = useState(false);

  // Satisfaction feedback state
  const [feedbackSent, setFeedbackSent] = useState<Record<string, boolean>>({});
  async function submitFeedback(skillName: string, satisfaction: 1 | 2 | 3 | 4 | 5) {
    if (feedbackSent[skillName]) return;
    try {
      await feedbackApi.submit({ teacher_id: teacherId, skill_name: skillName, satisfaction });
      setFeedbackSent((p) => ({ ...p, [skillName]: true }));
    } catch {}
  }

  // Auto-merge preview modal state
  const [applyPreview, setApplyPreview] = useState<{
    pattern_id: string; target_file: string; diff: string; lines_added: number;
  } | null>(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyResult, setApplyResult] = useState<string | null>(null);

  // Personalization (Loop 3) — 선생님별 사용 이력 기반 추천
  const [recommend, setRecommend] = useState<{
    top_skills: Array<{
      skill_name: string; display_name: string; icon: string; category: string;
      count: number; reason: string;
    }>;
    recent_7d_count: number; total_count: number;
    time_pattern: "morning" | "afternoon" | "evening" | "unknown";
    next_suggestion: { workflow: string; icon: string; reason: string } | null;
  } | null>(null);
  useEffect(() => {
    if (tab !== "create") return;
    fetch(`/api/personalization/recommend?teacher_id=${teacherId}`)
      .then((r) => r.json())
      .then((d) => setRecommend(d))
      .catch(() => {});
  }, [tab, teacherId]);
  async function previewApply(patternId: string) {
    setApplyLoading(true);
    setApplyResult(null);
    try {
      const res = await fetch("/api/patterns/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pattern_id: patternId, confirmed: false }),
      });
      const data = await res.json();
      if (data.error) {
        setApplyResult(`❌ ${data.error}`);
      } else {
        setApplyPreview({
          pattern_id: patternId,
          target_file: data.target_file,
          diff: data.diff,
          lines_added: data.lines_added,
        });
      }
    } catch (e) {
      setApplyResult(`❌ ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setApplyLoading(false);
    }
  }
  async function confirmApply() {
    if (!applyPreview) return;
    setApplyLoading(true);
    try {
      const res = await fetch("/api/patterns/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pattern_id: applyPreview.pattern_id, confirmed: true }),
      });
      const data = await res.json();
      if (data.error) {
        setApplyResult(`❌ ${data.error}`);
      } else {
        setApplyResult(`✅ 적용 완료 (${data.lines_added}줄 추가, 백업: ${data.backup_path.split("/").pop()})`);
        setApplyPreview(null);
        setUpdateCandidates((prev) => prev.filter((c) => c.id !== applyPreview.pattern_id));
      }
    } catch (e) {
      setApplyResult(`❌ ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setApplyLoading(false);
    }
  }

  // Share dialog
  const [showShare, setShowShare] = useState(false);
  const [shareContent, setShareContent] = useState("");
  const [shareTitle, setShareTitle] = useState("");
  const [shareSkillType, setShareSkillType] = useState("home-letter");
  const [shareOriginal, setShareOriginal] = useState("");
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [shareSubmitting, setShareSubmitting] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (user?.id) setTeacherId(user.id);

    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("ssamai.library.history");
    if (stored) {
      try { setHistory(JSON.parse(stored) as HistoryItem[]); } catch { setHistory([]); }
    }

    fetch("/api/library/skills")
      .then((r) => r.json())
      .then((data: { skills: SkillDef[] }) => {
        setSkills(data.skills.map((s) => ({
          name: s.name, display_name: s.display_name, description: s.description, icon: s.icon, category: s.category,
        })));
      })
      .catch(() => setSkills([]));
  }, []);

  // Community 데이터 로드
  useEffect(() => {
    if (tab !== "community") return;
    setCommunityLoading(true);
    Promise.all([
      fetch("/api/templates/community").then((r) => r.json()).catch(() => ({ templates: [] })),
      fetch("/api/patterns/consensus").then((r) => r.json()).catch(() => ({ consensus_patterns: [] })),
      feedbackApi.candidates().then((d) => d.update_candidates).catch(() => []),
    ]).then(([communityRes, consensusRes, updateRes]) => {
      setCommunityTemplates(communityRes.templates || []);
      setConsensusPatterns(consensusRes.consensus_patterns || []);
      setUpdateCandidates(updateRes || []);
      setCommunityLoading(false);
    });
  }, [tab]);

  async function handleOrchestrate(request: string) {
    setOrchestrating(true);
    setOrchestratorError(null);
    setOrchestratorResult(null);
    try {
      const res = await fetch("/api/library/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request, teacher_id: teacherId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOrchestratorError(data.error || `HTTP ${res.status}`);
      } else {
        setOrchestratorResult(data);
        for (const f of data.files) {
          downloadBlob(base64ToBlob(f.base64, "application/vnd.hancom.hwpx"), f.filename);
        }
        const item: HistoryItem = {
          workflow: data.workflow,
          filename: `${data.total_files}개 파일 (${data.workflow})`,
          generatedAt: new Date().toISOString(),
          timeSaved: data.time_saved_estimate_minutes,
        };
        const next = [item, ...history].slice(0, 30);
        setHistory(next);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("ssamai.library.history", JSON.stringify(next));
        }
      }
    } catch (err) {
      setOrchestratorError(err instanceof Error ? err.message : String(err));
    } finally {
      setOrchestrating(false);
    }
  }

  function handleQuickWorkflow(req: string) {
    setFreeText(req);
    void handleOrchestrate(req);
  }

  async function handleQuickStart(skillName: string) {
    if (orchestrating) return;
    setOrchestrating(true);
    setOrchestratorError(null);
    try {
      const res = await fetch("/api/library/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher_id: teacherId, skill_name: skillName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "생성 실패");
      setOrchestratorResult(data);
      setFeedbackSent({});
    } catch (e) {
      setOrchestratorError(e instanceof Error ? e.message : String(e));
    } finally {
      setOrchestrating(false);
    }
  }

  function handleFreeSubmit() {
    const trimmed = freeText.trim();
    if (!trimmed || orchestrating) return;
    void handleOrchestrate(trimmed);
  }

  async function handleShare() {
    if (!shareContent.trim()) {
      setShareError("수정본 내용을 붙여넣어 주세요");
      return;
    }
    setShareSubmitting(true);
    setShareError(null);
    setShareSuccess(null);
    try {
      const res = await fetch("/api/templates/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacher_id: teacherId,
          skill_type: shareSkillType,
          title: shareTitle || `${shareSkillType} ${new Date().toLocaleDateString("ko-KR")}`,
          original_content: shareOriginal,
          edited_content: shareContent,
          is_anonymous: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setShareError(data.error || `HTTP ${res.status}`);
      } else {
        setShareSuccess(data.message);
        setShareContent("");
        setShareTitle("");
        setShareOriginal("");
        // 커뮤니티 탭 새로고침
        fetch("/api/templates/community").then((r) => r.json()).then((d) => setCommunityTemplates(d.templates || [])).catch(() => {});
      }
    } catch (err) {
      setShareError(err instanceof Error ? err.message : String(err));
    } finally {
      setShareSubmitting(false);
    }
  }

  async function handleFork(tpl: CommunityTemplate) {
    try {
      const res = await fetch(`/api/templates/${tpl.id}/fork`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher_id: teacherId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "포크 실패");
      } else {
        alert(`"${tpl.title}"을(를) 내 자료로 가져왔습니다!`);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  function handleGenerated(result: { skill_name: string; filename?: string }) {
    const item: HistoryItem = {
      workflow: result.skill_name,
      filename: result.filename || `${result.skill_name}.hwpx`,
      generatedAt: new Date().toISOString(),
      timeSaved: 45,
    };
    const next = [item, ...history].slice(0, 30);
    setHistory(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ssamai.library.history", JSON.stringify(next));
    }
  }

  if (!teacherId) {
    return (
      <div className="flex flex-1 items-center justify-center text-text-light">
        <div className="text-center">
          <div className="mb-2 text-4xl">🔒</div>
          <div className="text-[15px] font-semibold text-primary">로그인이 필요합니다</div>
          <Link href="/login" className="mt-3 inline-block text-[13px] text-accent underline">
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bg">
      <div className="border-b border-border bg-surface px-6 py-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[22px] font-bold text-text">📚 자료 라이브러리</h1>
            <p className="mt-1 text-[12.5px] text-text-mid">
              한 줄 요청 → 여러 문서 자동 생성 · 매주 12시간+ 절약
            </p>
          </div>
          <div className="flex shrink-0 gap-1 rounded-lg border border-border bg-bg p-1">
            {(["create", "community", "history"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                  tab === t ? "bg-primary text-white" : "text-text-mid hover:bg-primary-light"
                }`}
              >
                {t === "create" && "✨ 생성"}
                {t === "community" && `🌐 커뮤니티 (${communityTemplates.length})`}
                {t === "history" && `📁 내 자료 (${history.length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {tab === "create" && (
          <>
            {recommend && recommend.total_count > 0 && (
              <section className="mb-5 rounded-xl border border-accent bg-accent-light/10 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <h2 className="text-[13px] font-bold text-accent">💡 추천</h2>
                  <span className="rounded-full bg-accent-light px-2 py-0.5 text-[10px] text-accent">
                    최근 7일 {recommend.recent_7d_count}회 사용
                  </span>
                  {recommend.time_pattern !== "unknown" && (
                    <span className="rounded-full bg-primary-light px-2 py-0.5 text-[10px] text-primary">
                      {recommend.time_pattern === "morning" ? "🌅 오전" :
                       recommend.time_pattern === "afternoon" ? "☀️ 오후" : "🌙 저녁"} 활동
                    </span>
                  )}
                </div>
                <div className="mb-2 flex flex-wrap gap-2">
                  {recommend.top_skills.slice(0, 3).map((s) => (
                    <button
                      key={s.skill_name}
                      type="button"
                      onClick={() => handleQuickStart(s.skill_name)}
                      className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-[12px] transition-opacity hover:opacity-80"
                      title={s.reason}
                    >
                      <span className="text-[16px]">{s.icon}</span>
                      <span className="text-text">
                        {s.display_name}
                      </span>
                      <span className="rounded-full bg-accent-light px-1.5 py-0.5 text-[10px] text-accent">
                        {s.count}회
                      </span>
                    </button>
                  ))}
                </div>
                {recommend.next_suggestion && (
                  <button
                    type="button"
                    onClick={() => setFreeText(recommend.next_suggestion!.workflow + " 만들어줘")}
                    className="cursor-pointer flex w-full items-center gap-2 rounded-lg border border-dashed border-primary bg-bg px-3 py-2 text-left text-[12px] text-text-mid transition-opacity hover:opacity-80"
                  >
                    <span className="text-[14px]">🔁</span>
                    <span>
                      <strong className="text-primary">다음 추천:</strong>{" "}
                      {recommend.next_suggestion.workflow}
                    </span>
                  </button>
                )}
              </section>
            )}
            <section className="mb-5 rounded-xl border border-primary bg-primary-light/20 p-4">
              <h2 className="mb-2 text-[13px] font-bold text-primary">✨ 한 줄로 요청하세요</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleFreeSubmit(); }}
                  placeholder='예: "이번 주 2차시 자료 전부 만들어줘"'
                  className="flex-1 rounded-lg border border-border bg-surface px-3 py-2.5 text-[14px] text-text outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={handleFreeSubmit}
                  disabled={orchestrating || !freeText.trim()}
                  className="cursor-pointer rounded-lg bg-primary px-5 py-2.5 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {orchestrating ? "생성 중..." : "🚀 생성"}
                </button>
              </div>
              {orchestratorError && (
                <div className="mt-2 rounded-lg bg-accent-light px-3 py-2 text-[12px] text-accent">
                  {orchestratorError}
                </div>
              )}
              {orchestratorResult && (
                <div className="mt-2 rounded-lg bg-primary-light px-3 py-2 text-[12px] text-primary">
                  ✅ <strong>{orchestratorResult.workflow}</strong> 완료 — {orchestratorResult.total_files}개 파일 다운로드 시작
                  (절약 ≈ {orchestratorResult.time_saved_estimate_minutes}분)
                </div>
              )}
              {orchestratorResult && orchestratorResult.files.map((f) => (
                <div key={f.skillName} className="mt-1 flex items-center justify-between rounded-lg bg-surface px-3 py-1.5 text-[11.5px]">
                  <span className="text-text-mid">이 자료가 도움이 되었나요?</span>
                  {feedbackSent[f.skillName] ? (
                    <span className="text-primary">⭐ 평가 완료 — 감사합니다</span>
                  ) : (
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => submitFeedback(f.skillName, s as 1 | 2 | 3 | 4 | 5)}
                          className="cursor-pointer rounded px-1.5 py-0.5 text-[14px] hover:bg-primary-light"
                          title={`${s}점`}
                        >
                          {s <= 2 ? "☆" : s <= 4 ? "⭐" : "🌟"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </section>

            <section className="mb-6">
              <h2 className="mb-2 text-[13px] font-bold text-text-light">⚡ 빠른 생성 (자연어 한 줄)</h2>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_WORKFLOWS.map((wf) => (
                  <button
                    key={wf.title}
                    type="button"
                    onClick={() => handleQuickWorkflow(wf.request)}
                    disabled={orchestrating}
                    className="cursor-pointer flex items-start gap-3 rounded-lg border border-border bg-surface p-3 text-left transition-all hover:border-primary-mid hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-light text-[18px]">
                      {wf.emoji}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-text">{wf.title}</div>
                      <div className="mt-0.5 text-[11.5px] text-text-light">{wf.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-2 text-[13px] font-bold text-text-light">🛠️ 개별 스킬 (고급)</h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {skills.length === 0 ? (
                  <div className="col-span-full rounded-lg border border-border bg-surface p-8 text-center text-[13px] text-text-light">
                    스킬 목록을 불러오는 중...
                  </div>
                ) : (
                  skills.map((skill) => (
                    <button
                      key={skill.name}
                      type="button"
                      onClick={() => setActiveSkill(skill.name)}
                      className="cursor-pointer flex items-start gap-3 rounded-xl border border-border bg-surface p-4 text-left transition-all hover:border-primary hover:shadow-md"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light text-[20px]">
                        {skill.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14.5px] font-bold text-text">{skill.display_name}</div>
                        <div className="mt-0.5 text-[12px] leading-relaxed text-text-mid">{skill.description}</div>
                        <div className="mt-1.5">
                          <span className="inline-block rounded-full bg-accent-light px-2 py-0.5 text-[10.5px] font-medium text-accent">
                            {skill.category}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>
          </>
        )}

        {tab === "community" && (
          <>
            <section className="mb-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[14px] font-bold text-text">🌐 공유 자료 ({communityTemplates.length})</h2>
                <button
                  type="button"
                  onClick={() => { setShowShare(true); setShareError(null); setShareSuccess(null); }}
                  className="cursor-pointer rounded-lg bg-primary px-3 py-1.5 text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
                >
                  + 자료 공유
                </button>
              </div>

              {communityLoading ? (
                <div className="rounded-lg border border-border bg-surface p-8 text-center text-[13px] text-text-light">
                  불러오는 중...
                </div>
              ) : communityTemplates.length === 0 ? (
                <div className="rounded-lg border border-dashed border-primary-mid bg-bg p-8 text-center">
                  <div className="mb-2 text-3xl">📂</div>
                  <div className="text-[13.5px] font-semibold text-text">아직 공유된 자료가 없습니다</div>
                  <div className="mt-1 text-[11.5px] text-text-light">
                    첫 번째 공유 자료가 되어보세요 — 선생님이 만든/수정한 문서가 자동으로 학습됩니다
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {communityTemplates.map((tpl) => (
                    <div key={tpl.id} className="flex items-center justify-between rounded-lg border border-border bg-surface p-3">
                      <div className="flex items-center gap-3">
                        <div className="text-[22px]">
                          {skills.find((s) => s.name === tpl.skill_type)?.icon || "📄"}
                        </div>
                        <div>
                          <div className="text-[13.5px] font-semibold text-text">{tpl.title}</div>
                          <div className="text-[11.5px] text-text-light">
                            {tpl.author} · {tpl.skill_type} · 패턴 {tpl.pattern_count}개
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFork(tpl)}
                        className="cursor-pointer rounded-lg border border-primary bg-primary-light/30 px-3 py-1 text-[11.5px] font-medium text-primary transition-opacity hover:opacity-80"
                      >
                        내 것으로 가져오기
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mb-5">
              <h2 className="mb-2 text-[13px] font-bold text-text-light">
                🤖 5명 합의 패턴 (자동 스킬 업데이트 후보)
              </h2>
              {consensusPatterns.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-bg p-5 text-center text-[12px] text-text-light">
                  아직 5명 합의에 도달한 패턴이 없습니다 (5명 이상 선생님이 같은 패턴 추가 시 자동 반영)
                </div>
              ) : (
                <div className="space-y-1.5 rounded-lg border border-primary bg-primary-light/20 p-4">
                  {consensusPatterns.slice(0, 10).map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-[12px]">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">
                          {p.count}명
                        </span>
                        <span className="text-text">
                          "<strong>{p.value}</strong>" → <code className="rounded bg-bg px-1 text-[10.5px]">{p.skill_type}</code>
                          {p.avg_satisfaction > 0 && (
                            <span className="ml-1 text-[10.5px] text-text-light">
                              ⭐ {Number(p.avg_satisfaction).toFixed(1)}
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="text-[10.5px] text-text-light">
                        ✅ 스킬 업데이트 후보
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mb-5">
              <h2 className="mb-2 text-[13px] font-bold text-text-light">
                🔧 스킬 자동 업데이트 (Loop 2 완성)
              </h2>
              {updateCandidates.filter((c) => c.status === "ready").length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-bg p-5 text-center text-[12px] text-text-light">
                  아직 적용 가능한 업데이트가 없습니다 (5명 합의 + 평균 만족도 3.5+)
                </div>
              ) : (
                <div className="space-y-2">
                  {updateCandidates.filter((c) => c.status === "ready").map((c) => (
                    <div key={c.id} className="rounded-lg border border-accent bg-accent-light/20 p-3">
                      <div className="mb-1 flex items-center gap-2 text-[12px]">
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">
                          READY
                        </span>
                        <span className="rounded-full bg-primary-light px-2 py-0.5 text-[10px] text-primary">
                          {c.skill_name}
                        </span>
                        <span className="text-text">
                          "<strong>{c.value}</strong>"
                        </span>
                        <span className="ml-auto text-[10.5px] text-text-light">
                          {c.frequency}명 · ⭐ {c.avg_satisfaction.toFixed(1)}
                        </span>
                      </div>
                      {c.suggested_update && (
                        <pre className="rounded bg-bg p-2 text-[10.5px] text-text-mid whitespace-pre-wrap">
                          {c.suggested_update}
                        </pre>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => previewApply(c.id)}
                          disabled={applyLoading}
                          className="cursor-pointer rounded border border-accent bg-accent px-2 py-1 text-[10.5px] font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                        >
                          🔧 미리보기
                        </button>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard?.writeText(c.suggested_update || "")}
                          className="cursor-pointer rounded border border-border bg-surface px-2 py-1 text-[10.5px] text-text-mid transition-opacity hover:opacity-80"
                        >
                          📋 복사
                        </button>
                        <span className="text-[10px] text-text-light self-center">
                          → services/skill-service/app/skills/{c.skill_name}.py 에 자동 적용
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-2 text-[13px] font-bold text-text-light">💡 자가 학습 작동 방식</h2>
              <ol className="space-y-1 text-[11.5px] text-text-mid list-decimal pl-5">
                <li>선생님이 생성된 문서를 수정해서 [자료 공유] 버튼 클릭</li>
                <li>ssamAI가 수정본에서 새 패턴 자동 추출 (Neo4j Pattern 노드)</li>
                <li>같은 패턴이 5명 이상 합의 시 → 해당 스킬 자동 업데이트 후보</li>
                <li>커뮤니티 탭에서 다른 선생님 자료 포크 가능</li>
              </ol>
            </section>
          </>
        )}

        {tab === "history" && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[14px] font-bold text-text">📁 최근 생성한 자료 (최대 30건)</h2>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window === "undefined") return;
                    if (!window.confirm("생성 이력을 모두 삭제할까요?")) return;
                    setHistory([]);
                    window.localStorage.removeItem("ssamai.library.history");
                  }}
                  className="cursor-pointer rounded-lg border border-border bg-surface px-3 py-1.5 text-[12px] text-text-mid transition-opacity hover:opacity-80"
                >
                  전체 삭제
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface p-12 text-center">
                <div className="mb-2 text-3xl">📂</div>
                <div className="text-[14px] font-semibold text-text">아직 생성한 자료가 없습니다</div>
                <div className="mt-1 text-[12px] text-text-light">[✨ 생성] 탭에서 한 줄로 요청하거나 5개 스킬 중 하나를 골라 시작</div>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((item, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2.5">
                    <div>
                      <div className="text-[13.5px] font-semibold text-text">{item.workflow}</div>
                      <div className="text-[11.5px] text-text-light">
                        {item.filename} · {new Date(item.generatedAt).toLocaleString("ko-KR")}
                        {item.timeSaved > 0 && ` · 절약 ≈ ${item.timeSaved}분`}
                      </div>
                    </div>
                    <span className="rounded-full bg-primary-light px-2 py-0.5 text-[10.5px] text-primary">완료</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Auto-merge preview modal */}
      {applyPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-3xl rounded-xl bg-bg p-5 shadow-xl">
            <h3 className="mb-2 text-[15px] font-bold text-text">
              🔧 SKILL.md 자동 적용 미리보기
            </h3>
            <p className="mb-3 text-[11.5px] text-text-mid">
              대상 파일: <code className="rounded bg-surface px-1 text-[10.5px]">{applyPreview.target_file}</code>
              <span className="ml-2 rounded-full bg-accent-light px-2 py-0.5 text-[10px] text-accent">
                +{applyPreview.lines_added}줄
              </span>
            </p>
            <pre className="mb-4 max-h-96 overflow-y-auto rounded-lg border border-border bg-surface p-3 text-[10.5px] leading-relaxed text-text">
              {applyPreview.diff}
            </pre>
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] text-text-light">
                적용 시 원본은 <code>.bak.&#123;timestamp&#125;</code>로 백업됩니다
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setApplyPreview(null)}
                  disabled={applyLoading}
                  className="cursor-pointer rounded border border-border bg-surface px-3 py-1.5 text-[12px] text-text-mid transition-opacity hover:opacity-80 disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={confirmApply}
                  disabled={applyLoading}
                  className="cursor-pointer rounded bg-accent px-3 py-1.5 text-[12px] font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                >
                  {applyLoading ? "적용 중…" : "✅ 적용"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {applyResult && !applyPreview && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-primary bg-bg p-3 text-[12px] text-text shadow-lg">
          {applyResult}
          <button
            type="button"
            onClick={() => setApplyResult(null)}
            className="ml-3 cursor-pointer text-text-light hover:text-text"
          >
            ✕
          </button>
        </div>
      )}

      <SkillDialog
        open={activeSkill !== null}
        onClose={() => setActiveSkill(null)}
        onGenerated={handleGenerated}
        teacherId={teacherId}
      />

      {/* Share dialog */}
      {showShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <h2 className="text-[16px] font-bold text-text">📤 자료 공유 (커뮤니티)</h2>
              <button
                type="button"
                onClick={() => setShowShare(false)}
                className="cursor-pointer rounded-md border-none bg-transparent text-[18px] text-text-light hover:text-text-mid"
              >
                ✕
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-[11.5px] text-text-light">
                자동 생성된 문서를 수정한 후 공유하면, ssamAI가 새 패턴을 학습해서 다른 선생님께도 반영합니다.
              </p>

              <div>
                <label className="mb-1 block text-[12px] font-semibold text-text-mid">문서 종류</label>
                <select
                  value={shareSkillType}
                  onChange={(e) => setShareSkillType(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-[13px] outline-none focus:border-primary"
                >
                  <option value="lesson-plan">수업 과정안</option>
                  <option value="formative-assessment">형성평가</option>
                  <option value="rubric">수행평가 루브릭</option>
                  <option value="official-letter">행정공문</option>
                  <option value="home-letter">가정통신문</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold text-text-mid">제목</label>
                <input
                  type="text"
                  value={shareTitle}
                  onChange={(e) => setShareTitle(e.target.value)}
                  placeholder="예: 4학년 현장학습 (학부모 확인란 추가)"
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-[13px] outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold text-text-mid">
                  수정본 내용 (마크다운 또는 HWPX 변환 텍스트)
                </label>
                <textarea
                  value={shareContent}
                  onChange={(e) => setShareContent(e.target.value)}
                  rows={10}
                  placeholder="수정한 문서 내용을 여기에 붙여넣으세요..."
                  className="w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 font-mono text-[11.5px] outline-none focus:border-primary placeholder:text-text-light"
                />
              </div>

              <details className="rounded-lg border border-border bg-bg p-2 text-[11px]">
                <summary className="cursor-pointer text-text-mid">원본 (선택, 패턴 추출 정확도 향상)</summary>
                <textarea
                  value={shareOriginal}
                  onChange={(e) => setShareOriginal(e.target.value)}
                  rows={4}
                  placeholder="자동 생성된 원본 내용을 붙여넣으세요..."
                  className="mt-2 w-full resize-none rounded border border-border bg-surface px-2 py-1.5 font-mono text-[11px] outline-none"
                />
              </details>

              {shareError && (
                <div className="rounded-lg bg-accent-light px-3 py-2 text-[12px] text-accent">{shareError}</div>
              )}
              {shareSuccess && (
                <div className="rounded-lg bg-primary-light px-3 py-2 text-[12px] text-primary">{shareSuccess}</div>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
              <button
                type="button"
                onClick={() => setShowShare(false)}
                className="cursor-pointer rounded-lg border border-border bg-surface px-4 py-2 text-[13px] text-text-mid transition-opacity hover:opacity-80"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleShare}
                disabled={shareSubmitting}
                className="cursor-pointer rounded-lg bg-primary px-5 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {shareSubmitting ? "공유 중..." : "📤 커뮤니티 공유"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}