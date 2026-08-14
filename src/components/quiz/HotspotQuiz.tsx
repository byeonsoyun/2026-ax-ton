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

  function handleSelect(id: string) {
    if (foundIds.includes(id)) return;
    setAttempts((a) => a + 1);
    const hazard = hazards.find((h) => h.id === id)!;
    setActiveConsequence(hazard.consequenceText);
    const updated = [...foundIds, id];
    setFoundIds(updated);
    if (updated.length === hazards.length) {
      setTimeout(() => onDone({ passed: true, attempts: attempts + 1 }), 1200);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-center text-lg font-medium">
        위험한 곳을 모두 찾아 짚어보세요 ({foundIds.length}/{hazards.length})
      </p>

      <HotspotOverlay
        hotspots={hazards.map((h) => ({ id: h.id, rect: h.hotspot, label: h.label }))}
        markedIds={foundIds}
        markedVariant="incorrect"
        onSelect={handleSelect}
      >
        <PressMachineDiagram />
      </HotspotOverlay>

      {activeConsequence && (
        <div className="max-w-md rounded-lg border border-amber-300 bg-amber-50 p-4 text-center text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          {activeConsequence}
        </div>
      )}
    </div>
  );
}
