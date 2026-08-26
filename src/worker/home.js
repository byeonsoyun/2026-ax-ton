/* ===================================================================
   home.js — 노동자 홈

   담당: P2
   기능번호: — (진입점)
   읽는 키: setup, courses, library, progress
   쓰는 키: 없음
   근거: SCREEN 화면2 · PRD §4.2

   ★ 글자를 한 자도 읽지 않고 어디로 가야 할지 알 수 있어야 한다.
     그래서 이 화면의 모든 조작에 픽토그램과 음성이 함께 붙는다.

   이 파일이 코드로 지키는 것 —

   · 오늘의 안전 문구는 검수 완료(reviewed)된 것만 올린다.
     홈 배너는 교육에 들어가지 않아도 보이는 자리라, 여기 잘못된 문구가
     걸리면 가장 오래 노출된다.

   · 수강 → 검증 → 완료 3단계를 픽토그램으로 보여 준다.
     통과하지 못하면 완료가 아니다 (SCREEN 기능4).

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

  function stateOf(courseId) {
    var row = progressOf(courseId);
    if (!row) return 'todo';
    if (row.quiz && row.quiz.passed) return 'done';
    if (row.learnedAt) return 'verify';
    return 'todo';
  }

  /* 내 언어로 된 번역. 없으면 null. */
  function translationOf(phrase) {
    var t = phrase.translations && phrase.translations[me.lang];
    return (t && t.text) ? t : null;
  }

  /* -----------------------------------------------------------------
  /* 오늘 띄울 문구들. 검수를 지난 것만, 내 언어 기준으로 판정한다.

     ★ 내 설비 교육이 쓰는 문구를 앞에 둔다. 없으면 검수된 것 전부를 쓴다 —
       빈 배너보다는 낫다. */
  function phrasePool() {
    // 판정은 내 언어 기준이다 — 다른 언어의 오역으로 내 문구가 사라지지 않는다
    var library = Store.library.load().filter(function (p) {
      return Store.phraseOk(p, me.lang);
    });
    if (!library.length) return [];

    var mine = {};
    myCourses().forEach(function (c) {
      (c.phraseIds || []).forEach(function (id) { mine[id] = true; });
    });

    var preferred = library.filter(function (p) { return mine[p.id]; });
    return preferred.length ? preferred : library;
  }

  /* 날짜로 돌린다. 새로고침할 때마다 바뀌면 "오늘의 문구" 가 아니다. */
  function todayIndex(pool) {
    if (!pool.length) return 0;
    return Math.floor(Date.now() / 86400000) % pool.length;
  }

  /* 지금 보고 있는 자리. null 이면 아직 오늘 것을 보고 있다는 뜻이다 (C5). */
  var phraseAt = null;

  function currentPhrase() {
    var pool = phrasePool();
    if (!pool.length) return null;

    /* 문구가 지워지거나 검수가 내려가면 목록이 짧아진다.
       자리를 그대로 두면 없는 것을 가리키게 되므로 접어 준다. */
    var at = (phraseAt === null) ? todayIndex(pool) : ((phraseAt % pool.length) + pool.length) % pool.length;
    return { phrase: pool[at], at: at, total: pool.length };
  }

  /* 좌우로 넘긴다. 끝에서 다시 처음으로 돌아온다 —
     막다른 끝이 있으면 글을 못 읽는 사람은 고장으로 여긴다. */
  function stepPhrase(delta) {
    var now = currentPhrase();
    if (!now || now.total < 2) return;

    phraseAt = ((now.at + delta) % now.total + now.total) % now.total;
    renderToday();

    /* ★ 넘기면 그 문구를 읽어 준다. 사람이 손으로 누른 뒤라
       음성이 실제로 나는지도 여기서 판정된다 (UI.speak). */
    var next = currentPhrase();
    if (next) UI.speak(speechFor(next.phrase));
  }

  function speechFor(phrase) {
    var t = translationOf(phrase);
    return {
      text: t ? t.text : phrase.ko,
      lang: t ? me.lang : 'ko',
      ko: phrase.ko               // 내 언어 음성이 기기에 없으면 이것을 읽는다
    };
  }

  function renderToday() {
    var now = currentPhrase();
    var box = $('today');
    var nav = $('today-nav');

    if (!now) {
      box.className = 'today empty-today';
      $('today-pict').textContent = '📋';
      $('today-text').textContent = '아직 안전 문구가 준비되지 않았습니다.';
      $('today-ko').textContent = '';
      $('today-note').textContent = '';
      $('today-listen').textContent = '';
      nav.hidden = true;
      return;
    }

    var phrase = now.phrase;
    box.className = 'today';

    var eqIcon = '⚠';
    var state = Store.setup.load();
    myCourses().some(function (c) {
      if ((c.phraseIds || []).indexOf(phrase.id) === -1) return false;
      var eq = Store.findBy(state.equipments, 'id', c.equipmentId);
      if (eq) { eqIcon = eq.icon; return true; }
      return false;
    });

    var t = translationOf(phrase);
    $('today-pict').textContent = eqIcon;
    $('today-text').textContent = t ? t.text : phrase.ko;
    $('today-ko').textContent = t ? phrase.ko : '';

    /* ★ 배지는 정해진 자리에만 넣는다. 예전에는 다시 그릴 때마다
         listen 옆에 새로 끼워 넣어서 배지가 쌓였다. */
    var note = $('today-note');
    note.textContent = '';
    if (!t) note.appendChild(UI.waitBadge('내 언어 번역 준비 중'));

    var listen = $('today-listen');
    listen.textContent = '';
    listen.appendChild(UI.audioButton(function () {
      return speechFor(phrase);
    }, '안전 문구 듣기'));
    listen.appendChild(UI.el('span', 'label', '들어 보기'));

    /* 넘겨 볼 것이 하나뿐이면 버튼을 아예 두지 않는다 (C5) */
    nav.hidden = now.total < 2;
    $('today-pos').textContent = now.total < 2 ? '' : (now.at + 1) + ' / ' + now.total;
  }

  /* -----------------------------------------------------------------
     2. 수강 → 검증 → 완료 3단계
     ----------------------------------------------------------------- */

  function renderStage() {
    var courses = myCourses();
    var track = $('stage-track');
    var say = $('stage-say');
    var actions = $('stage-actions');
    actions.textContent = '';

    function mark(step, value) {
      var li = track.querySelector('[data-step="' + step + '"]');
      if (li) li.setAttribute('data-state', value);
    }

    if (!courses.length) {
      ['learn', 'quiz', 'done'].forEach(function (s) { mark(s, 'wait'); });
      say.textContent = '아직 받을 교육이 없습니다. 관리자가 교육을 만들면 여기 나옵니다.';
      return;
    }

    // 가장 급한 교육 하나를 고른다 — 미수강 > 검증 대기 > 완료
    var todo = courses.filter(function (c) { return stateOf(c.id) === 'todo'; })[0];
    var verify = courses.filter(function (c) { return stateOf(c.id) === 'verify'; })[0];
    var target = todo || verify || courses[0];
    var state = stateOf(target.id);

    if (state === 'todo') {
      mark('learn', 'now'); mark('quiz', 'wait'); mark('done', 'wait');
      say.textContent = '"' + target.title + '" 을 아직 듣지 않았습니다.';
      actions.appendChild(bigLink('🎧', '교육 듣기', 'learn.html'));
    } else if (state === 'verify') {
      mark('learn', 'done'); mark('quiz', 'now'); mark('done', 'wait');
      say.textContent = '"' + target.title + '" 을 들었습니다. 이해했는지 확인이 남았습니다.';
      actions.appendChild(bigLink('👆', '이해 확인하기',
        'quiz.html?course=' + encodeURIComponent(target.id)));
    } else {
      mark('learn', 'done'); mark('quiz', 'done'); mark('done', 'done');
      say.textContent = '받아야 할 교육을 모두 마쳤습니다.';
      actions.appendChild(bigLink('🙋', '내 기록 보기', 'my.html'));
    }

    // 상태를 소리로도 알려 준다
    var listen = UI.audioButton(function () {
      return { text: say.textContent, lang: 'ko' };
    }, '내 교육 상태 듣기');
    listen.classList.add('inline-audio');
    say.appendChild(listen);
  }

  function bigLink(icon, label, href) {
    var a = UI.el('a', 'btn btn-primary');
    a.href = href;
    var ico = UI.el('span', null, icon);
    ico.setAttribute('aria-hidden', 'true');
    a.appendChild(ico);
    a.appendChild(document.createTextNode(' ' + label));
    return a;
  }

  /* -----------------------------------------------------------------
     3. 메뉴 4갈래 — 픽토그램 + 글자 + 음성
     ----------------------------------------------------------------- */

  var MENU = [
    { icon: '🎧', label: '안전교육 듣기', href: 'learn.html', say: '안전교육을 듣습니다' },
    { icon: '📷', label: '위험한 곳 알리기', href: 'report.html', say: '위험한 곳을 알립니다. 이름은 남지 않습니다' },
    { icon: '💬', label: '물어보기', href: 'talk.html', say: '궁금한 것을 물어봅니다' },
    { icon: '🙋', label: '내 기록', href: 'my.html', say: '내 교육 기록을 봅니다' }
  ];

  function renderMenu() {
    var box = $('bigmenu');
    box.textContent = '';

    MENU.forEach(function (item) {
      var cell = UI.el('div', 'bigmenu-cell');

      var a = UI.el('a', 'bigmenu-link');
      a.href = item.href;
      var ico = UI.el('span', 'ico', item.icon);
      ico.setAttribute('aria-hidden', 'true');
      a.appendChild(ico);
      a.appendChild(UI.el('span', 'name', item.label));
      cell.appendChild(a);

      // 글자를 못 읽어도 무엇인지 알 수 있게
      cell.appendChild(UI.audioButton(function () {
        return { text: item.say, lang: 'ko' };
      }, item.label + ' 설명 듣기'));

      box.appendChild(cell);
    });
  }

  /* -----------------------------------------------------------------
     4. 번역 이상 신고 안내 — 음성으로도
     ----------------------------------------------------------------- */

  function renderBadTrans() {
    var box = $('badtrans-listen');
    box.textContent = '';
    box.appendChild(UI.audioButton(function () {
      return {
        text: '안전 문구의 말이 이상하면 관리자에게 알려 주세요. 알려 주신 분이 누구인지는 기록하지 않습니다.',
        lang: 'ko'
      };
    }, '안내 듣기'));
    box.appendChild(UI.el('span', 'label', '설명 듣기'));
  }

  function renderVoiceNote() {
    var note = UI.voiceNote(me.lang);
    var box = $('voicenote');
    box.textContent = note;
    box.hidden = !note;
  }

  /* -----------------------------------------------------------------
     그리기
     ----------------------------------------------------------------- */

  function render() {
    renderVoiceNote();
    renderToday();
    renderStage();
    renderMenu();
    renderBadTrans();
  }

  /* 안전 문구 넘겨 보기 (C5).
     교육에 들어가지 않아도 안전 지시가 여러 번 닿게 하는 것이 목적이다. */
  $('today-prev').addEventListener('click', function () { stepPhrase(-1); });
  $('today-next').addEventListener('click', function () { stepPhrase(1); });

  window.addEventListener('pagehide', UI.stopSpeak);
  UI.onVoicesReady(renderVoiceNote);

  window.addEventListener('storage', function (e) {
    if (e.key === Store.courses.KEY || e.key === Store.library.KEY ||
        e.key === Store.progress.KEY || e.key === Store.setup.KEY) render();
  });

  render();
})();
