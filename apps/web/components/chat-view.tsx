"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, PptOutline, SkillGenerateResponse, TeacherPersona } from "@/lib/types";
import { PersonaPanel } from "./persona-panel";
import { PptCreateDialog } from "./ppt-create-dialog";
import { SkillDialog } from "./skill-dialog";
import { getToken } from "@/lib/auth";
import { librechatApi } from "@/lib/api-client";
import { consumeSSEStream, tryParseData, type LibreChatMessageEvent } from "@/lib/sse";

interface ChatViewProps {
  teacherId: string;
  persona: Pick<
    TeacherPersona,
    "name" | "subject" | "schoolLevel" | "teachingStyle" | "currentClass"
  >;
  initialMessages?: ChatMessage[];
  /** LibreChat model id — must exist in librechat.yaml model list. */
  model?: string;
}

const QUICK_CHIPS = [
  "📊 PPT 만들기",
  "📝 문서 작성",
  "✏️ 자료 수정",
  "🔗 공유 자료 가져오기",
] as const;

const ROOT_PARENT_ID = "00000000-0000-0000-0000-000000000000";

export function ChatView({
  teacherId,
  persona,
  initialMessages = [],
  model = "deepseek-chat",
}: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [lastParentId, setLastParentId] = useState<string>(ROOT_PARENT_ID);
  const [pptDialogOpen, setPptDialogOpen] = useState(false);
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  function appendAssistantPlaceholder(messageId: string): number {
    const placeholder: ChatMessage = {
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      messageId,
    };
    setMessages((m) => [...m, placeholder]);
    return -1;
  }

  function updateAssistantContent(messageId: string, updater: (prev: string) => string) {
    setMessages((prev) =>
      prev.map((m) =>
        m.messageId === messageId && m.role === "assistant"
          ? { ...m, content: updater(m.content) }
          : m,
      ),
    );
  }

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const token = getToken();
    if (!token) {
      setStreamError("로그인이 필요합니다. /login으로 이동해 주세요.");
      return;
    }

    const userMessageId = crypto.randomUUID();
    const responseMessageId = crypto.randomUUID();
    const userMsg: ChatMessage = {
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
      messageId: userMessageId,
      conversationId,
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);
    setStreamError(null);
    appendAssistantPlaceholder(responseMessageId);

    abortRef.current = new AbortController();

    try {
      const res = await librechatApi.sendMessage(
        {
          conversationId: conversationId ?? undefined,
          parentMessageId: lastParentId,
          model,
          endpoint: "openAI",
          text: trimmed,
        },
        token,
      );

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`LibreChat 오류 (${res.status}): ${errText.slice(0, 200)}`);
      }

      let aggregated = "";
      let resolvedConvoId = conversationId;

      await consumeSSEStream(res, {
        onEvent: ({ event, data }) => {
          if (event === "error") {
            throw new Error(data || "LibreChat stream error");
          }
          const payload = tryParseData<LibreChatMessageEvent>(data);
          if (!payload) return;

          // Surface server-side errors that arrive as a `message` event with an error field.
          if (payload.error) {
            throw new Error(payload.error);
          }

          // Resolve conversationId from any phase that carries it (user echo, final).
          const cid =
            payload.message?.conversationId ??
            payload.conversation?.conversationId ??
            payload.responseMessage?.conversationId;
          if (cid && !resolvedConvoId) {
            resolvedConvoId = cid;
            setConversationId(cid);
          }

          // Text delta — the actual streamed response chunks.
          if (payload.event === "on_message_delta") {
            const content = payload.data?.delta?.content;
            if (Array.isArray(content)) {
              for (const part of content) {
                if (part?.type === "text" && typeof part.text === "string") {
                  aggregated += part.text;
                  updateAssistantContent(responseMessageId, (prev) => prev + part.text);
                }
              }
            }
          }

          // Final frame — optionally backfill the full responseMessage text if
          // any deltas were missed (e.g., on reconnect).
          if (payload.final && payload.responseMessage) {
            const finalText =
              payload.responseMessage.text ||
              (payload.responseMessage.content || [])
                .filter((p) => p?.type === "text" && typeof p.text === "string")
                .map((p) => p.text)
                .join("");
            if (finalText && !aggregated) {
              aggregated = finalText;
              updateAssistantContent(responseMessageId, () => finalText);
            }
            if (payload.responseMessage.messageId) {
              setLastParentId(payload.responseMessage.messageId);
              return;
            }
          }
        },
      });

      // Mark final parent for the next turn so message threading stays linear.
      setLastParentId(responseMessageId);

      // If no text came back at all, surface a friendly error.
      if (!aggregated) {
        updateAssistantContent(
          responseMessageId,
          () => "(빈 응답 — LiteLLM/DeepSeek 연결을 확인하세요.)",
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setStreamError(message);
      updateAssistantContent(
        responseMessageId,
        () => `⚠️ 응답 스트리밍 실패: ${message}`,
      );
    } finally {
      abortRef.current = null;
      setSending(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  function handleStop() {
    abortRef.current?.abort();
    setSending(false);
  }

  function handleChipClick(chip: string) {
    if (chip.startsWith("📊")) {
      setPptDialogOpen(true);
      return;
    }
    if (chip.startsWith("📝")) {
      setSkillDialogOpen(true);
      return;
    }
    setInput(chip.split(" ").slice(1).join(" ") + " ");
  }

  function handlePptCreated(result: { pptUrl: string; outline: PptOutline; topic: string }) {
    const userAck: ChatMessage = {
      role: "user",
      content: `📊 PPT 만들어줘. 주제: ${result.topic} (${result.outline.slideCount}장)`,
      createdAt: new Date().toISOString(),
      conversationId,
    };
    const assistant: ChatMessage = {
      role: "assistant",
      content: `"${result.topic}" PPT를 ${result.outline.slideCount}장으로 생성했어요. 다운로드해서 수업에 바로 활용해 보세요!`,
      createdAt: new Date().toISOString(),
      card: {
        title: `📊 슬라이드 구성 (${result.outline.slideCount}장)`,
        slideCount: result.outline.slideCount,
        sections: result.outline.slides.map(
          (s) => `${s.index}장. ${s.title ?? s.textPreview ?? "(제목 없음)"}`,
        ),
        downloadUrl: result.pptUrl,
        fileName: result.outline.fileName,
      },
    };
    setMessages((m) => [...m, userAck, assistant]);
  }

  function handleSkillGenerated(result: SkillGenerateResponse) {
    const skillName = result.skill_name === "lesson-plan" ? "수업지도안" : result.skill_name;
    const paramsSummary = Object.entries(result.params_used)
      .filter(([, v]) => v)
      .map(([, v]) => v)
      .join(", ");
    const userAck: ChatMessage = {
      role: "user",
      content: `📝 ${skillName} 생성 요청 — ${paramsSummary}`,
      createdAt: new Date().toISOString(),
      conversationId,
    };
    const assistant: ChatMessage = {
      role: "assistant",
      content: result.content,
      createdAt: new Date().toISOString(),
      messageId: crypto.randomUUID(),
    };
    setMessages((m) => [...m, userAck, assistant]);
  }

  function handleDocumentUploaded(result: {
    filename: string;
    title: string | null;
    textPreview: string;
    exampleId: string | null;
  }) {
    const userAck: ChatMessage = {
      role: "user",
      content: `📁 자료 업로드: ${result.filename}`,
      createdAt: new Date().toISOString(),
      conversationId,
    };
    const titleLine = result.title ? `**제목**: ${result.title}\n\n` : "";
    const idLine = result.exampleId
      ? `\n\n---\n*예시 ID \`${result.exampleId}\`로 저장되었습니다. 이후 유사 문서 생성 시 참고됩니다.*`
      : "";
    const assistant: ChatMessage = {
      role: "assistant",
      content: `📁 **${result.filename}** 업로드 완료! 내용을 분석해서 저장했어요.\n\n${titleLine}${result.textPreview.slice(0, 800)}${result.textPreview.length > 800 ? "..." : ""}${idLine}`,
      createdAt: new Date().toISOString(),
      messageId: crypto.randomUUID(),
    };
    setMessages((m) => [...m, userAck, assistant]);
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Chat column */}
      <section className="flex flex-1 flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            messages.map((m, i) => <ChatBubble key={m.messageId ?? `idx-${i}`} msg={m} />)
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border bg-surface px-5 py-3.5">
          {streamError && (
            <div className="mb-2 rounded-lg bg-accent-light px-3 py-2 text-[12px] text-accent">
              {streamError}
            </div>
          )}
          <div className="mb-2 flex flex-wrap gap-1.5">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipClick(chip)}
                disabled={sending}
                className="cursor-pointer rounded-full border border-border bg-surface px-3 py-1 text-[11.5px] text-text-mid transition-colors hover:border-primary-mid hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {chip}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2 rounded-[13px] border-[1.5px] border-border bg-bg px-3 py-2.5">
            <button
              type="button"
              aria-label="파일 첨부"
              className="cursor-pointer border-none bg-transparent text-[18px] text-text-mid hover:text-primary"
            >
              📎
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="수업 자료 생성, 수정, 질문을 자유롭게 입력하세요..."
              rows={2}
              className="min-h-[40px] flex-1 resize-none border-none bg-transparent text-[13.5px] leading-relaxed text-text outline-none placeholder:text-text-light"
            />
            {sending ? (
              <button
                type="button"
                onClick={handleStop}
                aria-label="응답 중단"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[9px] border-none bg-accent text-[13px] font-bold text-white transition-opacity hover:opacity-90"
              >
                ■
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={!input.trim()}
                aria-label="전송"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[9px] border-none bg-primary text-[15px] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ↑
              </button>
            )}
          </div>
          <div className="mt-1.5 text-[11px] text-text-light">
            model: <code className="rounded bg-primary-light px-1 text-primary">{model}</code>
            {conversationId && (
              <>
                {" · "}convo: <code className="text-text-mid">{conversationId.slice(0, 8)}…</code>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Right panel */}
      <PersonaPanel persona={persona} />

      <PptCreateDialog
        open={pptDialogOpen}
        onClose={() => setPptDialogOpen(false)}
        onCreated={handlePptCreated}
        defaultSubject={persona.subject}
        defaultSchoolLevel={persona.schoolLevel}
        teacherId={teacherId}
      />

      <SkillDialog
        open={skillDialogOpen}
        onClose={() => setSkillDialogOpen(false)}
        onGenerated={handleSkillGenerated}
        onUploaded={handleDocumentUploaded}
        teacherId={teacherId}
        defaultSubject={persona.subject}
        defaultSchoolLevel={persona.schoolLevel}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-text-light">
      <div className="text-3xl">🌿</div>
      <div className="text-[15px] font-semibold text-primary">새 대화를 시작하세요</div>
      <div className="max-w-xs text-[13px]">
        수업 자료 생성, 행정 문서 작성, 기존 자료 분석 등 무엇이든 물어보세요.
      </div>
    </div>
  );
}

function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  const time = new Date(msg.createdAt).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const isStreaming = !isUser && msg.role === "assistant" && msg.content === "";

  return (
    <div className={`mb-4 flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      {!isUser && (
        <div className="mb-1.5 flex items-center gap-2">
          <div className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-mid text-[13px]">
            🌿
          </div>
          <span className="text-[12px] font-semibold text-primary">ssamAI</span>
          <span className="text-[11px] text-text-light">{isStreaming ? "응답 생성 중…" : time}</span>
        </div>
      )}
      {msg.file && (
        <div className="mb-1.5 flex items-center gap-2 rounded-[9px] border border-border bg-accent-light px-3 py-1.5 text-[12px]">
          🖼 {msg.file.name}
        </div>
      )}
      <div
        className={`max-w-[76%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed text-text ${
          isUser
            ? "rounded-br-sm bg-userBubble"
            : "rounded-bl-sm border border-border bg-surface shadow-card"
        }`}
      >
        {msg.content || (isStreaming ? "…" : "")}
        {msg.card && <SlideOutlineCard card={msg.card} />}
      </div>
      {!isUser && msg.card && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {["📥 PPT 다운로드", "🔗 커뮤니티에 공유", "✏️ 추가 수정"].map((b) => (
            <button
              key={b}
              type="button"
              className="cursor-pointer rounded-full border border-border bg-surface px-3 py-1 text-[11.5px] font-medium text-text transition-colors hover:border-primary-mid"
            >
              {b}
            </button>
          ))}
        </div>
      )}
      {isUser && <span className="mt-0.5 text-[11px] text-text-light">{time}</span>}
    </div>
  );
}

function SlideOutlineCard({ card }: { card: NonNullable<ChatMessage["card"]> }) {
  return (
    <div className="mt-2.5 rounded-[9px] border border-border bg-bg px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="text-[11px] font-bold text-primary">{card.title}</div>
        {card.downloadUrl && (
          <a
            href={card.downloadUrl}
            download={card.fileName ?? undefined}
            className="cursor-pointer rounded-md bg-primary px-2 py-0.5 text-[10.5px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            📥 다운로드
          </a>
        )}
      </div>
      {card.sections.map((s, j) => (
        <div
          key={j}
          className={`py-0.5 text-[11.5px] text-text-mid ${
            j < card.sections.length - 1 ? "border-b border-border" : ""
          }`}
        >
          {s}
        </div>
      ))}
    </div>
  );
}
