/* 기능3 안전교육 수강 — 실제 DOM 검증 */
const { boot, ok, eq, has, report } = require('./harness');

const text = (n) => (n ? n.textContent.trim().replace(/\s+/g, ' ') : '');

/* =================================================================
   1. 크메르어 · 프레스 공정 노동자 (W-4821-07)
   ================================================================= */
{
  const t = boot('worker/learn.html', { login: 'W-4821-07', page: 'worker/learn.js' });
  const doc = t.win.document;

  ok('오류 없이 뜬다', t.errors.length === 0, t.errors.join(' | '));

  const cards = doc.querySelectorAll('#course-list .course-card');
  eq('내 공정 교육만 1개 보인다 (도장 부스는 제외)', cards.length, 1);
  has('제목', text(cards[0].querySelector('strong')), '프레스 3호기 안전교육');
  has('설비 이름', text(cards[0].querySelector('.meta')), '프레스 3호기');
  has('검수 통과 문구 3개', text(cards[0].querySelector('.meta')), '안전 문구 3개');
  // 예시 데이터에서 이 노동자는 c-press 를 이미 통과했다 → 완료로 보이는 것이 정상
  has('이미 통과한 교육은 완료 배지', text(cards[0].querySelector('.tags')), '완료');

  // 음성 버튼이 카드마다 있다 (60px 원형)
  eq('카드에 음성 버튼', cards[0].querySelectorAll('.btn-audio').length, 1);

  /* --- 카드를 눌러 수강 진행으로 --- */
  cards[0].querySelector('.course-open').dispatchEvent(new t.win.MouseEvent('click', { bubbles: true }));

  eq('목록이 숨는다', t.$('view-list').hidden, true);
  eq('수강 화면이 뜬다', t.$('view-step').hidden, false);
  has('진행 표시', text(t.$('step-count')), '1 / 3');
  eq('진행 점 3개', t.$('step-dots').children.length, 3);
  eq('첫 장에서 이전 버튼은 잠김', t.$('btn-prev').disabled, true);

  // ph-1 의 크메르어 번역이 크게, 한국어 원문이 작게
  eq('크메르어 번역이 본문', text(t.$('phrase-card').querySelector('.translated')), 'កុំដាក់ដៃចូល');
  has('한국어 원문도 함께', text(t.$('phrase-card').querySelector('.original')), '손을 넣지 마십시오');
  eq('큰 픽토그램', text(t.$('phrase-card').querySelector('.pict')), '⚙');

  /* --- 끝까지 듣기 --- */
  const next = () => t.$('btn-next').dispatchEvent(new t.win.MouseEvent('click', { bubbles: true }));

  next();
  has('두 번째 장', text(t.$('step-count')), '2 / 3');
  eq('이제 이전 버튼이 열린다', t.$('btn-prev').disabled, false);

  next();
  has('세 번째 장', text(t.$('step-count')), '3 / 3');
  has('마지막 장은 버튼 글자가 바뀐다', text(t.$('btn-next')), '다 들었습니다');

  const beforeRow = t.win.Store.progress.load().find(
    (r) => r.workerId === 'W-4821-07' && r.courseId === 'c-press');
  eq('듣기 전에는 learnedAt 이 예시값', typeof beforeRow.learnedAt, 'string');

  next();   // 다 들었습니다

  const row = t.win.Store.progress.load().find(
    (r) => r.workerId === 'W-4821-07' && r.courseId === 'c-press');
  ok('learnedAt 이 갱신됐다', row.learnedAt !== beforeRow.learnedAt,
    `이전 ${beforeRow.learnedAt} / 이후 ${row.learnedAt}`);
  eq('언어가 남는다', row.lang, 'km');
  ok('progress 필드 모양이 유지된다',
    ['workerId', 'courseId', 'lang', 'learnedAt', 'quiz'].every((k) => k in row),
    JSON.stringify(Object.keys(row)));
  eq('검증 화면으로 보낸다', t.nav[t.nav.length - 1], 'quiz.html?course=c-press');
}

/* =================================================================
   2. 인도네시아어 · 도장 공정 (W-4821-11)
      ph-6 은 인도네시아어 번역이 없다 → 숨기지 않고 표시해야 한다
   ================================================================= */
{
  const t = boot('worker/learn.html', { login: 'W-4821-11', page: 'worker/learn.js' });
  const doc = t.win.document;

  const cards = doc.querySelectorAll('#course-list .course-card');
  eq('도장 공정에는 교육 1개', cards.length, 1);
  has('도장 부스 교육', text(cards[0].querySelector('strong')), '도장 부스 1 안전교육');
  has('미통과 상태이므로 검증이 남았다', text(cards[0].querySelector('.tags')), '이해도 검증이 남았습니다');

  cards[0].querySelector('.course-open').dispatchEvent(new t.win.MouseEvent('click', { bubbles: true }));
  has('문구 2개', text(t.$('step-count')), '1 / 2');

  // 1장 = ph-4 (id 번역 있음)
  eq('인도네시아어 번역', text(t.$('phrase-card').querySelector('.translated')), 'Kenakan masker gas');

  // 2장 = ph-6 (id 번역 없음) → 한국어 원문 + "번역 준비 중"
  t.$('btn-next').dispatchEvent(new t.win.MouseEvent('click', { bubbles: true }));
  has('번역이 없으면 한국어 원문을 띄운다',
    text(t.$('phrase-card').querySelector('.translated')), '비상정지 버튼');
  has('번역이 없다는 사실을 화면에 남긴다',
    text(t.$('phrase-card')), '내 언어 번역 준비 중');
}

/* =================================================================
   3. ★ 검수 완료가 아닌 문구는 안전 지시로 쓰지 않는다
      ph-1 · ph-2 · ph-6 을 전부 검수 대기로 돌리면 진행을 막아야 한다
   ================================================================= */
{
  const t = boot('worker/learn.html', {
    login: 'W-4821-07',
    page: 'worker/learn.js',
    before(win) {
      win.Store.library.update((list) => {
        list.forEach((p) => { if (p.id !== 'ph-4') p.status = 'waiting'; });
      });
    },
  });
  const doc = t.win.document;

  const cards = doc.querySelectorAll('#course-list .course-card');
  has('쓸 수 있는 문구가 0개', text(cards[0].querySelector('.meta')), '안전 문구 0개');
  has('몇 개가 빠졌는지 밝힌다', text(cards[0].querySelector('.tags')), '검수 대기 3개 제외');

  cards[0].querySelector('.course-open').dispatchEvent(new t.win.MouseEvent('click', { bubbles: true }));
  eq('수강 화면으로 넘어가지 않는다', t.$('view-step').hidden, true);
  eq('진행 불가 화면이 뜬다', t.$('view-nophrase').hidden, false);
  has('이유를 말한다', text(t.$('nophrase-why')), '검수를 지나지 않은 문구는 안전 지시로 쓰지 않습니다');
}

/* =================================================================
   4. 교육이 아직 없는 경우 (조립 공정 W-4821-03 — 계정은 없으니 setup 으로만)
   ================================================================= */
{
  const t = boot('worker/learn.html', {
    login: 'W-4821-07',
    page: 'worker/learn.js',
    before(win) { win.Store.courses.save([]); },
  });
  has('무엇을 하면 되는지 말한다', text(t.$('course-list')), '담당자가 아직 내 설비의 교육을 만들지 않았습니다');
}

/* =================================================================
   5. 외부 요청 0건 — HTML 에 외부 주소가 없어야 한다
   ================================================================= */
{
  const fs = require('fs');
  const html = fs.readFileSync('C:/Users/byeonsoyun/2026-ax-ton/2026-ax-ton/src/worker/learn.html', 'utf8');
  ok('http(s):// 참조 없음', !/(src|href)\s*=\s*["']https?:/i.test(html));
  ok('절대경로(/assets) 없음', !/(src|href)\s*=\s*["']\//.test(html));
  const js = fs.readFileSync('C:/Users/byeonsoyun/2026-ax-ton/2026-ax-ton/src/worker/learn.js', 'utf8');
  ok('innerHTML 안 씀', !/innerHTML/.test(js));
  ok('localStorage 직접 호출 안 함', !/localStorage/.test(js));
  ok('import/export 안 씀', !/^\s*(import|export)\s/m.test(js));
}

report('기능3 안전교육 수강');
