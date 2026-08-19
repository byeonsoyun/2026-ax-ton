import type { HotspotRect } from "@/lib/types";

// PressMachineDiagram(src/components/diagrams/PressMachineDiagram.tsx)과 동일한 도식을
// 서버에서 래스터화(PNG)하기 위한 순수 SVG 문자열 버전. 하이라이트 사각형은 현재 단계를
// 강조하는 용도로, 브라우저용 HotspotOverlay와 같은 퍼센트 좌표계(0~100)를 쓴다.
export function pressMachineDiagramSvg(size: number, highlight?: HotspotRect): string {
  const highlightRect = highlight
    ? `<rect x="${highlight.x}" y="${highlight.y}" width="${highlight.w}" height="${highlight.h}" rx="2" fill="#10b98133" stroke="#10b981" stroke-width="1.5" />`
    : "";

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
  <rect width="100" height="100" fill="#0b0f14" />
  <rect x="8" y="6" width="84" height="88" rx="2" fill="none" stroke="#d4d4d8" stroke-width="1.5" />
  <circle cx="20" cy="18" r="6" fill="none" stroke="#d4d4d8" stroke-width="1.5" />
  <line x1="20" y1="14" x2="20" y2="18" stroke="#d4d4d8" stroke-width="1.5" />
  <circle cx="78" cy="18" r="7" fill="none" stroke="#d4d4d8" stroke-width="1.5" />
  <line x1="78" y1="18" x2="82" y2="14" stroke="#d4d4d8" stroke-width="1.5" />
  <rect x="30" y="34" width="40" height="8" fill="#d4d4d8" opacity="0.85" />
  <rect x="34" y="60" width="32" height="10" fill="none" stroke="#d4d4d8" stroke-width="1.5" />
  <line x1="50" y1="42" x2="50" y2="60" stroke="#d4d4d8" stroke-width="1.5" />
  <rect x="72" y="76" width="10" height="6" fill="none" stroke="#d4d4d8" stroke-width="1.5" />
  ${highlightRect}
</svg>`.trim();
}
