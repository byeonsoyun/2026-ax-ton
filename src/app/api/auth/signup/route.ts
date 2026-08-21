import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createSessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/session";

export async function POST(req: Request) {
  const { id, password, displayName, language, role } = await req.json();
  if (!id || !password) {
    return NextResponse.json({ error: "ID와 비밀번호를 입력하세요" }, { status: 400 });
  }
  const finalRole = role === "manager" ? "manager" : "worker";

  const supabase = createServerSupabaseClient();
  const { data: existing } = await supabase.from("workers").select("id").eq("id", id).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "이미 사용 중인 ID입니다" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { error } = await supabase.from("workers").insert({
    id,
    password_hash: passwordHash,
    display_name: displayName || null,
    language: language || "ko",
    role: finalRole,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, createSessionCookieValue(id, finalRole), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({ id, role: finalRole });
}
