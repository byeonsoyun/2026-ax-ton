"use client";

import { useState } from "react";
import { HotspotOverlay } from "@/components/HotspotOverlay";
import { PressMachineDiagram } from "@/components/diagrams/PressMachineDiagram";
import type { ChecklistStep } from "@/lib/types";

// F-02 ① 절차 시뮬레이션형: 설비 그림 위에서 실제 조작 순서를 그대로 터치한다.
// 순서를 틀리면 "지금 이대로 하면 무슨 일이 생기는지"를 즉시 보여준다 (PRD §4.2 원칙 6).
export function SequenceQuiz({
  steps,
  onDone,
}: {
  steps: ChecklistStep[];
  onDone: (result: { passed: boolean; attempts: number }) => void;
}) {
  const sorted = [...steps].sort((a, b) => a.order - b.order);
  const [doneOrders, setDoneOrders] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const nextExpected = sorted[doneOrders.length];

  function handleSelect(stepOrder: number) {
    if (feedback) return; // 피드백 확인 중에는 다음 입력 대기
    setAttempts((a) => a + 1);
    if (stepOrder === nextExpected.order) {
      const updated = [...doneOrders, stepOrder];
      setDoneOrders(updated);
      if (updated.length === sorted.length) {
        onDone({ passed: true, attempts: attempts + 1 });
      }
    } else {
      const wrongStep = sorted.find((s) => s.order === stepOrder)!;
      setFeedback(wrongStep.wrongOrderFeedback);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-center text-lg font-medium">
        순서대로 안전 절차를 짚어보세요 ({doneOrders.length}/{sorted.length})
      </p>

      <HotspotOverlay
        hotspots={sorted.map((s) => ({ id: String(s.order), rect: s.hotspot, label: s.label }))}
        markedIds={doneOrders.map(String)}
        markedVariant="correct"
        onSelect={(id) => handleSelect(Number(id))}
      >
        <PressMachineDiagram />
      </HotspotOverlay>

      {feedback && (
        <div className="flex max-w-md flex-col items-center gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-950/40">
          <p className="text-red-700 dark:text-red-300">{feedback}</p>
          <button
            onClick={() => setFeedback(null)}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white"
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
}
