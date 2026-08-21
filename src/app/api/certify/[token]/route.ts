import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// 3층 아이디어: 수료증 공유. 로그인 없이도 볼 수 있는 짧은 공개 링크지만,
// UUID share_token을 아는 사람만 접근 가능하고 완료(서명)된 기록만 노출한다.
export async function GET(_req: Request, ctx: RouteContext<"/api/certify/[token]">) {
  const { token } = await ctx.params;
  const supabase = createServerSupabaseClient();

  const { data: record, error } = await supabase
    .from("training_records")
    .select("*")
    .eq("share_token", token)
    .not("completed_at", "is", null)
    .single();
  if (error) {
    // PGRST116 = single()이 0건을 찾은 정상 케이스. 그 외(컬럼 없음 등)는 실제 오류이므로 감춘다.
    const status = error.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
  if (!record) {
    return NextResponse.json({ error: "공유된 증빙을 찾을 수 없습니다" }, { status: 404 });
  }

  const { data: equipment } = await supabase
    .from("equipment")
    .select("name")
    .eq("id", record.equipment_id)
    .single();

  return NextResponse.json({
    record: {
      id: record.id,
      equipmentId: record.equipment_id,
      language: record.language,
      contentId: record.content_id,
      startedAt: record.started_at,
      completedAt: record.completed_at,
      quizResults: record.quiz_results,
      passed: record.passed,
      signatureName: record.signature_name,
      signedAt: record.signed_at,
      integrityHash: record.integrity_hash,
      createdAt: record.created_at,
      shareToken: record.share_token,
    },
    equipmentName: equipment?.name ?? "설비",
  });
}
