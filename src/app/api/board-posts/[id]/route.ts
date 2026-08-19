import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(_req: Request, ctx: RouteContext<"/api/board-posts/[id]">) {
  const { id } = await ctx.params;
  const supabase = createServerSupabaseClient();

  const { data: post, error } = await supabase.from("board_posts").select("*").eq("id", id).single();
  if (error || !post) return NextResponse.json({ error: "게시글을 찾을 수 없습니다" }, { status: 404 });

  await supabase
    .from("board_posts")
    .update({ view_count: (post.view_count ?? 0) + 1 })
    .eq("id", id);

  const { data: comments } = await supabase
    .from("board_comments")
    .select("*")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    id: post.id,
    authorDisplay: post.author_display,
    title: post.title,
    body: post.body,
    viewCount: (post.view_count ?? 0) + 1,
    createdAt: post.created_at,
    comments: (comments ?? []).map((c) => ({
      id: c.id,
      authorDisplay: c.author_display,
      body: c.body,
      createdAt: c.created_at,
    })),
  });
}
