/* 기능6 담당자 대시보드 — 실제 DOM 검증 */
const { boot, ok, eq, has, report } = require('./harness');

const text = (n) => (n ? n.textContent.trim().replace(/\s+/g, ' ') : '');
const click = (win, node) => node.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));

function open(opts = {}) {
  return boot('admin/dashboard.html',
    Object.assign({ login: 'kim@daesung.co.kr', role: 'admin', page: 'admin/dashboard.js' }, opts));
}

/* =================================================================
   1. 화면에 반드시 있어야 하는 문장 세 개 (SCREEN 기능6)
   ================================================================= */
{
  const t = open();
  const doc = t.win.document;
  ok('오류 없이 뜬다', t.errors.length === 0, t.errors.join(' | '));

  const all = text(doc.querySelector('main'));
  has('① 노동자 평가가 아니라 콘텐츠 개선 신호', all, '노동자 평가가 아니라');
  has('①-2', all, '콘텐츠 개선 신호');
  has('② 미통과는 교육의 실패', all, '미통과는 노동자의 실패가 아니라 교육의 실패로 기록됩니다');
  has('③ 인사·평가 목적 내보내기 없음', all, '개인별 점수의 인사·평가 목적 내보내기는 제공하지 않습니다');
  has('AI 개입 없음 고지', text(doc.querySelector('.ai-note')), 'AI 개입 없음');
  has('추정하거나 보정하지 않는다', text(doc.querySelector('.ai-note')), '추정하거나 보정하지 않습니다');
}

/* =================================================================
   2. ★ 정보 위계 — 취약 항목이 이수율보다 크다
   ================================================================= */
{
  const t = open();
  const doc = t.win.document;

  const statusCard = t.$('status-tiles').closest('.card');
  const weakCard = t.$('weak-bars').closest('.card');

  ok('이수 현황 타일은 작은 모양', t.$('status-tiles').className.includes('small'));
  ok('★ 취약 항목이 강조 블록', weakCard.className.includes('feature'));
  ok('이수 현황은 강조 블록이 아니다', !statusCard.className.includes('feature'));

  // 문서상 순서: 0 고지 → 1 이수 현황 → 2 취약 항목
  const cards = [...doc.querySelectorAll('main .card')];
  ok('이수 현황이 취약 항목보다 위에 있다',
    cards.indexOf(statusCard) < cards.indexOf(weakCard));
}

/* =================================================================
   3. ★ 언어 × 위험유형 정답률 — 이 화면의 핵심
      예시 데이터:
        W-4821-07 km c-press [1,1,1]  → q1 pinch, q2 pinch, q3 shock
        W-4821-11 id c-paint [0,1]    → q1 fire(오답), q2 chemical(정답)
   ================================================================= */
{
  const t = open();
  const bars = [...t.$('weak-bars').querySelectorAll('.bar-item')];
  eq('막대 4줄 (km-끼임, km-감전, id-화재, id-화학물질)', bars.length, 4);

  const byLabel = {};
  bars.forEach((b) => { byLabel[text(b.querySelector('.what'))] = b; });
  const labels = Object.keys(byLabel);

  ok('인도네시아어 화재가 있다', labels.some((l) => l.includes('인도네시아어 · 화재')),
    JSON.stringify(labels));
  ok('크메르어 끼임이 있다', labels.some((l) => l.includes('크메르어 · 끼임')),
    JSON.stringify(labels));

  // ★ 낮은 것이 맨 위
  const first = bars[0];
  has('가장 낮은 항목이 맨 위 — 인도네시아어 화재', text(first.querySelector('.what')), '화재');
  has('0%', text(first.querySelector('.num')), '0%');
  eq('낮음 등급', first.getAttribute('data-level'), 'low');
  has('★ 색만이 아니라 등급 글자도 준다', text(first.querySelector('.num')), '낮음');
  eq('막대 길이가 0%', first.querySelector('.bar-fill').style.width, '0%');
  has('몇 문항 중 몇 개인지', text(first.querySelector('.what')), '0/1문항');

  // 100% 항목
  const good = bars[bars.length - 1];
  eq('양호 등급', good.getAttribute('data-level'), 'ok');
  has('양호 글자', text(good.querySelector('.num')), '양호');

  // 무엇부터 하면 되는지 말해 준다
  has('가장 낮은 항목을 지목한다', text(t.$('weak-hint')), '인도네시아어');
  has('무엇을 하라고 말한다', text(t.$('weak-hint')), '설명을 다시 만드는 것부터');
}

/* =================================================================
   4. 이수 현황 숫자와 최초 통과율
      대상: c-press → 프레스 공정 1명 / c-paint → 도장 공정 1명
   ================================================================= */
{
  const t = open();
  const tiles = {};
  [...t.$('status-tiles').querySelectorAll('.kpi')].forEach((k) => {
    tiles[text(k.querySelector('dt'))] = text(k);
  });

  has('이수 1건', tiles['이수'], '1건');
  has('미통과 1건', tiles['미통과'], '1건');
  has('최초 통과율 50%', tiles['최초 통과율'], '50%');
  has('목표 범위를 적는다', tiles['최초 통과율'], '70~85%');
}

/* =================================================================
   5. 최초 통과율이 100% 면 지표 실패로 표시
   ================================================================= */
{
  const t = open({
    before(win) {
      win.Store.progress.update((list) => {
        const r = list.find((x) => x.workerId === 'W-4821-11');
        r.quiz = { score: 100, passed: true, answers: [1, 1], at: '2026-08-20T00:00:00.000Z',
          attempt: 1, firstPassed: true };
      });
    },
  });
  const rate = [...t.$('status-tiles').querySelectorAll('.kpi')]
    .find((k) => text(k.querySelector('dt')) === '최초 통과율');
  has('100%', text(rate.querySelector('dd')), '100%');
  has('★ 문항이 쉬운 것이라고 말한다', text(rate), '100% 는 문항이 쉬운 것입니다');
  ok('경고 모양', rate.className.includes('alert'));
}

/* =================================================================
   6. 조치가 필요한 사람 — 막힌 항목까지 이름을 댄다
   ================================================================= */
{
  const t = open();
  const rows = [...t.$('action-rows').querySelectorAll('tr')];
  eq('조치 대상 1명 (미통과)', rows.length, 1);
  has('식별번호', text(rows[0]), 'W-4821-11');
  has('언어', text(rows[0]), '인도네시아어');
  has('교육', text(rows[0]), '도장 부스 1 안전교육');
  has('미통과 상태', text(rows[0]), '미통과');
  has('★ 어느 항목에서 막혔는지', text(rows[0]), '화재');
}

/* =================================================================
   7. ★ 위험요소 신고 — 익명이 지켜지는지
   ================================================================= */
{
  const t = open();
  const items = [...t.$('report-queue').querySelectorAll('.queue-item')];
  eq('신고 2건', items.length, 2);

  // 긴급이 위로
  eq('긴급 건이 맨 위', items[0].getAttribute('data-urgent'), 'yes');
  has('위험유형과 설비', text(items[0]), '끼임 — 프레스 3호기');
  has('신고 내용', text(items[0]), '덮개가 흔들려서');
  has('★ 익명이라고 적는다', text(items[0]), '익명 신고');

  // ★ 신고자를 식별할 값이 화면에 없어야 한다
  const queueText = text(t.$('report-queue'));
  ok('★ 노동자 식별번호가 신고 큐에 나오지 않는다',
    !/W-\d{4}-\d{2}/.test(queueText), queueText.slice(0, 200));
  has('익명성이 깨지면 어떻게 되는지 적는다',
    text(t.$('report-queue').closest('.card')), '익명성이 깨지면 신고가 멈추고');

  /* --- 조치 상태 바꾸기 --- */
  const resolveBtn = [...items[0].querySelectorAll('.btn-sm')]
    .find((b) => text(b) === '조치 완료');
  click(t.win, resolveBtn);

  const r1 = t.win.Store.reports.load().find((r) => r.id === 'r-1');
  eq('상태가 바뀐다', r1.status, 'resolved');
  ok('★ 신고자를 식별할 값이 새로 들어가지 않는다',
    !('workerId' in r1) && !('author' in r1) && !('userId' in r1) && !('by' in r1),
    JSON.stringify(Object.keys(r1)));

  has('화면에도 조치 완료로 보인다', text(t.$('report-queue')), '조치 완료');
}

/* =================================================================
   8. 교육별 실시 상황 · 기한
   ================================================================= */
{
  const t = open();
  const items = [...t.$('due-list').querySelectorAll('.item')];
  eq('교육 2개', items.length, 2);
  has('이수 현황', text(items[0]), '이수 1 / 1명');
  has('마지막 실시일', text(items[0]), '마지막 실시');
  /* 예시 데이터에서 기한을 가진 것은 c-press 하나뿐이다 —
     기한이 선택이라는 것이 대시보드 한 화면에서 보여야 한다.
     "D-" 를 기대하지 않는다: 예시 날짜가 지나면 "지남" 이 되고 그것도 맞는 표시다. */
  ok('기한이 있으면 미정이 아니다',
    text(items[0]).indexOf('기한 미정') === -1, text(items[0]));
  has('기한이 없으면 미정', text(items[1]), '기한 미정');

  // courses 에 dueAt 이 들어오면 D-day 를 쓴다
  const t2 = open({
    before(win) {
      const soon = new Date(Date.now() + 5 * 86400000).toISOString();
      const past = new Date(Date.now() - 3 * 86400000).toISOString();
      win.Store.courses.update((list) => { list[0].dueAt = soon; list[1].dueAt = past; });
    },
  });
  const items2 = [...t2.$('due-list').querySelectorAll('.item')];
  has('임박한 기한은 D-day', text(items2[0]), 'D-5');
  has('지난 기한은 그렇게 표시', text(items2[1]), '지남');
}

/* =================================================================
   9. 기록이 없을 때 무엇을 하면 되는지 말한다
   ================================================================= */
{
  const t = open({ before(win) { win.Store.progress.save([]); } });
  has('검증 기록이 없다고 말한다', text(t.$('weak-bars')), '아직 이해도 검증 기록이 없습니다');
  has('언제 나오는지 알려 준다', text(t.$('weak-bars')), '검증을 마치면');

  const t2 = open({ before(win) { win.Store.reports.save([]); } });
  has('신고가 없으면', text(t2.$('report-queue')), '접수된 위험요소 신고가 없습니다');

  const t3 = open({ before(win) { win.Store.courses.save([]); } });
  has('교육이 없으면 어디로 가는지', text(t3.$('due-list')), '교육 콘텐츠 생성에서 먼저 만들어');
}

/* =================================================================
   10. 규칙 검사
   ================================================================= */
{
  const fs = require('fs');
  const base = 'C:/Users/byeonsoyun/2026-ax-ton/2026-ax-ton/src/admin/';
  const html = fs.readFileSync(base + 'dashboard.html', 'utf8');
  const js = fs.readFileSync(base + 'dashboard.js', 'utf8');
  const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
  const visible = html.replace(/<!--[\s\S]*?-->/g, '');

  ok('외부 주소 없음', !/(src|href)\s*=\s*["']https?:/i.test(html));
  ok('절대경로 없음', !/(src|href)\s*=\s*["']\//.test(html));
  ok('innerHTML 안 씀', !/innerHTML/.test(strip(js)));
  ok('localStorage 직접 호출 안 함', !/localStorage/.test(strip(js)));
  ok('"면책" 표현 없음', !/면책/.test(visible + strip(js)));
  ok('껍데기 안내 없음', !/아직 만들지 않은 화면/.test(html));

  // ★ reports 에 쓸 때 status 외의 것을 넣지 않는지
  ok('★ 신고에 조치 상태만 쓴다',
    /if \(r\) r\.status = status;/.test(js), '신고 쓰기가 status 외의 것을 건드립니다');
}

report('기능6 담당자 대시보드');
