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

report('회귀 — 화면 11개 · 데이터 계약 · 코드 규칙');
