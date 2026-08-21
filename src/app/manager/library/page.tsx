"use client";

import { useEffect, useState } from "react";
import { getSafetyPhrases, updateSafetyPhraseStatus } from "@/lib/api";
import { LANGUAGES } from "@/lib/seed/press-machine";
import type { SafetyPhrase } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  approved: "검수 완료",
  pending: "검수 대기",
  retracted: "사용 중지",
};

export default function LibraryPage() {
  const [phrases, setPhrases] = useState<SafetyPhrase[]>([]);

  function load() {
    getSafetyPhrases().then(setPhrases);
  }

  useEffect(load, []);

  async function handleStatus(id: string, status: "approved" | "pending" | "retracted") {
    await updateSafetyPhraseStatus(id, status);
    load();
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">안전 문구 라이브러리 (F-08)</h1>
        <p className="text-sm text-zinc-500">
          검수 완료가 아닌 문구는 F-01 콘텐츠 조립에 안전 지시로 쓰이지 않습니다. 사용자에게는
          보이지 않지만 제품 신뢰의 단일 최대 요인입니다.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-2">한국어 원문</th>
              <th className="px-4 py-2">번역 (언어 수)</th>
              <th className="px-4 py-2">상태</th>
              <th className="px-4 py-2">조치</th>
            </tr>
          </thead>
          <tbody>
            {phrases.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-400">
                  등록된 문구가 없습니다.
                </td>
              </tr>
            )}
            {phrases.map((p) => {
              const translatedCount = Object.keys(p.translations ?? {}).length;
              return (
                <tr key={p.id} className="border-t border-zinc-100 align-top dark:border-zinc-800">
                  <td className="px-4 py-2">
                    <p>{p.textKo}</p>
                    <details className="mt-1 text-xs text-zinc-500">
                      <summary className="cursor-pointer">번역 보기</summary>
                      <ul className="mt-1 space-y-0.5">
                        {LANGUAGES.filter((l) => l.code !== "ko").map((l) => (
                          <li key={l.code}>
                            {l.label}: {p.translations?.[l.code] ?? "-"}
                          </li>
                        ))}
                      </ul>
                    </details>
                  </td>
                  <td className="px-4 py-2">{translatedCount}개 언어</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-xs " +
                        (p.status === "approved"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : p.status === "retracted"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300")
                      }
                    >
                      {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      {p.status !== "approved" && (
                        <button
                          onClick={() => handleStatus(p.id, "approved")}
                          className="rounded-lg bg-emerald-600 px-2 py-1 text-xs text-white"
                        >
                          검수 완료
                        </button>
                      )}
                      {p.status !== "retracted" && (
                        <button
                          onClick={() => handleStatus(p.id, "retracted")}
                          className="rounded-lg border border-red-300 px-2 py-1 text-xs text-red-700 dark:border-red-800 dark:text-red-400"
                        >
                          사용 중지
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
