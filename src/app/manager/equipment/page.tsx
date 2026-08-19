"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getEquipmentList } from "@/lib/api";

export default function ManagerEquipmentListPage() {
  const [rows, setRows] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getEquipmentList().then(setRows);
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
          <Link
            key={r.id}
            href={`/manager/equipment/${r.id}`}
            className="rounded-lg border border-zinc-300 p-4 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            {r.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
