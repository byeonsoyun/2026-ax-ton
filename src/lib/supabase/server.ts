import "server-only";
import { createClient } from "@supabase/supabase-js";

// 서버(Route Handler, Server Component, Server Action)에서만 쓰는 service role 클라이언트.
// 절대 클라이언트 컴포넌트에서 import하지 말 것 — RLS를 우회하는 권한을 가진다.
export function createServerSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
