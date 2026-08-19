import { NextResponse } from "next/server";
import { renderEquipmentVideo } from "@/lib/video/render";

// 로컬 전용(tools/README.md) — ffmpeg·Piper·Windows SAPI를 이 서버 프로세스에서 직접 실행한다.
// Vercel 등 서버리스 배포 환경에는 이 라우트가 동작하지 않는다.
export async function POST(req: Request, ctx: RouteContext<"/api/equipment/[id]/render-video">) {
  const { id } = await ctx.params;
  const lang = new URL(req.url).searchParams.get("lang") ?? "ko";
  try {
    const url = await renderEquipmentVideo(id, lang);
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
