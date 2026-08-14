export default async function QuizPage({
  params,
}: {
  params: Promise<{ equipmentId: string }>;
}) {
  const { equipmentId } = await params;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-xl font-semibold">이해도 검증 (설비 #{equipmentId})</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        F-02 퀴즈 3종(절차 시뮬레이션형/핫스팟형/분기 시나리오형)이 여기 들어갑니다. (구현 예정)
      </p>
    </div>
  );
}
