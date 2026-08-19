// 데모용 언어 목록. 설비·안전문구·콘텐츠·퀴즈 데이터는 Supabase로 옮겨졌다
// (scripts/seed-supabase.mjs 참고 — 프레스기 1종 x 언어 3종 시드).

export const LANGUAGES = [
  { code: "ko", label: "한국어" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "km", label: "ភាសាខ្មែរ" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];
