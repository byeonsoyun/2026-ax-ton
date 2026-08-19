-- 확장 스키마: 로그인, 신고(F-05), 현장 소통 게시판(신규)
-- 모두 RLS 활성화, anon용 policy는 만들지 않는다 — 접근은 전부 서버(service_role) 경유.

-- 로그인/회원가입: 사업장 발급 ID + 비밀번호만 사용 (여권/외국인등록번호 등 민감정보 수집 안 함, PRD §9.2)
create table workers (
  id text primary key,
  password_hash text not null,
  display_name text,
  language text not null default 'ko',
  created_at timestamptz not null default now()
);
alter table workers enable row level security;

-- F-05: 위험요소 신고. worker_id는 서버에서 "내 신고 이력" 조회용으로만 쓰고,
-- 담당자 게시판 화면에는 절대 노출하지 않는다 (신고자 익명성 원칙).
create table hazard_reports (
  id uuid primary key default gen_random_uuid(),
  worker_id text references workers(id),
  equipment_id uuid references equipment(id),
  hazard_type text not null,
  title text not null,
  photo_url text,
  voice_memo_url text,
  status text not null default 'received' check (status in ('received', 'in_progress', 'done')),
  view_count int not null default 0,
  created_at timestamptz not null default now()
);
alter table hazard_reports enable row level security;

-- 담당자의 처리 회신 — 신고자에게는 마이페이지의 "신고 이력"으로, 담당자에게는 게시판 댓글로 보인다
create table hazard_report_comments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references hazard_reports(id) on delete cascade,
  author text not null default '담당자',
  body text not null,
  created_at timestamptz not null default now()
);
alter table hazard_report_comments enable row level security;

-- 현장 소통 게시판 (F-04 긴급 카드와는 별개의 신규 기능 — 일반 공지/소통용)
create table board_posts (
  id uuid primary key default gen_random_uuid(),
  worker_id text references workers(id),
  author_display text not null, -- 이름 또는 '익명'
  title text not null,
  body text not null,
  view_count int not null default 0,
  created_at timestamptz not null default now()
);
alter table board_posts enable row level security;

create table board_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references board_posts(id) on delete cascade,
  worker_id text references workers(id),
  author_display text not null,
  body text not null,
  created_at timestamptz not null default now()
);
alter table board_comments enable row level security;

create index idx_hazard_reports_equipment on hazard_reports(equipment_id);
create index idx_board_posts_created on board_posts(created_at desc);
