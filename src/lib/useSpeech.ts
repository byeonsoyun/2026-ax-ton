"use client";

import { useCallback } from "react";

// 데모용 TTS: 브라우저 내장 Web Speech API 사용 (계획서 "시간 부족 시 컷 우선순위" 4번 —
// 실제 배포 시 Google Cloud TTS로 교체. 크메르어 등은 브라우저/OS에 음성이 없을 수 있어
// 지원되지 않으면 조용히 무시한다).
const LANG_TAGS: Record<string, string> = {
  ko: "ko-KR",
  vi: "vi-VN",
  km: "km-KH",
};

export function useSpeech() {
  const speak = useCallback((text: string, langCode: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_TAGS[langCode] ?? langCode;
    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return { speak, stop };
}
