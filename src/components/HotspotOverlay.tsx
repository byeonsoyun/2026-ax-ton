"use client";

import { ReactNode } from "react";
import type { HotspotRect } from "@/lib/types";

export type HotspotDef = {
  id: string;
  rect: HotspotRect; // 0~100 퍼센트 좌표
  label: string;
};

// 이미지/도식 위에 퍼센트 좌표로 터치 가능한 영역을 겹쳐 그린다.
// F-02 절차 시뮬레이션형·핫스팟형 퀴즈가 공유하는 뼈대 컴포넌트.
// 터치 타깃은 장갑 착용을 고려해 최소 60px 이상을 보장한다 (PRD §9.1).
export function HotspotOverlay({
  children,
  hotspots,
  onSelect,
  markedIds = [],
  markedVariant = "correct",
  disabled = false,
}: {
  children: ReactNode;
  hotspots: HotspotDef[];
  onSelect: (id: string) => void;
  markedIds?: string[];
  markedVariant?: "correct" | "incorrect";
  disabled?: boolean;
}) {
  return (
    <div className="relative aspect-square w-full max-w-md mx-auto text-zinc-700 dark:text-zinc-300">
      {children}
      {hotspots.map((h) => {
        const marked = markedIds.includes(h.id);
        return (
          <button
            key={h.id}
            type="button"
            aria-label={h.label}
            disabled={disabled}
            onClick={() => onSelect(h.id)}
            style={{
              position: "absolute",
              left: `${h.rect.x}%`,
              top: `${h.rect.y}%`,
              width: `${h.rect.w}%`,
              height: `${h.rect.h}%`,
              minWidth: 60,
              minHeight: 60,
            }}
            className={
              "rounded-md border-2 transition-colors " +
              (marked
                ? markedVariant === "correct"
                  ? "border-emerald-500 bg-emerald-500/20"
                  : "border-red-500 bg-red-500/20"
                : "border-transparent hover:border-amber-500/60 hover:bg-amber-500/10 active:bg-amber-500/20")
            }
          />
        );
      })}
    </div>
  );
}
