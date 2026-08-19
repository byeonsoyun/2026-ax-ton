import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

export async function GET(_req: Request, ctx: RouteContext<"/api/training-records/[id]">) {
  const { id } = await ctx.params;
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("training_records").select("*").eq("id", id).single();
  if (error || !data) return NextResponse.json({ error: "기록을 찾을 수 없습니다" }, { status: 404 });
  return NextResponse.json(toRecord(data));
}

// F-03: 검증 결과 + 서명이 확정되는 시점. 이후 이 레코드는 수정하지 않는다 (§10 리스크: 기록 임의 수정 불가).
export async function PATCH(req: Request, ctx: RouteContext<"/api/training-records/[id]">) {
  const { id } = await ctx.params;
  const body = await req.json();
  const supabase = createServerSupabaseClient();

  const { data: existing, error: fetchErr } = await supabase
    .from("training_records")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchErr || !existing) return NextResponse.json({ error: "기록을 찾을 수 없습니다" }, { status: 404 });
  if (existing.completed_at) {
    return NextResponse.json({ error: "이미 완료된 기록은 수정할 수 없습니다" }, { status: 409 });
  }

  const passed = (body.quizResults as { passed: boolean }[]).every((r) => r.passed);
  const completedAt = new Date().toISOString();
  const integrityHash = createHash("sha256")
    .update(JSON.stringify(body.quizResults) + body.signatureName + completedAt)
    .digest("hex");

  const { data, error } = await supabase
    .from("training_records")
    .update({
      quiz_results: body.quizResults,
      passed,
      completed_at: completedAt,
      signature_name: body.signatureName,
      signed_at: completedAt,
      integrity_hash: integrityHash,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(toRecord(data));
}
