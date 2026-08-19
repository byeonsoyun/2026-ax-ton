"use client";

import { useState } from "react";
import { HotspotOverlay } from "@/components/HotspotOverlay";
import { PressMachineDiagram } from "@/components/diagrams/PressMachineDiagram";
import type { ChecklistHazard } from "@/lib/types";

// F-02 ② 위험지점 핫스팟형: 위험한 곳을 터치하면 "여기서 실제로 어떤 사고가 나는지"를
// 결과 텍스트로 즉시 보여준다 (단순 정답 확인이 아니라 결과 학습).
export function HotspotQuiz({
  hazards,
  onDone,
}: {
  hazards: ChecklistHazard[];
  onDone: (result: { passed: boolean; attempts: number }) => void;
}) {
  const [foundIds, setFoundIds] = useState<string[]>([]);
  const [activeConsequence, setActiveConsequence] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const allFound = foundIds.length === hazards.length;
  const remaining = hazards.length - foundIds.length;

  function handleSelect(id: string) {
    if (foundIds.includes(id)) return;
    setAttempts((a) => a + 1);
    const hazard = hazards.find((h) => h.id === id)!;
    setActiveConsequence(hazard.consequenceText);
    setFoundIds((prev) => [...prev, id]);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-center text-lg font-medium">
        위험한 곳을 모두 찾아 짚어보세요 ({foundIds.length}/{hazards.length})
      </p>

      <HotspotOverlay
        hotspots={hazards.map((h) => ({ id: h.id, rect: h.hotspot, label: h.label }))}
        markedIds={foundIds}
        markedVariant="correct"
        onSelect={handleSelect}
      >
        <PressMachineDiagram />
      </HotspotOverlay>

      {activeConsequence && (
        <div className="max-w-md rounded-lg border border-amber-300 bg-amber-50 p-4 text-center text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          {activeConsequence}
          {!allFound && (
            <p className="mt-2 text-sm font-medium">
              위험한 곳이 {remaining}곳 더 있습니다. 도식의 다른 부분도 눌러보세요.
            </p>
          )}
        </div>
      )}

      {allFound && (
        <button
          onClick={() => onDone({ passed: true, attempts })}
          className="min-h-[60px] rounded-lg bg-zinc-900 px-6 font-medium text-white dark:bg-white dark:text-black"
        >
          다음으로 →
        </button>
      )}
    </div>
  );
}
