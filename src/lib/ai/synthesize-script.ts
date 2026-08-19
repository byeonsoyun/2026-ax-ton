import "server-only";
import { getAnthropicClient } from "@/lib/anthropic";
import { RESEARCH_SOURCES } from "@/lib/ai/research-sources";
import type { ChecklistStep } from "@/lib/types";

export type ScriptDraftLine = { order: number; draftText: string; sourceNotes: string };

// F-01 2단계: 체크리스트 + 여러 리서치 소스를 종합해 나레이션 초안을 재구성한다.
// 한 소스를 그대로 베끼지 않고 여러 소스의 핵심을 합성하도록 프롬프트에 명시한다.
// 결과는 절대 그대로 쓰이지 않는다 — 호출부(API route)가 status="pending"으로 저장하고,
// 담당자가 F-08 문구 라이브러리와 대조해 승인해야만 실제 나레이션으로 편입된다.
export async function synthesizeScript(
  equipmentType: string,
  steps: ChecklistStep[]
): Promise<ScriptDraftLine[]> {
  const sources = RESEARCH_SOURCES[equipmentType] ?? [];
  const client = getAnthropicClient();

  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content:
          `다음은 "${equipmentType}" 설비의 조작 절차 단계 목록과, 참고할 안전 자료 여러 개다.\n\n` +
          `[절차 단계]\n${steps.map((s) => `${s.order}. ${s.label}`).join("\n")}\n\n` +
          `[참고 자료 (여러 개 — 하나만 베끼지 말고 종합해서 재구성할 것)]\n` +
          sources.map((s) => `- ${s.label}: ${s.text}`).join("\n") +
          `\n\n각 절차 단계마다, 위 참고 자료들의 핵심을 종합해서 노동자에게 말하듯 짧고 명확한 ` +
          `한국어 나레이션 한 문장을 새로 작성하라. 어느 자료 한 곳을 그대로 옮기지 말고 여러 자료의 ` +
          `내용을 합쳐서 이 설비 상황에 맞게 재구성해야 한다. 다음 JSON 배열 형식으로만 답하라(설명 없이): ` +
          `[{"order": number, "draftText": string, "sourceNotes": string}]. sourceNotes에는 이 문장을 ` +
          `만들 때 어떤 참고 자료들을 종합했는지 한국어로 짧게 적어라.`,
      },
    ],
  });

  const text = message.content.find((b) => b.type === "text")?.text ?? "[]";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
}
