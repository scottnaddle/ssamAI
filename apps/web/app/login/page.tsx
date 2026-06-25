"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `로그인 실패 (HTTP ${res.status})`);
      }
      const { token, user } = await res.json();
      setAuth(token, { id: user.id, name: user.name, username: user.username });
      router.push("/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-mid text-2xl">
            🌿
          </div>
          <div>
            <div className="text-center text-2xl font-extrabold text-primary">ssamAI</div>
            <div className="text-center text-[12px] text-text-light">AI 교원 조교</div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-ssamAI border border-border bg-surface p-6 shadow-card"
        >
          <h1 className="mb-5 text-[18px] font-bold">로그인</h1>

          <label className="mb-1 block text-[12px] font-semibold text-text-mid">이메일</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teacher@example.kr"
            className="mb-3 w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-[14px] outline-none focus:border-primary"
          />

          <label className="mb-1 block text-[12px] font-semibold text-text-mid">비밀번호</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mb-4 w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-[14px] outline-none focus:border-primary"
          />

          {error && (
            <div className="mb-3 rounded-lg bg-accent-light px-3 py-2 text-[12px] text-accent">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer rounded-lg bg-primary py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>

          <div className="mt-4 text-center text-[12px] text-text-light">
            계정이 없으신가요?{" "}
            <Link href="/signup" className="cursor-pointer font-semibold text-primary hover:underline">
              회원가입
            </Link>
          </div>
        </form>

        <div className="mt-4 text-center text-[11px] leading-relaxed text-text-light">
          Phase 1은 LibreChat 자체 인증(이메일/JWT)을 사용합니다.
          <br />
          카카오/구글 소셜 로그인은 Phase 2에 추가됩니다.
        </div>
      </div>
    </div>
  );
}
