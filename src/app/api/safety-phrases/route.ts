import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function toPhrase(row: Record<string, unknown>) {
  return {
    id: row.id,
    textKo: row.text_ko,
    translations: row.translations,
    status: row.status,
    reviewedBy: row.reviewed_by,
    createdAt: row.created_at,
  };
}

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("safety_phrases")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(toPhrase));
}
