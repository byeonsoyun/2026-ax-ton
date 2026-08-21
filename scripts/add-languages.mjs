import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "path";

config({ path: path.join(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 팀 우선순위 문서(1층)가 요구하는 6개 언어를 맞추기 위해 인도네시아어(id)·태국어(th)·
// 네팔어(ne)를 기존에 이미 심어둔 설비(press-01)에 추가한다. seed-supabase.mjs를 다시
// 돌리면 equipment가 중복 생성되므로, 기존 equipment.id를 그대로 재사용하는 별도 스크립트다.
// 번역은 원어민 검수 전 초안이라 safety_phrases.status는 계속 "pending"으로 둔다.

const TRANSLATIONS = {
  id: {
    "step-1": "Periksa apakah listrik sudah dimatikan",
    "step-2": "Periksa pengukur tekanan sisa",
    "step-3": "Periksa apakah area kerja sudah bersih",
    "step-4": "Pasang pin pengaman",
  },
  th: {
    "step-1": "ตรวจสอบว่าตัดกระแสไฟฟ้าแล้ว",
    "step-2": "ตรวจสอบมาตรวัดแรงดันคงค้าง",
    "step-3": "ตรวจสอบว่าพื้นที่ทำงานสะอาดเรียบร้อย",
    "step-4": "ใส่สลักนิรภัย",
  },
  ne: {
    "step-1": "बिजुली बन्द भएको जाँच गर्नुहोस्",
    "step-2": "अवशिष्ट चाप गेज जाँच गर्नुहोस्",
    "step-3": "कार्यक्षेत्र सफा भएको जाँच गर्नुहोस्",
    "step-4": "सुरक्षा पिन लगाउनुहोस्",
  },
};

const HAZARD_TRANSLATIONS = {
  id: {
    "pinch-point": { label: "Titik jepitan", consequenceText: "Jika jari terjepit di titik ini, dapat menyebabkan patah tulang atau cedera amputasi." },
    "residual-pressure": { label: "Tekanan sisa", consequenceText: "Jika bekerja saat masih ada tekanan sisa, mesin press bisa turun tiba-tiba dan menyebabkan cedera." },
  },
  th: {
    "pinch-point": { label: "จุดหนีบ", consequenceText: "หากนิ้วติดอยู่ที่จุดนี้ อาจทำให้กระดูกหักหรือถูกตัดขาดได้" },
    "residual-pressure": { label: "แรงดันคงค้าง", consequenceText: "หากทำงานขณะยังมีแรงดันคงค้าง เครื่องปั๊มอาจเลื่อนลงกะทันหันและทำให้บาดเจ็บได้" },
  },
  ne: {
    "pinch-point": { label: "च्यापिने बिन्दु", consequenceText: "यदि यहाँ औंला च्यापियो भने हड्डी भाँचिन वा काटिन सक्छ।" },
    "residual-pressure": { label: "अवशिष्ट चाप", consequenceText: "अवशिष्ट चाप रहेकै बेला काम गर्दा प्रेस अचानक तल झर्न सक्छ र चोट लाग्न सक्छ।" },
  },
};

const BRANCH_COPY = {
  id: {
    prompt: "Saat bekerja dengan mesin press, ada benda asing yang tersangkut di antara bagian mesin. Apa tindakan pertama Anda?",
    options: [
      { label: "Matikan listrik dan beri tahu mandor", mediaUrl: null, isCorrect: true, resultText: "Benar. Mematikan listrik lalu melapor ke penyelia adalah cara yang aman." },
      { label: "Mengeluarkannya langsung dengan tangan", mediaUrl: null, isCorrect: false, resultText: "Berbahaya! Memasukkan tangan saat listrik masih menyala dapat menyebabkan cedera jepit." },
    ],
  },
  th: {
    prompt: "ขณะทำงานกับเครื่องปั๊ม มีสิ่งแปลกปลอมติดอยู่ระหว่างชิ้นส่วน คุณจะทำอะไรเป็นอันดับแรก?",
    options: [
      { label: "ปิดไฟแล้วแจ้งหัวหน้างาน", mediaUrl: null, isCorrect: true, resultText: "ถูกต้อง การตัดไฟแล้วแจ้งผู้ดูแลเป็นวิธีที่ปลอดภัย" },
      { label: "ใช้มือดึงออกโดยตรง", mediaUrl: null, isCorrect: false, resultText: "อันตราย! การยื่นมือเข้าไปขณะที่ไฟยังเปิดอยู่อาจทำให้มือติดได้" },
    ],
  },
  ne: {
    prompt: "प्रेस मेसिनमा काम गर्दा पार्ट्सको बीचमा केही फसेको छ। तपाईंको पहिलो कदम के हो?",
    options: [
      { label: "बिजुली बन्द गरी सुपरिवेक्षकलाई जानकारी दिने", mediaUrl: null, isCorrect: true, resultText: "सही। बिजुली बन्द गरी व्यवस्थापकलाई सूचित गर्नु सुरक्षित तरिका हो।" },
      { label: "हातले सिधै निकाल्ने", mediaUrl: null, isCorrect: false, resultText: "खतरनाक! बिजुली चालू रहेको बेला हात हाल्दा च्यापिने दुर्घटना हुन सक्छ।" },
    ],
  },
};

const NEW_LANGS = ["id", "th", "ne"];

async function main() {
  const { data: equipment, error: eqErr } = await supabase.from("equipment").select("*").single();
  if (eqErr) throw eqErr;
  console.log("equipment.id =", equipment.id);
  const checklist = equipment.checklist;

  // 기존 safety_phrases에 새 언어 번역 추가
  const { data: phrases, error: phraseErr } = await supabase
    .from("safety_phrases")
    .select("*")
    .order("created_at", { ascending: true });
  if (phraseErr) throw phraseErr;

  for (let i = 0; i < phrases.length; i++) {
    const stepKey = `step-${i + 1}`;
    const additions = Object.fromEntries(NEW_LANGS.map((l) => [l, TRANSLATIONS[l][stepKey]]));
    const { error } = await supabase
      .from("safety_phrases")
      .update({ translations: { ...phrases[i].translations, ...additions } })
      .eq("id", phrases[i].id);
    if (error) throw error;
  }
  console.log("safety_phrases updated with id/th/ne");

  for (const lang of NEW_LANGS) {
    console.log(`Seeding training_contents (${lang})...`);
    const slides = checklist.steps.map((step, i) => ({
      order: step.order,
      imageUrl: "",
      phraseId: `step-${i + 1}`,
      pictogram: TRANSLATIONS[lang][`step-${i + 1}`],
      narrationAudioUrl: null,
    }));
    const { error: contentErr } = await supabase.from("training_contents").insert({
      equipment_id: equipment.id,
      language: lang,
      slides,
      status: "approved",
      approved_at: new Date().toISOString(),
    });
    if (contentErr) throw contentErr;

    console.log(`Seeding quiz_items (${lang})...`);
    const translatedHazards = checklist.hazards.map((h) => ({
      ...h,
      label: HAZARD_TRANSLATIONS[lang][h.id]?.label ?? h.label,
      consequenceText: HAZARD_TRANSLATIONS[lang][h.id]?.consequenceText ?? h.consequenceText,
    }));
    const { error: quizErr } = await supabase.from("quiz_items").insert([
      { equipment_id: equipment.id, language: lang, item_type: "sequence", data: { steps: checklist.steps } },
      { equipment_id: equipment.id, language: lang, item_type: "hotspot", data: { imageUrl: "", hazards: translatedHazards } },
      { equipment_id: equipment.id, language: lang, item_type: "branch", data: BRANCH_COPY[lang] },
    ]);
    if (quizErr) throw quizErr;
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
