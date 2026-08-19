import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createSessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/session";

export async function POST(req: Request) {
  const { id, password } = await req.json();
  if (!id || !password) {
    return NextResponse.json({ error: "ID와 비밀번호를 입력하세요" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data: worker, error } = await supabase.from("workers").select("*").eq("id", id).maybeSingle();
  if (error || !worker) {
    return NextResponse.json({ error: "ID 또는 비밀번호가 올바르지 않습니다" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, worker.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "ID 또는 비밀번호가 올바르지 않습니다" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, createSessionCookieValue(id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({ id: worker.id, displayName: worker.display_name, language: worker.language });
}
