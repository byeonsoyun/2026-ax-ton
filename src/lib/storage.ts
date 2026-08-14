"use client";

import type { QuizResult, TrainingRecord } from "@/lib/types";

// 데모 단계 임시 저장소. Supabase 연동 전까지 training_records를 브라우저 localStorage에 저장한다.
// 나중에 Supabase로 옮길 때 이 파일의 함수 시그니처만 그대로 유지하면 호출부(퀴즈/대시보드)는 안 바뀐다.

const STORAGE_KEY = "safelang_training_records";
const ANON_ID_KEY = "safelang_worker_anon_id";

function readAll(): TrainingRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TrainingRecord[]) : [];
  } catch {
    return [];
  }
}

function writeAll(records: TrainingRecord[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function getWorkerAnonId(): string {
  let id = window.localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = `worker-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}

export function getAllTrainingRecords(): TrainingRecord[] {
  return readAll();
}

export function createTrainingRecord(input: {
  equipmentId: string;
  language: string;
  contentId: string;
}): TrainingRecord {
  const record: TrainingRecord = {
    id: `record-${Math.random().toString(36).slice(2, 10)}`,
    workerAnonId: getWorkerAnonId(),
    equipmentId: input.equipmentId,
    language: input.language,
    contentId: input.contentId,
    startedAt: new Date().toISOString(),
    completedAt: null,
    quizResults: [],
    passed: false,
    signatureName: null,
    signedAt: null,
    integrityHash: null,
    createdAt: new Date().toISOString(),
  };
  const all = readAll();
  all.push(record);
  writeAll(all);
  return record;
}

export function completeTrainingRecord(
  recordId: string,
  quizResults: QuizResult[],
  signatureName: string
): TrainingRecord | null {
  const all = readAll();
  const idx = all.findIndex((r) => r.id === recordId);
  if (idx === -1) return null;

  const passed = quizResults.every((r) => r.passed);
  const now = new Date().toISOString();
  const updated: TrainingRecord = {
    ...all[idx],
    quizResults,
    passed,
    completedAt: now,
    signatureName,
    signedAt: now,
    // 데모용 무결성 해시: 실제로는 서버에서 레코드 확정 시점에 SHA-256으로 계산해야 한다
    integrityHash: `demo-${btoa(unescape(encodeURIComponent(JSON.stringify(quizResults) + signatureName))).slice(0, 24)}`,
  };
  all[idx] = updated;
  writeAll(all);
  return updated;
}

export function getTrainingRecord(recordId: string): TrainingRecord | null {
  return readAll().find((r) => r.id === recordId) ?? null;
}
