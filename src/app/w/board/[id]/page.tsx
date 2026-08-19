"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { addBoardComment, getBoardPost } from "@/lib/api";
import type { BoardPostDetail } from "@/lib/types";

export default function BoardPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [post, setPost] = useState<BoardPostDetail | null>(null);
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  function load() {
    getBoardPost(id).then(setPost);
  }

  useEffect(load, [id]);

  async function handleComment() {
    if (!comment.trim()) return;
    await addBoardComment(id, comment.trim(), anonymous);
    setComment("");
    load();
  }

  if (!post) return <p className="p-6 text-zinc-400">불러오는 중...</p>;

  return (
    <div className="flex flex-col gap-4 p-6">
      <Link href="/w/board" className="text-sm text-zinc-500">
        ← 목록으로
      </Link>

      <div>
        <h1 className="text-xl font-semibold">{post.title}</h1>
        <p className="text-sm text-zinc-500">
          {post.authorDisplay} · {new Date(post.createdAt).toLocaleString("ko-KR")} · 조회 {post.viewCount}
        </p>
      </div>

      <p className="whitespace-pre-wrap rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">{post.body}</p>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">댓글 {post.comments.length}</p>
        {post.comments.map((c) => (
          <div key={c.id} className="rounded-lg bg-zinc-100 p-3 text-sm dark:bg-zinc-800">
            <p className="text-xs text-zinc-500">
              {c.authorDisplay} · {new Date(c.createdAt).toLocaleString("ko-KR")}
            </p>
            <p>{c.body}</p>
          </div>
        ))}

        <div className="flex gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="댓글 입력"
          />
          <button
            onClick={handleComment}
            className="rounded-lg bg-zinc-900 px-4 text-sm text-white dark:bg-white dark:text-black"
          >
            등록
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs text-zinc-500">
          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
          익명으로 댓글 작성
        </label>
      </div>
    </div>
  );
}
