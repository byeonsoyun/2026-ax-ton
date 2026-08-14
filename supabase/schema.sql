-- Safelang 데모 스키마 (PRD-safety.md §7 데이터 모델 기반, 데모 범위로 단순화)
-- 설비 1종 x 언어 2종 데모를 기준으로 하되, 여러 설비/언어로 자연스럽게 확장 가능한 구조로 작성.

create extension if not exists "pgcrypto";

-- F-01 1단계 산출물: 설비 + 승인된 안전 체크리스트(구조화 데이터)가 콘텐츠·퀴즈 양쪽의 단일 소스
create table equipment (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  equipment_type text not null,
  photo_url text,
  -- checklist: { steps: [{ order, label, hotspot: {x,y,w,h}, wrong_order_feedback }],
  --              hazards: [{ id, label, hotspot: {x,y,w,h}, consequence_text }] }
  checklist jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'approved')), -- 게이트 1
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

-- F-08: 검수 완료 문구만 안전 지시로 노출된다는 원칙의 실제 데이터
create table safety_phrases (
  id uuid primary key default gen_random_uuid(),
  text_ko text not null,
  -- translations: { km: '...', vi: '...' }
  translations jsonb not null default '{}'::jsonb,
  -- audio_urls: { km: 'https://...', vi: 'https://...' }
  audio_urls jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('approved', 'pending', 'retracted')),
  reviewed_by text,
  created_at timestamptz not null default now()
);

-- F-01 3단계 산출물: 언어별로 조립된 슬라이드형 콘텐츠
create table training_contents (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references equipment(id) on delete cascade,
  language text not null, -- 'ko', 'km', 'vi' ...
  -- slides: [{ order, image_url, phrase_id, pictogram, narration_audio_url }]
  slides jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'approved')), -- 게이트 3
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

-- F-01 4단계 산출물 + F-02: 체크리스트에서 규칙 기반으로 파생된 문항
create table quiz_items (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references equipment(id) on delete cascade,
  language text not null,
  item_type text not null check (item_type in ('sequence', 'hotspot', 'branch')),
  -- data: 문항 유형별 상이한 구조. 예)
  --   sequence: { steps: [{order, hotspot, feedback_on_wrong}] }
  --   hotspot:  { image_url, hazards: [{hotspot, consequence_text}] }
  --   branch:   { prompt, options: [{label, media_url, is_correct, result_text}] }
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- F-03: 사후 조작 불가능한 교육 증빙 기록
create table training_records (
  id uuid primary key default gen_random_uuid(),
  worker_anon_id text not null,
  equipment_id uuid not null references equipment(id),
  language text not null,
  content_id uuid references training_contents(id),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  -- quiz_results: [{ quiz_item_id, item_type, passed, response_time_ms, attempts }]
  quiz_results jsonb not null default '[]'::jsonb,
  passed boolean not null default false,
  signature_name text,
  signed_at timestamptz,
  integrity_hash text, -- 레코드 확정 시점의 SHA-256 해시 (변조 방지)
  created_at timestamptz not null default now()
);

-- 대시보드 집계용 인덱스
create index idx_training_records_equipment on training_records(equipment_id);
create index idx_training_records_passed on training_records(passed);
