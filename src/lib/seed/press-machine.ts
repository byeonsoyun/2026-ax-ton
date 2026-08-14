import type {
  BranchQuizData,
  Checklist,
  Equipment,
  HotspotQuizData,
  QuizItem,
  SafetyPhrase,
  SequenceQuizData,
  Slide,
  TrainingContent,
} from "@/lib/types";

// 데모용 시드 데이터: 프레스기 1종 x 언어 3종(한국어/베트남어/크메르어).
// 베트남어·크메르어 번역은 원어민 검수를 거치지 않은 초안이라 status를 "pending"으로 둔다.
// (F-08 원칙: 검수 완료가 아닌 문구는 실제 안전 지시로 쓰지 않는다 — 화면에도 "검수 대기" 배지로 표시)

export const EQUIPMENT_ID = "press-01";

export const checklist: Checklist = {
  steps: [
    {
      order: 1,
      label: "전원 차단 확인",
      hotspot: { x: 12, y: 8, w: 18, h: 20 },
      wrongOrderFeedback: "전원이 켜진 채로 다음 단계를 진행하면 갑자기 프레스가 작동할 수 있습니다.",
    },
    {
      order: 2,
      label: "잔류 압력 게이지 확인",
      hotspot: { x: 66, y: 8, w: 24, h: 20 },
      wrongOrderFeedback: "잔류 압력을 확인하지 않으면 남은 압력으로 갑자기 눌릴 수 있습니다.",
    },
    {
      order: 3,
      label: "작업구역 정리 확인",
      hotspot: { x: 28, y: 32, w: 44, h: 40 },
      wrongOrderFeedback: "작업구역에 손이나 이물질이 남은 채 진행하면 협착 사고로 이어집니다.",
    },
    {
      order: 4,
      label: "안전핀 삽입",
      hotspot: { x: 70, y: 74, w: 16, h: 14 },
      wrongOrderFeedback: "안전핀 없이 마무리하면 다음 사용자가 무방비 상태로 작업을 시작하게 됩니다.",
    },
  ],
  hazards: [
    {
      id: "pinch-point",
      label: "협착 지점",
      hotspot: { x: 38, y: 40, w: 24, h: 22 },
      consequenceText: "이 지점에 손가락이 끼면 골절·절단 사고로 이어질 수 있습니다.",
    },
    {
      id: "residual-pressure",
      label: "잔류 압력",
      hotspot: { x: 66, y: 8, w: 24, h: 20 },
      consequenceText: "잔류 압력이 남은 채 작업하면 갑작스러운 프레스 하강으로 다칠 수 있습니다.",
    },
  ],
};

export const equipment: Equipment = {
  id: EQUIPMENT_ID,
  name: "프레스기 1호",
  equipmentType: "press",
  photoUrl: null, // 데모 단계: 실사진 대신 PressMachineDiagram(SVG)을 사용
  checklist,
  status: "approved",
  createdAt: new Date(2026, 7, 1).toISOString(),
  approvedAt: new Date(2026, 7, 1).toISOString(),
};

type PhraseSeed = {
  id: string;
  textKo: string;
  vi: string;
  km: string;
};

const phraseSeeds: PhraseSeed[] = [
  {
    id: "step-1",
    textKo: "전원 차단 확인",
    vi: "Kiểm tra đã ngắt điện",
    km: "ពិនិត្យមើលថាបានកាត់ចរន្តអគ្គិសនី",
  },
  {
    id: "step-2",
    textKo: "잔류 압력 게이지 확인",
    vi: "Kiểm tra đồng hồ áp suất dư",
    km: "ពិនិត្យម៉ែត្រសម្ពាធសល់",
  },
  {
    id: "step-3",
    textKo: "작업구역 정리 확인",
    vi: "Kiểm tra khu vực làm việc đã dọn sạch",
    km: "ពិនិត្យតំបន់ការងារឱ្យស្អាត",
  },
  {
    id: "step-4",
    textKo: "안전핀 삽입",
    vi: "Cắm chốt an toàn",
    km: "ដាក់ម្ជុលសុវត្ថិភាព",
  },
];

export const safetyPhrases: SafetyPhrase[] = phraseSeeds.map((p) => ({
  id: p.id,
  textKo: p.textKo,
  translations: { vi: p.vi, km: p.km },
  audioUrls: {},
  status: "pending", // 원어민 검수 전 — 실제 배포 전 F-08 검수 워크플로를 거쳐야 "approved"로 바뀐다
  reviewedBy: null,
}));

function slidesFor(lang: "ko" | "vi" | "km"): Slide[] {
  return checklist.steps.map((step, i) => {
    const phrase = phraseSeeds[i];
    const text = lang === "ko" ? phrase.textKo : lang === "vi" ? phrase.vi : phrase.km;
    return {
      order: step.order,
      imageUrl: "", // PressMachineDiagram(SVG)을 그대로 사용하므로 이미지 URL 불필요
      phraseId: phrase.id,
      pictogram: step.label,
      narrationAudioUrl: null, // 데모: 브라우저 내장 Web Speech API로 즉석 재생 (text 필드로 대체)
    };
  }).map((slide, i) => ({ ...slide, pictogram: (lang === "ko" ? phraseSeeds[i].textKo : lang === "vi" ? phraseSeeds[i].vi : phraseSeeds[i].km) }));
}

export const trainingContents: Record<string, TrainingContent> = {
  ko: {
    id: "content-ko",
    equipmentId: EQUIPMENT_ID,
    language: "ko",
    slides: slidesFor("ko"),
    status: "approved",
    createdAt: new Date(2026, 7, 1).toISOString(),
    approvedAt: new Date(2026, 7, 1).toISOString(),
  },
  vi: {
    id: "content-vi",
    equipmentId: EQUIPMENT_ID,
    language: "vi",
    slides: slidesFor("vi"),
    status: "approved",
    createdAt: new Date(2026, 7, 1).toISOString(),
    approvedAt: new Date(2026, 7, 1).toISOString(),
  },
  km: {
    id: "content-km",
    equipmentId: EQUIPMENT_ID,
    language: "km",
    slides: slidesFor("km"),
    status: "approved",
    createdAt: new Date(2026, 7, 1).toISOString(),
    approvedAt: new Date(2026, 7, 1).toISOString(),
  },
};

const branchCopy: Record<"ko" | "vi" | "km", BranchQuizData> = {
  ko: {
    prompt: "프레스기로 작업 중 부품 사이에 이물질이 끼었습니다. 당신의 첫 행동은?",
    options: [
      {
        label: "전원을 끄고 반장에게 알린다",
        mediaUrl: null,
        isCorrect: true,
        resultText: "올바른 대응입니다. 전원 차단 후 담당자에게 알리면 안전하게 처리할 수 있습니다.",
      },
      {
        label: "손으로 직접 빼낸다",
        mediaUrl: null,
        isCorrect: false,
        resultText: "위험합니다! 전원이 켜진 상태에서 손을 넣으면 협착 사고로 이어질 수 있습니다.",
      },
    ],
  },
  vi: {
    prompt: "Trong khi vận hành máy ép, có dị vật kẹt giữa các bộ phận. Hành động đầu tiên của bạn là gì?",
    options: [
      {
        label: "Tắt nguồn điện và báo cho tổ trưởng",
        mediaUrl: null,
        isCorrect: true,
        resultText: "Đúng. Ngắt điện rồi báo cho quản lý là cách xử lý an toàn.",
      },
      {
        label: "Dùng tay lấy dị vật ra trực tiếp",
        mediaUrl: null,
        isCorrect: false,
        resultText: "Nguy hiểm! Đưa tay vào khi máy còn điện có thể gây kẹp tay.",
      },
    ],
  },
  km: {
    prompt: "ខណៈធ្វើការជាមួយម៉ាស៊ីនចុច មានវត្ថុមួយជាប់ចន្លោះផ្នែក។ អ្វីជាសកម្មភាពដំបូងរបស់អ្នក?",
    options: [
      {
        label: "បិទចរន្តអគ្គិសនី ហើយប្រាប់ប្រធានក្រុម",
        mediaUrl: null,
        isCorrect: true,
        resultText: "ត្រឹមត្រូវ។ ការបិទចរន្តហើយប្រាប់អ្នកគ្រប់គ្រងគឺជាវិធីដោះស្រាយប្រកបដោយសុវត្ថិភាព។",
      },
      {
        label: "ដកវត្ថុនោះចេញដោយផ្ទាល់ដោយដៃ",
        mediaUrl: null,
        isCorrect: false,
        resultText: "គ្រោះថ្នាក់! ការដាក់ដៃចូលខណៈពេលចរន្តនៅតែបើក អាចបណ្ដាលឱ្យប្រថាប់ដៃ។",
      },
    ],
  },
};

export function quizItemsFor(lang: "ko" | "vi" | "km"): QuizItem[] {
  const sequenceData: SequenceQuizData = { steps: checklist.steps };
  const hotspotData: HotspotQuizData = { imageUrl: "", hazards: checklist.hazards };

  return [
    {
      id: `quiz-sequence-${lang}`,
      equipmentId: EQUIPMENT_ID,
      language: lang,
      itemType: "sequence",
      data: sequenceData,
    },
    {
      id: `quiz-hotspot-${lang}`,
      equipmentId: EQUIPMENT_ID,
      language: lang,
      itemType: "hotspot",
      data: hotspotData,
    },
    {
      id: `quiz-branch-${lang}`,
      equipmentId: EQUIPMENT_ID,
      language: lang,
      itemType: "branch",
      data: branchCopy[lang],
    },
  ];
}

export const LANGUAGES = [
  { code: "ko", label: "한국어" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "km", label: "ភាសាខ្មែរ" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];
