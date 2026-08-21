/* ===================================================================
   content.js — 기능2 교육 콘텐츠 생성 · 승인 (담당자)

   담당: P3
   기능번호: 기능2
   읽는 키: setup, library
   쓰는 키: courses
   근거: SCREEN 기능2 · PRD §4.1

   설비 → 언어 → 문구 → 문항 → 승인. 승인하면 그 공정 노동자의
   수강 화면(기능3)에 바로 나타난다.

   이 파일이 코드로 지키는 것 —

   · 검수 완료(status === 'reviewed')된 문구만 선택지에 올린다.
     검수 대기·사용 중지 문구는 목록에 아예 나오지 않는다.
     오역이 그대로 사고가 되므로, 고를 수 있게 두는 것 자체가 위험하다.

   · 언어는 사업장 등록(기능1)에서 등록한 것만 나온다.
     등록하지 않은 언어가 교육에 들어가면 그 언어 노동자가 없는데 번역만 쌓인다.

   · 고른 언어에 번역이 없는 문구가 있으면 승인 전에 알린다.
     그대로 내보내면 그 언어 노동자는 한국어 원문만 보게 된다.

   · AI 는 문구를 새로 쓰지 않는다. 고르기만 한다 (화면 상단 고지).

   -------------------------------------------------------------------
   골격입니다. 남은 것은 화면 아래 "여기부터 채우시면 됩니다" 에 적혀 있습니다.
   =================================================================== */

(function () {
  'use strict';

  var $ = UI.$;
  var user = Auth.current();

  UI.fillAdminBar(user);
  UI.markCurrentTab();
  UI.warnIfBlocked();

  var QTYPES = [
    { code: 'hotspot', icon: '👆', label: '위험 지점 짚기' },
    { code: 'choice',  icon: '☑',  label: '올바른 작업 고르기' },
    { code: 'match',   icon: '🔗', label: '보호구 연결하기' }
  ];

  /* 초안. 승인을 누를 때까지 저장하지 않는다 —
     반쯤 만든 교육이 courses 에 들어가면 노동자 화면에 그대로 나온다. */
  var draft = newDraft();

  function newDraft() {
    return { title: '', equipmentId: '', languages: [], phraseIds: [], quiz: [] };
  }

  /* -----------------------------------------------------------------
     읽기
     ----------------------------------------------------------------- */

  function setup() { return Store.setup.load(); }

  /* ★ 검수를 지난 문구만. 여기가 규칙이 코드가 되는 지점이다. */
  function usablePhrases() {
    return Store.library.load().filter(function (p) { return p.status === 'reviewed'; });
  }

  function equipmentOf(id) { return Store.findBy(setup().equipments, 'id', id); }

  function langName(code) {
    var l = Store.language(code);
    return l ? l.name : code;
  }

  function phraseOf(id) { return Store.findBy(Store.library.load(), 'id', id); }

  /* 이 교육을 볼 수 있는 노동자 수 — 설비가 속한 공정의 노동자 */
  function audienceOf(course) {
    var state = setup();
    var eq = Store.findBy(state.equipments, 'id', course.equipmentId);
    if (!eq) return 0;
    return state.workers.filter(function (w) { return w.processId === eq.processId; }).length;
  }

  /* -----------------------------------------------------------------
     1단계 — 설비와 언어
     ----------------------------------------------------------------- */

  function buildLangPicker() {
    var box = $('pick-lang');
    box.textContent = '';
    var registered = setup().languages;

    if (!registered.length) {
      box.appendChild(UI.el('p', 'empty', '등록된 언어가 없습니다. 사업장 등록에서 먼저 골라 주세요.'));
      return;
    }
    registered.forEach(function (code) {
      var lang = Store.language(code);
      box.appendChild(UI.chip({
        type: 'checkbox', name: 'lang', value: code,
        label: lang ? lang.name : code, sub: lang ? lang.native : '',
        checked: draft.languages.indexOf(code) !== -1
      }));
    });
  }

  /* -----------------------------------------------------------------
     2단계 — 안전 문구
     ----------------------------------------------------------------- */

  function buildPhrasePicker() {
    var box = $('pick-phrase');
    box.textContent = '';

    var all = Store.library.load();
    var usable = usablePhrases();
    var excluded = all.length - usable.length;

    $('phrase-note').textContent = excluded
      ? '검수 완료 ' + usable.length + '개만 보입니다. 검수 대기·사용 중지 ' + excluded + '개는 고를 수 없습니다.'
      : '검수 완료 ' + usable.length + '개';

    if (!usable.length) {
      box.appendChild(UI.el('p', 'empty',
        '검수를 지난 문구가 없습니다. 운영자가 안전 문구 라이브러리(기능9)에서 검수를 마쳐야 합니다.'));
      return;
    }

    usable.forEach(function (p) {
      box.appendChild(UI.chip({
        type: 'checkbox', name: 'phrase', value: p.id,
        label: p.ko, sub: p.category || '',
        checked: draft.phraseIds.indexOf(p.id) !== -1
      }));
    });
  }

  /* 고른 언어에 번역이 없는 문구를 알린다.
     막지는 않는다 — 안전 지시를 아예 빼는 것보다 한국어로라도 보이는 편이 낫다.
     대신 무엇이 빠졌는지는 화면에 남는다. */
  function renderPhraseWarn() {
    var box = $('phrase-warn');
    box.textContent = '';
    if (!draft.languages.length || !draft.phraseIds.length) return;

    var missing = [];
    draft.phraseIds.forEach(function (id) {
      var p = phraseOf(id);
      if (!p) return;
      draft.languages.forEach(function (code) {
        var t = p.translations && p.translations[code];
        if (!t || !t.text) missing.push(langName(code) + ' — ' + p.ko);
      });
    });

    if (!missing.length) return;

    var warn = UI.el('div', 'warnbox');
    warn.appendChild(UI.el('strong', null, '번역이 없는 조합 ' + missing.length + '건'));
    var list = UI.el('ul');
    missing.slice(0, 6).forEach(function (line) { list.appendChild(UI.el('li', null, line)); });
    if (missing.length > 6) list.appendChild(UI.el('li', null, '그 밖에 ' + (missing.length - 6) + '건'));
    warn.appendChild(list);
    warn.appendChild(UI.el('p', null,
      '이대로 발급하면 그 언어 노동자는 이 문구를 한국어로 보게 됩니다. ' +
      '운영자에게 번역 요청을 해 두세요.'));
    box.appendChild(warn);
  }

  /* -----------------------------------------------------------------
     3단계 — 문항 만들기
     ----------------------------------------------------------------- */

  var pickedZone = null;     // hotspot 에서 고른 구역

  function buildTypePicker() {
    var box = $('pick-qtype');
    box.textContent = '';
    QTYPES.forEach(function (t, i) {
      box.appendChild(UI.chip({
        type: 'radio', name: 'qtype', value: t.code,
        icon: t.icon, label: t.label, checked: i === 0
      }));
    });
  }

  function buildChoiceInputs() {
    var box = $('q-ch-options');
    box.textContent = '';
    for (var i = 0; i < 3; i++) {
      var wrap = UI.el('div', 'opt-row');

      var head = UI.el('div', 'opt-head');
      var radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'q-ch-answer';
      radio.value = String(i);
      radio.id = 'q-ch-answer-' + i;
      if (i === 0) radio.checked = true;
      head.appendChild(radio);
      var lab = UI.el('label', null, (i + 1) + '번이 정답');
      lab.setAttribute('for', 'q-ch-answer-' + i);
      head.appendChild(lab);
      wrap.appendChild(head);

      var opt = document.createElement('input');
      opt.type = 'text';
      opt.id = 'q-ch-opt-' + i;
      opt.placeholder = (i + 1) + '번 선택지';
      wrap.appendChild(opt);

      var res = document.createElement('input');
      res.type = 'text';
      res.id = 'q-ch-res-' + i;
      res.placeholder = '이 선택을 하면 무슨 일이 생기는지 (선택)';
      wrap.appendChild(res);

      box.appendChild(wrap);
    }
  }

  function addPairRow() {
    var box = $('q-ma-pairs');
    var n = box.children.length;
    var row = UI.el('div', 'pair-row');

    var a = document.createElement('input');
    a.type = 'text';
    a.className = 'pair-a';
    a.placeholder = '작업 (예: 프레스 작업)';
    row.appendChild(a);

    var arrow = UI.el('span', 'pair-arrow', '→');
    arrow.setAttribute('aria-hidden', 'true');
    row.appendChild(arrow);

    var b = document.createElement('input');
    b.type = 'text';
    b.className = 'pair-b';
    b.placeholder = '보호구 (예: 안전장갑)';
    row.appendChild(b);

    if (n >= 2) {
      var del = UI.el('button', 'btn-sm danger', '삭제');
      del.type = 'button';
      del.addEventListener('click', function () { box.removeChild(row); });
      row.appendChild(del);
    }

    box.appendChild(row);
  }

  function renderHotspotFigure() {
    var box = $('q-hot-figure');
    box.textContent = '';
    pickedZone = null;
    $('q-hot-picked').textContent = '아직 고르지 않았습니다.';

    var eq = equipmentOf(draft.equipmentId);
    var name = Diagrams.nameFor(eq);
    box.appendChild(Diagrams.svg(name));

    var zones = Diagrams.zones(name);
    if (!zones.length) {
      $('q-hot-picked').textContent =
        '이 설비는 도해에 이름 붙은 구역이 없습니다. 다른 문항 유형을 쓰시거나 P1 에게 도해 추가를 요청해 주세요.';
      return;
    }

    zones.forEach(function (z) {
      var btn = UI.el('button', 'zone');
      btn.type = 'button';
      btn.setAttribute('aria-label', z.label);
      btn.style.left = z.x + '%';
      btn.style.top = z.y + '%';
      btn.style.width = z.w + '%';
      btn.style.height = z.h + '%';
      btn.addEventListener('click', function () {
        pickedZone = z;
        UI.$$('.zone', box).forEach(function (other) { other.removeAttribute('data-mark'); });
        btn.setAttribute('data-mark', 'ok');
        $('q-hot-picked').textContent = '정답 구역 — ' + z.label;
      });
      box.appendChild(btn);
    });
  }

  function currentType() { return UI.pickedValue('qtype') || 'hotspot'; }

  function showTypeForm() {
    var type = currentType();
    $('q-hotspot').hidden = type !== 'hotspot';
    $('q-choice').hidden = type !== 'choice';
    $('q-match').hidden = type !== 'match';
    if (type === 'hotspot') renderHotspotFigure();
  }

  function addQuestion() {
    var type = currentType();

    if (type === 'hotspot') {
      var hp = $('q-hot-prompt').value.trim();
      if (!hp) { UI.toast('문항을 적어 주세요.'); $('q-hot-prompt').focus(); return; }
      if (!pickedZone) { UI.toast('그림에서 정답이 될 위험 구역을 골라 주세요.'); return; }

      draft.quiz.push({
        id: 'q' + (draft.quiz.length + 1),
        type: 'hotspot',
        prompt: hp,
        answer: Diagrams.answerFor(pickedZone)
      });
      $('q-hot-prompt').value = '';

    } else if (type === 'choice') {
      var cp = $('q-ch-prompt').value.trim();
      if (!cp) { UI.toast('문항을 적어 주세요.'); $('q-ch-prompt').focus(); return; }

      var options = [];
      var results = [];
      for (var i = 0; i < 3; i++) {
        var v = $('q-ch-opt-' + i).value.trim();
        if (v) { options.push(v); results.push($('q-ch-res-' + i).value.trim()); }
      }
      if (options.length < 2) { UI.toast('선택지를 두 개 이상 적어 주세요.'); return; }

      var answer = Number(UI.pickedValue('q-ch-answer') || '0');
      if (answer >= options.length) { UI.toast('정답으로 고른 번호의 선택지가 비어 있습니다.'); return; }

      draft.quiz.push({
        id: 'q' + (draft.quiz.length + 1),
        type: 'choice',
        prompt: cp,
        options: options,
        answer: answer,
        results: results
      });
      $('q-ch-prompt').value = '';
      for (var k = 0; k < 3; k++) { $('q-ch-opt-' + k).value = ''; $('q-ch-res-' + k).value = ''; }

    } else {
      var mp = $('q-ma-prompt').value.trim();
      if (!mp) { UI.toast('문항을 적어 주세요.'); $('q-ma-prompt').focus(); return; }

      var pairs = [];
      UI.$$('#q-ma-pairs .pair-row').forEach(function (row) {
        var a = row.querySelector('.pair-a').value.trim();
        var b = row.querySelector('.pair-b').value.trim();
        if (a && b) pairs.push([a, b]);
      });
      if (pairs.length < 2) { UI.toast('짝을 두 개 이상 채워 주세요.'); return; }

      draft.quiz.push({
        id: 'q' + (draft.quiz.length + 1),
        type: 'match',
        prompt: mp,
        pairs: pairs
      });
      $('q-ma-prompt').value = '';
      $('q-ma-pairs').textContent = '';
      addPairRow();
      addPairRow();
    }

    UI.toast('문항을 추가했습니다.');
    render();
  }

  function renderQuizList() {
    var list = $('quiz-list');
    list.textContent = '';

    if (!draft.quiz.length) {
      list.appendChild(UI.emptyRow('아직 문항이 없습니다. 아래에서 하나 만들어 주세요.'));
      return;
    }

    draft.quiz.forEach(function (q, i) {
      var type = Store.findBy(QTYPES, 'code', q.type) || { icon: '?', label: q.type };
      var li = UI.itemRow(type.icon, q.prompt, (i + 1) + '번 · ' + type.label);

      var row = UI.el('div', 'btn-row');
      var del = UI.el('button', 'btn-sm danger', '삭제');
      del.type = 'button';
      del.addEventListener('click', function () {
        draft.quiz.splice(i, 1);
        // 번호를 다시 매긴다. 지운 뒤 q1, q3 이 남으면 채점 기록이 헷갈린다
        draft.quiz.forEach(function (x, k) { x.id = 'q' + (k + 1); });
        render();
      });
      row.appendChild(del);
      li.appendChild(row);

      list.appendChild(li);
    });
  }

  /* -----------------------------------------------------------------
     4단계 — 확인하고 발급
     ----------------------------------------------------------------- */

  function draftSteps() {
    var eq = equipmentOf(draft.equipmentId);
    return [
      { what: '1. 설비와 제목', done: !!(draft.equipmentId && draft.title),
        note: eq ? eq.name : '설비 미선택' },
      { what: '1. 언어', done: draft.languages.length > 0,
        note: draft.languages.length ? draft.languages.map(langName).join(' · ') : '미선택' },
      { what: '2. 안전 문구', done: draft.phraseIds.length > 0,
        note: draft.phraseIds.length + '개' },
      { what: '3. 이해도 검증 문항', done: draft.quiz.length > 0,
        note: draft.quiz.length + '문항' }
    ];
  }

  function renderCheck() {
    var list = $('draft-check');
    list.textContent = '';
    draftSteps().forEach(function (s) {
      var li = UI.el('li');
      li.setAttribute('data-done', s.done ? 'yes' : 'no');
      li.appendChild(UI.el('span', 'what', s.what));
      li.appendChild(s.done ? UI.okBadge(s.note) : UI.neutralBadge(s.note));
      list.appendChild(li);
    });

    var ready = draftSteps().every(function (s) { return s.done; });
    $('btn-approve').disabled = !ready;
  }

  function approve() {
    if (!draftSteps().every(function (s) { return s.done; })) {
      UI.toast('아직 채우지 않은 단계가 있습니다.');
      return;
    }

    var course = {
      id: Store.uid(),
      title: draft.title,
      equipmentId: draft.equipmentId,
      languages: draft.languages.slice(),
      phraseIds: draft.phraseIds.slice(),
      quiz: draft.quiz.slice(),
      approved: true,
      createdAt: new Date().toISOString()
    };

    var result = Store.courses.update(function (list) { list.push(course); });
    if (!result.ok) {
      UI.toast('저장하지 못했습니다. 이 브라우저의 저장소가 막혀 있습니다.');
      return;
    }

    var count = audienceOf(course);
    UI.toast('발급했습니다. 노동자 ' + count + '명의 수강 화면에 나타납니다.');

    draft = newDraft();
    resetForms();
    render();
  }

  /* -----------------------------------------------------------------
     발급한 교육 목록
     ----------------------------------------------------------------- */

  function renderCourses() {
    var body = $('course-rows');
    body.textContent = '';

    var list = Store.courses.load();
    if (!list.length) {
      var tr = UI.el('tr');
      var cell = UI.el('td');
      cell.colSpan = 7;
      cell.appendChild(UI.el('p', 'empty', '아직 발급한 교육이 없습니다.'));
      tr.appendChild(cell);
      body.appendChild(tr);
      return;
    }

    list.forEach(function (c) {
      var eq = equipmentOf(c.equipmentId);
      var tr = UI.el('tr');

      tr.appendChild(UI.el('td', null, c.title));
      tr.appendChild(UI.el('td', null, eq ? eq.icon + ' ' + eq.name : '삭제된 설비'));

      var langCell = UI.el('td');
      var chips = UI.el('div', 'chips');
      (c.languages || []).forEach(function (code) {
        chips.appendChild(UI.el('span', 'badge badge-neutral', langName(code)));
      });
      langCell.appendChild(chips);
      tr.appendChild(langCell);

      // 검수 상태가 바뀌어 지금 쓸 수 있는 문구가 줄었을 수 있다. 그것도 보여 준다.
      var ids = c.phraseIds || [];
      var live = ids.filter(function (id) {
        var p = phraseOf(id);
        return p && p.status === 'reviewed';
      }).length;
      var countCell = UI.el('td');
      countCell.appendChild(document.createTextNode('문구 ' + live + ' / ' + ids.length));
      countCell.appendChild(UI.el('span', 'sub', '문항 ' + ((c.quiz || []).length) + '개'));
      tr.appendChild(countCell);

      tr.appendChild(UI.el('td', 'num', audienceOf(c) + '명'));

      var statusCell = UI.el('td');
      if (!(c.quiz || []).length) statusCell.appendChild(UI.stopBadge('문항 없음'));
      else if (live < ids.length) statusCell.appendChild(UI.waitBadge('문구 ' + (ids.length - live) + '개 중지됨'));
      else if (c.approved) statusCell.appendChild(UI.okBadge('발급됨'));
      else statusCell.appendChild(UI.neutralBadge('미승인'));
      tr.appendChild(statusCell);

      var actCell = UI.el('td');
      var row = UI.el('div', 'btn-row');

      var link = UI.el('button', 'btn-sm', '접속 주소');
      link.type = 'button';
      link.addEventListener('click', function () { showLink(c); });
      row.appendChild(link);

      var del = UI.el('button', 'btn-sm danger', '삭제');
      del.type = 'button';
      del.addEventListener('click', function () {
        if (!window.confirm('"' + c.title + '" 교육을 삭제할까요?\n\n' +
          '노동자의 수강 화면에서 사라집니다. 이미 남은 수강 기록은 지워지지 않습니다.')) return;
        Store.courses.update(function (all) {
          var i = all.findIndex ? all.findIndex(function (x) { return x.id === c.id; }) : -1;
          if (i === -1) { for (var k = 0; k < all.length; k++) if (all[k].id === c.id) { i = k; break; } }
          if (i !== -1) all.splice(i, 1);
        });
        render();
        UI.toast('교육을 삭제했습니다.');
      });
      row.appendChild(del);

      actCell.appendChild(row);
      tr.appendChild(actCell);

      body.appendChild(tr);
    });
  }

  function showLink(course) {
    var note = $('link-note');
    note.textContent = '';
    note.appendChild(UI.el('strong', null, course.title));
    note.appendChild(document.createTextNode(' 접속 주소 — '));
    note.appendChild(UI.el('code', null,
      '../worker/learn.html (로그인 후) · 이해도 검증: ../worker/quiz.html?course=' + course.id));
    note.appendChild(UI.el('p', null,
      'QR 그림은 아직 만들지 않았습니다. 외부 라이브러리를 쓸 수 없어서 직접 그려야 합니다. ' +
      '지금은 이 주소를 노동자 폰에서 열면 됩니다.'));
    note.hidden = false;
  }

  /* -----------------------------------------------------------------
     그리기
     ----------------------------------------------------------------- */

  function badge(node, done, doneText, todoText) {
    node.className = 'badge ' + (done ? 'badge-ok' : 'badge-neutral');
    node.textContent = '';
    var icon = UI.el('span', null, done ? '✓' : '○');
    icon.setAttribute('aria-hidden', 'true');
    node.appendChild(icon);
    node.appendChild(document.createTextNode(' ' + (done ? doneText : todoText)));
  }

  function render() {
    var state = setup();
    var ready = state.equipments.length > 0 && state.languages.length > 0;
    $('setup-lock').hidden = ready;
    $('builder').hidden = !ready;

    if (ready) {
      UI.fillSelect($('draft-equip'), state.equipments,
        function (e) { return e.id; },
        function (e) { return e.icon + '  ' + e.name; });
      if (!draft.equipmentId) draft.equipmentId = $('draft-equip').value;
      $('draft-equip').value = draft.equipmentId;

      buildLangPicker();
      buildPhrasePicker();
      renderPhraseWarn();
      renderQuizList();
      renderCheck();

      badge($('b-step1'), !!(draft.equipmentId && draft.title && draft.languages.length),
        draft.languages.length + '개 언어', '미설정');
      badge($('b-step2'), draft.phraseIds.length > 0, draft.phraseIds.length + '개 문구', '미설정');
      badge($('b-step3'), draft.quiz.length > 0, draft.quiz.length + '문항', '미설정');
    }

    renderCourses();
  }

  function resetForms() {
    $('draft-title').value = '';
    $('q-hot-prompt').value = '';
    $('q-ch-prompt').value = '';
    $('q-ma-prompt').value = '';
    buildChoiceInputs();
    $('q-ma-pairs').textContent = '';
    addPairRow();
    addPairRow();
    showTypeForm();
  }

  /* -----------------------------------------------------------------
     이벤트 연결
     ----------------------------------------------------------------- */

  $('draft-equip').addEventListener('change', function () {
    draft.equipmentId = $('draft-equip').value;
    // 제목을 아직 손대지 않았으면 설비 이름으로 채워 준다
    var eq = equipmentOf(draft.equipmentId);
    if (eq && !$('draft-title').value.trim()) {
      $('draft-title').value = eq.name + ' 안전교육';
      draft.title = $('draft-title').value;
    }
    if (currentType() === 'hotspot') renderHotspotFigure();
    render();
  });

  $('draft-title').addEventListener('input', function () {
    draft.title = $('draft-title').value.trim();
    renderCheck();
  });

  $('pick-lang').addEventListener('change', function () {
    draft.languages = UI.checkedValues('lang');
    renderPhraseWarn();
    renderCheck();
    badge($('b-step1'), !!(draft.equipmentId && draft.title && draft.languages.length),
      draft.languages.length + '개 언어', '미설정');
  });

  $('pick-phrase').addEventListener('change', function () {
    draft.phraseIds = UI.checkedValues('phrase');
    renderPhraseWarn();
    renderCheck();
    badge($('b-step2'), draft.phraseIds.length > 0, draft.phraseIds.length + '개 문구', '미설정');
  });

  $('pick-qtype').addEventListener('change', showTypeForm);
  $('q-ma-add').addEventListener('click', addPairRow);
  $('btn-add-q').addEventListener('click', addQuestion);
  $('btn-approve').addEventListener('click', approve);

  $('btn-reset-draft').addEventListener('click', function () {
    if (!window.confirm('만들던 초안을 비웁니다. 계속할까요?')) return;
    draft = newDraft();
    resetForms();
    render();
    UI.toast('초안을 비웠습니다.');
  });

  // 운영자가 다른 탭에서 문구 검수를 바꾸면 선택지도 따라간다
  window.addEventListener('storage', function (e) {
    if (e.key === Store.library.KEY || e.key === Store.setup.KEY || e.key === Store.courses.KEY) render();
  });

  buildTypePicker();
  resetForms();
  render();
})();
