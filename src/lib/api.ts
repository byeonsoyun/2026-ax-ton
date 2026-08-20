"use client";

import type {
  BoardPost,
  BoardPostDetail,
  Equipment,
  HazardReport,
  HazardReportDetail,
  ManualUpload,
  QuizItem,
  QuizResult,
  ScriptDraft,
  TrainingContent,
  TrainingRecord,
} from "@/lib/types";

// 브라우저에서 우리 Next.js API 라우트를 호출하는 얇은 래퍼.
// 실제 Supabase 접근은 전부 서버(route handler, service_role 키)에서만 일어난다 —
// 브라우저는 anon 키로 테이블에 직접 접근하지 않는다 (RLS: anon에 policy 없음).

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `요청 실패 (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function getEquipment(equipmentId: string): Promise<Equipment> {
  return fetch(`/api/equipment/${equipmentId}`).then((res) => json(res));
}

export function getEquipmentList(): Promise<Pick<Equipment, "id" | "name" | "equipmentType" | "photoUrl" | "status">[]> {
  return fetch("/api/equipment").then((res) => json(res));
}

export function getTrainingContent(equipmentId: string, lang: string): Promise<TrainingContent> {
  return fetch(`/api/equipment/${equipmentId}/content?lang=${lang}`).then((res) => json(res));
}

export function getQuizItems(equipmentId: string, lang: string): Promise<QuizItem[]> {
  return fetch(`/api/equipment/${equipmentId}/quiz?lang=${lang}`).then((res) => json(res));
}

export function createTrainingRecord(input: {
  equipmentId: string;
  language: string;
  contentId: string;
}): Promise<TrainingRecord> {
  return fetch("/api/training-records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then((res) => json(res));
}

export function getTrainingRecord(recordId: string): Promise<TrainingRecord> {
  return fetch(`/api/training-records/${recordId}`).then((res) => json(res));
}

export function completeTrainingRecord(
  recordId: string,
  quizResults: QuizResult[],
  signatureName: string
): Promise<TrainingRecord> {
  return fetch(`/api/training-records/${recordId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quizResults, signatureName }),
  }).then((res) => json(res));
}

export function getAllTrainingRecords(): Promise<TrainingRecord[]> {
  return fetch("/api/training-records").then((res) => json(res));
}

export function getMyTrainingRecords(): Promise<TrainingRecord[]> {
  return fetch("/api/training-records?mine=1").then((res) => json(res));
}

export type Me = { id: string; displayName: string | null; language: string };

export function getMe(): Promise<Me> {
  return fetch("/api/auth/me").then((res) => json(res));
}

// F-05: 위험요소 신고
export function createHazardReport(input: {
  equipmentId?: string | null;
  hazardType: string;
  title: string;
  photoUrl?: string | null;
  voiceMemoUrl?: string | null;
}): Promise<HazardReport> {
  return fetch("/api/hazard-reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then((res) => json(res));
}

export function getMyHazardReports(): Promise<HazardReport[]> {
  return fetch("/api/hazard-reports?mine=1").then((res) => json(res));
}

export function getAllHazardReports(): Promise<HazardReport[]> {
  return fetch("/api/hazard-reports").then((res) => json(res));
}

export function getHazardReport(id: string): Promise<HazardReportDetail> {
  return fetch(`/api/hazard-reports/${id}`).then((res) => json(res));
}

export function updateHazardReportStatus(id: string, status: string): Promise<{ ok: true }> {
  return fetch(`/api/hazard-reports/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  }).then((res) => json(res));
}

export function addHazardReportComment(id: string, body: string) {
  return fetch(`/api/hazard-reports/${id}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  }).then((res) => json(res));
}

// F-01 2단계 고도화: 다중 소스 스크립트 재구성 (검수 대기 게이트 포함)
export function getScriptDrafts(equipmentId: string): Promise<ScriptDraft[]> {
  return fetch(`/api/equipment/${equipmentId}/synthesize-script`).then((res) => json(res));
}

export function synthesizeScriptDrafts(equipmentId: string): Promise<ScriptDraft[]> {
  return fetch(`/api/equipment/${equipmentId}/synthesize-script`, { method: "POST" }).then((res) => json(res));
}

export function updateScriptDraftStatus(id: string, status: "approved" | "rejected") {
  return fetch(`/api/script-drafts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  }).then((res) => json(res));
}

// F-09 (v0.4, 경로 B): 매뉴얼 업로드·추출
export function getManualUploads(equipmentId: string): Promise<ManualUpload[]> {
  return fetch(`/api/equipment/${equipmentId}/manual-upload`).then((res) => json(res));
}

export function uploadManual(equipmentId: string, file: File): Promise<ManualUpload> {
  const formData = new FormData();
  formData.append("file", file);
  return fetch(`/api/equipment/${equipmentId}/manual-upload`, { method: "POST", body: formData }).then(
    (res) => json(res)
  );
}

// F-01 3단계 고도화: 로컬 ffmpeg 렌더링 (Vercel에는 배포되지 않는 로컬 전용 기능)
export function renderEquipmentVideo(equipmentId: string, lang: string): Promise<{ url: string }> {
  return fetch(`/api/equipment/${equipmentId}/render-video?lang=${lang}`, { method: "POST" }).then((res) =>
    json(res)
  );
}

// 현장 소통 게시판 (F-04와 별개의 신규 기능)
export function getBoardPosts(): Promise<BoardPost[]> {
  return fetch("/api/board-posts").then((res) => json(res));
}

export function getBoardPost(id: string): Promise<BoardPostDetail> {
  return fetch(`/api/board-posts/${id}`).then((res) => json(res));
}

export function createBoardPost(input: { title: string; body: string; anonymous: boolean }): Promise<BoardPost> {
  return fetch("/api/board-posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then((res) => json(res));
}

export function addBoardComment(postId: string, body: string, anonymous: boolean) {
  return fetch(`/api/board-posts/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body, anonymous }),
  }).then((res) => json(res));
}
