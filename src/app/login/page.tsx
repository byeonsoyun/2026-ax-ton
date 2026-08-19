"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/w";

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "signup" ? { id, password, displayName } : { id, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "실패했습니다");
      router.push(next);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Safelang</h1>
        <p className="mt-1 text-sm text-zinc-500">이주노동자 안전교육 이해도 검증 플랫폼</p>
      </div>

      <div className="flex w-full max-w-xs rounded-lg border border-zinc-300 p-1 text-sm dark:border-zinc-700">
        <button
          onClick={() => setMode("login")}
          className={`flex-1 rounded-md py-2 ${mode === "login" ? "bg-zinc-900 text-white dark:bg-white dark:text-black" : ""}`}
        >
          로그인
        </button>
        <button
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-md py-2 ${mode === "signup" ? "bg-zinc-900 text-white dark:bg-white dark:text-black" : ""}`}
        >
          회원가입
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-3">
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="사업장 발급 ID"
          className="min-h-[60px] rounded-lg border border-zinc-300 px-4 text-lg dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          className="min-h-[60px] rounded-lg border border-zinc-300 px-4 text-lg dark:border-zinc-700 dark:bg-zinc-900"
        />
        {mode === "signup" && (
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="이름 (선택)"
            className="min-h-[60px] rounded-lg border border-zinc-300 px-4 text-lg dark:border-zinc-700 dark:bg-zinc-900"
          />
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={!id || !password || submitting}
          className="min-h-[60px] rounded-lg bg-zinc-900 font-medium text-white disabled:opacity-40 dark:bg-white dark:text-black"
        >
          {submitting ? "처리 중..." : mode === "login" ? "로그인" : "가입하고 시작하기"}
        </button>
      </form>

      <p className="max-w-xs text-center text-xs text-zinc-500">
        여권번호·외국인등록번호 등은 수집하지 않습니다. 사업장에서 발급받은 ID로만 로그인합니다.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
