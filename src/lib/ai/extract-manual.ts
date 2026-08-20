import "server-only";
import { getAnthropicClient } from "@/lib/anthropic";

export type ManualExtractedItem = { text: string; page: number | null; section: string | null };

// F-09 (경로 B): 매뉴얼 PDF에서 경고·주의·절차 항목을 페이지 근거와 함께 추출한다.
// 원문을 그대로 옮기지 않고 "이 페이지 이 절에 이런 내용이 있다"는 사실만 뽑아,
// 실제 안전 지시문으로 쓰기 전 F-08 검수를 반드시 거치게 한다 (§4.2 원칙 2).
export async function extractManualItems(pdfBase64: string): Promise<ManualExtractedItem[]> {
  const client = getAnthropicClient();

  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: pdfBase64 },
          },
          {
            type: "text",
            text:
              "이 설비 매뉴얼에서 경고(⚠)·주의·안전 절차 항목을 찾아 추출하라. 문장을 그대로 베끼지 말고 " +
              "핵심 내용을 짧은 한국어 문장으로 정리하라. 각 항목에 근거(페이지 번호, 절 제목)를 반드시 " +
              "붙여라. 다음 JSON 배열 형식으로만 답하라(설명 없이): " +
              '[{"text": string, "page": number, "section": string}]',
          },
        ],
      },
    ],
  });

  const text = message.content.find((b) => b.type === "text")?.text ?? "[]";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
}
