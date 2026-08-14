"use client";

import { useState } from "react";
import type { BranchQuizData } from "@/lib/types";

// F-02 ③ 분기 시나리오형: 선택지를 고르면 그 선택의 결과를 바로 보여준다.
export function BranchQuiz({
  data,
  onDone,
}: {
  data: BranchQuizData;
  onDone: (result: { passed: boolean; attempts: number }) => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);

  function handleSelect(i: number) {
    if (selectedIndex !== null) return;
    setAttempts((a) => a + 1);
    setSelectedIndex(i);
    const option = data.options[i];
    if (option.isCorrect) {
      setTimeout(() => onDone({ passed: true, attempts: attempts + 1 }), 1400);
    }
  }

  const selected = selectedIndex !== null ? data.options[selectedIndex] : null;

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="max-w-md text-center text-lg font-medium">{data.prompt}</p>

      <div className="flex w-full max-w-md flex-col gap-3">
        {data.options.map((opt, i) => (
          <button
            key={i}
            disabled={selectedIndex !== null}
            onClick={() => handleSelect(i)}
            className={
              "min-h-[60px] rounded-lg border px-4 py-3 text-left text-base " +
              (selectedIndex === i
                ? opt.isCorrect
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-red-500 bg-red-500/10"
                : "border-zinc-300 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-900")
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      {selected && (
        <div
          className={
            "max-w-md rounded-lg border p-4 text-center " +
            (selected.isCorrect
              ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300")
          }
        >
          {selected.resultText}
          {!selected.isCorrect && (
            <button
              onClick={() => setSelectedIndex(null)}
              className="mt-3 block w-full rounded-lg bg-red-600 px-4 py-2 text-sm text-white"
            >
              다시 시도
            </button>
          )}
        </div>
      )}
    </div>
  );
}
