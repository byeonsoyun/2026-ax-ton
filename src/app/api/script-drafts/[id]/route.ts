import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// 담당자 승인/반려. 승인해도 F-08 문구 라이브러리에 자동 반영되지는 않는다 —
// "AI가 재구성한 문장은 검수를 통과해야만 다음 단계로 갈 수 있다"는 게이트만 데모로 보여준다.
export async function PATCH(req: Request, ctx: RouteContext<"/api/script-drafts/[id]">) {
  const { id } = await ctx.params;
  const body = await req.json();
  if (!["approved", "rejected", "pending"].includes(body.status)) {
    return NextResponse.json({ error: "잘못된 상태값입니다" }, { status: 400 });
  }
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("script_drafts").update({ status: body.status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
