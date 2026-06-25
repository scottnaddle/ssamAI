"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { librechatApi } from "@/lib/api-client";
import { setAuth } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    if (form.password.length < 8) {
      setError("비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }

    setLoading(true);
    try {
      await librechatApi.register({
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        confirm_password: form.confirmPassword,
      });

      // Auto-login after signup so the user lands in /onboarding authenticated.
      const { token, user } = await librechatApi.login({
        email: form.email.trim(),
        password: form.password,
      });
      setAuth(token, { id: user.id, name: user.name, username: user.username });
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입 실패.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-[14px] outline-none focus:border-primary";

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-mid text-2xl">
            🌿
          </div>
          <div>
            <div className="text-center text-2xl font-extrabold text-primary">ssamAI</div>
            <div className="text-center text-[12px] text-text-light">교원 AI 조교 — 회원가입</div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-ssamAI border border-border bg-surface p-6 shadow-card"
        >
          <label className="mb-1 block text-[12px] font-semibold text-text-mid">이름</label>
          <input
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="김지영"
            className={`mb-3 ${inputCls}`}
          />

          <label className="mb-1 block text-[12px] font-semibold text-text-mid">사용자명</label>
          <input
            required
            value={form.username}
            onChange={(e) => update("username", e.target.value)}
            placeholder="jy_kim"
            className={`mb-3 ${inputCls}`}
          />

          <label className="mb-1 block text-[12px] font-semibold text-text-mid">이메일</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="teacher@example.kr"
            className={`mb-3 ${inputCls}`}
          />

          <label className="mb-1 block text-[12px] font-semibold text-text-mid">비밀번호 (최소 8자)</label>
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            placeholder="••••••••"
            className={`mb-3 ${inputCls}`}
          />

          <label className="mb-1 block text-[12px] font-semibold text-text-mid">비밀번호 확인</label>
          <input
            type="password"
            required
            minLength={8}
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            placeholder="••••••••"
            className={`mb-4 ${inputCls}`}
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
            {loading ? "가입 중..." : "회원가입"}
          </button>

          <div className="mt-4 text-center text-[12px] text-text-light">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="cursor-pointer font-semibold text-primary hover:underline">
              로그인
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
