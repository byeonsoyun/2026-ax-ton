-- F-01 2단계 고도화: 여러 공식 자료를 종합해 AI가 재구성한 나레이션 초안.
-- 절대 그대로 노출되지 않는다 — status='approved'가 되어야 F-08 문구 라이브러리로
-- 편입 대상이 된다 (실제 편입은 담당자가 검토 후 수동으로 반영, 데모 범위).
create table script_drafts (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references equipment(id) on delete cascade,
  step_order int not null,
  draft_text text not null,
  source_notes text not null, -- 어떤 자료들을 종합했는지 (근거 추적용)
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);
alter table script_drafts enable row level security;

create index idx_script_drafts_equipment on script_drafts(equipment_id);
