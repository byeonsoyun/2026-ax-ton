import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { mkdir, readFile, stat } from "fs/promises";
import path from "path";
import { synthesizeNarrationWav } from "@/lib/video/tts";
import { isLocalTtsSupported } from "@/lib/tts-languages";

// 라이브 노동자 화면 "듣기" 버튼용 서버 TTS. 같은 (언어, 문구)는 슬라이드마다 고정 텍스트라
// 디스크 캐시로 재사용하고, 매번 Piper/SAPI를 새로 돌리지 않는다.
const CACHE_DIR = path.join(process.cwd(), ".tts-cache");

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const lang = typeof body?.lang === "string" ? body.lang : "";

  if (!text || !lang) {
    return NextResponse.json({ error: "text, lang이 필요합니다" }, { status: 400 });
  }
  if (!isLocalTtsSupported(lang)) {
    return NextResponse.json({ error: `합성 음성이 지원되지 않는 언어입니다: ${lang}` }, { status: 422 });
  }

  const key = createHash("sha1").update(`${lang}:${text}`).digest("hex");
  const filePath = path.join(CACHE_DIR, `${key}.wav`);

  const cached = await stat(filePath).then(() => true).catch(() => false);
  if (!cached) {
    try {
      await mkdir(CACHE_DIR, { recursive: true });
      await synthesizeNarrationWav(text, lang, filePath);
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
  }

  const buf = await readFile(filePath);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "audio/wav",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
