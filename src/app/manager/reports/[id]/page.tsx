"use client";

import { use, useEffect, useState } from "react";
import { addHazardReportComment, getHazardReport, updateHazardReportStatus } from "@/lib/api";
import type { HazardReportDetail } from "@/lib/types";

const STATUS_OPTIONS = [
  { value: "received", label: "접수" },
  { value: "in_progress", label: "처리 중" },
  { value: "done", label: "완료" },
];

export default function ManagerReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [report, setReport] = useState<HazardReportDetail | null>(null);
  const [comment, setComment] = useState("");

  function load() {
    getHazardReport(id).then(setReport);
  }

  useEffect(load, [id]);

  async function handleStatusChange(status: string) {
    await updateHazardReportStatus(id, status);
    load();
  }

  async function handleComment() {
    if (!comment.trim()) return;
    await addHazardReportComment(id, comment.trim());
    setComment("");
    load();
  }

  if (!report) return <p className="text-zinc-400">불러오는 중...</p>;

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h1 className="text-xl font-semibold">{report.title}</h1>
      <p className="text-sm text-zinc-500">
        {new Date(report.createdAt).toLocaleString("ko-KR")} · 조회 {report.viewCount}
      </p>

      {report.photoUrl && <img src={report.photoUrl} alt="" className="max-h-64 rounded-lg" />}
      {report.voiceMemoUrl && (
        <div className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800">
          메모: {report.voiceMemoUrl}
        </div>
      )}

      <div className="flex gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleStatusChange(opt.value)}
            className={`rounded-lg border px-3 py-2 text-sm ${
              report.status === opt.value
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black"
                : "border-zinc-300 dark:border-zinc-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">처리 회신 (신고자에게 전달됩니다)</p>
        {report.comments.map((c) => (
          <div key={c.id} className="rounded-lg bg-zinc-100 p-3 text-sm dark:bg-zinc-800">
            <p className="text-xs text-zinc-500">
              {c.author} · {new Date(c.createdAt).toLocaleString("ko-KR")}
            </p>
            <p>{c.body}</p>
          </div>
        ))}
        <div className="flex gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="회신 내용 입력"
          />
          <button onClick={handleComment} className="rounded-lg bg-zinc-900 px-4 text-sm text-white dark:bg-white dark:text-black">
            등록
          </button>
        </div>
      </div>
    </div>
  );
}
