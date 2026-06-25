/**
 * Shared TypeScript types for @ssamAI/web.
 * Centralised so server components, client components, and API helpers agree.
 */

export type SchoolLevel = "초등" | "중학교" | "고등학교";
export type TeachingStyle = "실험·탐구 중심" | "강의식" | "토론·프로젝트 중심" | "게임·활동 중심";

/** Teacher persona — stored in Graphiti, surfaced in the right panel. */
export interface TeacherPersona {
  teacherId: string;
  name: string;
  schoolLevel: SchoolLevel;
  subject: string;
  school?: string;
  teachingStyle: TeachingStyle;
  philosophy?: string;
  currentClass?: {
    grade: string;
    className: string;
    studentCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

/** Chat message — mirrors LibreChat message schema (subset). */
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  /** Optional structured card attached to assistant message. */
  card?: SlideCard;
  /** Optional file attachment metadata. */
  file?: { name: string; type: string; size?: number };
  createdAt: string;
  /** LibreChat message id (Mongo ObjectId) — populated after API roundtrip. */
  messageId?: string;
  /** LibreChat conversation id. */
  conversationId?: string;
}

/** Slide outline card shown after PPT generation requests. */
export interface SlideCard {
  title: string;
  slideCount: number;
  sections: string[];
  /** Populated when this card represents a generated file available for download. */
  downloadUrl?: string;
  /** Original file name from ppt-service (used as anchor text). */
  fileName?: string;
}

/** Sidebar nav item — matches the wireframe nav array. */
export interface NavItem {
  id: string;
  icon: string; // emoji placeholder until icon system chosen
  label: string;
  badge?: string;
  href: string;
}

/** Recent chat list entry in sidebar. */
export interface ChatHistoryItem {
  id: string;
  label: string;
  time: string;
  updatedAt: string;
}

/** PPT file metadata — from ppt-service parse response. */
export interface PptOutline {
  fileName: string;
  slideCount: number;
  slides: Array<{
    index: number;
    title: string | null;
    textPreview: string | null;
  }>;
}

/** Create-PPT request body. */
export interface CreatePptRequest {
  topic: string;
  schoolLevel: SchoolLevel;
  subject: string;
  grade?: string;
  slideCount: number;
  /** Teacher id — used to personalise via persona-service. */
  teacherId: string;
  /** Optional style hint passed to LLM. */
  styleHint?: string;
}

/** Skill system types. */
export interface SkillParamField {
  key: string;
  label: string;
  type: "text" | "select" | "number" | "textarea";
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface SkillDef {
  name: string;
  display_name: string;
  description: string;
  category: string;
  icon: string;
  params: SkillParamField[];
  requires_teacher_context: boolean;
}

export interface SkillGenerateRequest {
  skill_name: string;
  teacher_id: string;
  model?: string;
  params: Record<string, string>;
}

export interface SkillGenerateResponse {
  skill_name: string;
  content: string;
  model_used: string;
  params_used: Record<string, string>;
  example_count: number;
  filename?: string;
  file_size?: number;
}
