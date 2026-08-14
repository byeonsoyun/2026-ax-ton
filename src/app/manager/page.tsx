import Link from "next/link";

export default function ManagerHome() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">담당자 홈</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        설비를 등록해 콘텐츠 파이프라인(F-01)을 시작하거나, 대시보드에서 이수 현황을 확인하세요.
      </p>
      <div className="flex gap-3">
        <Link
          href="/manager/equipment/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
        >
          + 설비 등록
        </Link>
        <Link
          href="/manager/dashboard"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
        >
          대시보드 보기
        </Link>
      </div>
    </div>
  );
}
