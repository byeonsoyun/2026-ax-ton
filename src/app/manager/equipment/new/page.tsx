"use client";

import { useState } from "react";

type AnalysisResult = {
  equipmentType: string;
  suggestedSteps: { order: number; label: string }[];
  suggestedHazards: { label: string; consequenceText: string }[];
  source: "claude-vision" | "mock";
};

export default function NewEquipmentPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [approved, setApproved] = useState(false);

  async function analyze() {
    setLoading(true);
    try {
      const formData = new FormData();
      if (file) formData.append("photo", file);
      const res = await fetch("/api/analyze-equipment", { method: "POST", body: formData });
      const data = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">설비 등록 (F-01 1단계)</h1>
        <p className="text-sm text-zinc-500">
          사진을 올리면 설비 유형·위험 요소·조작 순서 후보를 분석합니다. 담당자 승인 전까지는
          체크리스트로 확정되지 않습니다 (게이트 1).
        </p>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        <button
          onClick={analyze}
          disabled={loading}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-40 dark:bg-white dark:text-black"
        >
          {loading ? "분석 중..." : "분석 요청"}
        </button>
      </div>

      {result && (
        <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <p className="font-medium">분석 결과 (검토·수정 후 승인하세요)</p>
            <span
              className={
                "rounded-full px-2 py-0.5 text-xs " +
                (result.source === "claude-vision"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300")
              }
            >
              {result.source === "claude-vision" ? "Claude Vision 실제 분석" : "목(mock) 응답 — ANTHROPIC_API_KEY 미설정"}
            </span>
          </div>

          <div>
            <p className="text-sm text-zinc-500">설비 유형</p>
            <p>{result.equipmentType}</p>
          </div>

          <div>
            <p className="mb-1 text-sm text-zinc-500">조작 순서 후보</p>
            <ol className="list-decimal pl-5 text-sm">
              {result.suggestedSteps.map((s) => (
                <li key={s.order}>{s.label}</li>
              ))}
            </ol>
          </div>

          <div>
            <p className="mb-1 text-sm text-zinc-500">위험 요소 후보</p>
            <ul className="list-disc pl-5 text-sm">
              {result.suggestedHazards.map((h, i) => (
                <li key={i}>
                  {h.label} — {h.consequenceText}
                </li>
              ))}
            </ul>
          </div>

          {approved ? (
            <p className="text-emerald-600 dark:text-emerald-400">
              승인 완료. (데모: 실제로는 여기서 Equipment 레코드가 Supabase에 status=&quot;approved&quot;로 저장됩니다)
            </p>
          ) : (
            <button
              onClick={() => setApproved(true)}
              className="self-start rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white"
            >
              검토 완료 — 승인
            </button>
          )}
        </div>
      )}
    </div>
  );
}
