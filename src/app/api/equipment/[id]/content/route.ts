import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: Request, ctx: RouteContext<"/api/equipment/[id]/content">) {
  const { id } = await ctx.params;
  const lang = new URL(req.url).searchParams.get("lang") ?? "ko";
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("training_contents")
    .select("*")
    .eq("equipment_id", id)
    .eq("language", lang)
    .eq("status", "approved")
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "콘텐츠를 찾을 수 없습니다" }, { status: 404 });
  }
  return NextResponse.json({
    id: data.id,
    equipmentId: data.equipment_id,
    language: data.language,
    slides: data.slides,
    videoUrl: data.video_url ?? null,
    status: data.status,
  });
}
