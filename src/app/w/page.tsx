export default function WorkerEntryPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-xl font-semibold">노동자 화면</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        실제로는 QR 코드로 <code>/w/[equipmentId]</code> 형태의 특정 설비 교육 링크에 접속합니다. (구현 예정: 언어
        선택 → 콘텐츠 → 이해도 검증)
      </p>
    </div>
  );
}
