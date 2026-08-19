import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

// 아주 단순한 서명된 세션 쿠키. Supabase Auth를 쓰지 않는 이유:
// 로그인 방식을 "사업장 발급 ID + 비밀번호"로 하기로 했는데, Supabase Auth는 이메일/전화
// 중심이라 억지로 맞추는 것보다 workers 테이블 + 서명 쿠키가 더 단순하고 명확하다.

const COOKIE_NAME = "safelang_session";

function sign(value: string): string {
  const secret = process.env.SESSION_SECRET!;
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function createSessionCookieValue(workerId: string): string {
  const signature = sign(workerId);
  return `${workerId}.${signature}`;
}

export function verifySessionCookieValue(cookieValue: string | undefined): string | null {
  if (!cookieValue) return null;
  const [workerId, signature] = cookieValue.split(".");
  if (!workerId || !signature) return null;
  const expected = sign(workerId);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return workerId;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
