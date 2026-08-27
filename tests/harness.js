/* 브라우저 없이 실제 DOM 에서 화면 스크립트를 돌리는 공용 하네스.
   프로젝트에는 의존성을 넣지 않는다 — jsdom 은 이 스크래치패드에만 있다. */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const SRC = 'C:/Users/byeonsoyun/2026-ax-ton/2026-ax-ton/src';

function boot(pageRelPath, opts = {}) {
  // ?course=... 같은 쿼리는 URL 에만 붙이고 파일 경로에서는 뗀다
  const [filePart, queryPart] = pageRelPath.split('?');
  const html = fs.readFileSync(path.join(SRC, filePart), 'utf8');
  const errors = [];

  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => errors.push(e.message));
  vc.on('error', (m) => errors.push(String(m)));

  const dom = new JSDOM(html, {
    url: 'https://test.local/' + filePart + (queryPart ? '?' + queryPart : ''),
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    virtualConsole: vc,
  });

  const win = dom.window;
  win.scrollTo = () => {};

  /* location.href 대입은 jsdom 이 구현하지 않고 window.location 은 재정의도 막혀 있다.
     그래서 화면 스크립트를 함수로 감싸 인자 이름 location 으로 가린다.
     화면 코드는 이미 IIFE 라서 감싸도 동작이 같다. */
  const nav = [];
  const locShim = {
    protocol: 'https:',
    // QR 은 절대 주소를 만들어야 해서 origin·host 도 필요하다 (D1)
    origin: win.location.origin,
    host: win.location.host,
    hostname: win.location.hostname,
    pathname: win.location.pathname,
    search: win.location.search,
    get href() { return win.location.href; },
    set href(v) { nav.push(v); },
    replace: (v) => nav.push(v),
    assign: (v) => nav.push(v),
  };

  const run = (rel, { shimLocation = false } = {}) => {
    const code = fs.readFileSync(path.join(SRC, rel), 'utf8');
    if (!shimLocation) { win.eval(code); return; }
    win.__locShim = locShim;
    win.eval('(function (location) {\n' + code + '\n}).call(this, window.__locShim);');
  };

  // <head> 의 고정 3줄 순서를 그대로 재현한다
  run('assets/store.js');
  run('assets/auth.js');
  run('assets/seed.js');

  if (opts.seed !== false) win.Seed.fill();
  if (opts.login) {
    win.Store.session.save({ userId: opts.login, role: opts.role || 'worker', at: new Date().toISOString() });
  }
  if (opts.before) opts.before(win);

  run('assets/ui.js');
  run('assets/review.js');
  run('assets/diagrams.js');
  run('assets/qr.js');
  if (opts.page) run(opts.page, { shimLocation: true });

  return { dom, win, errors, nav, run, $: (id) => win.document.getElementById(id) };
}

// --- 아주 작은 단정 도구 ---
let pass = 0;
const fails = [];

function ok(label, cond, extra) {
  if (cond) { pass++; return true; }
  fails.push(label + (extra ? '  →  ' + extra : ''));
  return false;
}

function eq(label, actual, expected) {
  return ok(label, actual === expected, `기대 ${JSON.stringify(expected)} / 실제 ${JSON.stringify(actual)}`);
}

function has(label, haystack, needle) {
  return ok(label, String(haystack).indexOf(needle) !== -1,
    `"${needle}" 가 없음. 실제: ${JSON.stringify(String(haystack).slice(0, 160))}`);
}

function report(title) {
  console.log(`\n===== ${title} =====`);
  console.log(`통과 ${pass}건, 실패 ${fails.length}건`);
  if (fails.length) {
    fails.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
    process.exitCode = 1;
  }
  return fails.length === 0;
}

module.exports = { boot, ok, eq, has, report, SRC };
