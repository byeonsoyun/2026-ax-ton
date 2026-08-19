"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const SAFETY_BANNER = [
  "안전은 서명이 아니라 이해에서 시작됩니다.",
  "오늘도 작업 전 위험 요소를 한 번 더 확인하세요.",
  "이상하다고 느껴지면, 신고는 익명으로 안전하게 처리됩니다.",
];

export default function WorkerHome() {
  const router = useRouter();
  const [me, setMe] = useState<{ id: string; displayName: string | null } | null>(null);
  const [bannerIndex, setBannerIndex] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then(setMe);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setBannerIndex((i) => (i + 1) % SAFETY_BANNER.length), 5000);
    return () => clearInterval(t);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-6">
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold">
          안녕하세요{me?.displayName ? `, ${me.displayName}님` : ""}
        </p>
        <button onClick={handleLogout} className="text-sm text-zinc-500 underline">
          로그아웃
        </button>
      </div>

      <div className="rounded-lg bg-amber-50 p-4 text-center text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        {SAFETY_BANNER[bannerIndex]}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/w/mypage"
          className="rounded-lg border border-zinc-300 p-6 text-center hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          <p className="text-lg font-medium">마이페이지</p>
          <p className="mt-1 text-sm text-zinc-500">회원정보·수강이력·신고이력</p>
        </Link>
        <Link
          href="/w/courses"
          className="rounded-lg border border-zinc-300 p-6 text-center hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          <p className="text-lg font-medium">안전교육 수강</p>
          <p className="mt-1 text-sm text-zinc-500">강의 목록·이해도 검증</p>
        </Link>
        <Link
          href="/w/report"
          className="rounded-lg border border-zinc-300 p-6 text-center hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          <p className="text-lg font-medium">위험요소 신고</p>
          <p className="mt-1 text-sm text-zinc-500">사진 한 장으로 익명 신고</p>
        </Link>
        <Link
          href="/w/board"
          className="rounded-lg border border-zinc-300 p-6 text-center hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          <p className="text-lg font-medium">현장 소통</p>
          <p className="mt-1 text-sm text-zinc-500">공지·소통 게시판</p>
        </Link>
      </div>
    </div>
  );
}
