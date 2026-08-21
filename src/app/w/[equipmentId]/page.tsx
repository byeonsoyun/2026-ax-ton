"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PressMachineDiagram } from "@/components/diagrams/PressMachineDiagram";
import { HotspotOverlay } from "@/components/HotspotOverlay";
import { useSpeech } from "@/lib/useSpeech";
import { isLocalTtsSupported } from "@/lib/tts-languages";
import { createTrainingRecord, getEquipment, getTrainingContent } from "@/lib/api";
import { LANGUAGES, LangCode } from "@/lib/seed/press-machine";
import { ProgressSteps } from "@/components/ProgressSteps";
import type { Equipment, TrainingContent } from "@/lib/types";

const LANG_STORAGE_KEY = "safelang_lang";

export default function TrainingPage({
  params,
}: {
  params: Promise<{ equipmentId: string }>;
}) {
  const { equipmentId } = use(params);
  const router = useRouter();
  const { speak, isFallback } = useSpeech();

  const [lang, setLang] = useState<LangCode | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [content, setContent] = useState<TrainingContent | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [viewMode, setViewMode] = useState<"slide" | "video">("slide");

  useEffect(() => {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY) as LangCode | null;
    if (saved) setLang(saved);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!lang) return;
    setLoadError(null);
    Promise.all([getEquipment(equipmentId), getTrainingContent(equipmentId, lang)])
      .then(([eq, c]) => {
        setEquipment(eq);
        setContent(c);
        setViewMode(c.videoUrl ? "video" : "slide");
      })
      .catch((err) => setLoadError(err.message));
  }, [equipmentId, lang]);

  if (!hydrated) return null;

  if (!lang) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
        <p className="text-lg text-zinc-600 dark:text-zinc-400">언어를 선택하세요 / Choose your language</p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                window.localStorage.setItem(LANG_STORAGE_KEY, l.code);
                setLang(l.code);
              }}
              className="min-h-[60px] rounded-lg border border-zinc-300 px-6 py-4 text-lg font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-zinc-500">{loadError}</div>
    );
  }

  if (!equipment || !content) {
    return <div className="flex flex-1 items-center justify-center p-6 text-zinc-400">불러오는 중...</div>;
  }

  const slide = content.slides[slideIndex];
  const step = equipment.checklist.steps[slideIndex];
  const isLast = slideIndex === content.slides.length - 1;
  const needsReview = lang !== "ko";

  async function startQuiz() {
    setStarting(true);
    try {
      const record = await createTrainingRecord({
        equipmentId,
        language: lang!,
        contentId: content!.id,
      });
      router.push(`/w/${equipmentId}/quiz?lang=${lang}&recordId=${record.id}`);
    } catch (err) {
      setLoadError((err as Error).message);
      setStarting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6">
      <ProgressSteps current="learn" />

      <div className="flex w-full max-w-md items-center justify-between text-sm text-zinc-500">
        <span>
          {viewMode === "slide" ? `${slideIndex + 1} / ${content.slides.length}` : "영상"}
        </span>
        {needsReview && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            번역 검수 대기 (데모)
          </span>
        )}
      </div>

      {content.videoUrl && (
        <div className="flex gap-2 text-sm">
          <button
            onClick={() => setViewMode("video")}
            className={`rounded-full px-3 py-1 ${viewMode === "video" ? "bg-zinc-900 text-white dark:bg-white dark:text-black" : "border border-zinc-300 dark:border-zinc-700"}`}
          >
            영상으로 보기
          </button>
          <button
            onClick={() => setViewMode("slide")}
            className={`rounded-full px-3 py-1 ${viewMode === "slide" ? "bg-zinc-900 text-white dark:bg-white dark:text-black" : "border border-zinc-300 dark:border-zinc-700"}`}
          >
            슬라이드로 보기
          </button>
        </div>
      )}

      {viewMode === "video" && content.videoUrl ? (
        <div className="flex w-full max-w-md flex-col items-center gap-6">
          <video src={content.videoUrl} controls autoPlay className="w-full rounded-lg" />
          <button
            onClick={startQuiz}
            disabled={starting}
            className="min-h-[60px] w-full rounded-lg bg-zinc-900 font-medium text-white disabled:opacity-40 dark:bg-white dark:text-black"
          >
            {starting ? "준비 중..." : "이해도 검증 시작"}
          </button>
        </div>
      ) : (
        <>
          <HotspotOverlay
            hotspots={[{ id: "current", rect: step.hotspot, label: slide.pictogram }]}
            markedIds={["current"]}
            markedVariant="correct"
            disabled
            onSelect={() => {}}
          >
            <PressMachineDiagram />
          </HotspotOverlay>

          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-2xl font-semibold">{slide.pictogram}</p>
            <button
              onClick={() => speak(slide.pictogram, lang!)}
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
            >
              🔊 듣기
            </button>
            {(!isLocalTtsSupported(lang!) || isFallback) && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                합성 음성 품질 안내: 이 언어는 고품질 음성이 아직 없어 기기 기본 음성으로 재생됩니다
              </p>
            )}
          </div>

          <div className="flex w-full max-w-md gap-3">
            <button
              disabled={slideIndex === 0}
              onClick={() => setSlideIndex((i) => i - 1)}
              className="min-h-[60px] flex-1 rounded-lg border border-zinc-300 disabled:opacity-30 dark:border-zinc-700"
            >
              이전
            </button>
            {isLast ? (
              <button
                onClick={startQuiz}
                disabled={starting}
                className="min-h-[60px] flex-1 rounded-lg bg-zinc-900 font-medium text-white disabled:opacity-40 dark:bg-white dark:text-black"
              >
                {starting ? "준비 중..." : "이해도 검증 시작"}
              </button>
            ) : (
              <button
                onClick={() => setSlideIndex((i) => i + 1)}
                className="min-h-[60px] flex-1 rounded-lg bg-zinc-900 font-medium text-white dark:bg-white dark:text-black"
              >
                다음
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
