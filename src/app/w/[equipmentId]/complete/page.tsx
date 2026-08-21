"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { completeTrainingRecord, getEquipment, getTrainingRecord } from "@/lib/api";
import { DownloadCertificateButton } from "@/components/DownloadCertificateButton";
import { ProgressSteps } from "@/components/ProgressSteps";
import type { QuizResult, TrainingRecord } from "@/lib/types";

const ITEM_LABEL: Record<string, string> = {
  sequence: "절차 시뮬레이션형",
  hotspot: "위험지점 핫스팟형",
  branch: "분기 시나리오형",
};

export default function CompletePage({
  params,
}: {
  params: Promise<{ equipmentId: string }>;
}) {
  const { equipmentId } = use(params);
  const searchParams = useSearchParams();
  const recordId = searchParams.get("recordId") ?? "";
  const results: QuizResult[] = useMemo(() => {
    try {
      return JSON.parse(decodeURIComponent(searchParams.get("results") ?? "[]"));
    } catch {
      return [];
    }
  }, [searchParams]);

  const [signature, setSignature] = useState("");
  const [saved, setSaved] = useState<TrainingRecord | null>(null);
  const [equipmentName, setEquipmentName] = useState("설비");
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    getEquipment(equipmentId)
      .then((eq) => setEquipmentName(eq.name))
      .catch(() => {});
    getTrainingRecord(recordId)
      .then((r) => {
        if (r.completedAt) setSaved(r);
      })
      .catch((err) => setLoadError(err.message));
  }, [equipmentId, recordId]);

  async function handleShare() {
    if (!saved) return;
    const url = `${window.location.origin}/certify/${saved.shareToken}`;
    await navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  }

  async function handleSign() {
    if (!signature.trim()) return;
    setSubmitting(true);
    try {
      const record = await completeTrainingRecord(recordId, results, signature.trim());
      setSaved(record);
    } catch (err) {
      setLoadError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-zinc-500">{loadError}</div>
    );
  }

  if (saved?.signedAt) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
        <ProgressSteps current="done" />
        <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">교육 완료</p>
        <p className="text-zinc-600 dark:text-zinc-400">
          {saved.signatureName}님, 이해도 검증을 모두 통과했습니다. 교육 기록이 저장되었습니다.
        </p>
        <div className="flex flex-col gap-3">
          <DownloadCertificateButton record={saved} equipmentName={equipmentName} />
          <button
            onClick={handleShare}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
          >
            {shareCopied ? "링크가 복사되었습니다 ✓" : "공유 링크 복사"}
          </button>
          <a
            href={`/manager/dashboard`}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-center text-sm dark:border-zinc-700"
          >
            담당자 대시보드에서 확인하기 →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <ProgressSteps current="done" />
      <p className="text-2xl font-semibold">이해도 검증 통과</p>

      <div className="w-full max-w-md rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <p className="mb-2 text-sm text-zinc-500">항목별 결과</p>
        <ul className="flex flex-col gap-2 text-sm">
          {results.map((r, i) => (
            <li key={i} className="flex justify-between">
              <span>{ITEM_LABEL[r.itemType] ?? r.itemType}</span>
              <span className="text-zinc-500">시도 {r.attempts}회</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex w-full max-w-md flex-col gap-3">
        <label className="text-sm text-zinc-600 dark:text-zinc-400">본인 확인 서명 (이름 입력)</label>
        <input
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder="이름"
          className="min-h-[60px] rounded-lg border border-zinc-300 px-4 text-lg dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          onClick={handleSign}
          disabled={!signature.trim() || submitting}
          className="min-h-[60px] rounded-lg bg-zinc-900 font-medium text-white disabled:opacity-40 dark:bg-white dark:text-black"
        >
          {submitting ? "저장 중..." : "서명하고 완료하기"}
        </button>
      </div>
    </div>
  );
}
