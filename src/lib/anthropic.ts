import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// F-01 1단계(Vision 분석)와 2·3단계(번역)에서 공용으로 쓰는 Claude 클라이언트.
// 반드시 서버 사이드에서만 호출 — API 키가 클라이언트로 노출되면 안 된다.
export function getAnthropicClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}
