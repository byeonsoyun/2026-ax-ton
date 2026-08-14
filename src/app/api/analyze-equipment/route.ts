import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";

// F-01 1단계: 설비 사진 → Vision 분석 → 체크리스트 초안.
// ANTHROPIC_API_KEY가 없으면 데모용 목(mock) 응답을 반환한다 — 계정 연결 전에도 화면 흐름을
// 그대로 확인할 수 있게 하기 위함. 키가 설정되면 자동으로 실제 Claude Vision 호출로 전환된다.

type AnalysisResult = {
  equipmentType: string;
  suggestedSteps: { order: number; label: string }[];
  suggestedHazards: { label: string; consequenceText: string }[];
  source: "claude-vision" | "mock";
};

const MOCK_RESULT: AnalysisResult = {
  equipmentType: "press",
  suggestedSteps: [
    { order: 1, label: "전원 차단 확인" },
    { order: 2, label: "잔류 압력 게이지 확인" },
    { order: 3, label: "작업구역 정리 확인" },
    { order: 4, label: "안전핀 삽입" },
  ],
  suggestedHazards: [
    { label: "협착 지점", consequenceText: "이 지점에 손가락이 끼면 골절·절단 사고로 이어질 수 있습니다." },
    { label: "잔류 압력", consequenceText: "잔류 압력이 남은 채 작업하면 갑작스러운 프레스 하강으로 다칠 수 있습니다." },
  ],
  source: "mock",
};

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(MOCK_RESULT);
  }

  const formData = await request.formData();
  const file = formData.get("photo");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "photo 파일이 필요합니다" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const base64 = bytes.toString("base64");

  const client = getAnthropicClient();
  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: (file.type || "image/jpeg") as "image/jpeg", data: base64 },
          },
          {
            type: "text",
            text:
              "이 사진은 제조업 현장 설비 사진입니다. 다음 JSON 형식으로만 답하세요(설명 없이): " +
              '{"equipmentType": string, "suggestedSteps": [{"order": number, "label": string}], ' +
              '"suggestedHazards": [{"label": string, "consequenceText": string}]}. ' +
              "suggestedSteps는 이 설비를 안전하게 조작하기 위한 순서(전원 차단 확인 등)이고, " +
              "suggestedHazards는 이 설비에서 실제로 발생 가능한 협착·화상 등 위험 지점입니다.",
          },
        ],
      },
    ],
  });

  const text = message.content.find((b) => b.type === "text")?.text ?? "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : MOCK_RESULT;

  return NextResponse.json({ ...parsed, source: "claude-vision" } satisfies AnalysisResult);
}
