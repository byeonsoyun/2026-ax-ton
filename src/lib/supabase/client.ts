import { createClient } from "@supabase/supabase-js";

// 브라우저(클라이언트 컴포넌트)에서 쓰는 익명 키 클라이언트. RLS로 보호되는 읽기 위주 접근에 사용.
export function createBrowserSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
