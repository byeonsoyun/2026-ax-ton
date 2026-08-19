"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getEquipment,
  getMe,
  getMyHazardReports,
  getMyTrainingRecords,
  type Me,
} from "@/lib/api";
import { DownloadCertificateButton } from "@/components/DownloadCertificateButton";
import type { HazardReport, TrainingRecord } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  received: "접수",
  in_progress: "처리 중",
  done: "완료",
};

export default function MyPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [equipmentNames, setEquipmentNames] = useState<Record<string, string>>({});
  const [reports, setReports] = useState<HazardReport[]>([]);

  useEffect(() => {
    getMe().then(setMe);
    getMyTrainingRecords().then(async (rs) => {
      setRecords(rs);
      const uniqueIds = [...new Set(rs.map((r) => r.equipmentId))];
      const entries = await Promise.all(
        uniqueIds.map(async (id) => [id, (await getEquipment(id)).name] as const)
      );
      setEquipmentNames(Object.fromEntries(entries));
    });
    getMyHazardReports().then(setReports);
  }, []);

  return (
    <div className="flex flex-col gap-8 p-6">
      <Link href="/w" className="text-sm text-zinc-500">
        ← 홈으로
      </Link>

      <section>
        <h2 className="mb-2 text-lg font-semibold">회원정보</h2>
        <div className="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
          <p>ID: {me?.id}</p>
          <p>이름: {me?.displayName || "-"}</p>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">수강 이력</h2>
        <div className="flex flex-col gap-3">
          {records.length === 0 && <p className="text-sm text-zinc-400">아직 수강한 교육이 없습니다.</p>}
          {records.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div>
                <p className="font-medium">{equipmentNames[r.equipmentId] ?? "설비"}</p>
                <p className="text-sm text-zinc-500">
                  {r.completedAt ? (
                    <span className={r.passed ? "text-emerald-600 dark:text-emerald-400" : "text-red-600"}>
                      {r.passed ? "이수 완료" : "미달"}
                    </span>
                  ) : (
                    <span className="text-amber-600">진행 중</span>
                  )}
                  {" · "}
                  {new Date(r.startedAt).toLocaleDateString("ko-KR")}
                </p>
              </div>
              {r.completedAt && (
                <DownloadCertificateButton record={r} equipmentName={equipmentNames[r.equipmentId] ?? "설비"} />
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">신고 이력</h2>
        <div className="flex flex-col gap-3">
          {reports.length === 0 && <p className="text-sm text-zinc-400">신고한 내역이 없습니다.</p>}
          {reports.map((r) => (
            <div key={r.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <p className="font-medium">{r.title}</p>
                <span className="text-sm text-zinc-500">{STATUS_LABEL[r.status]}</span>
              </div>
              <p className="text-sm text-zinc-500">{new Date(r.createdAt).toLocaleDateString("ko-KR")}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
