/* ===================================================================
   proof.js — 기능5 교육 증빙 생성

   담당: P4
   기능번호: 기능5
   읽는 키: progress, courses, setup, library
   쓰는 키: 없음
   근거: SCREEN 기능5 · PRD §4.3

   증빙 작성 2시간 → 5분. 사업주 쪽 도입 유인은 사실상 이것 하나다.

   ★ 쓰는 키가 없는 것이 이 화면의 설계다.

     증빙을 따로 저장하지 않고 progress 를 그대로 읽어서 그린다.
     사본을 만들지 않으므로 고칠 경로가 아예 없다 — "생성 후 수정 불가" 를
     규칙으로 적어 두는 대신 구조로 만든다.
     내용을 바꾸려면 교육 기록 자체가 바뀌어야 한다.

   ★ 미이수자와 이해도 미달자를 숨기는 경로를 넣지 않는다.
     걸러 보기 기능도, 정렬로 아래로 밀어내는 것도 두지 않는다.
     숨길 수 있는 증빙은 증빙이 아니다.

   ★ "면책" 이라고 쓰지 않는다.
     이 문서는 교육을 실시했다는 기록이고, 법적 책임을 대신하지 않는다.

   PDF 는 window.print() 와 @media print 로만 만든다.
   외부 라이브러리를 넣으면 외부 요청 0건 규칙이 깨진다.

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

  var QLABEL = { hotspot: '위험 지점 짚기', choice: '올바른 작업 고르기', match: '보호구 연결하기' };

  /* -----------------------------------------------------------------
     읽기
     ----------------------------------------------------------------- */

  function setup() { return Store.setup.load(); }

  function langName(code) {
    var l = Store.language(code);
    return l ? l.name : (code || '-');
  }

  function courseOf(id) { return Store.findBy(Store.courses.load(), 'id', id); }

  /* 이 교육의 대상자 — 설비가 속한 공정의 노동자 전원.
     ★ 여기서 아무도 빼지 않는다. 미수강자가 빠지면 이수율이 저절로 100% 가 된다. */
  function audienceOf(course) {
    var state = setup();
    var eq = Store.findBy(state.equipments, 'id', course.equipmentId);
    if (!eq) return [];
    return state.workers.filter(function (w) { return w.processId === eq.processId; });
  }

  function progressOf(workerId, courseId) {
    return Store.progress.load().filter(function (r) {
      return r.workerId === workerId && r.courseId === courseId;
    })[0] || null;
  }

  /* 한 사람의 결과. 통과하지 못하면 이수가 아니다 (SCREEN 기능4). */
  function resultOf(worker, course) {
    var row = progressOf(worker.id, course.id);

    if (!row || !row.learnedAt) {
      return { state: 'none', label: '미수강', learnedAt: null, quizAt: null, score: null };
    }
    if (!row.quiz) {
      return { state: 'noquiz', label: '검증 미실시', learnedAt: row.learnedAt, quizAt: null, score: null };
    }
    return {
      state: row.quiz.passed ? 'pass' : 'fail',
      label: row.quiz.passed ? '이수' : '미통과',
      learnedAt: row.learnedAt,
      quizAt: row.quiz.at,
      score: row.quiz.score,
      attempt: row.quiz.attempt,
      firstPassed: row.quiz.firstPassed,
      lang: row.lang
    };
  }

  /* -----------------------------------------------------------------
     요약 타일
     ----------------------------------------------------------------- */

  function renderSummary(course) {
    var box = $('summary');
    box.textContent = '';
    if (!course) return;

    var people = audienceOf(course);
    var results = people.map(function (w) { return resultOf(w, course); });

    var count = function (state) {
      return results.filter(function (r) { return r.state === state; }).length;
    };

    // 최초 통과율 — 다시 풀어서 통과한 것은 세지 않는다.
    // 이 값이 100% 면 문항이 쉬운 것이라 지표 실패로 본다 (목표 70~85%).
    var tried = results.filter(function (r) { return r.state === 'pass' || r.state === 'fail'; });
    var firstPass = tried.filter(function (r) {
      return r.firstPassed !== undefined ? r.firstPassed : r.state === 'pass';
    }).length;
    var rate = tried.length ? Math.round((firstPass / tried.length) * 100) : null;

    var tiles = [
      { label: '대상', value: people.length, unit: '명', hint: '이 공정 노동자 전원' },
      { label: '이수', value: count('pass'), unit: '명', hint: '이해도 검증 통과' },
      { label: '미통과', value: count('fail'), unit: '명', hint: '교육을 다시 만들 신호', alert: count('fail') > 0 },
      { label: '미수강', value: count('none') + count('noquiz'), unit: '명',
        hint: '아직 안 들었거나 검증 전', alert: (count('none') + count('noquiz')) > 0 },
      { label: '최초 통과율', value: rate === null ? '-' : rate, unit: rate === null ? '' : '%',
        hint: rate === null ? '검증 기록이 없습니다'
          : (rate === 100 ? '100% 는 문항이 쉬운 것입니다' : '목표 70~85%'),
        alert: rate === 100 }
    ];

    tiles.forEach(function (t) {
      var cell = UI.el('div', 'kpi' + (t.alert ? ' alert' : ''));
      cell.appendChild(UI.el('dt', null, t.label));
      var dd = UI.el('dd', null, String(t.value));
      if (t.unit) dd.appendChild(UI.el('small', null, t.unit));
      cell.appendChild(dd);
      cell.appendChild(UI.el('p', 'hint', t.hint));
      box.appendChild(cell);
    });
  }

  /* -----------------------------------------------------------------
     교육일지
     ----------------------------------------------------------------- */

  function metaRow(label, value) {
    var tr = UI.el('tr');
    tr.appendChild(UI.el('th', null, label));
    tr.appendChild(UI.el('td', null, value));
    return tr;
  }

  function renderProof(course) {
    var state = setup();
    var eq = course ? Store.findBy(state.equipments, 'id', course.equipmentId) : null;
    var proc = eq ? Store.findBy(state.processes, 'id', eq.processId) : null;

    $('proof-issued-at').textContent = '발급 ' + UI.formatDate(new Date().toISOString());
    $('proof-issued-by').textContent = [user.name, user.title].filter(Boolean).join(' · ') || user.userId;
    $('sign-admin').textContent = user.name || user.userId;

    var metas = $('proof-meta-rows');
    metas.textContent = '';

    if (!course) {
      $('proof').hidden = true;
      return;
    }
    $('proof').hidden = false;

    var people = audienceOf(course);
    var results = people.map(function (w) { return resultOf(w, course); });
    var doneAt = results.map(function (r) { return r.quizAt || r.learnedAt; })
      .filter(Boolean).sort();

    metas.appendChild(metaRow('사업장', state.site.name || '(미등록)'));
    metas.appendChild(metaRow('규모', state.site.sizeBand || '-'));
    metas.appendChild(metaRow('교육명', course.title));
    metas.appendChild(metaRow('대상 공정 · 설비',
      [proc ? proc.name : '-', eq ? eq.name : '삭제된 설비'].join(' · ')));
    metas.appendChild(metaRow('교육 언어', (course.languages || []).map(langName).join(' · ') || '-'));
    metas.appendChild(metaRow('교육 방식',
      '설비별 다국어 음성 · 픽토그램 자율 학습 후 이해도 검증'));
    metas.appendChild(metaRow('실시 기간', doneAt.length
      ? UI.formatDate(doneAt[0]) + ' ~ ' + UI.formatDate(doneAt[doneAt.length - 1])
      : '실시 기록 없음'));
    metas.appendChild(metaRow('대상 인원', people.length + '명'));

    renderPhrases(course);
    renderQuiz(course);
    renderRows(people, results, course);
  }

  /* 전달한 안전 문구.
     ★ 지금 검수 상태도 함께 적는다. 교육 당시에는 쓸 수 있었지만 그 뒤
       오역으로 중지된 문구가 있으면, 그 사실이 증빙에 남아야 한다. */
  function renderPhrases(course) {
    var box = $('proof-phrases');
    box.textContent = '';

    var library = Store.library.load();
    var ids = course.phraseIds || [];

    if (!ids.length) {
      box.appendChild(UI.el('li', null, '기록된 안전 문구가 없습니다.'));
      return;
    }

    ids.forEach(function (id) {
      var p = Store.findBy(library, 'id', id);
      var li = UI.el('li');
      if (!p) {
        li.appendChild(document.createTextNode('(삭제된 문구 ' + id + ')'));
      } else {
        li.appendChild(document.createTextNode(p.ko));
        if (p.status !== 'reviewed') {
          li.appendChild(UI.el('span', 'proof-flag',
            p.status === 'stopped'
              ? ' — 교육 이후 사용 중지된 문구입니다'
              : ' — 현재 검수 대기 상태입니다'));
        } else {
          /* 문구 전체는 살아 있어도 어느 한 언어에서만 내려갔을 수 있다.
             그 언어 노동자는 이 문구를 받지 못했다는 뜻이므로 증빙에 적는다.
             ★ 숨기지 않는다. 무엇이 전달되지 않았는지가 이 문서의 내용이다. */
          var out = (course.languages || []).filter(function (code) {
            return !Store.phraseOk(p, code);
          });
          if (out.length) {
            li.appendChild(UI.el('span', 'proof-flag',
              ' — ' + out.map(langName).join(' · ') + ' 노동자에게는 전달되지 않았습니다'));
          }
        }
      }
      box.appendChild(li);
    });
  }

  function renderQuiz(course) {
    var box = $('proof-quiz');
    box.textContent = '';

    var quiz = course.quiz || [];
    if (!quiz.length) {
      box.appendChild(UI.el('li', null,
        '이해도 검증 문항이 없습니다. 문항이 없는 교육은 이수로 기록되지 않습니다.'));
      return;
    }

    /* 문항 문구는 한국어를 적는다 — 이 서식은 감독기관에 내는 한국어 문서다.
       대신 그 문항이 어느 언어로 제공됐는지를 함께 적는다.
       "번역된 문항으로 이해를 확인했다" 가 이 증빙이 서명과 다른 이유다.

       ★ 한국어로만 제공된 문항을 숨기지 않는다. 옅게 만들지도 않는다.
         숨길 수 있는 증빙은 증빙이 아니다. */
    var langs = (course.languages || []).filter(function (c) { return c !== 'ko'; });

    quiz.forEach(function (q) {
      var li = UI.el('li');
      li.appendChild(document.createTextNode(q.prompt));
      li.appendChild(UI.el('span', 'proof-qtype', ' (' + (QLABEL[q.type] || q.type) + ')'));

      if (langs.length) {
        var got = langs.filter(function (code) { return Store.qhas(q, code); });
        var text = got.length
          ? '제공 언어 — 한국어 · ' + got.map(langName).join(' · ')
          : '제공 언어 — 한국어';
        var missed = langs.filter(function (code) { return got.indexOf(code) === -1; });
        if (missed.length) {
          text += ' (' + missed.map(langName).join(' · ') + ' 는 한국어로 제공)';
        }
        li.appendChild(UI.el('span', 'proof-qlang', text));
      }

      box.appendChild(li);
    });
  }

  /* 대상자별 기록.
     ★ 순서를 결과로 바꾸지 않는다. 식별번호 순 그대로 둔다 —
       정렬만 바꿔도 미통과자를 아래로 밀어내는 통로가 된다. */
  function renderRows(people, results, course) {
    var body = $('proof-rows');
    body.textContent = '';

    if (!people.length) {
      var tr = UI.el('tr');
      var cell = UI.el('td');
      cell.colSpan = 6;
      cell.appendChild(UI.el('p', 'empty',
        '이 공정에 등록된 노동자가 없습니다. 사업장 등록에서 노동자를 추가해 주세요.'));
      tr.appendChild(cell);
      body.appendChild(tr);
      return;
    }

    people.forEach(function (w, i) {
      var r = results[i];
      var tr = UI.el('tr');
      tr.setAttribute('data-state', r.state);

      tr.appendChild(UI.el('td', null, w.id));
      tr.appendChild(UI.el('td', null, langName(r.lang || w.lang)));
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
      else resultCell.appendChild(UI.neutralBadge(r.label));
      tr.appendChild(resultCell);

      body.appendChild(tr);
    });
  }

  /* -----------------------------------------------------------------
     그리기
     ----------------------------------------------------------------- */

  function render() {
    var courses = Store.courses.load();

    UI.fillSelect($('pick-course'), courses,
      function (c) { return c.id; },
      function (c) { return c.title; });

    if (!courses.length) {
      $('proof').hidden = true;
      $('summary').textContent = '';
      $('btn-print').disabled = true;
      var note = UI.el('p', 'empty',
        '발급된 교육이 없습니다. 교육 콘텐츠 생성(기능2)에서 교육을 먼저 만들어 주세요.');
      $('summary').appendChild(note);
      return;
    }

    $('btn-print').disabled = false;
    var course = courseOf($('pick-course').value) || courses[0];
    renderSummary(course);
    renderProof(course);
  }

  /* -----------------------------------------------------------------
     이벤트 연결
     ----------------------------------------------------------------- */

  $('pick-course').addEventListener('change', render);

  $('btn-print').addEventListener('click', function () {
    // 발급 시각을 누르는 순간으로 다시 적는다
    render();
    window.print();
  });

  window.addEventListener('storage', function (e) {
    if (e.key === Store.progress.KEY || e.key === Store.courses.KEY ||
        e.key === Store.setup.KEY || e.key === Store.library.KEY) render();
  });

  render();
})();
