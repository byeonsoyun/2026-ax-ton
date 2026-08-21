"use client";

import { useCallback, useRef, useState } from "react";
import { isLocalTtsSupported } from "@/lib/tts-languages";

// 라이브 화면 "듣기" 버튼용 TTS. 실서비스처럼 일관된 음질을 내기 위해 서버의 로컬 엔진
// (Piper/Windows SAPI, 영상 렌더링과 동일한 엔진)을 우선 쓰고, 그 엔진이 커버하지 않는
// 언어(크메르어·태국어)만 브라우저 내장 Web Speech API로 폴백한다 — 조용히 넘어가지 않고
// 폴백 여부를 화면에 알린다 (PRD §4.2 원칙).
const LANG_TAGS: Record<string, string> = {
  ko: "ko-KR",
  vi: "vi-VN",
  km: "km-KH",
  id: "id-ID",
  th: "th-TH",
  ne: "ne-NP",
};

function speakWithBrowserVoice(text: string, langCode: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANG_TAGS[langCode] ?? langCode;
  window.speechSynthesis.speak(utterance);
}

export function useSpeech() {
  const [isFallback, setIsFallback] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string, langCode: string) => {
    if (!isLocalTtsSupported(langCode)) {
      setIsFallback(true);
      speakWithBrowserVoice(text, langCode);
      return;
    }

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang: langCode }),
      });
      if (!res.ok) throw new Error("tts request failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioRef.current?.pause();
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play();
      audio.addEventListener("ended", () => URL.revokeObjectURL(url), { once: true });
      setIsFallback(false);
    } catch {
      setIsFallback(true);
      speakWithBrowserVoice(text, langCode);
    }
  }, []);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return { speak, stop, isFallback };
}
