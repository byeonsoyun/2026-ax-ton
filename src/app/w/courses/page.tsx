"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getEquipmentList, getMyTrainingRecords } from "@/lib/api";

type Row = { id: string; name: string; equipmentType: string; completed: boolean; passed: boolean };

export default function CoursesPage() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    Promise.all([getEquipmentList(), getMyTrainingRecords()]).then(([equipment, records]) => {
      setRows(
        equipment.map((eq) => {
          const myRecords = records.filter((r) => r.equipmentId === eq.id && r.completedAt);
          return {
            id: eq.id,
            name: eq.name,
            equipmentType: eq.equipmentType,
            completed: myRecords.length > 0,
            passed: myRecords.some((r) => r.passed),
          };
        })
      );
    });
  }, []);

  return (
    <div className="flex flex-col gap-6 p-6">
      <Link href="/w" className="text-sm text-zinc-500">
        ← 홈으로
      </Link>
      <h1 className="text-xl font-semibold">안전교육 수강</h1>

      <div className="flex flex-col gap-3">
        {rows === null && <p className="text-zinc-400">불러오는 중...</p>}
        {rows?.length === 0 && <p className="text-zinc-400">등록된 설비가 없습니다.</p>}
        {rows?.map((row) => (
          <Link
            key={row.id}
            href={`/w/${row.id}`}
            className="flex items-center justify-between rounded-lg border border-zinc-300 p-4 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            <span className="font-medium">{row.name}</span>
            {row.completed ? (
              <span
                className={
                  row.passed
                    ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800 dark:bg-red-900/40 dark:text-red-300"
                }
              >
                {row.passed ? "이수 완료" : "미달"}
              </span>
            ) : (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                미수강
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
