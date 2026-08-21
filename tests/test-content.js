/* 기능2 교육 콘텐츠 생성 · 승인 — 실제 DOM 검증 */
const { boot, ok, eq, has, report } = require('./harness');

const text = (n) => (n ? n.textContent.trim().replace(/\s+/g, ' ') : '');
const click = (win, node) => node.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
const change = (win, node) => node.dispatchEvent(new win.Event('change', { bubbles: true }));
const input = (win, node, v) => {
  node.value = v;
  node.dispatchEvent(new win.Event('input', { bubbles: true }));
};

function open(opts = {}) {
  return boot('admin/content.html',
    Object.assign({ login: 'kim@daesung.co.kr', role: 'admin', page: 'admin/content.js' }, opts));
}

const checkAll = (win, root, name, values) => {
  root.querySelectorAll('input[name="' + name + '"]').forEach((i) => {
    i.checked = values.indexOf(i.value) !== -1;
  });
  change(win, root);
};

/* =================================================================
   1. 첫 화면 — AI 경계 · 검수된 문구만
   ================================================================= */
{
  const t = open();
  const doc = t.win.document;
  ok('오류 없이 뜬다', t.errors.length === 0, t.errors.join(' | '));

  has('AI 가 문구를 새로 쓰지 않는다고 적는다',
    text(doc.querySelector('.ai-note')), 'AI 는 안전 문구를 새로 쓰지 않습니다');

  // 등록한 언어 3개(km, id, vi)만 나온다 — Store.LANGUAGES 는 6개
  const langs = t.$('pick-lang').querySelectorAll('input[name="lang"]');
  eq('★ 등록한 언어 3개만 나온다', langs.length, 3);
  const codes = [...langs].map((i) => i.value).sort();
  eq('km · id · vi', codes.join(','), 'id,km,vi');

  // ★ 검수 완료 4개만 (ph-1,2,4,6). ph-3 중지 · ph-5 대기 는 없어야 한다
  const phrases = t.$('pick-phrase').querySelectorAll('input[name="phrase"]');
  eq('★ 검수 완료된 문구 4개만 선택지에 오른다', phrases.length, 4);
  const pids = [...phrases].map((i) => i.value).sort();
  eq('ph-3(중지) · ph-5(대기) 는 없다', pids.join(','), 'ph-1,ph-2,ph-4,ph-6');
  has('몇 개가 빠졌는지 밝힌다', text(t.$('phrase-note')), '2개는 고를 수 없습니다');

  // 설비를 고르면 제목이 채워진다
  eq('설비가 3대', t.$('draft-equip').querySelectorAll('option').length, 3);
  t.$('draft-equip').value = 'e-panel';
  change(t.win, t.$('draft-equip'));
  eq('제목이 자동으로 채워진다', t.$('draft-title').value, '배전반 A 안전교육');

  eq('아직 발급할 수 없다', t.$('btn-approve').disabled, true);
}

/* =================================================================
   2. ★ 교육을 하나 만들면 노동자 수강 화면에 나타난다 (완료 기준)
      배전반 A(감전) 로 만든다 — 예시 데이터에 없는 새 교육
   ================================================================= */
{
  const t = open();

  // 1단계 — 설비 · 제목 · 언어
  t.$('draft-equip').value = 'e-panel';
  change(t.win, t.$('draft-equip'));
  input(t.win, t.$('draft-title'), '배전반 A 감전 예방 교육');
  checkAll(t.win, t.$('pick-lang'), 'lang', ['km', 'vi']);
  has('1단계 배지가 채워진다', text(t.$('b-step1')), '2개 언어');

  // 2단계 — 문구 (ph-2 작업 전 전원 차단, ph-6 비상정지 버튼)
  checkAll(t.win, t.$('pick-phrase'), 'phrase', ['ph-2', 'ph-6']);
  has('2단계 배지', text(t.$('b-step2')), '2개 문구');

  // 3단계 — hotspot 문항. 배전반이라 panel 도해가 붙는다
  const zones = t.$('q-hot-figure').querySelectorAll('.zone');
  eq('배전반 도해의 구역 5개', zones.length, 5);
  const labels = [...zones].map((z) => z.getAttribute('aria-label'));
  has('노출된 단자대가 있다', labels.join(' | '), '노출된 단자대');

  input(t.win, t.$('q-hot-prompt'), '전기가 흐르는 곳을 누르세요');
  has('고르기 전에는 안 골랐다고 말한다', text(t.$('q-hot-picked')), '아직 고르지 않았습니다');

  const terminal = [...zones].find((z) => z.getAttribute('aria-label') === '노출된 단자대');
  click(t.win, terminal);
  has('고른 구역을 알려 준다', text(t.$('q-hot-picked')), '노출된 단자대');
  eq('고른 자리에 표시', terminal.getAttribute('data-mark'), 'ok');

  click(t.win, t.$('btn-add-q'));
  eq('문항 1개 추가됨', t.$('quiz-list').querySelectorAll('.item').length, 1);
  has('3단계 배지', text(t.$('b-step3')), '1문항');

  // 문항 2 — choice
  const typeRadios = t.$('pick-qtype').querySelectorAll('input[name="qtype"]');
  [...typeRadios].find((r) => r.value === 'choice').checked = true;
  change(t.win, t.$('pick-qtype'));
  eq('choice 폼이 열린다', t.$('q-choice').hidden, false);
  eq('hotspot 폼은 닫힌다', t.$('q-hotspot').hidden, true);

  input(t.win, t.$('q-ch-prompt'), '배전반을 점검하려고 합니다. 먼저 무엇을 합니까?');
  t.$('q-ch-opt-0').value = '문을 열고 바로 확인한다';
  t.$('q-ch-res-0').value = '차단하지 않고 열면 감전됩니다.';
  t.$('q-ch-opt-1').value = '주 차단기를 내리고 절연장갑을 낀다';
  t.$('q-ch-res-1').value = '맞습니다. 전원을 내리고 절연장갑을 껴야 합니다.';
  t.$('q-ch-answer-1').checked = true;
  click(t.win, t.$('btn-add-q'));
  eq('문항 2개', t.$('quiz-list').querySelectorAll('.item').length, 2);

  // 4단계 — 이제 발급할 수 있다
  eq('발급 버튼이 열린다', t.$('btn-approve').disabled, false);
  const steps = [...t.$('draft-check').children].map((li) => li.getAttribute('data-done'));
  ok('네 단계가 모두 완료', steps.every((s) => s === 'yes'), JSON.stringify(steps));

  const before = t.win.Store.courses.load().length;
  click(t.win, t.$('btn-approve'));

  const courses = t.win.Store.courses.load();
  eq('교육이 하나 늘었다', courses.length, before + 1);

  const made = courses[courses.length - 1];
  eq('제목', made.title, '배전반 A 감전 예방 교육');
  eq('설비', made.equipmentId, 'e-panel');
  eq('언어 2개', made.languages.join(','), 'km,vi');
  eq('문구 2개', made.phraseIds.join(','), 'ph-2,ph-6');
  eq('문항 2개', made.quiz.length, 2);
  eq('발급됨', made.approved, true);

  eq('hotspot 정답이 좌표로 저장된다', typeof made.quiz[0].answer.x, 'number');
  eq('노출된 단자대 좌표 (50, 26)',
    made.quiz[0].answer.x + ',' + made.quiz[0].answer.y, '50,26');
  eq('choice 정답 인덱스', made.quiz[1].answer, 1);
  has('선택의 결과도 저장된다', made.quiz[1].results[0], '감전됩니다');

  eq('초안이 비워진다', t.$('quiz-list').querySelectorAll('.item').length, 0);

  /* --- ★ 노동자 화면에 나타나는지 --- */
  const saved = t.win.Store.courses.load();
  const learn = boot('worker/learn.html', {
    login: 'W-4821-07',           // 크메르어 · 프레스 공정 (배전반 A 도 프레스 공정)
    page: 'worker/learn.js',
    before(win) { win.Store.courses.save(saved); },
  });

  const cards = learn.win.document.querySelectorAll('#course-list .course-card');
  eq('★ 노동자 수강 목록에 2개가 보인다', cards.length, 2);
  has('방금 만든 교육이 있다', text(learn.$('course-list')), '배전반 A 감전 예방 교육');

  /* --- ★ 그리고 이해도 검증까지 이어지는지 --- */
  const newCourse = saved.find((c) => c.title === '배전반 A 감전 예방 교육');
  const quiz = boot('worker/quiz.html?course=' + newCourse.id, {
    login: 'W-4821-07',
    page: 'worker/quiz.js',
    before(win) {
      win.Store.courses.save(saved);
      // 교육을 들은 것으로 해 둔다 (기능3 을 거쳐야 검증에 들어간다)
      win.Store.progress.update((list) => {
        list.push({ workerId: 'W-4821-07', courseId: newCourse.id, lang: 'km',
          learnedAt: '2026-08-21T00:00:00.000Z', quiz: null });
      });
    },
  });

  eq('★ 검증 화면이 뜬다', quiz.$('view-quiz').hidden, false);
  has('문항 1 / 2', text(quiz.$('step-count')), '문항 1 / 2');
  has('담당자가 적은 문항이 그대로 나온다', text(quiz.$('quiz-prompt')), '전기가 흐르는 곳을 누르세요');

  // 담당자가 고른 구역이 정답인지
  const qzones = quiz.$('quiz-body').querySelectorAll('.zone');
  const answer = [...qzones].find((z) => z.getAttribute('aria-label') === '노출된 단자대');
  click(quiz.win, answer);
  eq('★ 담당자가 고른 구역이 정답이 된다', answer.getAttribute('data-mark'), 'ok');
  has('결과 학습 문장도 나온다', text(quiz.$('consequence-text')), '감전됩니다');
}

/* =================================================================
   3. 고른 언어에 번역이 없으면 알린다 (막지는 않는다)
      ph-4 는 vi 번역이 없다
   ================================================================= */
{
  const t = open();
  t.$('draft-equip').value = 'e-booth1';
  change(t.win, t.$('draft-equip'));
  checkAll(t.win, t.$('pick-lang'), 'lang', ['vi']);
  checkAll(t.win, t.$('pick-phrase'), 'phrase', ['ph-4']);

  has('번역이 없는 조합을 알린다', text(t.$('phrase-warn')), '번역이 없는 조합');
  has('어느 언어 어느 문구인지', text(t.$('phrase-warn')), '베트남어');
  has('그대로 내보내면 어떻게 되는지', text(t.$('phrase-warn')), '한국어로 보게 됩니다');

  // 막지는 않는다 — 문항만 채우면 발급할 수 있다
  input(t.win, t.$('q-hot-prompt'), '마스크가 필요한 곳');
  click(t.win, t.$('q-hot-figure').querySelector('.zone'));
  click(t.win, t.$('btn-add-q'));
  eq('경고가 있어도 발급은 가능하다', t.$('btn-approve').disabled, false);
}

/* =================================================================
   4. 검수된 문구가 하나도 없으면 만들 수 없다
   ================================================================= */
{
  const t = open({
    before(win) {
      win.Store.library.update((list) => { list.forEach((p) => { p.status = 'waiting'; }); });
    },
  });
  has('운영자가 검수를 마쳐야 한다고 말한다',
    text(t.$('pick-phrase')), '운영자가 안전 문구 라이브러리(기능9)에서 검수를 마쳐야 합니다');
  eq('발급 버튼이 잠긴다', t.$('btn-approve').disabled, true);
}

/* =================================================================
   5. 설비나 언어가 등록되지 않았으면 먼저 등록하게 한다
   ================================================================= */
{
  const t = open({
    before(win) {
      win.Store.setup.update((s) => { s.equipments = []; });
    },
  });
  eq('만들기 영역이 잠긴다', t.$('builder').hidden, true);
  eq('먼저 등록하라고 안내한다', t.$('setup-lock').hidden, false);
  has('어디로 가야 하는지', t.$('setup-lock').innerHTML, 'setup.html');
}

/* =================================================================
   6. 발급한 교육 목록 — 문구가 중지되면 그 사실이 보인다
   ================================================================= */
{
  const t = open({
    before(win) {
      // c-press 가 쓰는 ph-1 을 중지시킨다 (운영자가 오역 신고를 접수한 상황)
      win.Store.library.update((list) => {
        list.find((p) => p.id === 'ph-1').status = 'stopped';
      });
    },
  });

  const row = [...t.$('course-rows').querySelectorAll('tr')]
    .find((r) => text(r).includes('프레스 3호기'));
  ok('교육이 목록에 있다', !!row);
  has('쓸 수 있는 문구가 줄었다고 보여 준다', text(row), '문구 2 / 3');
  has('중지된 문구가 있다고 알린다', text(row), '1개 중지됨');
  // 예시 데이터에서 프레스 공정 노동자는 W-4821-07 한 명이다
  has('그 공정 노동자 수를 센다', text(row), '1명');

  // 문항 없는 교육은 그것도 표시
  const t2 = open({
    before(win) {
      win.Store.courses.update((list) => { list[0].quiz = []; });
    },
  });
  const row2 = t2.$('course-rows').querySelectorAll('tr')[0];
  has('문항이 없으면 그렇게 표시', text(row2), '문항 없음');
}

/* =================================================================
   7. 잘못 만들려고 하면 막는다
   ================================================================= */
{
  const t = open();
  t.$('draft-equip').value = 'e-press3';
  change(t.win, t.$('draft-equip'));

  // 문항 없이 추가 시도
  click(t.win, t.$('btn-add-q'));
  eq('문항 문구가 비면 추가되지 않는다', t.$('quiz-list').querySelectorAll('.item').length, 0);

  // 문구는 적었지만 구역을 안 골랐다
  input(t.win, t.$('q-hot-prompt'), '아무 데나');
  click(t.win, t.$('btn-add-q'));
  eq('정답 구역을 안 고르면 추가되지 않는다', t.$('quiz-list').querySelectorAll('.item').length, 0);

  // choice 에 선택지가 하나뿐
  [...t.$('pick-qtype').querySelectorAll('input')].find((r) => r.value === 'choice').checked = true;
  change(t.win, t.$('pick-qtype'));
  input(t.win, t.$('q-ch-prompt'), '질문');
  t.$('q-ch-opt-0').value = '하나뿐';
  click(t.win, t.$('btn-add-q'));
  eq('선택지가 두 개 미만이면 추가되지 않는다', t.$('quiz-list').querySelectorAll('.item').length, 0);

  // match 에 짝이 하나뿐
  [...t.$('pick-qtype').querySelectorAll('input')].find((r) => r.value === 'match').checked = true;
  change(t.win, t.$('pick-qtype'));
  input(t.win, t.$('q-ma-prompt'), '연결하세요');
  const rows = t.$('q-ma-pairs').querySelectorAll('.pair-row');
  eq('짝 입력줄이 2개로 시작한다', rows.length, 2);
  rows[0].querySelector('.pair-a').value = '작업1';
  rows[0].querySelector('.pair-b').value = '보호구1';
  click(t.win, t.$('btn-add-q'));
  eq('짝이 두 개 미만이면 추가되지 않는다', t.$('quiz-list').querySelectorAll('.item').length, 0);

  // 제대로 채우면 추가된다
  rows[1].querySelector('.pair-a').value = '작업2';
  rows[1].querySelector('.pair-b').value = '보호구2';
  click(t.win, t.$('btn-add-q'));
  eq('제대로 채우면 추가된다', t.$('quiz-list').querySelectorAll('.item').length, 1);
}

/* =================================================================
   8. 규칙 검사
   ================================================================= */
{
  const fs = require('fs');
  const base = 'C:/Users/byeonsoyun/2026-ax-ton/2026-ax-ton/src/admin/';
  const html = fs.readFileSync(base + 'content.html', 'utf8');
  const js = fs.readFileSync(base + 'content.js', 'utf8');
  const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');

  ok('외부 주소 없음', !/(src|href)\s*=\s*["']https?:/i.test(html));
  ok('절대경로 없음', !/(src|href)\s*=\s*["']\//.test(html));
  ok('innerHTML 안 씀', !/innerHTML/.test(strip(js)));
  ok('localStorage 직접 호출 안 함', !/localStorage/.test(strip(js)));
  ok('"면책" 표현 없음', !/면책/.test(html + js));
  ok('껍데기 안내가 남아 있지 않다', !/아직 만들지 않은 화면/.test(html));
  ok('<img> 없음', !/<img/i.test(html));
}

report('기능2 교육 콘텐츠 생성 · 승인');
