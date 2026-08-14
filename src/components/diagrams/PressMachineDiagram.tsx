// 실제 설비 사진이 없는 데모 단계용 도식. 좌표계는 0~100 퍼센트 기준이라
// HotspotOverlay가 쓰는 좌표(ChecklistStep.hotspot, ChecklistHazard.hotspot)와 그대로 맞아떨어진다.
export function PressMachineDiagram() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <rect x="8" y="6" width="84" height="88" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* 전원 스위치 (좌상단, step 1) */}
      <circle cx="20" cy="18" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="20" y1="14" x2="20" y2="18" stroke="currentColor" strokeWidth="1.5" />
      {/* 잔류 압력 게이지 (우상단, step 2) */}
      <circle cx="78" cy="18" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="78" y1="18" x2="82" y2="14" stroke="currentColor" strokeWidth="1.5" />
      {/* 프레스 램 + 다이 (중앙 작업구역, step 3 + hazard) */}
      <rect x="30" y="34" width="40" height="8" fill="currentColor" opacity="0.85" />
      <rect x="34" y="60" width="32" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="50" y1="42" x2="50" y2="60" stroke="currentColor" strokeWidth="1.5" />
      {/* 안전핀 삽입구 (우하단, step 4) */}
      <rect x="72" y="76" width="10" height="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
