"use client";

import { use, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SequenceQuiz } from "@/components/quiz/SequenceQuiz";
import { HotspotQuiz } from "@/components/quiz/HotspotQuiz";
import { BranchQuiz } from "@/components/quiz/BranchQuiz";
import { EQUIPMENT_ID, LangCode, quizItemsFor } from "@/lib/seed/press-machine";
import type {
  BranchQuizData,
  HotspotQuizData,
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

  const items = useMemo(() => quizItemsFor(lang), [lang]);
  const [itemIndex, setItemIndex] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [startedAt, setStartedAt] = useState(() => Date.now());

  if (equipmentId !== EQUIPMENT_ID) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-zinc-500">
        설비를 찾을 수 없습니다.
      </div>
    );
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

    if (itemIndex + 1 < items.length) {
      setItemIndex((i) => i + 1);
      setStartedAt(Date.now());
    } else {
      const encoded = encodeURIComponent(JSON.stringify(updated));
      router.push(`/w/${equipmentId}/complete?lang=${lang}&recordId=${recordId}&results=${encoded}`);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
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
