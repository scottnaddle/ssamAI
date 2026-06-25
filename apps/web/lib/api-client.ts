/**
 * Server-side API clients for ssamAI downstream services.
 *
 * Browser → Next.js (these helpers) → downstream microservices.
 * In dev, next.config.mjs rewrites /api/librechat, /api/ppt, /api/persona
 * to the real services, so client code can call same-origin URLs.
 */

import type {
  ChatMessage,
  PptOutline,
  CreatePptRequest,
  TeacherPersona,
  SkillDef,
  SkillGenerateRequest,
  SkillGenerateResponse,
} from "./types";

// ─── Config ─────────────────────────────────────────────────
const LIBRECHAT_BASE =
  process.env.NEXT_PUBLIC_LIBRECHAT_API || "http://localhost:3090/api";
const PPT_BASE =
  process.env.NEXT_PUBLIC_PPT_SERVICE_API || "http://localhost:8200";
const PERSONA_BASE =
  process.env.NEXT_PUBLIC_PERSONA_SERVICE_API || "http://localhost:8100";

// ─── Helpers ────────────────────────────────────────────────
async function postJson<T>(url: string, body: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    body: JSON.stringify(body),
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} — ${text}`);
  }
  return res.json() as Promise<T>;
}

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ─── PPT service ────────────────────────────────────────────
export const pptApi = {
  /** POST /ppt/parse — extract text/structure from uploaded .pptx. */
  parse: (formData: FormData) =>
    fetch(`${PPT_BASE}/ppt/parse`, { method: "POST", body: formData }).then((r) => {
      if (!r.ok) throw new Error(`ppt/parse ${r.status}`);
      return r.json() as Promise<PptOutline>;
    }),

  /**
   * POST /ppt/create — generate a new .pptx via LLM + python-pptx.
   * The returned `pptUrl` is rewritten so the browser can fetch it via the
   * Next.js dev rewrite (`/api/ppt/:path*` → `${PPT_BASE}/:path*`).
   */
  async create(req: CreatePptRequest): Promise<{ pptUrl: string; outline: PptOutline }> {
    const raw = await postJson<{ pptUrl: string; outline: PptOutline }>(
      `${PPT_BASE}/ppt/create`,
      req,
    );
    const browserUrl = raw.pptUrl.startsWith("/")
      ? `/api/ppt${raw.pptUrl}`
      : raw.pptUrl;
    return { ...raw, pptUrl: browserUrl };
  },
};

// ─── Persona service (Graphiti) ─────────────────────────────
export const personaApi = {
  /** GET /persona/:id — read teacher persona. */
  get: (teacherId: string) =>
    getJson<TeacherPersona>(`${PERSONA_BASE}/persona/${teacherId}`),

  /** POST /persona — create or update teacher persona. */
  upsert: (persona: Omit<TeacherPersona, "createdAt" | "updatedAt">) =>
    postJson<TeacherPersona>(`${PERSONA_BASE}/persona`, persona),

  /** GET /persona/:id/related?query=... — semantic recollection. */
  recall: (teacherId: string, query: string) =>
    getJson<{ facts: string[]; sources: string[] }>(
      `${PERSONA_BASE}/persona/${teacherId}/related?query=${encodeURIComponent(query)}`,
    ),
};

// ─── LibreChat (chat + auth) ────────────────────────────────
// LIBRECHAT_BASE already ends with /api, so the paths below prepend /api.
// Ref: https://docs.librechat.ai/api
export const librechatApi = {
  login: (payload: { email: string; password: string }) =>
    postJson<{ token: string; refreshToken: string; user: { id: string; name: string; username: string } }>(
      `${LIBRECHAT_BASE}/auth/login`,
      payload,
    ),

  register: (payload: {
    name: string;
    username: string;
    email: string;
    password: string;
    confirm_password: string;
  }) => postJson<{ message: string; userId?: string }>(`${LIBRECHAT_BASE}/register`, payload),

  /**
   * Streams the assistant response via SSE. Callers must consume the body
   * as a ReadableStream (see lib/sse.ts).
   *
   * LibreChat v0.8.6 uses a "resumable stream" pattern:
   *   1. POST /api/agents/chat  → {streamId, conversationId, status}
   *   2. GET  /api/agents/chat/stream/:streamId  → SSE event stream
   *
   * The POST must complete immediately and the GET must open right after,
   * otherwise the in-memory GenerationJobManager expires the job.
   *
   * Note: `/api/messages` is GET-only (conversation history retrieval).
   */
  sendMessage: async (
    payload: {
      conversationId?: string | null;
      parentMessageId?: string;
      model: string;
      text: string;
      endpoint: "openAI";
      overridePrefix?: string;
    },
    token: string,
  ): Promise<Response> => {
    const postRes = await fetch(`${LIBRECHAT_BASE}/agents/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: JSON.stringify(payload),
    });
    if (!postRes.ok) {
      const errText = await postRes.text().catch(() => "");
      throw new Error(`agents/chat ${postRes.status} — ${errText}`);
    }
    const { streamId } = (await postRes.json()) as { streamId: string };
    if (!streamId) {
      throw new Error("agents/chat returned no streamId");
    }
    return fetch(`${LIBRECHAT_BASE}/agents/chat/stream/${streamId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
  },

  listConvos: (token: string) =>
    getJson<{
      conversations: Array<{ conversationId: string; title: string; updatedAt: string }>;
      pageNumber?: string;
      pageSize?: string;
    }>(`${LIBRECHAT_BASE}/convos`, { headers: { Authorization: `Bearer ${token}` } }),

  listModels: (token: string) =>
    getJson<{ data: Array<{ id: string }> }>(`${LIBRECHAT_BASE}/models`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// ─── Skill service (document generation skills) ──────────────
// Phase 2: Next.js API routes (apps/web/app/api/library/*)
const SKILL_BASE = "/api/library";

export const skillApi = {
  /** GET /skills — list all registered skills. */
  list: () => getJson<{ skills: SkillDef[] }>(`${SKILL_BASE}/skills`),

  /** POST /generate — generate a document, triggers browser download. */
  generate: async (req: SkillGenerateRequest): Promise<SkillGenerateResponse> => {
    const res = await fetch(`${SKILL_BASE}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`생성 실패 (${res.status}): ${text.slice(0, 200)}`);
    }
    const skillName = res.headers.get("X-Skill-Name") || req.skill_name;
    const filename = `${skillName}_${Date.now()}.hwpx`;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return {
      skill_name: skillName,
      filename,
      file_size: blob.size,
    } as unknown as SkillGenerateResponse;
  },

  /** POST /skills/upload/parse — upload & parse a document file. */
  uploadParse: async (file: File, teacherId: string, skillName: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("teacher_id", teacherId);
    formData.append("skill_name", skillName);
    const res = await fetch(`${SKILL_BASE}/skills/upload/parse`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`업로드 실패 (${res.status}): ${text}`);
    }
    return res.json() as Promise<{
      filename: string;
      file_type: string;
      title: string | null;
      sections_count: number;
      text_preview: string;
      example_id: string | null;
    }>;
  },

  /** POST /skills/examples/feedback — record 👍/👎 feedback (Phase 2 stub). */
  feedback: async (exampleId: string, helpful: boolean) => ({
    example_id: exampleId,
    help_count: helpful ? 1 : 0,
    quality_score: helpful ? 1.0 : 0.0,
  }),
};

// ─── Feedback + Skill Updates (Phase 3 B+C) ──────────────────
export const feedbackApi = {
  /** POST /api/library/feedback — 만족도 + 편집 비율 기록 */
  submit: (body: {
    teacher_id: string;
    skill_name: string;
    satisfaction: 1 | 2 | 3 | 4 | 5;
    template_id?: string;
    edit_ratio?: number;
    notes?: string;
  }) =>
    postJson<{ feedback_id: string; recorded: boolean; skill_average: { skill: string; avg: number; count: number } | null; message: string }>(
      "/api/library/feedback",
      body,
    ),

  /** GET /api/patterns/updates — 5명 합의 + 만족도 기반 스킬 업데이트 후보 */
  candidates: (skill_name?: string) =>
    getJson<{
      update_candidates: Array<{
        id: string;
        value: string;
        type: string;
        skill_name: string;
        frequency: number;
        avg_satisfaction: number;
        rating_count: number;
        status: "ready" | "candidate";
        suggested_update: string | null;
      }>;
      ready_count: number;
      threshold: { count: number; satisfaction: number };
    }>(`/api/patterns/updates${skill_name ? `?skill_name=${encodeURIComponent(skill_name)}` : ""}`),
};

// ─── Local mock (dev-only fallback when services are down) ──
export const mockChatHistory = (): ChatMessage[] => [
  {
    role: "user",
    content: "3학년 2반 광합성 단원 PPT 만들어줘. 실험 활동 포함, 15장.",
    createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  },
  {
    role: "assistant",
    content: "작년 광반응 실험 활동지 스타일 참고해서 구성할게요. 슬라이드 15장으로 잡았습니다.",
    createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    card: {
      title: "📊 슬라이드 구성 (15장)",
      slideCount: 15,
      sections: [
        "1–2장. 도입 & 탐구 질문",
        "3–5장. 광합성 개념 + 반응식",
        "6–8장. 실험 설계 & 관찰",
        "9–11장. 결과 분석 워크시트",
        "12–15장. 정리 & 심화 토론",
      ],
    },
  },
];
