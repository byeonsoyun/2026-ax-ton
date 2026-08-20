-- F-09 (v0.4): 경로 B — 매뉴얼 업로드·추출. 원문은 사업장(설비) 단위로만 격리 보관하고
-- 재배포하지 않는다. 추출 항목은 script_drafts와 같은 검수 대기 큐로 합류한다.
create table manual_uploads (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references equipment(id) on delete cascade,
  file_name text not null,
  file_data text not null, -- base64 (데모 범위: Storage 버킷 대신 컬럼에 직접 보관)
  extracted_items jsonb not null default '[]'::jsonb, -- [{text, page, section}]
  status text not null default 'processing' check (status in ('processing', 'done', 'failed')),
  created_at timestamptz not null default now()
);
alter table manual_uploads enable row level security;

create index idx_manual_uploads_equipment on manual_uploads(equipment_id);
