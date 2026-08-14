// PRD-safety.md §7 데이터 모델을 데모 범위로 옮긴 타입 정의

export type HotspotRect = { x: number; y: number; w: number; h: number };

export type ChecklistStep = {
  order: number;
  label: string;
  hotspot: HotspotRect;
  wrongOrderFeedback: string;
};

export type ChecklistHazard = {
  id: string;
  label: string;
  hotspot: HotspotRect;
  consequenceText: string;
};

export type Checklist = {
  steps: ChecklistStep[];
  hazards: ChecklistHazard[];
};

export type Equipment = {
  id: string;
  name: string;
  equipmentType: string;
  photoUrl: string | null;
  checklist: Checklist;
  status: "draft" | "approved"; // 게이트 1
  createdAt: string;
  approvedAt: string | null;
};

export type SafetyPhrase = {
  id: string;
  textKo: string;
  translations: Record<string, string>; // { km: '...', vi: '...' }
  audioUrls: Record<string, string>;
  status: "approved" | "pending" | "retracted";
  reviewedBy: string | null;
};

export type Slide = {
  order: number;
  imageUrl: string;
  phraseId: string;
  pictogram: string;
  narrationAudioUrl: string | null;
};

export type TrainingContent = {
  id: string;
  equipmentId: string;
  language: string;
  slides: Slide[];
  status: "draft" | "approved"; // 게이트 3
  createdAt: string;
  approvedAt: string | null;
};

export type QuizItemType = "sequence" | "hotspot" | "branch";

export type SequenceQuizData = {
  steps: ChecklistStep[];
};

export type HotspotQuizData = {
  imageUrl: string;
  hazards: ChecklistHazard[];
};

export type BranchOption = {
  label: string;
  mediaUrl: string | null;
  isCorrect: boolean;
  resultText: string;
};

export type BranchQuizData = {
  prompt: string;
  options: BranchOption[];
};

export type QuizItem = {
  id: string;
  equipmentId: string;
  language: string;
  itemType: QuizItemType;
  data: SequenceQuizData | HotspotQuizData | BranchQuizData;
};

export type QuizResult = {
  quizItemId: string;
  itemType: QuizItemType;
  passed: boolean;
  responseTimeMs: number;
  attempts: number;
};

export type TrainingRecord = {
  id: string;
  workerAnonId: string;
  equipmentId: string;
  language: string;
  contentId: string | null;
  startedAt: string;
  completedAt: string | null;
  quizResults: QuizResult[];
  passed: boolean;
  signatureName: string | null;
  signedAt: string | null;
  integrityHash: string | null;
  createdAt: string;
};
