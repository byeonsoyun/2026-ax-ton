import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: Request, ctx: RouteContext<"/api/equipment/[id]/quiz">) {
  const { id } = await ctx.params;
  const lang = new URL(req.url).searchParams.get("lang") ?? "ko";
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("quiz_items")
    .select("*")
    .eq("equipment_id", id)
    .eq("language", lang);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  // F-01 4단계 설계대로 sequence → hotspot → branch 고정 순서로 정렬한다
  const order = { sequence: 0, hotspot: 1, branch: 2 } as const;
  const sorted = [...(data ?? [])].sort(
    (a, b) => order[a.item_type as keyof typeof order] - order[b.item_type as keyof typeof order]
  );
  return NextResponse.json(
    sorted.map((q) => ({
      id: q.id,
      equipmentId: q.equipment_id,
      language: q.language,
      itemType: q.item_type,
      data: q.data,
    }))
  );
}
