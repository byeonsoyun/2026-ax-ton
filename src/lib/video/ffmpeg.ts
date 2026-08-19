import "server-only";
import { writeFile } from "fs/promises";
import path from "path";
import { runProcess } from "@/lib/video/proc";

const SIZE = 1080;
const FPS = 25;

export async function getAudioDurationSeconds(filePath: string): Promise<number> {
  const out = await runProcess("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "csv=p=0",
    filePath,
  ]);
  const seconds = parseFloat(out.trim());
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 3;
}

// 슬라이드 이미지 1장 + 나레이션 음성 1개 → 팬/줌(켄 번즈) 애니메이션이 들어간 짧은 클립.
export async function renderSlideClip(imagePath: string, audioPath: string, outPath: string): Promise<void> {
  const duration = await getAudioDurationSeconds(audioPath);
  const frames = Math.max(1, Math.round(duration * FPS));

  await runProcess("ffmpeg", [
    "-y",
    "-loop",
    "1",
    "-i",
    imagePath,
    "-i",
    audioPath,
    "-filter_complex",
    `[0:v]scale=${SIZE}:${SIZE},zoompan=z='min(zoom+0.0008,1.15)':d=${frames}:s=${SIZE}x${SIZE}:fps=${FPS}[v]`,
    "-map",
    "[v]",
    "-map",
    "1:a",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-t",
    duration.toFixed(2),
    "-shortest",
    outPath,
  ]);
}

// 슬라이드별 클립들을 하나의 영상으로 이어붙인다.
export async function concatClips(clipPaths: string[], outPath: string): Promise<void> {
  const listPath = path.join(path.dirname(outPath), `concat-${Date.now()}.txt`);
  const listContent = clipPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
  await writeFile(listPath, listContent, "utf8");

  await runProcess("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", outPath]);
}
