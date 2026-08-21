const STEPS = [
  { key: "learn", label: "수강" },
  { key: "quiz", label: "검증" },
  { key: "done", label: "완료" },
] as const;

// 2층(사용성): 글자를 안 읽어도 지금 어디까지 왔는지 보이게 — 색만이 아니라 숫자·굵기로도 구분한다.
export function ProgressSteps({ current }: { current: (typeof STEPS)[number]["key"] }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex w-full max-w-md items-center justify-center gap-2">
      {STEPS.map((step, i) => {
        const state = i < currentIndex ? "done" : i === currentIndex ? "current" : "upcoming";
        return (
          <div key={step.key} className="flex items-center gap-2">
            <div
              className={
                "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold " +
                (state === "current"
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black"
                  : state === "done"
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-zinc-300 text-zinc-400 dark:border-zinc-700")
              }
            >
              {state === "done" ? "✓" : i + 1}
            </div>
            <span className={state === "upcoming" ? "text-sm text-zinc-400" : "text-sm font-medium"}>
              {step.label}
            </span>
            {i < STEPS.length - 1 && <div className="h-px w-6 bg-zinc-300 dark:bg-zinc-700" />}
          </div>
        );
      })}
    </div>
  );
}
