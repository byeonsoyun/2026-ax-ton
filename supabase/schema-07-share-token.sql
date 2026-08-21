-- 3층 아이디어: 수료증 공유 기능. 개인 퀴즈 점수는 절대 노출하지 않고
-- (설비명/이수자 이름/완료일만 보여주는) 짧은 공개 링크를 만들기 위한 토큰.
alter table training_records
  add column share_token uuid not null default gen_random_uuid();

create unique index idx_training_records_share_token on training_records(share_token);
