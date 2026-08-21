-- 팀 우선순위 문서(1층): 노동자/담당자 역할별 로그인 분기.
-- 별도 테이블 대신 workers에 role을 두고 재사용한다 — 로그인 방식(사업장 발급 ID+비밀번호)이 동일하기 때문.
alter table workers add column role text not null default 'worker' check (role in ('worker', 'manager'));
