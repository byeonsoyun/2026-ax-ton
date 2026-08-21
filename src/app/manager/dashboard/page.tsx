"use client";

import { useEffect, useState } from "react";
import { getAllTrainingRecords } from "@/lib/api";
import { LANGUAGES } from "@/lib/seed/press-machine";
import type { QuizItemType, TrainingRecord } from "@/lib/types";

const LANG_LABEL: Record<string, string> = Object.fromEntries(LANGUAGES.map((l) => [l.code, l.label]));

const ITEM_TYPE_LABEL: Record<QuizItemType, string> = {
  sequence: "절차 시뮬레이션형",
  hotspot: "위험지점 핫스팟형",
  branch: "분기 시나리오형",
};

// 정기교육 주기를 90일(분기)로 가정한 데모용 값 — 실제로는 교육 유형별 법정 주기를 반영해야 한다 (PRD §3 요구사항)
const RETRAINING_CYCLE_DAYS = 90;

function grade(rate: number): { label: string; className: string } {
  if (rate >= 80) return { label: "양호", className: "text-emerald-600 dark:text-emerald-400" };
  if (rate >= 50) return { label: "보통", className: "text-amber-600 dark:text-amber-400" };
  return { label: "낮음", className: "text-red-600 dark:text-red-400" };
}

export default function DashboardPage() {
  const [records, setRecords] = useState<TrainingRecord[]>([]);

  useEffect(() => {
    getAllTrainingRecords().then(setRecords).catch(() => {});
  }, []);

  const completed = records.filter((r) => r.completedAt);
  const passRate = completed.length
    ? Math.round((completed.filter((r) => r.passed).length / completed.length) * 100)
    : 0;

  // 언어 x 문항유형별 정답률 집계 — 개인 식별 없이 콘텐츠 개선 신호로만 쓴다 (PRD §4.2 원칙 4)
  const agg = new Map<string, { total: number; passed: number }>();
  for (const r of completed) {
    for (const q of r.quizResults ?? []) {
      const key = `${r.language}|${q.itemType}`;
      const cell = agg.get(key) ?? { total: 0, passed: 0 };
      cell.total += 1;
      if (q.passed) cell.passed += 1;
      agg.set(key, cell);
    }
  }
  const weakRows = [...agg.entries()]
    .map(([key, v]) => {
      const [lang, itemType] = key.split("|");
      return { lang, itemType: itemType as QuizItemType, rate: Math.round((v.passed / v.total) * 100), total: v.total };
    })
    .sort((a, b) => a.rate - b.rate);

  const dueSoonCount = completed.filter((r) => {
    const due = new Date(r.completedAt!).getTime() + RETRAINING_CYCLE_DAYS * 86400000;
    return due - Date.now() <= 7 * 86400000;
  }).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">담당자 대시보드</h1>
        <p className="text-sm text-zinc-500">F-06 — Supabase에 저장된 교육 기록 기준</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="교육 완료 인원" value={String(completed.length)} />
        <StatCard label="이해도 검증 통과율" value={`${passRate}%`} />
        <StatCard label="미이수(진행 중)" value={String(records.length - completed.length)} />
        <StatCard label="재교육 기한 임박(7일 이내)" value={String(dueSoonCount)} />
      </div>

      <div>
        <h2 className="mb-2 text-lg font-medium">언어별·항목별 취약점</h2>
        <p className="mb-2 text-sm text-zinc-500">
          낮은 정답률은 노동자 평가가 아니라 콘텐츠 개선 신호입니다 (PRD §4.2 원칙 4).
        </p>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-2">언어</th>
                <th className="px-4 py-2">문항 유형</th>
                <th className="px-4 py-2">정답률</th>
                <th className="px-4 py-2">등급</th>
                <th className="px-4 py-2">응답 수</th>
              </tr>
            </thead>
            <tbody>
              {weakRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-zinc-400">
                    아직 집계할 검증 결과가 없습니다.
                  </td>
                </tr>
              )}
              {weakRows.map((row) => {
                const g = grade(row.rate);
                return (
                  <tr key={`${row.lang}-${row.itemType}`} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="px-4 py-2">{LANG_LABEL[row.lang] ?? row.lang}</td>
                    <td className="px-4 py-2">{ITEM_TYPE_LABEL[row.itemType] ?? row.itemType}</td>
                    <td className="px-4 py-2 tabular-nums">{row.rate}%</td>
                    <td className={`px-4 py-2 font-medium ${g.className}`}>{g.label}</td>
                    <td className="px-4 py-2 tabular-nums">{row.total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-medium">교육 기록</h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-2">노동자</th>
                <th className="px-4 py-2">언어</th>
                <th className="px-4 py-2">상태</th>
                <th className="px-4 py-2">시작</th>
                <th className="px-4 py-2">완료</th>
                <th className="px-4 py-2">다음 기한</th>
                <th className="px-4 py-2">서명</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-zinc-400">
                    아직 교육 기록이 없습니다. 노동자 화면에서 교육을 완료하면 여기 표시됩니다.
                  </td>
                </tr>
              )}
              {records.map((r) => {
                const dueAt = r.completedAt
                  ? new Date(new Date(r.completedAt).getTime() + RETRAINING_CYCLE_DAYS * 86400000)
                  : null;
                const dDay = dueAt ? Math.ceil((dueAt.getTime() - Date.now()) / 86400000) : null;
                return (
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
                    <td className="px-4 py-2 tabular-nums">
                      {dDay === null ? "-" : dDay <= 0 ? "기한 경과" : `D-${dDay}`}
                    </td>
                    <td className="px-4 py-2">{r.signatureName ?? "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
