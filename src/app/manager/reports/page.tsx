"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllHazardReports } from "@/lib/api";
import type { HazardReport } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = { received: "접수", in_progress: "처리 중", done: "완료" };

export default function ManagerReportsPage() {
  const [reports, setReports] = useState<HazardReport[]>([]);

  useEffect(() => {
    getAllHazardReports().then(setReports);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">위험요소 신고 게시판</h1>
      <p className="text-sm text-zinc-500">신고자 식별 정보는 표시되지 않습니다 (익명 신고 원칙).</p>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-2">제목</th>
              <th className="px-4 py-2">작성일</th>
              <th className="px-4 py-2">조회수</th>
              <th className="px-4 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-400">
                  접수된 신고가 없습니다.
                </td>
              </tr>
            )}
            {reports.map((r) => (
              <tr key={r.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-2">
                  <Link href={`/manager/reports/${r.id}`} className="hover:underline">
                    {r.title}
                  </Link>
                </td>
                <td className="px-4 py-2">{new Date(r.createdAt).toLocaleDateString("ko-KR")}</td>
                <td className="px-4 py-2">{r.viewCount}</td>
                <td className="px-4 py-2">{STATUS_LABEL[r.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
