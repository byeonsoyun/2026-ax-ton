import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { extractManualItems, type ManualExtractedItem } from "@/lib/ai/extract-manual";

const MOCK_ITEMS: ManualExtractedItem[] = [
  { text: "작업 전 잔류 압력 게이지를 확인한다", page: 34, section: "4.2 작업 준비" },
  { text: "금형 교체 시 안전블록을 반드시 삽입한다", page: 41, section: "5.1 정비 절차" },
  { text: "방호장치를 임의로 해제하지 않는다", page: 12, section: "2.3 일반 안전수칙" },
];

function toResponse(row: Record<string, unknown>) {
  return {
    id: row.id,
    equipmentId: row.equipment_id,
    fileName: row.file_name,
    extractedItems: row.extracted_items,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function GET(_req: Request, ctx: RouteContext<"/api/equipment/[id]/manual-upload">) {
  const { id } = await ctx.params;
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("manual_uploads")
    .select("id, equipment_id, file_name, extracted_items, status, created_at")
    .eq("equipment_id", id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(toResponse));
}

export async function POST(req: Request, ctx: RouteContext<"/api/equipment/[id]/manual-upload">) {
  const { id } = await ctx.params;
  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file이 필요합니다" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const base64 = bytes.toString("base64");
  const supabase = createServerSupabaseClient();

  const items = process.env.ANTHROPIC_API_KEY ? await extractManualItems(base64) : MOCK_ITEMS;

  const { data: upload, error } = await supabase
    .from("manual_uploads")
    .insert({
      equipment_id: id,
      file_name: file.name,
      file_data: base64,
      extracted_items: items,
      status: "done",
    })
    .select("id, equipment_id, file_name, extracted_items, status, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 추출 항목을 script_drafts와 같은 검수 대기 큐로 합류시킨다 (§F-09: 매뉴얼 근거라도 검수 생략 안 함)
  const draftRows = items.map((item, i) => ({
    equipment_id: id,
    step_order: 1000 + i, // 체크리스트 순번과 겹치지 않는 별도 범위 — 매뉴얼 발췌는 순서가 없는 항목이라
    draft_text: item.text,
    source_notes: `매뉴얼(${file.name}) ${item.page ? item.page + "페이지" : ""} ${item.section ?? ""}`.trim(),
  }));
  if (draftRows.length > 0) {
    const { error: draftErr } = await supabase.from("script_drafts").insert(draftRows);
    if (draftErr) return NextResponse.json({ error: draftErr.message }, { status: 500 });
  }

  return NextResponse.json(toResponse(upload));
}
