import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-zinc-50 px-6 py-24 text-center dark:bg-black">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Safelang
        </h1>
        <p className="mt-2 max-w-md text-zinc-600 dark:text-zinc-400">
          이주노동자 안전교육 이해도 검증 플랫폼
        </p>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/manager"
          className="rounded-full bg-zinc-900 px-8 py-3 text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          담당자로 시작하기
        </Link>
        <Link
          href="/w"
          className="rounded-full border border-zinc-300 px-8 py-3 text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          노동자 화면 (QR 데모)
        </Link>
      </div>
    </main>
  );
}
