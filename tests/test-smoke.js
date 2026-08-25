/* 회귀 검사 — ui.js · seed.js 를 고쳤으니 11개 화면 전부 오류 없이 뜨는지 본다.
   다른 세 분 담당 화면이 내 변경으로 깨지면 안 된다. */
const { boot, ok, eq, has, report } = require('./harness');

const PAGES = [
  ['worker/home.html',      'worker/home.js',      'W-4821-07'],
  ['worker/learn.html',     'worker/learn.js',     'W-4821-07'],
  ['worker/quiz.html',      'worker/quiz.js',      'W-4821-07'],
  ['worker/report.html',    'worker/report.js',    'W-4821-07'],
  ['worker/talk.html',      'worker/talk.js',      'W-4821-07'],
  ['worker/my.html',        'worker/my.js',        'W-4821-07'],
  ['admin/setup.html',      'admin/setup.js',      'kim@daesung.co.kr'],
  ['admin/dashboard.html',  'admin/dashboard.js',  'kim@daesung.co.kr'],
  ['admin/content.html',    'admin/content.js',    'kim@daesung.co.kr'],
  ['admin/proof.html',      'admin/proof.js',      'kim@daesung.co.kr'],
  ['admin/library.html',    'admin/library.js',    'oper@safety.kr'],
];

PAGES.forEach(([html, js, login]) => {
  let t;
  try {
    t = boot(html, {
      login,
      role: login.includes('@') ? (login.startsWith('oper') ? 'operator' : 'admin') : 'worker',
      page: js,
    });
  } catch (e) {
    ok(`${html} 이 뜬다`, false, e.message);
    return;
  }
  ok(`${html} 오류 0건`, t.errors.length === 0, t.errors.join(' | '));
  ok(`${html} 상단 머리띠가 채워진다`,
    (t.$('head-site') || {}).textContent !== '',
    JSON.stringify((t.$('head-site') || {}).textContent));
});

/* -------------------------------------------------------------------
   ui.js 에 더한 것이 기존 함수를 건드리지 않았는지
   ------------------------------------------------------------------- */
{
  const t = boot('worker/learn.html', { login: 'W-4821-07' });
  const UI = t.win.UI;
  const before = ['$', '$$', 'el', 'badge', 'okBadge', 'waitBadge', 'stopBadge', 'neutralBadge',
    'phraseBadge', 'chip', 'checkedValues', 'pickedValue', 'fillSelect', 'toast',
    'emptyRow', 'itemRow', 'fillAdminBar', 'fillWorkerBar', 'markCurrentTab',
    'warnIfBlocked', 'formatDate'];
  ok('원래 있던 UI 함수 21개가 그대로 있다',
    before.every((k) => typeof UI[k] === 'function'),
    JSON.stringify(before.filter((k) => typeof UI[k] !== 'function')));

  const added = ['speak', 'stopSpeak', 'audioButton', 'hasVoice', 'onVoicesReady', 'voiceNote'];
  ok('음성 함수 6개가 새로 들어왔다',
    added.every((k) => typeof UI[k] === 'function'),
    JSON.stringify(added.filter((k) => typeof UI[k] !== 'function')));

  // jsdom 에는 speechSynthesis 가 없다 — 없는 환경에서 죽지 않아야 한다
  let threw = null;
  try {
    UI.speak({ text: '시험', lang: 'km' });
    UI.stopSpeak();
    UI.hasVoice('km');
    UI.onVoicesReady(() => {});
  } catch (e) { threw = e.message; }
  ok('음성이 없는 환경에서도 예외를 던지지 않는다', threw === null, threw);
  has('음성을 못 쓰면 그 사실을 말한다', UI.voiceNote('km'), '음성 읽기를 지원하지 않습니다');
}

/* -------------------------------------------------------------------
   seed.js 데이터 계약 — 8개 키의 모양이 유지되는지
   ------------------------------------------------------------------- */
{
  const t = boot('worker/learn.html', { login: 'W-4821-07' });
  const S = t.win.Store;

  eq('accounts 4개', S.accounts.load().length, 4);
  eq('설비 3대', S.setup.load().equipments.length, 3);
  eq('안전 문구 6개', S.library.load().length, 6);
  eq('교육 2개', S.courses.load().length, 2);
  eq('수강 이력 3건', S.progress.load().length, 3);
  eq('신고 2건', S.reports.load().length, 2);
  eq('게시글 2건', S.posts.load().length, 2);

  // progress 의 기존 필드가 그대로인지 (P3·P4 가 읽는 모양)
  const rows = S.progress.load();
  ok('progress 기존 필드 유지',
    rows.every((r) => ['workerId', 'courseId', 'lang', 'learnedAt', 'quiz'].every((k) => k in r)));
  const done = rows.filter((r) => r.quiz);
  ok('quiz 기존 네 필드 유지',
    done.every((r) => ['score', 'passed', 'answers', 'at'].every((k) => k in r.quiz)));
  ok('quiz 에 attempt · firstPassed 가 더해졌다',
    done.every((r) => 'attempt' in r.quiz && 'firstPassed' in r.quiz));

  // 최초 통과율을 계산할 수 있는지 — P3 대시보드가 이 값으로 그린다
  const firstPass = done.filter((r) => r.quiz.firstPassed).length;
  eq('최초 통과 1건 / 검증 2건 → 50%', Math.round((firstPass / done.length) * 100), 50);

  // 신고는 익명이어야 한다
  const reports = S.reports.load();
  ok('★ reports 에 신고자를 식별할 값이 없다',
    reports.every((r) => !('workerId' in r) && !('author' in r) && !('userId' in r)),
    JSON.stringify(reports.map(Object.keys)));

  /* 오역 문구는 사용 중지여야 한다.
     ★ ph-3 은 인도네시아어 번역만 뜻이 뒤집혔다. 그 언어만 내려가고
       한국어·크메르어는 계속 나간다 — 문구 전체를 내리면 크메르어 노동자도
       이 안전 지시를 못 듣고, 그것은 오역보다 나은 상태가 아니다. */
  const ph3 = S.library.load().find((p) => p.id === 'ph-3');
  eq('★ 뜻이 뒤집힌 인도네시아어는 나가지 않는다', S.phraseOk(ph3, 'id'), false);
  eq('★ 크메르어는 계속 나간다', S.phraseOk(ph3, 'km'), true);
  eq('한국어 원문도 계속 나간다', S.phraseOk(ph3, 'ko'), true);
  eq('신고에 어느 언어인지 남아 있다', ph3.flags[0].lang, 'id');
}

/* -------------------------------------------------------------------
   로그인 화면 — 첫 방문에 예시 데이터를 자동으로 채우는가 (V1)

   배포 주소에 QR 로 들어온 사람은 "예시 데이터 채우기" 버튼을 누를 수 없다.
   그렇다고 쓰던 데이터를 덮어쓰면 담당자가 등록한 사업장이 날아간다.
   두 가지가 동시에 참이어야 해서 둘 다 본다.
   ------------------------------------------------------------------- */
{
  // 빈 브라우저 — 저장된 것이 하나도 없는 상태로 연다
  const t = boot('index.html', { seed: false, page: 'assets/login.js' });

  ok('index.html 오류 0건', t.errors.length === 0, t.errors.join(' | '));
  eq('★ 첫 방문이면 계정이 채워진다', t.win.Store.accounts.load().length, 4);
  eq('시연 계정 목록에 4개가 그려진다',
    t.$('demo-accounts').querySelectorAll('li.demo-account').length, 4);
  eq('★ 채웠으면 채웠다고 화면에 적는다', t.$('seed-auto').hidden, false);
  ok('아직 로그인 화면에 머문다 (자동으로 넘어가지 않는다)',
    t.nav.length === 0, t.nav.join(' | '));

  // 다른 키도 함께 채워졌는가 — 계정만 있고 사업장이 없으면 로그인 직후 빈 화면이다
  eq('사업장도 함께 채워진다', t.win.Store.setup.load().site.name, '대성정밀');
  eq('안전 문구도 함께 채워진다', t.win.Store.library.load().length, 6);
}

{
  /* 이미 쓰던 브라우저 — 담당자가 사업장 이름을 고쳐 둔 상태.
     ★ 여기서 덮어쓰면 새로고침할 때마다 담당자의 등록이 예시로 되돌아간다. */
  const t = boot('index.html', {
    page: 'assets/login.js',
    before: (win) => {
      win.Store.setup.update((s) => { s.site.name = '한빛금속'; });
    },
  });

  eq('★ 쓰던 데이터를 덮어쓰지 않는다', t.win.Store.setup.load().site.name, '한빛금속');
  eq('덮어쓰지 않았으면 채웠다고 말하지도 않는다', t.$('seed-auto').hidden, true);
  eq('계정은 그대로 4개', t.win.Store.accounts.load().length, 4);
}

/* -------------------------------------------------------------------
   외부 요청 0건 — src 전체
   ------------------------------------------------------------------- */
{
  const fs = require('fs');
  const path = require('path');
  const SRC = 'C:/Users/byeonsoyun/2026-ax-ton/2026-ax-ton/src';

  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);

  const files = walk(SRC);
  const offenders = [];

  files.filter((f) => /\.(html|js|css)$/.test(f)).forEach((f) => {
    const body = fs.readFileSync(f, 'utf8');
    const rel = path.relative(SRC, f).replace(/\\/g, '/');
    // 주석 안의 URL(문서 참조)은 요청이 아니다. 실제로 불러오는 형태만 본다.
    if (/(?:src|href)\s*=\s*["']https?:/i.test(body)) offenders.push(rel + ' — 외부 src/href');
    if (/@import\s+url\(\s*["']?https?:/i.test(body)) offenders.push(rel + ' — 외부 @import');
    if (/\b(fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/.test(body)) offenders.push(rel + ' — 네트워크 호출');
    if (/^\s*(import|export)\s/m.test(body) && f.endsWith('.js')) offenders.push(rel + ' — ES 모듈');
  });

  ok('src 전체에 외부 요청이 0건이다', offenders.length === 0, offenders.join(' | '));

  // 주석은 규칙을 적어 둔 곳이라 위반이 아니다. 코드만 남기고 본다.
  const stripComments = (src) => src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"\\])\/\/.*$/gm, '$1');

  const jsFiles = files.filter((f) => f.endsWith('.js'));
  const inner = jsFiles.filter((f) => /innerHTML/.test(stripComments(fs.readFileSync(f, 'utf8'))))
    .map((f) => path.relative(SRC, f));
  ok('innerHTML 을 쓰는 파일이 없다', inner.length === 0, inner.join(', '));

  const direct = jsFiles
    .filter((f) => !/assets[\\/]store\.js$/.test(f))
    .filter((f) => /localStorage/.test(stripComments(fs.readFileSync(f, 'utf8'))))
    .map((f) => path.relative(SRC, f));
  ok('store.js 밖에서 localStorage 를 직접 부르지 않는다', direct.length === 0, direct.join(', '));
}

/* -------------------------------------------------------------------
   ★ 음성이 조용히 실패하지 않는가

   2026-08-25 폰 확인에서 나온 것 — 카카오톡 안에서 열리는 브라우저는
   speechSynthesis 가 있다고 대답하고, 목소리 목록도 주고, speak() 도 받아 놓고
   아무 소리도 내지 않는다. 그런데 현장에서 교육 링크를 보내는 가장 흔한 방법이
   카톡이다. 조용히 실패하면 글자를 못 읽는 사람은 아무것도 못 받은 채
   이해도 검증을 통과한다.

   그래서 브라우저 이름을 넘겨짚지 않고 실제 결과를 본다. 여기서 그 세 가지
   브라우저를 흉내 내서, 각각에 대해 화면이 무엇을 말하는지 본다.
   ------------------------------------------------------------------- */

/* mode: 'dead'  아무 신호도 안 준다 (카카오톡 안 브라우저)
         'alive' 정상으로 읽는다 (삼성 인터넷·크롬)
         'error' 못 읽겠다고 대답한다 */
function fakeSpeech(mode) {
  return {
    spoken: [],
    cancel() {},
    getVoices() { return [{ lang: 'ko-KR' }, { lang: 'km-KH' }]; },
    addEventListener() {},
    removeEventListener() {},
    speak(u) {
      this.spoken.push(u);
      if (mode === 'alive') { if (u.onstart) u.onstart(); if (u.onend) u.onend(); }
      if (mode === 'error') { if (u.onerror) u.onerror({ error: 'synthesis-failed' }); }
      // 'dead' 는 아무것도 하지 않는다 — 그게 이 검사의 핵심이다
    },
  };
}

function bootWithSpeech(mode) {
  return boot('worker/home.html', {
    login: 'W-4821-07',
    page: 'worker/home.js',
    before: (win) => {
      win.speechSynthesis = fakeSpeech(mode);
      win.SpeechSynthesisUtterance = function (text) { this.text = text; };
    },
  });
}

{
  // 정상으로 읽는 브라우저에서는 아무 경고도 하지 않는다
  const t = bootWithSpeech('alive');
  t.win.UI.voiceWait(10);
  t.win.document.body.click();
  t.win.UI.speak({ text: '시험', lang: 'km' });
  eq('정상 브라우저는 문제 없음으로 본다', t.win.UI.voiceBlocked(), false);
  eq('정상 브라우저에서는 안내를 띄우지 않는다', t.win.UI.voiceNote('km'), '');
}

{
  // 못 읽겠다고 대답하는 브라우저 — 바로 알아챈다
  const t = bootWithSpeech('error');
  t.win.UI.voiceWait(10);
  t.win.document.body.click();
  t.win.UI.speak({ text: '시험', lang: 'km' });
  eq('★ 못 읽겠다고 하면 바로 알아챈다', t.win.UI.voiceBlocked(), true);
  has('무엇을 하면 되는지 알려 준다', t.win.UI.voiceNote('km'), '다른 브라우저로 열기');
}

{
  /* 저절로 읽는 것은 판정하지 않는다.
     멀쩡한 브라우저도 화면이 뜨자마자 나는 소리는 막는다.
     그것까지 "이 브라우저는 고장" 이라고 적으면 거짓말이 된다. */
  const t = bootWithSpeech('dead');
  t.win.UI.voiceWait(10);
  t.win.UI.speak({ text: '시험', lang: 'km' });   // 아무도 누르지 않았다
  eq('★ 누르지도 않았는데 고장이라고 하지 않는다', t.win.UI.voiceBlocked(), false);
}

/* 아무 신호도 안 주는 브라우저 — 기다려 봐야 알 수 있다.
   기다림이 필요해서 이 묶음의 마무리(report)를 여기 안에서 한다. */
{
  const t = bootWithSpeech('dead');
  t.win.UI.voiceWait(10);

  const before = t.win.document.querySelector('.btn-audio');
  ok('노동자 홈에 음성 버튼이 있다', !!before);
  eq('처음에는 스피커 그림이다', before ? before.textContent : '', '🔊');
  eq('누르기 전에는 고장이 아니다', t.win.UI.voiceBlocked(), false);

  if (before) before.click();          // 사람이 손으로 눌렀다

  setTimeout(() => {
    eq('★ 소리가 안 나면 알아챈다 (카카오톡 안 브라우저)', t.win.UI.voiceBlocked(), true);
    has('★ 조용히 넘어가지 않고 화면에 적는다', t.win.UI.voiceNote('km'), '소리가 나지 않습니다');
    has('★ 무엇을 하면 되는지 알려 준다', t.win.UI.voiceNote('km'), '다른 브라우저로 열기');

    /* ★ 글자를 못 읽는 사람에게 문장은 닿지 않는다. 그림이 바뀌어야 한다. */
    const after = t.win.document.querySelector('.btn-audio');
    eq('★ 버튼 그림이 음소거로 바뀐다', after ? after.textContent : '', '🔇');
    ok('색만으로 구분하지 않는다 (표시용 class 도 붙는다)',
      after ? after.classList.contains('is-mute') : false);

    // 화면의 안내 줄이 실제로 채워졌는가 — 화면 코드를 손대지 않고도 따라와야 한다
    const note = t.$('voicenote');
    ok('★ 화면 안내 줄이 저절로 채워진다', note && !note.hidden && note.textContent !== '',
      JSON.stringify(note && note.textContent));

    report('회귀 — 화면 11개 · 데이터 계약 · 코드 규칙 · 음성 실패 감지');
  }, 80);
}
