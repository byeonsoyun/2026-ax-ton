"use client";

import { use, useEffect, useState } from "react";
import { getSharedCertificate, type SharedCertificate } from "@/lib/api";
import { DownloadCertificateButton } from "@/components/DownloadCertificateButton";

// 3층 아이디어: 수료증 공유. 로그인 없이 링크만으로 완료 여부를 확인할 수 있는 공개 페이지.
export default function SharedCertificatePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [data, setData] = useState<SharedCertificate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSharedCertificate(token)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [token]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center text-zinc-500">
        <p>{error}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-zinc-400">불러오는 중...</div>
    );
  }

  const { record, equipmentName } = data;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <p className="text-sm text-zinc-500">Safelang 안전교육 이수 증빙</p>
      <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
        {record.passed ? "이해도 검증 통과" : "이해도 검증 미달"}
      </p>
      <div className="flex w-full max-w-sm flex-col gap-2 rounded-lg border border-zinc-200 p-4 text-left text-sm dark:border-zinc-800">
        <div className="flex justify-between">
          <span className="text-zinc-500">이수자</span>
          <span>{record.signatureName ?? "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">설비</span>
          <span>{equipmentName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">완료 일시</span>
          <span>{record.completedAt ? new Date(record.completedAt).toLocaleString("ko-KR") : "-"}</span>
        </div>
      </div>
      <DownloadCertificateButton record={record} equipmentName={equipmentName} />
      <p className="max-w-sm text-xs text-zinc-400">
        본 페이지는 이수자 본인이 공유한 링크입니다. 이 문서는 교육 실시 및 이해도 검증의 증빙이며,
        그 자체로 법적 면책을 보장하지 않습니다.
      </p>
    </div>
  );
}
