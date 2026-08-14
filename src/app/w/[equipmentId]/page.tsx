export default async function TrainingPage({
  params,
}: {
  params: Promise<{ equipmentId: string }>;
}) {
  const { equipmentId } = await params;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-xl font-semibold">교육 콘텐츠 (설비 #{equipmentId})</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        F-01 3단계(언어 선택 → 슬라이드+TTS 콘텐츠 재생)가 여기 들어갑니다. (구현 예정)
      </p>
    </div>
  );
}
