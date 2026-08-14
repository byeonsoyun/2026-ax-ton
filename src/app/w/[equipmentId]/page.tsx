"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PressMachineDiagram } from "@/components/diagrams/PressMachineDiagram";
import { HotspotOverlay } from "@/components/HotspotOverlay";
import { useSpeech } from "@/lib/useSpeech";
import { createTrainingRecord } from "@/lib/storage";
import { EQUIPMENT_ID, LANGUAGES, LangCode, checklist, trainingContents } from "@/lib/seed/press-machine";

const LANG_STORAGE_KEY = "safelang_lang";

export default function TrainingPage({
  params,
}: {
  params: Promise<{ equipmentId: string }>;
}) {
  const { equipmentId } = use(params);
  const router = useRouter();
  const { speak } = useSpeech();

  const [lang, setLang] = useState<LangCode | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY) as LangCode | null;
    if (saved) setLang(saved);
    setHydrated(true);
  }, []);

  if (equipmentId !== EQUIPMENT_ID) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-zinc-500">
        설비를 찾을 수 없습니다. (데모: {EQUIPMENT_ID})
      </div>
    );
  }

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

  const content = trainingContents[lang];
  const slide = content.slides[slideIndex];
  const step = checklist.steps[slideIndex];
  const isLast = slideIndex === content.slides.length - 1;
  const needsReview = lang !== "ko";

  const startQuiz = () => {
    const record = createTrainingRecord({
      equipmentId,
      language: lang,
      contentId: content.id,
    });
    router.push(`/w/${equipmentId}/quiz?lang=${lang}&recordId=${record.id}`);
  };

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6">
      <div className="flex w-full max-w-md items-center justify-between text-sm text-zinc-500">
        <span>
          {slideIndex + 1} / {content.slides.length}
        </span>
        {needsReview && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            번역 검수 대기 (데모)
          </span>
        )}
      </div>

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
          onClick={() => speak(slide.pictogram, lang)}
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
        >
          🔊 듣기
        </button>
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
            className="min-h-[60px] flex-1 rounded-lg bg-zinc-900 font-medium text-white dark:bg-white dark:text-black"
          >
            이해도 검증 시작
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
    </div>
  );
}
