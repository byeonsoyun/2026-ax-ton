import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionWorkerId } from "@/lib/auth-server";

function toPost(row: Record<string, unknown>) {
  return {
    id: row.id,
    authorDisplay: row.author_display,
    title: row.title,
    body: row.body,
    viewCount: row.view_count,
    createdAt: row.created_at,
  };
}

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("board_posts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(toPost));
}

export async function POST(req: Request) {
  const workerId = await getSessionWorkerId();
  if (!workerId) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const body = await req.json();
  const supabase = createServerSupabaseClient();
  const { data: worker } = await supabase.from("workers").select("display_name").eq("id", workerId).single();
  const authorDisplay = body.anonymous ? "익명" : worker?.display_name || workerId;

  const { data, error } = await supabase
    .from("board_posts")
    .insert({ worker_id: workerId, author_display: authorDisplay, title: body.title, body: body.body })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(toPost(data));
}
