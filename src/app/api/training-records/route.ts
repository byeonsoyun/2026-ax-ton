import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionWorkerId } from "@/lib/auth-server";

function toRecord(row: Record<string, unknown>) {
  return {
    id: row.id,
    workerAnonId: row.worker_anon_id,
    equipmentId: row.equipment_id,
    language: row.language,
    contentId: row.content_id,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    quizResults: row.quiz_results,
    passed: row.passed,
    signatureName: row.signature_name,
    signedAt: row.signed_at,
    integrityHash: row.integrity_hash,
    createdAt: row.created_at,
  };
}

export async function GET(req: Request) {
  const mine = new URL(req.url).searchParams.get("mine");
  const supabase = createServerSupabaseClient();
  let query = supabase.from("training_records").select("*").order("started_at", { ascending: false });

  if (mine) {
    const workerId = await getSessionWorkerId();
    if (!workerId) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    query = query.eq("worker_anon_id", workerId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(toRecord));
}

export async function POST(req: Request) {
  const workerId = await getSessionWorkerId();
  if (!workerId) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const body = await req.json();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("training_records")
    // worker_anon_id는 클라이언트가 아니라 세션 쿠키에서 서버가 직접 정한다 (신뢰 경계 §data-security)
    .insert({
      worker_anon_id: workerId,
      equipment_id: body.equipmentId,
      language: body.language,
      content_id: body.contentId,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(toRecord(data));
}
