import "server-only";
import sharp from "sharp";
import { mkdir, mkdtemp, rm } from "fs/promises";
import path from "path";
import os from "os";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { pressMachineDiagramSvg } from "@/lib/video/diagram-svg";
import { synthesizeNarrationWav, VIDEO_TTS_SUPPORTED_LANGUAGES } from "@/lib/video/tts";
import { renderSlideClip, concatClips } from "@/lib/video/ffmpeg";
import type { Checklist, Slide } from "@/lib/types";

const OUTPUT_DIR = path.join(process.cwd(), "public", "rendered-videos");

export async function renderEquipmentVideo(equipmentId: string, lang: string): Promise<string> {
  if (!(VIDEO_TTS_SUPPORTED_LANGUAGES as readonly string[]).includes(lang)) {
    throw new Error(`이 언어는 아직 영상 렌더링을 지원하지 않습니다: ${lang}`);
  }

  const supabase = createServerSupabaseClient();
  const { data: equipment, error: eqErr } = await supabase
    .from("equipment")
    .select("*")
    .eq("id", equipmentId)
    .single();
  if (eqErr || !equipment) throw new Error("설비를 찾을 수 없습니다");

  const { data: content, error: contentErr } = await supabase
    .from("training_contents")
    .select("*")
    .eq("equipment_id", equipmentId)
    .eq("language", lang)
    .eq("status", "approved")
    .single();
  if (contentErr || !content) throw new Error("해당 언어의 콘텐츠를 찾을 수 없습니다");

  const checklist = equipment.checklist as Checklist;
  const slides = (content.slides as Slide[]).sort((a, b) => a.order - b.order);

  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "safelang-render-"));
  const clipPaths: string[] = [];

  try {
    for (const slide of slides) {
      const step = checklist.steps.find((s) => s.order === slide.order);
      const svg = pressMachineDiagramSvg(1080, step?.hotspot);
      const imagePath = path.join(tmpDir, `slide-${slide.order}.png`);
      await sharp(Buffer.from(svg)).png().toFile(imagePath);

      const audioPath = path.join(tmpDir, `slide-${slide.order}.wav`);
      await synthesizeNarrationWav(slide.pictogram, lang, audioPath);

      const clipPath = path.join(tmpDir, `clip-${slide.order}.mp4`);
      await renderSlideClip(imagePath, audioPath, clipPath);
      clipPaths.push(clipPath);
    }

    await mkdir(OUTPUT_DIR, { recursive: true });
    const fileName = `${equipmentId}-${lang}.mp4`;
    const outPath = path.join(OUTPUT_DIR, fileName);
    await concatClips(clipPaths, outPath);

    const publicUrl = `/rendered-videos/${fileName}`;
    await supabase.from("training_contents").update({ video_url: publicUrl }).eq("id", content.id);
    return publicUrl;
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}
