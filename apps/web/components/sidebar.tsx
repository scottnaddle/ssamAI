"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Avatar } from "./avatar";
import { NavItem } from "./nav-item";
import { librechatApi } from "@/lib/api-client";
import { getStoredUser, getToken } from "@/lib/auth";

const NAV = [
  { id: "chat", icon: "💬", label: "AI 조교", href: "/chat" },
  { id: "library", icon: "📚", label: "자료 라이브러리", href: "/library" },
  { id: "persona", icon: "🎓", label: "내 페르소나", href: "/persona" },
  { id: "settings", icon: "⚙️", label: "설정", href: "/settings" },
];

interface ConvoItem {
  conversationId: string;
  title: string;
  updatedAt: string;
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const day = 86400000;
  if (diff < day) return "오늘";
  if (diff < 2 * day) return "어제";
  if (diff < 7 * day) {
    const d = new Date(iso);
    return `${d.getMonth() + 1}.${d.getDate()}`;
  }
  return new Date(iso).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [convos, setConvos] = useState<ConvoItem[]>([]);
  const [convosLoading, setConvosLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const user = getStoredUser();

  const fetchConvos = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setConvosLoading(false);
      return;
    }
    try {
      const res = await librechatApi.listConvos(token);
      const sorted = [...(res.conversations || [])].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
      setConvos(sorted);
    } catch {
      // Silently fail — sidebar is non-critical.
    } finally {
      setConvosLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchConvos();
  }, [fetchConvos, pathname]);

  return (
    <aside className="flex w-[235px] shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="border-b border-border px-4 pb-3.5 pt-[18px]">
        <Link href="/chat" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-primary to-primary-mid text-[17px]">
            🌿
          </div>
          <div>
            <div className="text-[15.5px] font-extrabold tracking-tight text-primary">ssamAI</div>
            <div className="text-[10px] text-text-light">AI 교원 조교</div>
          </div>
        </Link>
      </div>

      {/* New chat */}
      <div className="px-3 pb-1.5 pt-3">
        <button
          type="button"
          onClick={() => {
            setActiveChatId(null);
            router.push("/chat");
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-[9px] bg-primary py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          <span>+</span> 새 대화 시작
        </button>
      </div>

      {/* Nav */}
      <nav className="px-2.5 py-1">
        {NAV.map((item) => (
          <NavItem key={item.id} {...item} />
        ))}
      </nav>

      {/* Recent chats */}
      <RecentChats
        convos={convos}
        loading={convosLoading}
        activeId={activeChatId}
        onSelect={setActiveChatId}
        onRefresh={fetchConvos}
      />

      {/* Profile */}
      <div className="mt-auto flex items-center gap-2.5 border-t border-border px-3 py-2.5">
        <Avatar name={(user?.name || "?")[0]} size={32} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold">
            {user?.name || "선생님"}
          </div>
          <div className="truncate text-[11px] text-text-light">
            {user?.username || user?.id?.slice(-8) || ""}
          </div>
        </div>
        <button
          type="button"
          aria-label="프로필 메뉴"
          className="cursor-pointer text-[15px] text-text-light hover:text-text-mid"
        >
          ⋯
        </button>
      </div>
    </aside>
  );
}

function RecentChats({
  convos,
  loading,
  activeId,
  onSelect,
  onRefresh,
}: {
  convos: ConvoItem[];
  loading: boolean;
  activeId: string | null;
  onSelect: (id: string) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="flex-1 overflow-hidden px-3 pb-1.5 pt-2.5">
      <div className="mb-1.5 flex items-center justify-between px-1">
        <span className="text-[10.5px] font-bold tracking-wide text-text-light">
          최근 대화
        </span>
        {!loading && (
          <button
            type="button"
            onClick={onRefresh}
            aria-label="대화 목록 새로고침"
            className="cursor-pointer text-[11px] text-text-light transition-colors hover:text-text-mid"
          >
            ↻
          </button>
        )}
      </div>

      {loading ? (
        <div className="px-2 py-3 text-[11.5px] text-text-light">불러오는 중…</div>
      ) : convos.length === 0 ? (
        <div className="px-2 py-3 text-[11.5px] text-text-light">
          아직 대화가 없어요. 새 대화를 시작해보세요.
        </div>
      ) : (
        <ul>
          {convos.slice(0, 20).map((item) => {
            const active = activeId === item.conversationId;
            return (
              <li key={item.conversationId}>
                <button
                  type="button"
                  onClick={() => onSelect(item.conversationId)}
                  className={`w-full cursor-pointer rounded-md px-2 py-1.5 text-left transition-colors ${
                    active ? "bg-primary-light" : "hover:bg-primary-light/50"
                  }`}
                >
                  <div
                    className={`truncate text-[12px] font-medium ${
                      active ? "text-primary" : "text-text"
                    }`}
                  >
                    {item.title || "제목 없는 대화"}
                  </div>
                  <div className="text-[10.5px] text-text-light">
                    {formatRelativeTime(item.updatedAt)}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
