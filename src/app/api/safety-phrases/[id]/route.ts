import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionWorkerId } from "@/lib/auth-server";

// F-08: 상태 변경(검수완료/검수대기/사용중지). 검수 완료가 아닌 문구는 F-01 조립에서 쓰이지 않는다.
export async function PATCH(req: Request, ctx: RouteContext<"/api/safety-phrases/[id]">) {
  const { id } = await ctx.params;
  const body = await req.json();
  if (!["approved", "pending", "retracted"].includes(body.status)) {
    return NextResponse.json({ error: "잘못된 상태값입니다" }, { status: 400 });
  }
  const reviewerId = await getSessionWorkerId();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("safety_phrases")
    .update({ status: body.status, reviewed_by: reviewerId })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
