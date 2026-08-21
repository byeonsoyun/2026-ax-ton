import "server-only";
import { cookies } from "next/headers";
import { verifySessionCookieValue, SESSION_COOKIE_NAME, type SessionRole } from "@/lib/session";

// Route Handler / Server Component에서 현재 로그인한 worker의 id를 읽는 공용 헬퍼.
export async function getSessionWorkerId(): Promise<string | null> {
  const cookieStore = await cookies();
  return verifySessionCookieValue(cookieStore.get(SESSION_COOKIE_NAME)?.value)?.workerId ?? null;
}

export async function getSession(): Promise<{ workerId: string; role: SessionRole } | null> {
  const cookieStore = await cookies();
  return verifySessionCookieValue(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}
