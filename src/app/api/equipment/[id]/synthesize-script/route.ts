import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { synthesizeScript, type ScriptDraftLine } from "@/lib/ai/synthesize-script";

const MOCK_DRAFTS: ScriptDraftLine[] = [
  {
    order: 1,
    draftText: "작업 전 전원이 완전히 차단됐는지 반드시 눈으로 확인하세요.",
    sourceNotes: "목(mock) 응답 — ANTHROPIC_API_KEY 미설정",
  },
  {
    order: 2,
    draftText: "게이지를 확인해 잔류 압력이 남아있지 않은지 확인하세요.",
    sourceNotes: "목(mock) 응답 — ANTHROPIC_API_KEY 미설정",
  },
  {
    order: 3,
    draftText: "작업구역에 손이나 이물질이 남아있지 않은지 다시 한 번 확인하세요.",
    sourceNotes: "목(mock) 응답 — ANTHROPIC_API_KEY 미설정",
  },
  {
    order: 4,
    draftText: "정비 작업 시 안전핀을 반드시 끼워 슬라이드 낙하를 막으세요.",
    sourceNotes: "목(mock) 응답 — ANTHROPIC_API_KEY 미설정",
  },
];

export async function GET(_req: Request, ctx: RouteContext<"/api/equipment/[id]/synthesize-script">) {
  const { id } = await ctx.params;
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("script_drafts")
    .select("*")
    .eq("equipment_id", id)
    .order("step_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(
    (data ?? []).map((d) => ({
      id: d.id,
      stepOrder: d.step_order,
      draftText: d.draft_text,
      sourceNotes: d.source_notes,
      status: d.status,
      createdAt: d.created_at,
    }))
  );
}

export async function POST(_req: Request, ctx: RouteContext<"/api/equipment/[id]/synthesize-script">) {
  const { id } = await ctx.params;
  const supabase = createServerSupabaseClient();

  const { data: equipment, error: eqErr } = await supabase
    .from("equipment")
    .select("*")
    .eq("id", id)
    .single();
  if (eqErr || !equipment) return NextResponse.json({ error: "설비를 찾을 수 없습니다" }, { status: 404 });

  const steps = equipment.checklist?.steps ?? [];
  const lines = process.env.ANTHROPIC_API_KEY
    ? await synthesizeScript(equipment.equipment_type, steps)
    : MOCK_DRAFTS;

  const { data, error } = await supabase
    .from("script_drafts")
    .insert(
      lines.map((l) => ({
        equipment_id: id,
        step_order: l.order,
        draft_text: l.draftText,
        source_notes: l.sourceNotes,
      }))
    )
    .select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    data.map((d) => ({
      id: d.id,
      stepOrder: d.step_order,
      draftText: d.draft_text,
      sourceNotes: d.source_notes,
      status: d.status,
      createdAt: d.created_at,
    }))
  );
}
