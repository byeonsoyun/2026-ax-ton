/* ===================================================================
   my.js — 마이페이지

   담당: P2
   기능번호: — (내 기록)
   읽는 키: setup, courses, progress, reports
   쓰는 키: 없음
   근거: SCREEN 화면10 · PRD §4.2

   ★ 증빙은 저장하지 않고 progress 를 그대로 읽어서 그린다.
     사본이 없으니 고칠 경로도 없다 — 기능5 와 같은 방식이다.

   ★ 못 들은 교육과 통과하지 못한 교육을 빼고 뽑는 경로를 만들지 않는다.
     걸러 보기도, 결과순 정렬도 두지 않는다.
     숨길 수 있는 증빙은 증빙이 아니다.

   ★ 외국인등록번호 · 여권번호를 다루지 않는다.
     사업장 안에서 쓰는 식별번호만 보여 준다.

   ★ 위험 신고는 익명이라 "내가 낸 것" 을 골라낼 수 없다.
     그게 익명이라는 뜻이므로, 왜 그런지 화면에 적는다.

   -------------------------------------------------------------------
   골격입니다. 남은 것은 화면 아래 "여기부터 채우시면 됩니다" 에 적혀 있습니다.
   =================================================================== */

(function () {
  'use strict';

  var $ = UI.$;
  var user = Auth.current();

  UI.fillWorkerBar(user);
  UI.markCurrentTab();
  UI.warnIfBlocked();

  function whoAmI() {
    var state = Store.setup.load();
    var row = Store.findBy(state.workers, 'id', user.userId) || {};
    return {
      id: user.userId,
      lang: user.lang || row.lang || 'ko',
      processId: user.processId || row.processId || ''
    };
  }

  var me = whoAmI();

  /* -----------------------------------------------------------------
     읽기
     ----------------------------------------------------------------- */

  function langName(code) {
    var l = Store.language(code);
    return l ? l.name : (code || '-');
  }

  function processName(id) {
    var p = Store.findBy(Store.setup.load().processes, 'id', id);
    return p ? p.name : '';
  }

  function myCourses() {
    var state = Store.setup.load();
    return Store.courses.load().filter(function (c) {
      if (!c || !c.approved) return false;
      if (!me.processId) return true;
      var eq = Store.findBy(state.equipments, 'id', c.equipmentId);
      return !!eq && eq.processId === me.processId;
    });
  }

  function progressOf(courseId) {
    return Store.progress.load().filter(function (r) {
      return r.workerId === me.id && r.courseId === courseId;
    })[0] || null;
  }

  function resultOf(course) {
    var row = progressOf(course.id);
    if (!row || !row.learnedAt) {
      return { state: 'none', label: '아직 안 들었습니다', learnedAt: null, quizAt: null, score: null };
    }
    if (!row.quiz) {
      return { state: 'noquiz', label: '확인이 남았습니다', learnedAt: row.learnedAt, quizAt: null, score: null };
    }
    return {
      state: row.quiz.passed ? 'pass' : 'fail',
      label: row.quiz.passed ? '완료' : '통과하지 못했습니다',
      learnedAt: row.learnedAt,
      quizAt: row.quiz.at,
      score: row.quiz.score,
      attempt: row.quiz.attempt,
      lang: row.lang
    };
  }

  function renderVoiceNote() {
    var note = UI.voiceNote(me.lang);
    var box = $('voicenote');
    box.textContent = note;
    box.hidden = !note;
  }

  /* -----------------------------------------------------------------
     1. 내 정보

     ★ 외국인등록번호 · 여권번호는 아예 다루지 않는다.
       받지 않는다는 사실도 화면에 적는다.
     ----------------------------------------------------------------- */

  function renderMe() {
    var state = Store.setup.load();
    var list = $('me-list');
    list.textContent = '';

    var rows = [
      { what: '식별번호', note: me.id },
      { what: '사업장', note: state.site.name || '(미등록)' },
      { what: '공정', note: processName(me.processId) || '(미배정)' },
      { what: '내 언어', note: langName(me.lang) }
    ];

    rows.forEach(function (r) {
      var li = UI.el('li');
      li.setAttribute('data-done', 'yes');
      li.appendChild(UI.el('span', 'what', r.what));
      li.appendChild(UI.neutralBadge(r.note));
      list.appendChild(li);
    });
  }

  /* -----------------------------------------------------------------
     2. 받은 교육 — 못 들은 것도 그대로
     ----------------------------------------------------------------- */

  function badgeFor(state) {
    if (state === 'pass') return UI.okBadge('완료');
    if (state === 'fail') return UI.stopBadge('다시 해야 합니다');
    if (state === 'noquiz') return UI.waitBadge('확인이 남았습니다');
    return UI.neutralBadge('아직 안 들었습니다');
  }

  function renderHistory() {
    var list = $('history-list');
    list.textContent = '';

    var courses = myCourses();
    if (!courses.length) {
      list.appendChild(UI.emptyRow('아직 받을 교육이 없습니다.'));
      return;
    }

    var state = Store.setup.load();

    courses.forEach(function (course) {
      var eq = Store.findBy(state.equipments, 'id', course.equipmentId);
      var r = resultOf(course);

      var li = UI.el('li', 'course-card');

      var ico = UI.el('span', 'ico', (eq && eq.icon) || '⚙');
      ico.setAttribute('aria-hidden', 'true');
      li.appendChild(ico);

      var body = UI.el('div', 'body');
      body.appendChild(UI.el('strong', null, course.title));
      body.appendChild(UI.el('p', 'meta', [
        r.quizAt ? '확인 ' + UI.formatDate(r.quizAt) : (r.learnedAt ? '들은 날 ' + UI.formatDate(r.learnedAt) : null),
        r.score === null ? null : r.score + '점'
      ].filter(Boolean).join(' · ') || '기록 없음'));

      var tags = UI.el('div', 'tags');
      tags.appendChild(badgeFor(r.state));
      body.appendChild(tags);
      li.appendChild(body);

      // 다시 할 수 있는 길을 준다. 통과하지 못한 것이 막다른 길이 되면 안 된다.
      if (r.state !== 'pass') {
        var go = UI.el('a', 'btn-sm go', r.state === 'noquiz' ? '확인하기' : '다시 듣기');
        go.href = r.state === 'noquiz'
          ? 'quiz.html?course=' + encodeURIComponent(course.id)
          : 'learn.html';
        li.appendChild(go);
      }

      list.appendChild(li);
    });
  }

  /* -----------------------------------------------------------------
     3. 위험 신고 — 익명이라 내 것만 골라낼 수 없다
     ----------------------------------------------------------------- */

  function renderReports() {
    var list = $('reports-list');
    list.textContent = '';

    $('reports-why').textContent =
      '신고는 이름을 남기지 않으므로 "내가 낸 것" 만 골라 볼 수 없습니다. ' +
      '우리 현장에 들어온 신고를 함께 봅니다. 그게 이름을 남기지 않는다는 뜻입니다.';

    var state = Store.setup.load();
    var all = Store.reports.load().slice().sort(function (a, b) {
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    });

    if (!all.length) {
      list.appendChild(UI.emptyRow('아직 들어온 신고가 없습니다.'));
      return;
    }

    all.slice(0, 5).forEach(function (r) {
      var eq = Store.findBy(state.equipments, 'id', r.equipmentId);
      var haz = Store.hazard(r.hazard);

      var li = UI.el('li', 'report-item');
      var ico = UI.el('span', 'ico', haz ? haz.icon : '⚠');
      ico.setAttribute('aria-hidden', 'true');
      li.appendChild(ico);

      var body = UI.el('div', 'body');
      body.appendChild(UI.el('strong', null,
        (haz ? haz.label : '위험') + ' · ' + (eq ? eq.name : '설비 미지정')));
      body.appendChild(UI.el('p', 'meta',
        [r.ticket, UI.formatDate(r.createdAt)].filter(Boolean).join(' · ')));
      li.appendChild(body);

      if (r.status === 'resolved') li.appendChild(UI.okBadge('조치됨'));
      else if (r.status === 'urgent') li.appendChild(UI.stopBadge('긴급'));
      else li.appendChild(UI.waitBadge('확인 중'));

      list.appendChild(li);
    });

    if (all.length > 5) {
      var more = UI.el('li');
      more.appendChild(UI.el('p', 'empty', '그 밖에 ' + (all.length - 5) + '건이 더 있습니다.'));
      list.appendChild(more);
    }
  }

  /* -----------------------------------------------------------------
     4. 인쇄되는 증빙

     ★ 걸러 보기가 없다. 받은 교육 전부가 순서 그대로 들어간다.
     ----------------------------------------------------------------- */

  function metaRow(label, value) {
    var tr = UI.el('tr');
    tr.appendChild(UI.el('th', null, label));
    tr.appendChild(UI.el('td', null, value));
    return tr;
  }

  function renderProof() {
    var state = Store.setup.load();
    var courses = myCourses();

    $('proof-issued-at').textContent = '발급 ' + UI.formatDate(new Date().toISOString());

    var metas = $('proof-meta-rows');
    metas.textContent = '';
    metas.appendChild(metaRow('사업장', state.site.name || '(미등록)'));
    metas.appendChild(metaRow('식별번호', me.id));
    metas.appendChild(metaRow('공정', processName(me.processId) || '(미배정)'));
    metas.appendChild(metaRow('교육 언어', langName(me.lang)));

    var done = courses.filter(function (c) { return resultOf(c).state === 'pass'; }).length;
    metas.appendChild(metaRow('받은 교육', courses.length + '건 중 ' + done + '건 완료'));

    var body = $('proof-rows');
    body.textContent = '';

    if (!courses.length) {
      var tr = UI.el('tr');
      var cell = UI.el('td');
      cell.colSpan = 6;
      cell.appendChild(UI.el('p', 'empty', '받은 교육이 없습니다.'));
      tr.appendChild(cell);
      body.appendChild(tr);
      return;
    }

    courses.forEach(function (course) {
      var r = resultOf(course);
      var tr = UI.el('tr');
      tr.setAttribute('data-state', r.state);

      tr.appendChild(UI.el('td', null, course.title));
      tr.appendChild(UI.el('td', null, langName(r.lang || me.lang)));
      tr.appendChild(UI.el('td', null, r.learnedAt ? UI.formatDate(r.learnedAt) : '-'));
      tr.appendChild(UI.el('td', null, r.quizAt ? UI.formatDate(r.quizAt) : '-'));

      var scoreCell = UI.el('td', 'num');
      if (r.score === null) {
        scoreCell.textContent = '-';
      } else {
        scoreCell.appendChild(document.createTextNode(r.score + '점'));
        if (r.attempt > 1) scoreCell.appendChild(UI.el('span', 'sub', r.attempt + '회차'));
      }
      tr.appendChild(scoreCell);

      var resultCell = UI.el('td');
      if (r.state === 'pass') resultCell.appendChild(UI.okBadge('이수'));
      else if (r.state === 'fail') resultCell.appendChild(UI.stopBadge('미통과'));
      else resultCell.appendChild(UI.neutralBadge(r.state === 'noquiz' ? '검증 미실시' : '미수강'));
      tr.appendChild(resultCell);

      body.appendChild(tr);
    });
  }

  /* -----------------------------------------------------------------
     그리기
     ----------------------------------------------------------------- */

  function render() {
    renderVoiceNote();
    renderMe();
    renderHistory();
    renderReports();
    renderProof();
  }

  $('btn-print').addEventListener('click', function () {
    renderProof();     // 발급 시각을 누르는 순간으로
    window.print();
  });

  window.addEventListener('pagehide', UI.stopSpeak);
  UI.onVoicesReady(renderVoiceNote);

  window.addEventListener('storage', function (e) {
    if (e.key === Store.progress.KEY || e.key === Store.courses.KEY ||
        e.key === Store.reports.KEY || e.key === Store.setup.KEY) render();
  });

  render();
})();
