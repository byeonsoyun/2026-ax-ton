export default function WorkerLayout({ children }: LayoutProps<"/w">) {
  // 노동자 화면 공통 레이아웃. 글자를 읽지 않아도 완주 가능해야 하므로
  // 내비게이션 텍스트를 최소화하고 화면을 항상 전체화면 중심으로 구성한다.
  return <div className="flex flex-1 flex-col bg-white dark:bg-black">{children}</div>;
}
