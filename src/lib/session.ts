import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

// 아주 단순한 서명된 세션 쿠키. Supabase Auth를 쓰지 않는 이유:
// 로그인 방식을 "사업장 발급 ID + 비밀번호"로 하기로 했는데, Supabase Auth는 이메일/전화
// 중심이라 억지로 맞추는 것보다 workers 테이블 + 서명 쿠키가 더 단순하고 명확하다.
//
// role을 쿠키 자체에 서명해 넣어둔다 — proxy(구 middleware)는 매 요청·프리페치마다 돌기
// 때문에 DB 조회 없이 쿠키만으로 낙관적 확인을 하라는 Next.js 권장 패턴을 따른 것이다.

const COOKIE_NAME = "safelang_session";

export type SessionRole = "worker" | "manager";

function sign(value: string): string {
  const secret = process.env.SESSION_SECRET!;
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function createSessionCookieValue(workerId: string, role: SessionRole): string {
  const payload = `${workerId}:${role}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionCookieValue(
  cookieValue: string | undefined
): { workerId: string; role: SessionRole } | null {
  if (!cookieValue) return null;
  const lastDot = cookieValue.lastIndexOf(".");
  if (lastDot === -1) return null;
  const payload = cookieValue.slice(0, lastDot);
  const signature = cookieValue.slice(lastDot + 1);
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const [workerId, role] = payload.split(":");
  if (!workerId || (role !== "worker" && role !== "manager")) return null;
  return { workerId, role };
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
