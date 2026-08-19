import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(_req: Request, ctx: RouteContext<"/api/hazard-reports/[id]">) {
  const { id } = await ctx.params;
  const supabase = createServerSupabaseClient();

  const { data: report, error } = await supabase.from("hazard_reports").select("*").eq("id", id).single();
  if (error || !report) return NextResponse.json({ error: "신고를 찾을 수 없습니다" }, { status: 404 });

  await supabase
    .from("hazard_reports")
    .update({ view_count: (report.view_count ?? 0) + 1 })
    .eq("id", id);

  const { data: comments } = await supabase
    .from("hazard_report_comments")
    .select("*")
    .eq("report_id", id)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    id: report.id,
    equipmentId: report.equipment_id,
    hazardType: report.hazard_type,
    title: report.title,
    photoUrl: report.photo_url,
    voiceMemoUrl: report.voice_memo_url,
    status: report.status,
    viewCount: (report.view_count ?? 0) + 1,
    createdAt: report.created_at,
    comments: (comments ?? []).map((c) => ({
      id: c.id,
      author: c.author,
      body: c.body,
      createdAt: c.created_at,
    })),
  });
}

// 담당자 처리 상태 변경
export async function PATCH(req: Request, ctx: RouteContext<"/api/hazard-reports/[id]">) {
  const { id } = await ctx.params;
  const body = await req.json();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("hazard_reports").update({ status: body.status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
