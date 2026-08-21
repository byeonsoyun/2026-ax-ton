import "server-only";
import { writeFile, mkdtemp } from "fs/promises";
import path from "path";
import os from "os";
import { runProcess } from "@/lib/video/proc";
import { LOCAL_TTS_SUPPORTED_LANGUAGES } from "@/lib/tts-languages";

// 영상 렌더링 + 라이브 화면 듣기 버튼 공용 서버사이드 TTS. 계정/키가 필요한 Google Cloud TTS
// 대신, 무료·로컬 엔진을 쓴다 (tools/README.md 참고). 언어별 커버리지가 다르므로 지원하지
// 않는 언어는 명시적으로 에러를 던진다 — 조용히 다른 언어로 대체하지 않는다
// (PRD §4.2 원칙: 검증 없이 대충 넘기지 않는다).
export { LOCAL_TTS_SUPPORTED_LANGUAGES as VIDEO_TTS_SUPPORTED_LANGUAGES } from "@/lib/tts-languages";

const PIPER_MODEL_ENV: Partial<Record<(typeof LOCAL_TTS_SUPPORTED_LANGUAGES)[number], string>> = {
  vi: "PIPER_VI_MODEL_PATH",
  id: "PIPER_ID_MODEL_PATH",
  ne: "PIPER_NE_MODEL_PATH",
};

async function synthesizeKoreanWav(text: string, outPath: string): Promise<void> {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "safelang-tts-"));
  const textFile = path.join(tmpDir, "text.txt");
  await writeFile(textFile, text, "utf8");

  const script = [
    "Add-Type -AssemblyName System.Speech",
    "$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer",
    '$synth.SelectVoice("Microsoft Heami Desktop")',
    `$text = Get-Content -Raw -Encoding UTF8 "${textFile}"`,
    `$synth.SetOutputToWaveFile("${outPath}")`,
    "$synth.Speak($text)",
    "$synth.Dispose()",
  ].join("\n");

  await runProcess("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", script]);
}

async function synthesizePiperWav(envVar: string, text: string, outPath: string): Promise<void> {
  const bin = process.env.PIPER_BIN_PATH;
  const model = process.env[envVar];
  if (!bin || !model) throw new Error(`PIPER_BIN_PATH / ${envVar}가 설정되지 않았습니다`);

  await runProcess(path.resolve(bin), ["-m", path.resolve(model), "-f", outPath], text);
}

export async function synthesizeNarrationWav(
  text: string,
  lang: string,
  outPath: string
): Promise<void> {
  if (lang === "ko") return synthesizeKoreanWav(text, outPath);
  const envVar = PIPER_MODEL_ENV[lang as (typeof LOCAL_TTS_SUPPORTED_LANGUAGES)[number]];
  if (envVar) return synthesizePiperWav(envVar, text, outPath);
  throw new Error(`영상용 TTS가 지원되지 않는 언어입니다: ${lang}`);
}
