import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// 담당자의 처리 회신. 신고자 언어로 자동 번역하는 건 v1.0 범위(PRD F-05) — 데모는 한국어 그대로.
export async function POST(req: Request, ctx: RouteContext<"/api/hazard-reports/[id]/comments">) {
  const { id } = await ctx.params;
  const body = await req.json();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("hazard_report_comments")
    .insert({ report_id: id, author: "담당자", body: body.body })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id, author: data.author, body: data.body, createdAt: data.created_at });
}
