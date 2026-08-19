"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getBoardPosts } from "@/lib/api";
import type { BoardPost } from "@/lib/types";

export default function BoardPage() {
  const [posts, setPosts] = useState<BoardPost[]>([]);

  useEffect(() => {
    getBoardPosts().then(setPosts);
  }, []);

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <Link href="/w" className="text-sm text-zinc-500">
          ← 홈으로
        </Link>
        <Link
          href="/w/board/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
        >
          + 글쓰기
        </Link>
      </div>
      <h1 className="text-xl font-semibold">현장 소통</h1>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-2">제목</th>
              <th className="px-4 py-2">작성자</th>
              <th className="px-4 py-2">작성일</th>
              <th className="px-4 py-2">조회수</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-400">
                  아직 게시글이 없습니다.
                </td>
              </tr>
            )}
            {posts.map((p) => (
              <tr key={p.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-2">
                  <Link href={`/w/board/${p.id}`} className="hover:underline">
                    {p.title}
                  </Link>
                </td>
                <td className="px-4 py-2">{p.authorDisplay}</td>
                <td className="px-4 py-2">{new Date(p.createdAt).toLocaleDateString("ko-KR")}</td>
                <td className="px-4 py-2">{p.viewCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
