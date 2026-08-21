"use client";

import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SequenceQuiz } from "@/components/quiz/SequenceQuiz";
import { HotspotQuiz } from "@/components/quiz/HotspotQuiz";
import { BranchQuiz } from "@/components/quiz/BranchQuiz";
import { getQuizItems } from "@/lib/api";
import { LangCode } from "@/lib/seed/press-machine";
import { ProgressSteps } from "@/components/ProgressSteps";
import type {
  BranchQuizData,
  HotspotQuizData,
  QuizItem,
  QuizResult,
  SequenceQuizData,
} from "@/lib/types";

export default function QuizPage({
  params,
}: {
  params: Promise<{ equipmentId: string }>;
}) {
  const { equipmentId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = (searchParams.get("lang") ?? "ko") as LangCode;
  const recordId = searchParams.get("recordId") ?? "";

  const [items, setItems] = useState<QuizItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [itemIndex, setItemIndex] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [startedAt, setStartedAt] = useState(() => Date.now());

  useEffect(() => {
    getQuizItems(equipmentId, lang)
      .then(setItems)
      .catch((err) => setLoadError(err.message));
  }, [equipmentId, lang]);

  if (loadError) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-zinc-500">{loadError}</div>
    );
  }
  if (!items) {
    return <div className="flex flex-1 items-center justify-center p-6 text-zinc-400">불러오는 중...</div>;
  }

  const item = items[itemIndex];

  function handleItemDone(result: { passed: boolean; attempts: number }) {
    const responseTimeMs = Date.now() - startedAt;
    const updated: QuizResult[] = [
      ...results,
      {
        quizItemId: item.id,
        itemType: item.itemType,
        passed: result.passed,
        responseTimeMs,
        attempts: result.attempts,
      },
    ];
    setResults(updated);

    if (itemIndex + 1 < items!.length) {
      setItemIndex((i) => i + 1);
      setStartedAt(Date.now());
    } else {
      const encoded = encodeURIComponent(JSON.stringify(updated));
      router.push(`/w/${equipmentId}/complete?lang=${lang}&recordId=${recordId}&results=${encoded}`);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <ProgressSteps current="quiz" />
      <p className="text-sm text-zinc-500">
        이해도 검증 {itemIndex + 1} / {items.length}
      </p>

      {item.itemType === "sequence" && (
        <SequenceQuiz steps={(item.data as SequenceQuizData).steps} onDone={handleItemDone} />
      )}
      {item.itemType === "hotspot" && (
        <HotspotQuiz hazards={(item.data as HotspotQuizData).hazards} onDone={handleItemDone} />
      )}
      {item.itemType === "branch" && (
        <BranchQuiz data={item.data as BranchQuizData} onDone={handleItemDone} />
      )}
    </div>
  );
}
