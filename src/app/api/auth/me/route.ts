import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const supabase = createServerSupabaseClient();
  const { data: worker, error } = await supabase
    .from("workers")
    .select("*")
    .eq("id", session.workerId)
    .maybeSingle();
  if (error || !worker) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  return NextResponse.json({
    id: worker.id,
    displayName: worker.display_name,
    language: worker.language,
    role: worker.role,
  });
}
