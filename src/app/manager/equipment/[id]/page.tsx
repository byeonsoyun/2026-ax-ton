"use client";

import { use, useEffect, useState } from "react";
import {
  getEquipment,
  getScriptDrafts,
  renderEquipmentVideo,
  synthesizeScriptDrafts,
  updateScriptDraftStatus,
} from "@/lib/api";
import type { ChecklistStep, Equipment, ScriptDraft } from "@/lib/types";

export default function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [drafts, setDrafts] = useState<ScriptDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState<string | null>(null);
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({});
  const [renderError, setRenderError] = useState<string | null>(null);

  function load() {
    getEquipment(id).then(setEquipment);
    getScriptDrafts(id).then(setDrafts);
  }

  useEffect(load, [id]);

  async function handleSynthesize() {
    setLoading(true);
    try {
      await synthesizeScriptDrafts(id);
      load();
    } finally {
      setLoading(false);
    }
  }

  async function handleStatus(draftId: string, status: "approved" | "rejected") {
    await updateScriptDraftStatus(draftId, status);
    load();
  }

  async function handleRender(lang: string) {
    setRendering(lang);
    setRenderError(null);
    try {
      const { url } = await renderEquipmentVideo(id, lang);
      setVideoUrls((prev) => ({ ...prev, [lang]: url }));
    } catch (err) {
      setRenderError((err as Error).message);
    } finally {
      setRendering(null);
    }
  }

  const stepLabel = (order: number, steps: ChecklistStep[]) =>
    steps.find((s) => s.order === order)?.label ?? `단계 ${order}`;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-semibold">{equipment?.name ?? "설비"}</h1>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">나레이션 스크립트 재구성 (AI, F-01 2단계)</h2>
          <button
            onClick={handleSynthesize}
            disabled={loading}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-40 dark:bg-white dark:text-black"
          >
            {loading ? "재구성 중..." : "스크립트 재구성 요청"}
          </button>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          여러 안전 자료를 종합해 AI가 나레이션 초안을 새로 작성합니다. 검수 승인 전까지는 실제
          안전 지시로 쓰이지 않습니다.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {drafts.length === 0 && <p className="text-sm text-zinc-400">아직 생성된 초안이 없습니다.</p>}
          {drafts.map((d) => (
            <div key={d.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {equipment ? stepLabel(d.stepOrder, equipment.checklist.steps) : `단계 ${d.stepOrder}`}
                </p>
                <span
                  className={
                    "rounded-full px-2 py-0.5 text-xs " +
                    (d.status === "approved"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : d.status === "rejected"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300")
                  }
                >
                  {d.status === "approved" ? "승인됨" : d.status === "rejected" ? "반려됨" : "검수 대기"}
                </span>
              </div>
              <p className="mt-2">{d.draftText}</p>
              <p className="mt-1 text-xs text-zinc-500">근거: {d.sourceNotes}</p>
              {d.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleStatus(d.id, "approved")}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white"
                  >
                    승인
                  </button>
                  <button
                    onClick={() => handleStatus(d.id, "rejected")}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
                  >
                    반려
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium">영상 렌더링 (F-01 3단계, 로컬 전용)</h2>
        <p className="mt-1 text-sm text-zinc-500">
          ffmpeg + 무료 로컬 TTS로 실제 MP4를 만듭니다. 크메르어는 무료 TTS가 없어 지원하지 않습니다
          — 그 언어는 기존 웹 슬라이드로만 제공됩니다.
        </p>
        <div className="mt-3 flex gap-3">
          {["ko", "vi"].map((lang) => (
            <button
              key={lang}
              onClick={() => handleRender(lang)}
              disabled={rendering !== null}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm disabled:opacity-40 dark:border-zinc-700"
            >
              {rendering === lang ? "렌더링 중... (수십 초 소요)" : `${lang} 영상 생성`}
            </button>
          ))}
        </div>
        {renderError && <p className="mt-2 text-sm text-red-600">{renderError}</p>}
        <div className="mt-3 flex flex-col gap-2">
          {Object.entries(videoUrls).map(([lang, url]) => (
            <video key={lang} src={url} controls className="max-w-md rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
