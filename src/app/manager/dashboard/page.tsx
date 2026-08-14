"use client";

import { useEffect, useState } from "react";
import { getAllTrainingRecords } from "@/lib/storage";
import type { TrainingRecord } from "@/lib/types";

const LANG_LABEL: Record<string, string> = { ko: "한국어", vi: "Tiếng Việt", km: "ភាសាខ្មែរ" };

export default function DashboardPage() {
  const [records, setRecords] = useState<TrainingRecord[]>([]);

  useEffect(() => {
    setRecords(getAllTrainingRecords());
  }, []);

  const completed = records.filter((r) => r.completedAt);
  const passRate = completed.length
    ? Math.round((completed.filter((r) => r.passed).length / completed.length) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">담당자 대시보드</h1>
        <p className="text-sm text-zinc-500">
          F-06 최소 버전 — 이 브라우저에 저장된 교육 기록 기준 (데모: 실제 배포 시 Supabase로 교체)
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="교육 완료 인원" value={String(completed.length)} />
        <StatCard label="이해도 검증 통과율" value={`${passRate}%`} />
        <StatCard label="미이수(진행 중)" value={String(records.length - completed.length)} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-2">노동자</th>
              <th className="px-4 py-2">언어</th>
              <th className="px-4 py-2">상태</th>
              <th className="px-4 py-2">시작</th>
              <th className="px-4 py-2">완료</th>
              <th className="px-4 py-2">서명</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-400">
                  아직 교육 기록이 없습니다. 노동자 화면에서 교육을 완료하면 여기 표시됩니다.
                </td>
              </tr>
            )}
            {records.map((r) => (
              <tr key={r.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-2 font-mono text-xs">{r.workerAnonId}</td>
                <td className="px-4 py-2">{LANG_LABEL[r.language] ?? r.language}</td>
                <td className="px-4 py-2">
                  {r.completedAt ? (
                    <span
                      className={
                        r.passed
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }
                    >
                      {r.passed ? "통과" : "미달"}
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400">진행 중</span>
                  )}
                </td>
                <td className="px-4 py-2">{new Date(r.startedAt).toLocaleString("ko-KR")}</td>
                <td className="px-4 py-2">
                  {r.completedAt ? new Date(r.completedAt).toLocaleString("ko-KR") : "-"}
                </td>
                <td className="px-4 py-2">{r.signatureName ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
