import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionWorkerId } from "@/lib/auth-server";

export async function POST(req: Request, ctx: RouteContext<"/api/board-posts/[id]/comments">) {
  const { id } = await ctx.params;
  const workerId = await getSessionWorkerId();
  if (!workerId) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const body = await req.json();
  const supabase = createServerSupabaseClient();
  const { data: worker } = await supabase.from("workers").select("display_name").eq("id", workerId).single();
  const authorDisplay = body.anonymous ? "익명" : worker?.display_name || workerId;

  const { data, error } = await supabase
    .from("board_comments")
    .insert({ post_id: id, worker_id: workerId, author_display: authorDisplay, body: body.body })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    id: data.id,
    authorDisplay: data.author_display,
    body: data.body,
    createdAt: data.created_at,
  });
}
