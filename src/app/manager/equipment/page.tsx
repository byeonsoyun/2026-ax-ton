"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getEquipmentList } from "@/lib/api";
import { QRCodeImage } from "@/components/QRCodeImage";

export default function ManagerEquipmentListPage() {
  const [rows, setRows] = useState<{ id: string; name: string }[]>([]);
  const [qrOpenId, setQrOpenId] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    getEquipmentList().then(setRows);
    setOrigin(window.location.origin);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">설비 관리</h1>
        <Link
          href="/manager/equipment/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
        >
          + 설비 등록
        </Link>
      </div>
      <div className="flex flex-col gap-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-lg border border-zinc-300 p-4 dark:border-zinc-700">
            <div className="flex items-center justify-between">
              <Link href={`/manager/equipment/${r.id}`} className="hover:underline">
                {r.name}
              </Link>
              <button
                onClick={() => setQrOpenId(qrOpenId === r.id ? null : r.id)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700"
              >
                {qrOpenId === r.id ? "QR 닫기" : "QR 발급"}
              </button>
            </div>
            {qrOpenId === r.id && origin && (
              <div className="mt-3 flex flex-col items-center gap-2">
                <QRCodeImage url={`${origin}/w/${r.id}`} />
                <p className="text-xs text-zinc-500">{`${origin}/w/${r.id}`}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
