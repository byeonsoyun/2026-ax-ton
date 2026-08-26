/* 문서 검증 — "나 뭐 하면 되는지" 만 물어도 Claude Code 가 답할 수 있는가

   2026-08-21 개인 개발로 전환되면서 문서 구조가 바뀌었다.
   포지션(P2·P3·P4)별로 갈라져 있던 할 일이 A~E 하나의 우선순위 목록이 됐다.
   이 검사도 그것에 맞췄다. */
const fs = require('fs');
const path = require('path');
const { ok, eq, has, report } = require('./harness');

const ROOT = 'C:/Users/byeonsoyun/2026-ax-ton/2026-ax-ton';
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

/* =================================================================
   1. CLAUDE.md — 세션 시작 절차가 새 문서로 이어지는가
   ================================================================= */
{
  const c = read('CLAUDE.md');

  has('3단계가 07-next-tasks.md 를 가리킨다', c, 'docs/07-next-tasks.md');
  has('"나 뭐 하면 되는지" 를 직접 다룬다', c, '나 뭐 하면 되는지 알려줘');
  has('되묻지 말라고 지시한다', c, '되묻지 말고');
  // 이어서 하려면 어디를 봐야 하는지가 적혀 있어야 한다
  has('이어갈 자리를 가리킨다', c, '지난 세션이 끝난 자리');
  has('devlog 를 배경으로 쓴다', c, 'docs/devlog/byeonsoyun.md');
  has('"docs 보고 바로 진행" 도 같은 절차다', c, 'docs 보고 바로 진행해줘');
  has('회귀 검사 돌리는 법이 있다', c, 'tests/run-all.js');
  has('맨 위 하나만 제안한다', c, '맨 위 것 하나');
  has('끝나면 체크박스를 바꾼다', c, '`- [x]` 로 바꾸고');
  has('골격이 무슨 뜻인지 설명한다', c, '골격');
  has('제품 원칙 주석을 함부로 지우지 못하게 한다', c, '지워야 할 것 같으면 먼저 사용자에게');
  has('브랜치 확인 절차가 남아 있다', c, 'git branch --show-current');

  // ★ 개인 개발 전환이 반영돼 있는가 — 포지션을 되물으면 작업이 시작되지 않는다
  has('개인 개발임을 밝힌다', c, '개인 개발');
  has('포지션 확인 절차를 하지 않는다고 못 박는다', c, '포지션(P1~P4) 확인 절차를 하지 않습니다');
  has('브랜치가 하나로 정해져 있다', c, 'feature/byeonsoyun');

  // 옛 표현이 남아 있지 않은지
  ok('"껍데기인지" 라는 옛 안내가 사라졌다', !c.includes('껍데기인지 만들다 만 것인지'));
  ok('"내 포지션을 알려" 라는 옛 절차가 사라졌다', !/포지션을 확인하고 알려/.test(c));
}

/* =================================================================
   2. 07-next-tasks.md — 하나의 우선순위 목록이 실행 가능한가

   포지션이 없어졌으니 절은 "누가 하나" 가 아니라 "무엇이 먼저인가" 로 갈린다.
   A(데이터 모양) → B(값싼 것) → C(화면 완성도) → D(큰 것) → E(서버 뒤).
   ================================================================= */
{
  const t = read('docs/07-next-tasks.md');

  has('Claude Code 용 사용법이 맨 위에 있다', t, 'Claude Code 에게');
  has('포지션을 되묻지 않게 한다', t, '포지션을 묻지 마세요');
  has('하나의 목록임을 밝힌다', t, '하나의 우선순위 목록');
  has('여러 개를 동시에 벌이지 않게 한다', t, '여러 개를 동시에 벌이지 않습니다');

  // 우선순위 절이 다 있는가
  ['A. 데이터 모양을 바꾸는 것', 'B. 값싸고 바로 이어지는 것', 'C. 화면 완성도',
    'D. 큰 것', 'E. 나중에'].forEach((title) => {
    has('절이 있다 — ' + title, t, '# ' + title);
  });

  // 옛 포지션 절이 남아 있지 않은지
  ok('P2·P3·P4 절이 사라졌다', !/\n# P[234] /.test(t));

  // 할 일마다 "어디" 와 "됐는지" 가 있는가 — 없으면 실행할 수 없다
  // 남은 개수는 일을 끝낼수록 줄어드는 게 맞다. 여기서 보는 것은 개수가 아니라
  // "할 일이 실행 가능한 목록으로 있는가" 다. V1·V2 를 끝내면서 15 → 8 로 낮췄다.
  const boxes = (t.match(/- \[ \]/g) || []).length;
  ok('할 일이 체크박스로 있다 (' + boxes + '개)', boxes >= 8, String(boxes));

  const wheres = (t.match(/\*\*어디\*\*:/g) || []).length;
  const dones = (t.match(/\*\*됐는지\*\*:/g) || []).length;
  ok('할 일에 "어디" 가 적혀 있다 (' + wheres + '개)', wheres >= 12, String(wheres));
  ok('할 일에 완료 확인법이 있다 (' + dones + '개)', dones >= 12, String(dones));

  // A 가 맨 위인 이유가 적혀 있는가 — 순서를 바꾸면 같은 파일을 두 번 연다
  has('A 를 먼저 하는 이유가 적혀 있다', t, '같은 파일을 두 번 엽니다');

  has('막히면 어디를 보는지', t, '05-troubleshooting.md');
  has('다 끝나면 어디로 가는지', t, '06-feature-priority.md');
  has('절대 지우지 말 것 절이 있다', t, '# ★ 절대 지우지 말 것');

  /* ★ 다음 세션이 이 한 절만 읽고 이어갈 수 있어야 한다 */
  has('지난 세션이 끝난 자리가 있다', t, '★ 지난 세션이 끝난 자리');
  has('다음 한 걸음을 지목한다', t, '### 다음 한 걸음');
  has('브랜치를 적는다', t, 'feature/byeonsoyun');
  has('검사 돌리는 법을 적는다', t, 'tests/run-all.js');
  has('되묻지 말라고 한다', t, '되묻지 말고');
}

/* =================================================================
   3. 담당 파일이 실제로 존재하는가 — 문서가 없는 파일을 가리키면 안 된다
   ================================================================= */
{
  const t = read('docs/07-next-tasks.md');

  /* 문서는 `src/` 를 붙이기도 하고 (`src/worker/home.html`)
     생략하기도 한다 (`admin/content.js`). 둘 다 같은 파일로 본다.
     assets/review.js 처럼 아직 만들지 않은 파일을 가리키는 것은 걸러 낸다 —
     "앞으로 만들 것" 이라고 적힌 자리는 없는 파일을 가리키는 게 맞다. */
  const PLANNED = ['src/assets/review.js'];
  const files = [...new Set(
    (t.match(/(?:src\/)?(?:admin|worker|assets)\/[\w.-]+\.(?:html|js|css)/g) || [])
      .map((f) => (f.startsWith('src/') ? f : 'src/' + f))
  )].filter((f) => PLANNED.indexOf(f) === -1);

  ok('문서가 src 파일을 가리킨다 (' + files.length + '개)', files.length >= 10, String(files.length));

  const missing = files.filter((f) => !fs.existsSync(path.join(ROOT, f)));
  ok('★ 문서가 가리키는 파일이 다 있다', missing.length === 0, missing.join(', '));
}

/* =================================================================
   4. 문서가 가리키는 함수 이름이 코드에 실제로 있는가
      (없는 함수를 가리키면 팀원이 못 찾는다)
   ================================================================= */
{
  const t = read('docs/07-next-tasks.md');
  const refs = [
    ['usablePhrases', 'src/admin/content.js'],
    ['buildLangPicker', 'src/admin/content.js'],
    ['draftSteps', 'src/admin/content.js'],
    ['showLink', 'src/admin/content.js'],
    ['setReportStatus', 'src/admin/dashboard.js'],
    ['grade', 'src/admin/dashboard.js'],
    ['stuckTopics', 'src/admin/dashboard.js'],
    ['fileFlag', 'src/admin/library.js'],
    ['negationFlipped', 'src/assets/review.js'],   // 기능2 와 함께 쓰려고 빼냈다
    ['setStatus', 'src/admin/library.js'],
    ['courseBlock', 'src/admin/proof.js'],       // C1 에서 renderRows 를 덩어리 단위로 바꿨다
    ['phrasePool', 'src/worker/home.js'],        // C5 에서 pickTodayPhrase 를 쪼갠 것
  ];

  refs.forEach(([fn, file]) => {
    if (!t.includes(fn)) { ok('문서가 ' + fn + ' 을 언급한다', false, '문서에 없음'); return; }
    const code = read(file);
    ok(fn + ' 이 ' + path.basename(file) + ' 에 실제로 있다',
      new RegExp('function\\s+' + fn + '\\b').test(code), '코드에 없음');
  });
}

/* =================================================================
   5. 문서가 가리키는 CSS 클래스가 실제로 있는가
   ================================================================= */
{
  const t = read('docs/07-next-tasks.md');
  const adminCss = read('src/admin/admin.css');
  const workerCss = read('src/worker/worker.css');
  const adminHtml = read('src/admin/dashboard.html') + read('src/admin/library.html') +
    read('src/admin/proof.html');

  [['.card.feature', adminCss], ['.kpi-row.small', adminCss], ['.policy-note', adminCss]]
    .forEach(([cls, css]) => {
      ok('문서가 언급한 ' + cls + ' 가 CSS 에 있다', css.includes(cls), cls);
    });

  has('문서가 .ai-note 를 언급', t, '.ai-note');
  ok('.ai-note 가 관리자 화면에 실제로 있다', adminHtml.includes('ai-note'));
  ok('worker.css 에 [P2] 구역이 있다', workerCss.includes('[P2]'));
  ok('admin.css 에 [P3] 구역이 있다', adminCss.includes('[P3]'));
  ok('admin.css 에 [P4] 구역이 있다', adminCss.includes('[P4]'));
}

/* =================================================================
   6. 목업 파일이 실제로 있는가 — 각 포지션 1번 할 일이 이것이다
   ================================================================= */
{
  const t = read('docs/07-next-tasks.md');

  /* 문서는 첫 번째만 `docs/mockups/` 를 붙이고 나머지는 파일 이름만 적는다
     (`12-admin-dashboard.html`). 둘 다 모아 실제로 있는지 본다. */
  const mocks = [...new Set([
    ...(t.match(/docs\/mockups\/[\w.-]+/g) || []),
    ...(t.match(/\b\d\d-[\w-]+\.html\b/g) || []).map((f) => 'docs/mockups/' + f),
  ])];

  ok('목업을 가리킨다 (' + mocks.length + '개)', mocks.length >= 3, String(mocks.length));
  const missing = mocks.filter((m) => !fs.existsSync(path.join(ROOT, m)));
  ok('★ 목업 파일이 다 있다', missing.length === 0, missing.join(', '));
}

/* =================================================================
   7. 문서끼리 걸어 놓은 링크가 다 살아 있는가
   ================================================================= */
{
  const docs = fs.readdirSync(path.join(ROOT, 'docs')).filter((f) => f.endsWith('.md'));
  const broken = [];

  docs.forEach((name) => {
    const body = read('docs/' + name);
    (body.match(/\]\(([^)]+\.md)\)/g) || []).forEach((m) => {
      const rel = m.slice(2, -1);
      if (/^https?:/.test(rel)) return;
      const target = path.resolve(path.join(ROOT, 'docs'), rel);
      if (!fs.existsSync(target)) broken.push(name + ' → ' + rel);
    });
  });

  ok('★ docs 안의 문서 링크가 다 살아 있다', broken.length === 0, broken.join(' | '));
}

/* =================================================================
   8. README 와 프롬프트 문서가 새 흐름을 안내하는가
   ================================================================= */
{
  const r = read('docs/README.md');
  has('README 첫 줄이 "나 뭐 하면 되죠" 다', r, '나 뭐 하면 되죠');
  has('README 가 07 을 가리킨다', r, '07-next-tasks.md');
  has('README 가 06 을 가리킨다', r, '06-feature-priority.md');
  has('처음 순서가 두 단계로 줄었다', r, '나 뭐 하면 되는지 알려줘');

  has('README 가 개인 개발 전환을 알린다', r, '개인 개발로 전환됐습니다');

  const p = read('docs/03-prompts.md');
  has('프롬프트 문서도 단축 안내를 준다', p, '사실 이것도 안 해도 됩니다');
  has('프롬프트 문서가 팀 시절 기록임을 밝힌다', p, '진행하던 때의 기록');
  ok('블록들이 07 을 가리킨다',
    (p.match(/07-next-tasks\.md/g) || []).length >= 4);
  has('골격이라고 알려 준다', p, '골격이 들어가 있어서 동작해');
  ok('옛 꼬리 문구가 사라졌다', !p.includes('오늘 무엇부터 만들면 좋을지 3단계로'));
}

/* =================================================================
   9. 상태 표기가 문서끼리 어긋나지 않는가
   ================================================================= */
{
  const pos = read('docs/02-positions.md');
  const pri = read('docs/06-feature-priority.md');
  const next = read('docs/07-next-tasks.md');

  has('02 가 골격 있음을 표시', pos, '골격 있음');
  has('06 이 1층 전부 동작한다고 말한다', pri, '1층 기능 8개가 전부 동작합니다');
  has('07 이 화면 11개가 동작한다고 말한다', next, '화면 11개는 전부 동작합니다');

  // 껍데기라는 옛 상태 표기가 남아 있지 않은지
  ok('02 에 "껍데기" 상태 표기가 없다', !/\|\s*껍데기\s*\|/.test(pos));
  ok('06 에 "껍데기" 상태 표기가 없다', !/\|\s*껍데기\s*\|/.test(pri));

  // 실제 코드도 껍데기가 아닌지 (크기로 확인)
  const shells = ['worker/home', 'worker/report', 'worker/talk', 'worker/my',
    'admin/dashboard', 'admin/content', 'admin/proof', 'admin/library']
    .filter((f) => fs.statSync(path.join(ROOT, 'src', f + '.js')).size < 5000);
  ok('★ 껍데기로 남은 화면이 없다', shells.length === 0, shells.join(', '));

  const todos = ['worker/home', 'worker/report', 'worker/talk', 'worker/my',
    'admin/dashboard', 'admin/content', 'admin/proof', 'admin/library']
    .filter((f) => !read('src/' + f + '.html').includes('여기부터 채우시면 됩니다'));
  ok('★ 여덟 화면에 "여기부터" 칸이 다 있다', todos.length === 0, todos.join(', '));

  /* ★ 칸이 있는지만 보면 B5 가 고친 어긋남을 다시 놓친다.
       칸 안에 "이미 끝난 것" 이 적혀 있어도 위 검사는 통과한다.
       처음 보는 사람은 문서보다 화면을 믿어서 이미 있는 기능을 또 만든다. */
  const SCREENS = ['worker/home', 'worker/report', 'worker/talk', 'worker/my',
    'admin/dashboard', 'admin/content', 'admin/proof', 'admin/library'];

  /* 그 화면의 "여기부터 채우시면 됩니다" 칸만 잘라 낸다 */
  const todoBox = (f) => {
    const html = read('src/' + f + '.html');
    const from = html.indexOf('여기부터 채우시면 됩니다');
    if (from === -1) return '';
    const to = html.indexOf('</section>', from);
    return html.slice(from, to === -1 ? html.length : to);
  };

  /* 끝낸 기능이 아직 할 일로 적혀 있으면 안 된다.
     ★ 새 항목을 끝낼 때마다 여기에 한 줄 더하세요 — 그것이 화면도 함께
       정리하라는 신호가 됩니다 (07-next-tasks.md 의 - [x] 와 짝입니다). */
  const DONE = [
    { label: '문항 다국어', why: 'A1 에서 끝남 — Store.qtext' },
    { label: '언어별 판정', why: 'A2 에서 끝남 — Store.phraseStatus' },
    { label: '교육 기한', why: 'B1 에서 끝남 — UI.dueBadge' },
    { label: '문구 추가', why: 'B2 에서 끝남 — admin/library 의 #form-add' },
  ];

  DONE.forEach((d) => {
    const stale = SCREENS.filter((f) => todoBox(f).includes('<dt>' + d.label));
    ok('★ 끝난 "' + d.label + '" 이 할 일 칸에 없다 (' + d.why + ')',
      stale.length === 0, stale.join(', '));
  });

  /* 팀 시절 표기. 지금은 혼자라 P1~P4 가 가리키는 사람이 없다. */
  const withP = SCREENS.filter((f) => /—\s*P[1-4]\b|P[1-4]\s*가 채우/.test(read('src/' + f + '.html')));
  ok('★ 화면에 P1~P4 표기가 남아 있지 않다', withP.length === 0, withP.join(', '));
}

report('문서 — 물어보기만 해도 다음 할 일을 찾을 수 있는가');
