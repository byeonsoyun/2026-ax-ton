import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/session";

// 노동자 화면(/w/**)과 담당자 화면(/manager/**)은 각각 로그인이 필요하다 — 팀 우선순위
// 문서(1층): "노동자/담당자 역할별로 다른 화면이 열린다". /login, /signup은 공개.
export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isWorkerArea = path.startsWith("/w");
  const isManagerArea = path.startsWith("/manager");

  if (!isWorkerArea && !isManagerArea) return NextResponse.next();

  const session = verifySessionCookieValue(req.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", path + req.nextUrl.search);
    if (isManagerArea) loginUrl.searchParams.set("role", "manager");
    return NextResponse.redirect(loginUrl);
  }

  if (isManagerArea && session.role !== "manager") {
    return NextResponse.redirect(new URL("/w", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/w/:path*", "/manager/:path*"],
};
