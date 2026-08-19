import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const cookieStore = await cookies();
  const workerId = verifySessionCookieValue(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!workerId) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const supabase = createServerSupabaseClient();
  const { data: worker, error } = await supabase.from("workers").select("*").eq("id", workerId).maybeSingle();
  if (error || !worker) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  return NextResponse.json({ id: worker.id, displayName: worker.display_name, language: worker.language });
}
