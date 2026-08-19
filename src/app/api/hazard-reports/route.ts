import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionWorkerId } from "@/lib/auth-server";

// F-05: 위험요소 신고. 목록 조회는 두 갈래로 나뉜다.
//  - ?mine=1  : 신고자 본인이 자기 신고 이력을 보는 용도 (마이페이지)
//  - 그 외    : 담당자 게시판 — worker_id는 절대 응답에 포함하지 않는다 (익명성 원칙)

function toManagerView(row: Record<string, unknown>) {
  return {
    id: row.id,
    equipmentId: row.equipment_id,
    hazardType: row.hazard_type,
    title: row.title,
    photoUrl: row.photo_url,
    voiceMemoUrl: row.voice_memo_url,
    status: row.status,
    viewCount: row.view_count,
    createdAt: row.created_at,
  };
}

function toMineView(row: Record<string, unknown>) {
  return { ...toManagerView(row) };
}

export async function GET(req: Request) {
  const mine = new URL(req.url).searchParams.get("mine");
  const supabase = createServerSupabaseClient();

  if (mine) {
    const workerId = await getSessionWorkerId();
    if (!workerId) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    const { data, error } = await supabase
      .from("hazard_reports")
      .select("*")
      .eq("worker_id", workerId)
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json((data ?? []).map(toMineView));
  }

  // 담당자 게시판 — worker_id는 select에 포함하되 응답 직렬화에서 제외한다 (역추적 방지)
  const { data, error } = await supabase
    .from("hazard_reports")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(toManagerView));
}

export async function POST(req: Request) {
  const workerId = await getSessionWorkerId();
  if (!workerId) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const body = await req.json();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("hazard_reports")
    .insert({
      worker_id: workerId,
      equipment_id: body.equipmentId ?? null,
      hazard_type: body.hazardType,
      title: body.title,
      photo_url: body.photoUrl ?? null,
      voice_memo_url: body.voiceMemoUrl ?? null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(toMineView(data));
}
