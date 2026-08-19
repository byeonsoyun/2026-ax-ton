import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "path";

config({ path: path.join(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// press-machine.ts의 데이터를 그대로 옮겨 심는다 (한 곳에서 유지보수하기 위해
// 이 스크립트가 유일한 source-of-truth 역할을 한다 — src/lib/seed/press-machine.ts는
// 이제 참고용/오프라인 폴백용으로 남는다).

const checklist = {
  steps: [
    { order: 1, label: "전원 차단 확인", hotspot: { x: 12, y: 8, w: 18, h: 20 }, wrongOrderFeedback: "전원이 켜진 채로 다음 단계를 진행하면 갑자기 프레스가 작동할 수 있습니다." },
    { order: 2, label: "잔류 압력 게이지 확인", hotspot: { x: 66, y: 8, w: 24, h: 20 }, wrongOrderFeedback: "잔류 압력을 확인하지 않으면 남은 압력으로 갑자기 눌릴 수 있습니다." },
    { order: 3, label: "작업구역 정리 확인", hotspot: { x: 28, y: 32, w: 44, h: 40 }, wrongOrderFeedback: "작업구역에 손이나 이물질이 남은 채 진행하면 협착 사고로 이어집니다." },
    { order: 4, label: "안전핀 삽입", hotspot: { x: 70, y: 74, w: 16, h: 14 }, wrongOrderFeedback: "안전핀 없이 마무리하면 다음 사용자가 무방비 상태로 작업을 시작하게 됩니다." },
  ],
  hazards: [
    { id: "pinch-point", label: "협착 지점", hotspot: { x: 38, y: 40, w: 24, h: 22 }, consequenceText: "이 지점에 손가락이 끼면 골절·절단 사고로 이어질 수 있습니다." },
    { id: "residual-pressure", label: "잔류 압력", hotspot: { x: 66, y: 8, w: 24, h: 20 }, consequenceText: "잔류 압력이 남은 채 작업하면 갑작스러운 프레스 하강으로 다칠 수 있습니다." },
  ],
};

const phrases = [
  { id: "step-1", text_ko: "전원 차단 확인", vi: "Kiểm tra đã ngắt điện", km: "ពិនិត្យមើលថាបានកាត់ចរន្តអគ្គិសនី" },
  { id: "step-2", text_ko: "잔류 압력 게이지 확인", vi: "Kiểm tra đồng hồ áp suất dư", km: "ពិនិត្យម៉ែត្រសម្ពាធសល់" },
  { id: "step-3", text_ko: "작업구역 정리 확인", vi: "Kiểm tra khu vực làm việc đã dọn sạch", km: "ពិនិត្យតំបន់ការងារឱ្យស្អាត" },
  { id: "step-4", text_ko: "안전핀 삽입", vi: "Cắm chốt an toàn", km: "ដាក់ម្ជុលសុវត្ថិភាព" },
];

const branchCopy = {
  ko: {
    prompt: "프레스기로 작업 중 부품 사이에 이물질이 끼었습니다. 당신의 첫 행동은?",
    options: [
      { label: "전원을 끄고 반장에게 알린다", mediaUrl: null, isCorrect: true, resultText: "올바른 대응입니다. 전원 차단 후 담당자에게 알리면 안전하게 처리할 수 있습니다." },
      { label: "손으로 직접 빼낸다", mediaUrl: null, isCorrect: false, resultText: "위험합니다! 전원이 켜진 상태에서 손을 넣으면 협착 사고로 이어질 수 있습니다." },
    ],
  },
  vi: {
    prompt: "Trong khi vận hành máy ép, có dị vật kẹt giữa các bộ phận. Hành động đầu tiên của bạn là gì?",
    options: [
      { label: "Tắt nguồn điện và báo cho tổ trưởng", mediaUrl: null, isCorrect: true, resultText: "Đúng. Ngắt điện rồi báo cho quản lý là cách xử lý an toàn." },
      { label: "Dùng tay lấy dị vật ra trực tiếp", mediaUrl: null, isCorrect: false, resultText: "Nguy hiểm! Đưa tay vào khi máy còn điện có thể gây kẹp tay." },
    ],
  },
  km: {
    prompt: "ខណៈធ្វើការជាមួយម៉ាស៊ីនចុច មានវត្ថុមួយជាប់ចន្លោះផ្នែក។ អ្វីជាសកម្មភាពដំបូងរបស់អ្នក?",
    options: [
      { label: "បិទចរន្តអគ្គិសនី ហើយប្រាប់ប្រធានក្រុម", mediaUrl: null, isCorrect: true, resultText: "ត្រឹមត្រូវ។ ការបិទចរន្តហើយប្រាប់អ្នកគ្រប់គ្រងគឺជាវិធីដោះស្រាយប្រកបដោយសុវត្ថិភាព។" },
      { label: "ដកវត្ថុនោះចេញដោយផ្ទាល់ដោយដៃ", mediaUrl: null, isCorrect: false, resultText: "គ្រោះថ្នាក់! ការដាក់ដៃចូលខណៈពេលចរន្តនៅតែបើក អាចបណ្ដាលឱ្យប្រថាប់ដៃ។" },
    ],
  },
};

const LANGS = ["ko", "vi", "km"];

async function main() {
  console.log("Seeding equipment...");
  const { data: equipment, error: eqErr } = await supabase
    .from("equipment")
    .insert({
      name: "프레스기 1호",
      equipment_type: "press",
      photo_url: null,
      checklist,
      status: "approved",
      approved_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (eqErr) throw eqErr;
  console.log("equipment.id =", equipment.id);

  console.log("Seeding safety_phrases...");
  const { error: phraseErr } = await supabase.from("safety_phrases").insert(
    phrases.map((p) => ({
      text_ko: p.text_ko,
      translations: { vi: p.vi, km: p.km },
      audio_urls: {},
      status: "pending",
    }))
  );
  if (phraseErr) throw phraseErr;

  for (const lang of LANGS) {
    console.log(`Seeding training_contents (${lang})...`);
    const slides = checklist.steps.map((step, i) => {
      const p = phrases[i];
      const text = lang === "ko" ? p.text_ko : lang === "vi" ? p.vi : p.km;
      return { order: step.order, image_url: "", phrase_id: p.id, pictogram: text, narration_audio_url: null };
    });
    const { error: contentErr } = await supabase.from("training_contents").insert({
      equipment_id: equipment.id,
      language: lang,
      slides,
      status: "approved",
      approved_at: new Date().toISOString(),
    });
    if (contentErr) throw contentErr;

    console.log(`Seeding quiz_items (${lang})...`);
    const { error: quizErr } = await supabase.from("quiz_items").insert([
      { equipment_id: equipment.id, language: lang, item_type: "sequence", data: { steps: checklist.steps } },
      { equipment_id: equipment.id, language: lang, item_type: "hotspot", data: { imageUrl: "", hazards: checklist.hazards } },
      { equipment_id: equipment.id, language: lang, item_type: "branch", data: branchCopy[lang] },
    ]);
    if (quizErr) throw quizErr;
  }

  console.log("Done. equipment.id =", equipment.id);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
