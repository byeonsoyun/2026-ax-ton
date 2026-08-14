import Link from "next/link";

export default function ManagerLayout({ children }: LayoutProps<"/manager">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <Link href="/manager" className="font-semibold">
          Safelang <span className="text-zinc-400">/ 담당자</span>
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/manager/equipment/new">설비 등록</Link>
          <Link href="/manager/dashboard">대시보드</Link>
        </nav>
      </header>
      <main className="flex flex-1 flex-col p-6">{children}</main>
    </div>
  );
}
