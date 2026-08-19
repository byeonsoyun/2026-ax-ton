"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBoardPost } from "@/lib/api";

export default function NewBoardPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      const post = await createBoardPost({ title: title.trim(), body: body.trim(), anonymous });
      router.push(`/w/board/${post.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <Link href="/w/board" className="text-sm text-zinc-500">
        ← 목록으로
      </Link>
      <h1 className="text-xl font-semibold">글쓰기</h1>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목"
        className="min-h-[60px] rounded-lg border border-zinc-300 px-4 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="내용"
        rows={6}
        className="rounded-lg border border-zinc-300 p-3 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
        익명으로 작성
      </label>

      <button
        onClick={handleSubmit}
        disabled={!title.trim() || !body.trim() || submitting}
        className="min-h-[60px] rounded-lg bg-zinc-900 font-medium text-white disabled:opacity-40 dark:bg-white dark:text-black"
      >
        {submitting ? "등록 중..." : "등록"}
      </button>
    </div>
  );
}
