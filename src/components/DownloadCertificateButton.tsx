"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { TrainingCertificate } from "@/lib/pdf/TrainingCertificate";
import type { TrainingRecord } from "@/lib/types";

export function DownloadCertificateButton({
  record,
  equipmentName,
}: {
  record: TrainingRecord;
  equipmentName: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const blob = await pdf(
        <TrainingCertificate record={record} equipmentName={equipmentName} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `safelang-증빙-${record.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="min-h-[60px] rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium disabled:opacity-40 dark:border-zinc-700"
    >
      {loading ? "생성 중..." : "증빙 PDF 다운로드"}
    </button>
  );
}
