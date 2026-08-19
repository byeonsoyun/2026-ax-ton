import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "path";

config({ path: path.join(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 시드 스크립트가 JSONB 안에 스네이크케이스 키(is_correct, result_text, media_url,
// consequence_text, wrong_order_feedback)로 넣어버려서 프론트엔드(camelCase 기대)와
// 어긋난 걸 바로잡는다. equipment_id/row id는 그대로 두고 JSON 내용만 갱신 —
// 이미 생성된 training_records의 참조가 깨지지 않게 하기 위함.

function fixStep(step) {
  const { wrong_order_feedback, ...rest } = step;
  return { ...rest, wrongOrderFeedback: wrong_order_feedback ?? step.wrongOrderFeedback };
}

function fixHazard(hazard) {
  const { consequence_text, ...rest } = hazard;
  return { ...rest, consequenceText: consequence_text ?? hazard.consequenceText };
}

function fixOption(option) {
  const { media_url, is_correct, result_text, ...rest } = option;
  return {
    ...rest,
    mediaUrl: media_url ?? option.mediaUrl ?? null,
    isCorrect: is_correct ?? option.isCorrect,
    resultText: result_text ?? option.resultText,
  };
}

async function main() {
  const { data: equipmentRows, error: eqErr } = await supabase.from("equipment").select("*");
  if (eqErr) throw eqErr;

  for (const eq of equipmentRows) {
    const checklist = eq.checklist;
    const fixedChecklist = {
      steps: (checklist.steps ?? []).map(fixStep),
      hazards: (checklist.hazards ?? []).map(fixHazard),
    };
    const { error } = await supabase.from("equipment").update({ checklist: fixedChecklist }).eq("id", eq.id);
    if (error) throw error;
    console.log("fixed equipment", eq.id);
  }

  const { data: quizRows, error: quizErr } = await supabase.from("quiz_items").select("*");
  if (quizErr) throw quizErr;

  for (const q of quizRows) {
    let fixedData = q.data;
    if (q.item_type === "sequence") {
      fixedData = { steps: (q.data.steps ?? []).map(fixStep) };
    } else if (q.item_type === "hotspot") {
      fixedData = { imageUrl: q.data.imageUrl ?? "", hazards: (q.data.hazards ?? []).map(fixHazard) };
    } else if (q.item_type === "branch") {
      fixedData = { prompt: q.data.prompt, options: (q.data.options ?? []).map(fixOption) };
    }
    const { error } = await supabase.from("quiz_items").update({ data: fixedData }).eq("id", q.id);
    if (error) throw error;
    console.log("fixed quiz_item", q.id, q.item_type);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
