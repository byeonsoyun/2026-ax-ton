import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/session";

// 노동자 화면(/w/**)은 전부 로그인이 필요하다 — "첫 화면(홈)"부터 마이페이지·안전교육·신고·
// 현장소통까지 전부 로그인된 worker 신원에 묶인다. /login, /signup은 공개.
export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtected = path.startsWith("/w");

  if (!isProtected) return NextResponse.next();

  const workerId = verifySessionCookieValue(req.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!workerId) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", path + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/w/:path*"],
};
