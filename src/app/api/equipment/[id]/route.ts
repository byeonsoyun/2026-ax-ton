import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(_req: Request, ctx: RouteContext<"/api/equipment/[id]">) {
  const { id } = await ctx.params;
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("equipment").select("*").eq("id", id).single();
  if (error || !data) {
    return NextResponse.json({ error: "설비를 찾을 수 없습니다" }, { status: 404 });
  }
  return NextResponse.json({
    id: data.id,
    name: data.name,
    equipmentType: data.equipment_type,
    photoUrl: data.photo_url,
    checklist: data.checklist,
    status: data.status,
  });
}
