/* 기능9 안전 문구 라이브러리 — 실제 DOM 검증 */
const { boot, ok, eq, has, report } = require('./harness');

const text = (n) => (n ? n.textContent.trim().replace(/\s+/g, ' ') : '');
const click = (win, node) => node.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));

function open(opts = {}) {
  return boot('admin/library.html',
    Object.assign({ login: 'oper@safety.kr', role: 'operator', page: 'admin/library.js' }, opts));
}

/* =================================================================
   1. 첫 화면 — AI 경계 · 상태 타일 · 판정 큐
   ================================================================= */
{
  const t = open();
  const doc = t.win.document;
  ok('오류 없이 뜬다', t.errors.length === 0, t.errors.join(' | '));

  has('AI 경계를 화면에 적는다', text(doc.querySelector('.ai-note')), 'AI 여기까지');
  has('승인은 사람이 한다고 적는다', text(doc.querySelector('.ai-note')), '승인은 사람이 합니다');

  // 예시 데이터: reviewed 4 (ph-1,2,4,6) · waiting 1 (ph-5) · stopped 1 (ph-3)
  const tiles = [...t.$('stats').querySelectorAll('.kpi')].map(
    (k) => text(k.querySelector('dt')) + '=' + text(k.querySelector('dd')));
  has('검수 완료 4개', tiles.join(' '), '검수 완료=4개');
  has('검수 대기 1개', tiles.join(' '), '검수 대기=1개');
  has('사용 중지 1개', tiles.join(' '), '사용 중지=1개');
  has('전체 6개', tiles.join(' '), '전체=6개');

  eq('처리할 신고가 아직 없다', text(t.$('flag-queue')).includes('처리할 오역 신고가 없습니다'), true);

  /* --- 판정이 필요한 문구 = reviewed 가 아닌 것 (ph-3, ph-5) --- */
  const blocks = t.$('review-list').querySelectorAll('.review-block');
  eq('판정 대상 2건', blocks.length, 2);

  /* --- ★ ph-3 의 역번역 대조 — 부정이 뒤집힌 장면 --- */
  const ph3 = [...blocks].find((b) => text(b).includes('프레스가 멈춰도'));
  ok('ph-3 이 판정 대상에 있다', !!ph3);
  has('원문을 보여 준다', text(ph3), '프레스가 멈춰도 손을 넣지 마십시오');
  has('역번역을 보여 준다', text(ph3), '손을 넣어도 됩니다');
  has('★ 부정이 뒤집혔다고 크게 경고한다', text(ph3), '부정이 뒤집혔을 수 있습니다');
  has('그대로 나가면 어떻게 되는지 말한다', text(ph3), '정반대 지시가 됩니다');
  ok('뒤집힌 경우는 대조 칸도 위험 표시', !!ph3.querySelector('.diff.danger'));

  const flagged = ph3.querySelector('.diff-cell.flag');
  ok('차이가 있는 칸에 표시가 붙는다', !!flagged);
  const marks = [...ph3.querySelectorAll('mark')].map((m) => m.textContent);
  ok('뒤집힌 낱말이 표시된다', marks.some((m) => m.includes('넣어도')) && marks.some((m) => m.includes('됩니다')),
    JSON.stringify(marks));
  ok('원문에 있는 낱말은 표시하지 않는다', !marks.some((m) => m.includes('프레스')), JSON.stringify(marks));

  /* --- 역번역이 맞는 문구는 표시가 없다 (ph-5) --- */
  const ph5 = [...blocks].find((b) => text(b).includes('환기팬이'));
  ok('ph-5 도 판정 대상', !!ph5);
  // ph-5 는 "환기팬이 돌지 않으면" → "팬이 꺼져 있으면" — 말만 바꿔 쓴 것이고 뜻은 같다.
  // 낱말은 다르지만 부정은 양쪽 다 있으므로 크게 경고하지 않아야 한다.
  ok('★ 말만 바꿔 쓴 것은 크게 경고하지 않는다', !text(ph5).includes('부정이 뒤집혔'), text(ph5).slice(0, 120));
  ok('대조 칸도 위험 표시가 아니다', !ph5.querySelector('.diff.danger'));
  has('낱말이 다른 것은 개수만 알린다', text(ph5), '원문에 없는 낱말');
  has('판정은 사람이 한다고 말한다', text(ph5), '사람이 봅니다');
}

/* =================================================================
   2. ★ 오역 신고를 접수하면 그 순간 사용 중지가 된다
      (완료 기준: 접수 → 즉시 stopped → 기능2 선택지에서 사라진다)
   ================================================================= */
{
  const t = open();

  const before = t.win.Store.library.load().find((p) => p.id === 'ph-1');
  eq('접수 전에는 검수 완료', before.status, 'reviewed');

  // ph-1 을 골라 신고 접수
  t.$('flag-phrase').value = 'ph-1';
  t.$('flag-note').value = '크메르어에서 "프레스가 멈춰도" 가 빠졌습니다';
  t.$('form-flag').dispatchEvent(new t.win.Event('submit', { bubbles: true, cancelable: true }));

  const after = t.win.Store.library.load().find((p) => p.id === 'ph-1');
  eq('★ 접수하는 순간 사용 중지', after.status, 'stopped');
  eq('신고 내용이 남는다', after.flags.length, 1);
  has('무엇이 잘못됐는지', after.flags[0].note, '빠졌습니다');
  eq('아직 처리되지 않은 상태', after.flags[0].resolvedAt, null);

  // 큐에 뜨는지
  const items = t.$('flag-queue').querySelectorAll('.queue-item');
  eq('신고 큐에 1건', items.length, 1);
  eq('오역 신고는 긴급으로 표시', items[0].getAttribute('data-urgent'), 'yes');
  has('신고 내용을 보여 준다', text(items[0]), '빠졌습니다');

  // 상태 타일도 따라간다
  const tiles = [...t.$('stats').querySelectorAll('.kpi')].map(
    (k) => text(k.querySelector('dt')) + '=' + text(k.querySelector('dd')));
  has('검수 완료가 3개로 줄었다', tiles.join(' '), '검수 완료=3개');
  has('오역 신고 1건', tiles.join(' '), '오역 신고=1건');
  has('사용 중지가 2개로 늘었다', tiles.join(' '), '사용 중지=2개');

  const alertTile = [...t.$('stats').querySelectorAll('.kpi')]
    .find((k) => text(k.querySelector('dt')) === '오역 신고');
  ok('신고가 있으면 타일이 경고 모양이 된다', alertTile.className.includes('alert'));

  /* --- 신고만 닫으면 중지가 유지된다 --- */
  const keepBtn = [...items[0].querySelectorAll('.btn-sm')]
    .find((b) => text(b).includes('신고만 닫기'));
  click(t.win, keepBtn);

  const kept = t.win.Store.library.load().find((p) => p.id === 'ph-1');
  eq('신고는 닫혔다', kept.flags[0].resolvedAt !== null, true);
  eq('문구는 계속 중지', kept.status, 'stopped');
  has('큐가 비었다', text(t.$('flag-queue')), '처리할 오역 신고가 없습니다');
}

/* =================================================================
   3. 신고를 "고쳐졌습니다" 로 닫으면 다시 쓸 수 있다
   ================================================================= */
{
  const t = open();
  t.$('flag-phrase').value = 'ph-2';
  t.$('flag-note').value = '오타';
  t.$('form-flag').dispatchEvent(new t.win.Event('submit', { bubbles: true, cancelable: true }));

  t.win.confirm = () => true;   // 신고가 열린 채 되살릴지 묻는 확인창
  const fixBtn = [...t.$('flag-queue').querySelectorAll('.btn-sm')]
    .find((b) => text(b).includes('고쳐졌습니다'));
  click(t.win, fixBtn);

  const p = t.win.Store.library.load().find((x) => x.id === 'ph-2');
  eq('다시 검수 완료', p.status, 'reviewed');
  eq('신고도 함께 닫힌다', p.flags.every((f) => f.resolvedAt !== null), true);
}

/* =================================================================
   4. 번역이 없는 문구는 검수 완료로 올릴 수 없다
      (올리면 기능2 선택지에 빈 문구가 올라간다)
   ================================================================= */
{
  const t = open({
    before(win) {
      win.Store.library.update((list) => {
        list.push({ id: 'ph-x', category: '공통', status: 'waiting',
          ko: '번역이 아직 없는 문구', translations: {} });
      });
    },
  });

  const block = [...t.$('review-list').querySelectorAll('.review-block')]
    .find((b) => text(b).includes('번역이 아직 없는 문구'));
  ok('판정 대상에 뜬다', !!block);
  has('번역이 없다고 말한다', text(block), '아직 번역이 없습니다');

  click(t.win, [...block.querySelectorAll('.btn-sm')].find((b) => text(b).includes('검수 완료')));
  const p = t.win.Store.library.load().find((x) => x.id === 'ph-x');
  eq('★ 검수 완료로 올라가지 않는다', p.status, 'waiting');
}

/* =================================================================
   5. 문구 목록과 걸러 보기
   ================================================================= */
{
  const t = open();
  eq('전체 6줄', t.$('phrase-rows').querySelectorAll('tr').length, 6);

  click(t.win, t.$('filter-stopped'));
  eq('사용 중지만 1줄', t.$('phrase-rows').querySelectorAll('tr').length, 1);
  has('ph-3 이다', text(t.$('phrase-rows')), '프레스가 멈춰도');
  eq('지금 보고 있는 것을 표시', t.$('filter-stopped').getAttribute('aria-pressed'), 'true');

  click(t.win, t.$('filter-reviewed'));
  eq('검수 완료 4줄', t.$('phrase-rows').querySelectorAll('tr').length, 4);

  click(t.win, t.$('filter-all'));
  eq('다시 6줄', t.$('phrase-rows').querySelectorAll('tr').length, 6);

  // 목록에서 바로 중지
  const row = [...t.$('phrase-rows').querySelectorAll('tr')]
    .find((r) => text(r).includes('작업 전 전원을 차단'));
  click(t.win, [...row.querySelectorAll('.btn-sm')].find((b) => text(b) === '사용 중지'));
  eq('중지됐다', t.win.Store.library.load().find((p) => p.id === 'ph-2').status, 'stopped');
}

/* =================================================================
   6. ★ 기능9 → 기능3 연결: 중지된 문구는 노동자 수강 화면에서 사라진다
   ================================================================= */
{
  // 먼저 라이브러리에서 ph-1 을 중지시킨다
  const lib = open();
  lib.$('flag-phrase').value = 'ph-1';
  lib.$('flag-note').value = '뜻이 반대입니다';
  lib.$('form-flag').dispatchEvent(new lib.win.Event('submit', { bubbles: true, cancelable: true }));
  const saved = lib.win.Store.library.load();
  eq('ph-1 중지 확인', saved.find((p) => p.id === 'ph-1').status, 'stopped');

  // 같은 데이터로 노동자 수강 화면을 연다
  const learn = boot('worker/learn.html', {
    login: 'W-4821-07',
    page: 'worker/learn.js',
    before(win) { win.Store.library.save(saved); },
  });

  const card = learn.win.document.querySelector('#course-list .course-card');
  has('쓸 수 있는 문구가 3개에서 2개로 줄었다', text(card.querySelector('.meta')), '안전 문구 2개');
  has('몇 개가 빠졌는지 밝힌다', text(card.querySelector('.tags')), '검수 대기 1개 제외');

  card.querySelector('.course-open').dispatchEvent(new learn.win.MouseEvent('click', { bubbles: true }));
  has('수강 화면도 2장으로 줄었다', text(learn.$('step-count')), '1 / 2');
  ok('중지된 문구는 나오지 않는다',
    !text(learn.$('phrase-card')).includes('កុំដាក់ដៃចូល'),
    text(learn.$('phrase-card')));
}

/* =================================================================
   7. 규칙 검사
   ================================================================= */
{
  const fs = require('fs');
  const base = 'C:/Users/byeonsoyun/2026-ax-ton/2026-ax-ton/src/admin/';
  const html = fs.readFileSync(base + 'library.html', 'utf8');
  const js = fs.readFileSync(base + 'library.js', 'utf8');

  ok('외부 주소 없음', !/(src|href)\s*=\s*["']https?:/i.test(html));
  ok('절대경로 없음', !/(src|href)\s*=\s*["']\//.test(html));
  ok('innerHTML 안 씀', !/innerHTML/.test(js.replace(/\/\*[\s\S]*?\*\//g, '')));
  ok('localStorage 직접 호출 안 함', !/localStorage/.test(js.replace(/\/\*[\s\S]*?\*\//g, '')));
  ok('"면책" 표현 없음', !/면책/.test(html + js));
  ok('껍데기 안내가 남아 있지 않다', !/아직 만들지 않은 화면/.test(html));
}

report('기능9 안전 문구 라이브러리');
