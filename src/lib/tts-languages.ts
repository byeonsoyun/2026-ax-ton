// 로컬 무료 TTS 엔진(Windows SAPI / Piper)이 실제로 지원하는 언어 목록.
// 클라이언트/서버 양쪽에서 import하므로 여기엔 node 전용 코드를 두지 않는다.
// 크메르어(km)·태국어(th)는 무료 로컬 엔진 커버리지가 없어 미지원 — tools/README.md 참고.
export const LOCAL_TTS_SUPPORTED_LANGUAGES = ["ko", "vi", "id", "ne"] as const;

export function isLocalTtsSupported(lang: string): boolean {
  return (LOCAL_TTS_SUPPORTED_LANGUAGES as readonly string[]).includes(lang);
}
