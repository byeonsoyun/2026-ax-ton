import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("equipment")
    .select("id, name, equipment_type, photo_url, status")
    .eq("status", "approved")
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(
    (data ?? []).map((e) => ({
      id: e.id,
      name: e.name,
      equipmentType: e.equipment_type,
      photoUrl: e.photo_url,
      status: e.status,
    }))
  );
}
