// 데모용 언어 목록. 설비·안전문구·콘텐츠·퀴즈 데이터는 Supabase로 옮겨졌다
// (scripts/seed-supabase.mjs 참고). 팀 우선순위 문서(1층)가 요구하는 6개 언어를 지원한다.

export const LANGUAGES = [
  { code: "ko", label: "한국어" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "km", label: "ភាសាខ្មែរ" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "th", label: "ภาษาไทย" },
  { code: "ne", label: "नेपाली" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];
