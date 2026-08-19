"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createHazardReport, getEquipmentList } from "@/lib/api";

const HAZARD_TYPES = [
  { code: "pinch", label: "협착·끼임", icon: "🖐️" },
  { code: "fire", label: "화재·폭발", icon: "🔥" },
  { code: "electric", label: "감전", icon: "⚡" },
  { code: "slip", label: "미끄러짐·넘어짐", icon: "🧍" },
  { code: "chemical", label: "화학물질", icon: "🧪" },
  { code: "other", label: "기타", icon: "❗" },
];

export default function ReportPage() {
  const router = useRouter();
  const [equipment, setEquipment] = useState<{ id: string; name: string }[]>([]);
  const [equipmentId, setEquipmentId] = useState<string | null>(null);
  const [hazardType, setHazardType] = useState<string | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEquipmentList().then(setEquipment);
  }, []);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!hazardType) return;
    setSubmitting(true);
    setError(null);
    try {
      const equipmentName = equipment.find((e) => e.id === equipmentId)?.name ?? "미지정 설비";
      const hazardLabel = HAZARD_TYPES.find((h) => h.code === hazardType)?.label ?? hazardType;
      await createHazardReport({
        equipmentId,
        hazardType,
        title: `[${equipmentName}] ${hazardLabel} 신고`,
        photoUrl: photoDataUrl,
        voiceMemoUrl: note || null, // 데모: 음성 메모 대신 텍스트 메모로 대체
      });
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">신고 접수 완료</p>
        <p className="text-zinc-600 dark:text-zinc-400">
          신고해주셔서 감사합니다. 신고자 정보는 담당자에게 공개되지 않습니다.
        </p>
        <button
          onClick={() => router.push("/w/mypage")}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
        >
          마이페이지에서 처리 현황 보기
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <Link href="/w" className="text-sm text-zinc-500">
        ← 홈으로
      </Link>
      <h1 className="text-xl font-semibold">위험요소 신고</h1>
      <p className="text-sm text-zinc-500">텍스트 없이도 신고할 수 있습니다. 익명으로 처리됩니다.</p>

      <div>
        <p className="mb-2 text-sm font-medium">공정/설비 선택</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {equipment.map((eq) => (
            <button
              key={eq.id}
              onClick={() => setEquipmentId(eq.id)}
              className={`min-h-[60px] rounded-lg border p-3 text-sm ${
                equipmentId === eq.id
                  ? "border-zinc-900 bg-zinc-100 dark:border-white dark:bg-zinc-800"
                  : "border-zinc-300 dark:border-zinc-700"
              }`}
            >
              {eq.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">위험 유형 선택</p>
        <div className="grid grid-cols-3 gap-3">
          {HAZARD_TYPES.map((h) => (
            <button
              key={h.code}
              onClick={() => setHazardType(h.code)}
              className={`flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-lg border p-3 ${
                hazardType === h.code
                  ? "border-zinc-900 bg-zinc-100 dark:border-white dark:bg-zinc-800"
                  : "border-zinc-300 dark:border-zinc-700"
              }`}
            >
              <span className="text-2xl">{h.icon}</span>
              <span className="text-xs">{h.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">사진 (선택)</p>
        <input type="file" accept="image/*" onChange={handlePhoto} className="text-sm" />
        {photoDataUrl && <img src={photoDataUrl} alt="" className="mt-2 max-h-40 rounded-lg" />}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">메모 (선택 — 데모에서는 음성 대신 텍스트)</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!hazardType || submitting}
        className="min-h-[60px] rounded-lg bg-zinc-900 font-medium text-white disabled:opacity-40 dark:bg-white dark:text-black"
      >
        {submitting ? "접수 중..." : "접수하기"}
      </button>
    </div>
  );
}
