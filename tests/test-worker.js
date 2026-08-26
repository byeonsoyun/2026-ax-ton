/* 노동자 화면 4개 (홈 · 기능8 신고 · 기능7 소통 · 마이) — 실제 DOM 검증 */
const { boot, ok, eq, has, report } = require('./harness');

const text = (n) => (n ? n.textContent.trim().replace(/\s+/g, ' ') : '');
const click = (win, node) => node.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
const change = (win, node) => node.dispatchEvent(new win.Event('change', { bubbles: true }));

const pick = (win, root, name, value) => {
  root.querySelectorAll('input[name="' + name + '"]').forEach((i) => { i.checked = i.value === value; });
  change(win, root);
};

function open(page, opts = {}) {
  return boot('worker/' + page + '.html',
    Object.assign({ login: 'W-4821-07', page: 'worker/' + page + '.js' }, opts));
}

/* =================================================================
   홈 — 글자를 읽지 않고 길을 찾을 수 있는가
   ================================================================= */
{
  const t = open('home');
  ok('오류 없이 뜬다', t.errors.length === 0, t.errors.join(' | '));

  // 1. 오늘의 안전 문구 — ★ 검수된 것만
  const todayText = text(t.$('today-text'));
  ok('오늘의 문구가 있다', todayText.length > 0);
  const lib = t.win.Store.library.load();
  const shown = lib.find((p) => p.ko === text(t.$('today-ko')) ||
    (p.translations.km && p.translations.km.text === todayText));
  ok('★ 검수 완료된 문구만 배너에 오른다', !shown || shown.status === 'reviewed',
    shown && shown.id + ' status=' + shown.status);
  eq('문구를 소리로 들을 수 있다', t.$('today-listen').querySelectorAll('.btn-audio').length, 1);

  // 2. 3단계 — 예시 데이터에서 W-4821-07 은 c-press 통과 → 완료
  const stages = [...t.$('stage-track').children].map((li) => li.getAttribute('data-state'));
  eq('세 단계가 다 표시된다', stages.filter(Boolean).length, 3);
  has('상태를 말로도 알려 준다', text(t.$('stage-say')), '마쳤습니다');
  ok('상태를 소리로 들을 수 있다', !!t.$('stage-say').querySelector('.btn-audio'));

  // 3. 메뉴 4갈래 — 픽토그램 + 글자 + 음성
  const cells = [...t.$('bigmenu').querySelectorAll('.bigmenu-cell')];
  eq('메뉴 4개', cells.length, 4);
  ok('메뉴마다 픽토그램이 있다',
    cells.every((c) => text(c.querySelector('.ico')).length > 0));
  ok('★ 메뉴마다 음성 버튼이 있다',
    cells.every((c) => !!c.querySelector('.btn-audio')));
  const hrefs = cells.map((c) => c.querySelector('a').getAttribute('href'));
  eq('수강·신고·소통·마이로 간다',
    hrefs.join(','), 'learn.html,report.html,talk.html,my.html');

  // 4. 번역 이상 신고 안내
  const main = text(t.win.document.querySelector('main'));
  has('말이 이상하면 알려 달라고 한다', main, '말이 이상하면 알려 주세요');
  has('알린 사람을 기록하지 않는다고 말한다', main, '누구인지는 기록하지 않습니다');

  /* --- 아직 안 들은 상태면 교육으로 보낸다 --- */
  const t2 = open('home', {
    before(win) { win.Store.progress.save([]); },
  });
  has('아직 안 들었다고 말한다', text(t2.$('stage-say')), '아직 듣지 않았습니다');
  const now = [...t2.$('stage-track').children].find((li) => li.getAttribute('data-state') === 'now');
  has('듣기 단계가 지금 차례', text(now), '듣기');
  has('교육으로 가는 버튼', t2.$('stage-actions').innerHTML, 'learn.html');

  /* --- 검수된 문구가 없으면 --- */
  const t3 = open('home', {
    before(win) {
      win.Store.library.update((list) => { list.forEach((p) => { p.status = 'waiting'; }); });
    },
  });
  has('★ 검수된 문구가 없으면 배너를 비운다',
    text(t3.$('today-text')), '아직 안전 문구가 준비되지 않았습니다');
}

/* =================================================================
   기능8 신고 — ★★ 익명이 지켜지는가
   ================================================================= */
{
  const t = open('report');
  ok('오류 없이 뜬다', t.errors.length === 0, t.errors.join(' | '));

  // 익명 고지가 맨 위에
  const anon = t.win.document.querySelector('.anon-note');
  has('이름을 남기지 않는다고 크게 적는다', text(anon), '이름을 남기지 않습니다');
  has('관리자도 알 수 없다고 말한다', text(anon), '관리자도 알 수 없습니다');
  ok('안내를 소리로도 들을 수 있다', !!anon.querySelector('.btn-audio'));

  // 그림으로 고른다
  const equips = t.$('pick-equip').querySelectorAll('input[name="equip"]');
  eq('설비 3대', equips.length, 3);
  ok('내 공정 설비가 먼저 온다',
    ['e-press3', 'e-panel'].indexOf(equips[0].value) !== -1, equips[0].value);
  const hazards = t.$('pick-hazard').querySelectorAll('input[name="hazard"]');
  eq('위험유형 6개', hazards.length, 6);

  has('고르기 전에는 미선택', text(t.$('b-equip')), '미선택');

  /* --- ★ 글을 한 자도 안 쓰고 신고가 끝난다 --- */
  pick(t.win, t.$('pick-equip'), 'equip', 'e-press3');
  pick(t.win, t.$('pick-hazard'), 'hazard', 'pinch');
  has('고른 설비가 표시된다', text(t.$('b-equip')), '프레스 3호기');
  has('고른 위험이 표시된다', text(t.$('b-hazard')), '끼임');

  const before = t.win.Store.reports.load().length;
  click(t.win, t.$('btn-send'));

  const list = t.win.Store.reports.load();
  eq('★ 메모 없이도 접수된다', list.length, before + 1);

  const made = list[list.length - 1];

  /* --- ★★ 여기가 이 화면의 핵심 검사 --- */
  const keys = Object.keys(made);
  const forbidden = ['workerId', 'userId', 'author', 'by', 'reporter', 'name', 'lang', 'createdBy'];
  ok('★★ 신고자를 식별할 값이 하나도 없다',
    forbidden.every((k) => !(k in made)),
    JSON.stringify(keys));
  ok('★★ 저장된 값 어디에도 내 아이디가 없다',
    !JSON.stringify(made).includes('W-4821'),
    JSON.stringify(made));
  eq('저장되는 값은 정해진 것만',
    keys.slice().sort().join(','),
    'createdAt,equipmentId,hazard,id,memo,processId,status,ticket');

  // 접수 번호에도 사람이 안 들어간다
  ok('접수 번호가 생긴다', /^R-\d{6}-\d{4}$/.test(made.ticket), made.ticket);
  ok('★ 접수 번호에 아이디가 없다', !made.ticket.includes('4821'), made.ticket);

  // 접수 화면
  eq('접수 화면이 뜬다', t.$('view-done').hidden, false);
  eq('신고 폼은 숨는다', t.$('view-form').hidden, true);
  eq('접수 번호를 보여 준다', text(t.$('ticket')), made.ticket);
  has('번호에 누구인지가 없다고 말한다', text(t.$('view-done')), '누구인지가 들어 있지 않습니다');
  ok('접수 안내를 소리로 들을 수 있다', !!t.$('done-listen').querySelector('.btn-audio'));

  // 목록에 뜨고, 왜 "내 신고" 를 못 보는지 설명한다
  has('★ 익명이라 내 것만 골라 볼 수 없다고 설명한다',
    text(t.$('list-why')), '"내가 낸 것" 만 골라 볼 수 없습니다');
  const items = t.$('report-list').querySelectorAll('.report-item');
  eq('목록에 3건 (예시 2 + 방금 1)', items.length, 3);
  ok('★ 목록에도 식별번호가 나오지 않는다',
    !/W-\d{4}-\d{2}/.test(text(t.$('report-list'))), text(t.$('report-list')).slice(0, 200));

  /* --- 또 알리기 --- */
  click(t.win, t.$('btn-again'));
  eq('폼이 다시 뜬다', t.$('view-form').hidden, false);
  eq('고른 것이 비워진다', t.$('pick-equip').querySelectorAll('input:checked').length, 0);

  /* --- 안 고르면 막는다 --- */
  const t2 = open('report');
  click(t2.win, t2.$('btn-send'));
  eq('설비를 안 고르면 접수되지 않는다', t2.win.Store.reports.load().length, 2);
  pick(t2.win, t2.$('pick-equip'), 'equip', 'e-press3');
  click(t2.win, t2.$('btn-send'));
  eq('위험유형을 안 고르면 접수되지 않는다', t2.win.Store.reports.load().length, 2);
}

/* =================================================================
   기능7 소통 — 게시판과 이름 감추기
   ================================================================= */
{
  const t = open('talk');
  ok('오류 없이 뜬다', t.errors.length === 0, t.errors.join(' | '));

  const items = [...t.$('post-list').querySelectorAll('.post-item')];
  eq('예시 글 2개', items.length, 2);

  const meta = items.map((i) => text(i.querySelector('.meta')));
  ok('제목·작성자·작성일·조회수·댓글이 보인다',
    meta.every((m) => m.includes('조회') && m.includes('댓글')), JSON.stringify(meta));
  ok('익명 글은 이름 감춤으로 보인다',
    meta.some((m) => m.includes('이름 감춤')), JSON.stringify(meta));

  /* --- 글 열기 · 조회수 --- */
  const first = items[0].querySelector('.post-open');
  const beforeViews = t.win.Store.posts.load()[0].views || 0;
  click(t.win, first);
  eq('글 화면이 뜬다', t.$('view-post').hidden, false);
  ok('제목이 보인다', text(t.$('p-title')).length > 0);
  ok('글을 소리로 읽어 준다', !!t.$('p-listen').querySelector('.btn-audio'));

  /* --- 댓글 달기 (이름 감추고) --- */
  t.$('c-body').value = '저도 궁금합니다';
  pick(t.win, t.$('pick-canon'), 'canon', 'yes');
  click(t.win, t.$('btn-comment'));

  const posts = t.win.Store.posts.load();
  const opened = posts.find((p) => (p.comments || []).some((c) => c.body === '저도 궁금합니다'));
  ok('댓글이 저장된다', !!opened);
  const added = opened.comments[opened.comments.length - 1];
  eq('★ 이름을 감추면 아이디를 저장하지 않는다', added.author, '');
  eq('감췄다는 표시', added.anonymous, true);
  has('화면에도 이름 감춤으로', text(t.$('p-comments')), '이름 감춤');

  /* --- 새 글 쓰기 (이름 밝히고) --- */
  click(t.win, t.$('btn-post-back'));
  click(t.win, t.$('btn-new'));
  eq('쓰기 화면이 뜬다', t.$('view-write').hidden, false);

  t.$('w-title').value = '도장실 환기팬 언제 고쳐지나요';
  t.$('w-body').value = '어제부터 소리가 큽니다';
  click(t.win, t.$('btn-write-save'));

  const made = t.win.Store.posts.load().find((p) => p.title === '도장실 환기팬 언제 고쳐지나요');
  ok('글이 저장된다', !!made);
  eq('감추지 않으면 내 아이디가 들어간다', made.author, 'W-4821-07');
  eq('감춘 글이 아니다', made.anonymous, false);
  eq('조회수 0으로 시작', made.views, 0);
  eq('댓글은 빈 배열', made.comments.length, 0);
  eq('목록으로 돌아간다', t.$('view-list').hidden, false);
  has('목록에 새 글이 있다', text(t.$('post-list')), '도장실 환기팬');

  /* --- 제목 없이 올리려면 막는다 --- */
  click(t.win, t.$('btn-new'));
  const countBefore = t.win.Store.posts.load().length;
  click(t.win, t.$('btn-write-save'));
  eq('제목이 없으면 올라가지 않는다', t.win.Store.posts.load().length, countBefore);
}

/* =================================================================
   마이페이지 — 숨기는 경로가 없는가
   ================================================================= */
{
  const t = open('my');
  ok('오류 없이 뜬다', t.errors.length === 0, t.errors.join(' | '));

  // 내 정보 — ★ 외국인등록번호·여권번호 없음
  const meText = text(t.$('me-list'));
  has('식별번호', meText, 'W-4821-07');
  has('사업장', meText, '대성정밀');
  has('공정', meText, '프레스');
  has('내 언어', meText, '크메르어');
  const card = t.$('me-list').closest('.card');
  has('★ 받지 않는다는 것을 적는다', text(card), '외국인등록번호와 여권번호는 받지 않습니다');
  ok('★ 화면에 그런 항목이 없다', !/등록번호\s*[:：]|여권번호\s*[:：]/.test(meText));

  // 받은 교육
  const rows = [...t.$('history-list').querySelectorAll('.course-card')];
  eq('받은 교육 1건', rows.length, 1);
  has('완료로 보인다', text(rows[0]), '완료');
  has('점수도 보인다', text(rows[0]), '100점');

  /* --- 통과하지 못한 것도 그대로 보이고, 다시 할 길을 준다 --- */
  const t2 = open('my', {
    before(win) {
      win.Store.progress.update((list) => {
        const r = list.find((x) => x.workerId === 'W-4821-07' && x.courseId === 'c-press');
        r.quiz = { score: 33, passed: false, answers: [1, 0, 0], at: '2026-08-20T00:00:00.000Z',
          attempt: 1, firstPassed: false };
      });
    },
  });
  const row2 = t2.$('history-list').querySelector('.course-card');
  has('★ 통과하지 못한 것도 숨기지 않는다', text(row2), '다시 해야 합니다');
  has('점수도 그대로', text(row2), '33점');
  has('다시 할 길을 준다', row2.innerHTML, 'learn.html');

  // ★ 증빙 — 숨기는 경로가 없다
  const proofCard = t.$('btn-print').closest('.card');
  has('★ 빼고 뽑는 기능이 없다고 적는다',
    text(proofCard), '못 들은 교육을 빼고 뽑는 기능은 없습니다');

  const proofRows = [...t.$('proof-rows').querySelectorAll('tr')];
  eq('증빙에 받은 교육 전부', proofRows.length, 1);
  has('증빙 제목', text(t.$('proof')), '수강 증빙');
  has('★ 빼고 뽑을 수 없다고 문서에 적는다',
    text(t.$('proof-foot')), '빼고 뽑을 수 없습니다');
  has('법적 책임을 대신하지 않는다', text(t.$('proof-foot')), '법적 책임을 대신하지 않습니다');

  // 신고 이력 — 익명이라 내 것만 못 본다
  has('★ 왜 내 것만 볼 수 없는지 설명한다',
    text(t.$('reports-why')), '"내가 낸 것" 만 골라 볼 수 없습니다');
  ok('★ 신고 목록에 식별번호가 없다',
    !/W-\d{4}-\d{2}/.test(text(t.$('reports-list'))));

  // 인쇄
  let printed = 0;
  t.win.print = () => { printed++; };
  click(t.win, t.$('btn-print'));
  eq('브라우저 인쇄를 부른다', printed, 1);
  /* 쓰는 키 — 증빙에 손댈 수 있는 경로가 없어야 한다

     ★ 원래 이 검사는 "아무것도 쓰지 않는다" 였다. 지키려던 것은 그게 아니라
       "증빙 사본을 만들지 않는다" 다 — 사본이 없으니 고칠 경로도 없다.
       C8(내 언어 바꾸기)이 accounts 에 쓰게 되면서 원칙 쪽으로 좁혔다.
       내 언어는 앞으로 받을 교육의 언어이지 이미 받은 기록이 아니다. */
  const fs = require('fs');
  const code = fs.readFileSync('C:/Users/byeonsoyun/2026-ax-ton/2026-ax-ton/src/worker/my.js', 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  const writes = [...new Set((code.match(/Store\.(\w+)\.(?:save|update)\s*\(/g) || [])
    .map((s) => s.split('.')[1]))];
  eq('★ 마이페이지가 쓰는 키는 accounts 하나뿐이다', writes.join(','), 'accounts');

  ok('★ 기록에 쓰는 경로가 없다 (progress · courses · reports · setup)',
    !/Store\.(progress|courses|reports|setup)\.(?:save|update)\s*\(/.test(code));

  ok('★ accounts 는 lang 값만 고친다 — 모양은 넓히지 않는다',
    !/\bacc\.(userId|pw|role|name|title|siteName|processId)\s*=/.test(code));
}

/* =================================================================
   규칙 검사 — 노동자 화면 4개
   ================================================================= */
{
  const fs = require('fs');
  const base = 'C:/Users/byeonsoyun/2026-ax-ton/2026-ax-ton/src/worker/';
  const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');

  ['home', 'report', 'talk', 'my'].forEach((name) => {
    const html = fs.readFileSync(base + name + '.html', 'utf8');
    const js = fs.readFileSync(base + name + '.js', 'utf8');
    const visible = html.replace(/<!--[\s\S]*?-->/g, '');

    ok(name + ': 외부 주소 없음', !/(src|href)\s*=\s*["']https?:/i.test(html));
    ok(name + ': 절대경로 없음', !/(src|href)\s*=\s*["']\//.test(html));
    ok(name + ': innerHTML 안 씀', !/innerHTML/.test(strip(js)));
    ok(name + ': localStorage 직접 호출 안 함', !/localStorage/.test(strip(js)));
    ok(name + ': "면책" 없음', !/면책/.test(visible + strip(js)));
    ok(name + ': 껍데기 안내 없음', !/아직 만들지 않은 화면/.test(html));
    ok(name + ': <img> 없음', !/<img/i.test(html));
  });

  // ★ report.js 가 저장할 때 사람과 이어지는 값을 쓰지 않는지 (코드 수준)
  const reportJs = strip(fs.readFileSync(base + 'report.js', 'utf8'));
  const writeBlock = reportJs.slice(reportJs.indexOf('Store.reports.update'),
    reportJs.indexOf('if (!result.ok)'));
  ok('★★ 신고 저장 블록에 user 나 me.id 가 없다',
    !/user\.|me\.id|userId|workerId|author/.test(writeBlock), writeBlock.slice(0, 300));
}


/* =================================================================
   마이페이지 — 문항별 복기 (C4)
   ================================================================= */
{
  /* c-press 를 33점으로 떨어뜨린다. answers [1,0,0] — 2·3번 문항이 틀렸다.
     seed 의 c-press 문항은 q1 pinch(끼임) · q2 pinch · q3 shock(감전) 이다. */
  const t = open('my', {
    before(win) {
      win.Store.progress.update((list) => {
        const r = list.find((x) => x.workerId === 'W-4821-07' && x.courseId === 'c-press');
        r.quiz = { score: 33, passed: false, answers: [1, 0, 0], at: '2026-08-20T00:00:00.000Z',
          attempt: 1, firstPassed: false };
      });
    },
  });

  const stuck = t.$('history-list').querySelector('.stuck');
  ok('★ 미통과한 교육에 복기가 붙는다', !!stuck);
  has('여기서 막혔다고 적는다', text(stuck), '여기서 막혔습니다');

  const items = [...stuck.querySelectorAll('.stuck-list li')];
  /* q1 과 q2 는 둘 다 끼임이다. 맞힌 q1 까지 들어가면 끼임이 두 번 나온다. */
  eq('★ 맞힌 1번 문항은 나오지 않는다',
    items.filter((li) => text(li).includes('끼임')).length, 1);

  const all = items.map((li) => text(li)).join(' | ');
  has('★ 위험유형이 글자로 보인다', all, '감전');
  ok('★ 픽토그램이 함께 보인다 (색·글자만으로 구분하지 않는다)',
    items.every((li) => !!li.querySelector('.ico') && li.querySelector('.ico').textContent.trim()),
    all);
  ok('★ 틀렸다는 것을 배지로도 적는다', all.includes('틀림'), all);

  has('★ 노동자의 실패가 아니라고 적는다', text(stuck), '교육의 실패로 기록됩니다');

  /* 문항 문구는 내 언어로 나온다 — Store.qtext 를 거친다.
     seed 의 c-press q2 는 크메르어 번역이 있다. */
  has('★ 문항 문구가 크메르어로 나온다', text(stuck), 'ម៉ាស៊ីន');

  /* ★ q3 은 seed 에 번역이 일부러 없다. 없으면 한국어로 내려간다 (A1 규칙).
       조용히 비우면 무엇을 틀렸는지 알 수 없는 빈 줄이 된다. */
  has('★ 번역 없는 문항은 한국어로 내려간다', text(stuck), '보호구를 연결하세요');

  // 통과한 교육에는 붙지 않는다 — 복기가 성적표가 되면 안 된다
  const passed = open('my');
  ok('★ 통과한 교육에는 복기가 없다', !passed.$('history-list').querySelector('.stuck'));
}

/* =================================================================
   마이페이지 — 내 언어 바꾸기 (C8)
   ================================================================= */
{
  const t = open('my');
  const box = t.$('pick-mylang');
  ok('언어 고르는 칸이 있다', !!box);

  const chips = [...box.querySelectorAll('input[name="mylang"]')];
  eq('언어 6개가 다 나온다', chips.length, 6);
  eq('★ 지금 내 언어가 골라져 있다',
    chips.filter((c) => c.checked).map((c) => c.value).join(','), 'km');

  /* ★ 한국어를 못 읽는 사람이 자기 언어를 찾을 수 있어야 한다.
       모국어 글자가 앞에 온다. */
  has('★ 모국어 글자로 적혀 있다', text(box), 'Tiếng Việt');
  has('한국어 이름도 거든다', text(box), '베트남어');

  // 베트남어로 바꾼다
  const vi = chips.find((c) => c.value === 'vi');
  vi.checked = true;
  vi.dispatchEvent(new t.win.Event('change', { bubbles: true }));

  const acc = t.win.Store.findBy(t.win.Store.accounts.load(), 'userId', 'W-4821-07');
  eq('★ accounts 에 저장된다', acc.lang, 'vi');
  eq('★ 다른 필드는 그대로다 — 모양을 넓히지 않는다', acc.processId, 'p-press');
  eq('비밀번호도 그대로', acc.pw, '1234');
  has('바뀌었다고 알린다', text(t.$('toast')), '베트남어');
  has('★ 화면의 내 언어도 함께 바뀐다', text(t.$('me-list')), '베트남어');

  /* ★ 언어를 바꿔도 이미 받은 교육의 기록은 그대로다.
       progress 는 그때 들은 언어를 스스로 갖고 있다 (learn.js 가 row.lang 을 적는다).
       여기가 무너지면 언어를 바꾸는 것으로 증빙을 고칠 수 있게 된다. */
  const row = t.win.Store.progress.load()
    .find((x) => x.workerId === 'W-4821-07' && x.courseId === 'c-press');
  eq('★ 지난 기록의 언어는 안 바뀐다', row.lang, 'km');
  has('★ 증빙도 그때 언어로 남는다', text(t.$('proof-rows')), '크메르어');
}

/* =================================================================
   기능7 소통 — 내 글 수정·삭제 (C3)

   ★ 여기서 지켜야 하는 것은 "고칠 수 있는가" 가 아니라
     "감춘 글은 아무도 — 본인도 — 손댈 수 없는가" 다.
   ================================================================= */

/* 글 목록에서 제목으로 찾아 연다 */
function openPostByTitle(t, title) {
  const item = [...t.$('post-list').querySelectorAll('.post-item')]
    .find((li) => text(li).includes(title));
  if (item) click(t.win, item.querySelector('.post-open'));
  return item;
}

{
  /* seed: po-1 은 W-4821-07 이 이름을 밝히고 쓴 글, po-2 는 익명 글 */
  const t = open('talk');

  /* --- 내 글 --- */
  openPostByTitle(t, '프레스 교대');
  const mine = t.$('p-mine');
  has('★ 내 글에 고치기가 있다', text(mine), '고치기');
  has('★ 내 글에 지우기가 있다', text(mine), '지우기');

  /* --- 익명 글 — 본인도 손댈 수 없다 --- */
  click(t.win, t.$('btn-post-back'));
  openPostByTitle(t, '도장실 마스크');
  const anon = t.$('p-mine');
  ok('★ 감춘 글에는 고치기·지우기가 없다',
    !text(anon).includes('고치기') && !text(anon).includes('지우기'), text(anon));
  has('★ 왜 못 하는지 적는다', text(anon),
    '누가 썼는지 저장하지 않으므로');
  has('★ 본인도 못 한다고 적는다', text(anon), '본인도 고치거나 지울 수 없습니다');
}

{
  /* --- 남의 글에는 아무것도 안 붙는다 --- */
  const t = open('talk', {
    before(win) {
      win.Store.posts.update((list) => {
        const p = list.find((x) => x.id === 'po-1');
        p.author = 'W-4821-11';        // 다른 사람 글로 바꾼다
      });
    },
  });
  openPostByTitle(t, '프레스 교대');
  eq('★ 남의 글에는 버튼도 안내도 없다', text(t.$('p-mine')), '');
}

{
  /* --- 고치기 --- */
  const t = open('talk');
  openPostByTitle(t, '프레스 교대');
  click(t.win, [...t.$('p-mine').querySelectorAll('button')]
    .find((b) => text(b).includes('고치기')));

  eq('쓰기 화면으로 간다', t.$('view-write').hidden, false);
  has('★ 새로 쓰는 것이 아니라고 적는다', text(t.$('t-write')), '고치기');
  eq('원래 제목이 채워져 있다', t.$('w-title').value, '프레스 교대 시간 바뀐 것 맞나요?');
  ok('원래 내용도 채워져 있다', t.$('w-body').value.length > 0);

  t.$('w-title').value = '프레스 교대 시간 (확인했습니다)';
  click(t.win, t.$('btn-write-save'));

  const all = t.win.Store.posts.load();
  eq('★ 글이 늘지 않는다 — 고친 것이지 새로 쓴 것이 아니다', all.length, 2);

  const edited = all.find((p) => p.id === 'po-1');
  eq('제목이 바뀐다', edited.title, '프레스 교대 시간 (확인했습니다)');
  eq('★ 글쓴이는 그대로다', edited.author, 'W-4821-07');
  ok('고친 시각이 남는다', !!edited.editedAt);
  eq('★ 댓글은 그대로 남는다', edited.comments.length, 1);
  eq('★ 조회수도 그대로다', edited.views, all.find((p) => p.id === 'po-1').views);

  eq('고친 글 화면으로 돌아온다', t.$('view-post').hidden, false);
  has('고쳤다는 표시가 보인다', text(t.$('p-meta')), '고침');
}

{
  /* --- 고치다 그만두고 새로 쓰면 새 글이어야 한다
       ★ 옛 글을 덮어쓰면 남의 눈에는 글이 사라진 것으로 보인다.
         endEdit() 이 그만두기와 새로 쓰기 두 곳에 다 있다 — 한쪽만 남아도
         결과는 지켜진다. 검사는 방식이 아니라 그 결과를 본다. --- */
  const t = open('talk');
  openPostByTitle(t, '프레스 교대');
  click(t.win, [...t.$('p-mine').querySelectorAll('button')]
    .find((b) => text(b).includes('고치기')));
  click(t.win, t.$('btn-write-cancel'));

  click(t.win, t.$('btn-new'));
  eq('★ 그만두면 칸이 비워진다', t.$('w-title').value, '');
  has('★ 다시 새로 쓰기가 된다', text(t.$('t-write')), '새로 쓰기');

  t.$('w-title').value = '완전히 새 글';
  click(t.win, t.$('btn-write-save'));

  const all = t.win.Store.posts.load();
  eq('★ 새 글로 늘어난다 — 옛 글을 덮어쓰지 않는다', all.length, 3);
  ok('옛 글이 그대로 있다',
    !!all.find((p) => p.title === '프레스 교대 시간 바뀐 것 맞나요?'));
}

{
  /* --- 지우기 --- */
  const t = open('talk');
  t.win.confirm = () => true;
  openPostByTitle(t, '프레스 교대');
  click(t.win, [...t.$('p-mine').querySelectorAll('button')]
    .find((b) => text(b).includes('지우기')));

  const all = t.win.Store.posts.load();
  eq('글이 지워진다', all.length, 1);
  ok('그 글만 지워진다', !all.find((p) => p.id === 'po-1'));
  eq('목록으로 돌아간다', t.$('view-list').hidden, false);

  /* 되돌릴 수 없는 일이라 먼저 물어본다 */
  const t2 = open('talk');
  let asked = '';
  t2.win.confirm = (m) => { asked = m; return false; };
  openPostByTitle(t2, '프레스 교대');
  click(t2.win, [...t2.$('p-mine').querySelectorAll('button')]
    .find((b) => text(b).includes('지우기')));
  has('★ 먼저 물어본다', asked, '되돌릴 수 없습니다');
  has('★ 댓글도 사라진다고 알린다', asked, '댓글도 함께 사라집니다');
  eq('★ 아니라고 하면 안 지운다', t2.win.Store.posts.load().length, 2);
}

{
  /* --- 고치면서 이름을 감추면 되돌릴 수 없다 --- */
  const t = open('talk');
  openPostByTitle(t, '프레스 교대');
  click(t.win, [...t.$('p-mine').querySelectorAll('button')]
    .find((b) => text(b).includes('고치기')));

  pick(t.win, t.$('pick-anon'), 'anon', 'yes');
  has('★ 누르기 전에 되돌릴 수 없다고 적는다', text(t.$('w-anonwarn')), '되돌릴 수 없고');

  let asked = '';
  t.win.confirm = (m) => { asked = m; return true; };
  click(t.win, t.$('btn-write-save'));
  has('★ 저장할 때 한 번 더 물어본다', asked, '되돌릴 수 없고');

  const edited = t.win.Store.posts.load().find((p) => p.id === 'po-1');
  eq('★ 아이디가 지워진다 — 표시만 감추는 것이 아니다', edited.author, '');
  eq('감춘 글이 된다', edited.anonymous, true);

  /* 이제는 본인도 못 고친다 */
  has('★ 그 뒤로는 손댈 수 없다', text(t.$('p-mine')), '본인도 고치거나 지울 수 없습니다');
  ok('고치기 버튼이 사라진다', !text(t.$('p-mine')).includes('고치기'), text(t.$('p-mine')));
}
report('노동자 화면 4개 — 홈 · 신고 · 소통 · 마이');
