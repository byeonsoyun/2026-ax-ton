/* ===================================================================
   report.js — 기능8 위험요소 신고

   담당: P2
   기능번호: 기능8
   읽는 키: setup, reports
   쓰는 키: reports
   근거: SCREEN 기능8 · PRD §9.2

   ★★ 이 화면의 첫 번째 규칙: 신고는 익명이다.

     Store.reports 에 신고자를 식별할 수 있는 값을 절대 넣지 않는다.
     userId · workerId · author · 로그인 정보 · 공정 소속으로 역추적될
     좁은 정보 어느 것도 넣지 않는다.

     익명성이 깨지면 신고가 멈춘다. 그러면 재해가 나기 전에 알 방법이
     사라지고, 이 제품이 내세우는 선행지표도 함께 없어진다.
     기능이 하나 줄어드는 것이 아니라 제품의 전제가 무너진다.

   ★ 글을 쓰지 못해도 신고가 끝나야 한다.
     설비 그림 + 위험유형 픽토그램 두 번만 누르면 접수된다.
     메모는 선택이고, 안 써도 아무 문제 없다고 화면에 적는다.

   ★ 접수 번호(ticket)에는 누구인지가 들어 있지 않다.
     시각과 무작위 값만 쓴다. 나중에 조치 결과를 물어볼 실마리는 주되
     역추적 통로는 만들지 않는다.

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

  /* 로그인한 사람이 누구인지는 화면을 그리는 데만 쓴다.
     ★ 저장할 값에는 절대 섞지 않는다. */
  function whoAmI() {
    var state = Store.setup.load();
    var row = Store.findBy(state.workers, 'id', user.userId) || {};
    return {
      lang: user.lang || row.lang || 'ko',
      processId: user.processId || row.processId || ''
    };
  }

  var me = whoAmI();

  /* -----------------------------------------------------------------
     읽기
     ----------------------------------------------------------------- */

  /* 내 공정 설비를 먼저 보여 준다. 지금 서 있는 곳이 위에 있어야 빨리 누른다.
     다른 공정 설비도 고를 수 있게 둔다 — 지나가다 본 위험도 신고해야 한다. */
  function equipmentChoices() {
    var state = Store.setup.load();
    var mine = [];
    var others = [];

    state.equipments.forEach(function (eq) {
      if (me.processId && eq.processId === me.processId) mine.push(eq);
      else others.push(eq);
    });

    return mine.concat(others);
  }

  function processName(id) {
    var p = Store.findBy(Store.setup.load().processes, 'id', id);
    return p ? p.name : '';
  }

  function renderVoiceNote() {
    var note = UI.voiceNote(me.lang);
    var box = $('voicenote');
    box.textContent = note;
    box.hidden = !note;
  }

  /* -----------------------------------------------------------------
     고르기 — 그림으로
     ----------------------------------------------------------------- */

  function buildPickers() {
    var equipBox = $('pick-equip');
    equipBox.textContent = '';

    var list = equipmentChoices();
    if (!list.length) {
      equipBox.appendChild(UI.el('p', 'empty',
        '등록된 설비가 없습니다. 관리자가 설비를 등록하면 여기 나옵니다.'));
    } else {
      list.forEach(function (eq) {
        equipBox.appendChild(UI.chip({
          type: 'radio', name: 'equip', value: eq.id,
          icon: eq.icon, label: eq.name, sub: processName(eq.processId)
        }));
      });
    }

    var hazBox = $('pick-hazard');
    hazBox.textContent = '';
    Store.HAZARDS.forEach(function (h) {
      hazBox.appendChild(UI.chip({
        type: 'radio', name: 'hazard', value: h.code,
        icon: h.icon, label: h.label
      }));
    });
  }

  function badge(node, done, doneText) {
    node.className = 'badge ' + (done ? 'badge-ok' : 'badge-neutral');
    node.textContent = '';
    var icon = UI.el('span', null, done ? '✓' : '○');
    icon.setAttribute('aria-hidden', 'true');
    node.appendChild(icon);
    node.appendChild(document.createTextNode(' ' + (done ? doneText : '미선택')));
  }

  function refreshBadges() {
    var eqId = UI.pickedValue('equip');
    var haz = UI.pickedValue('hazard');
    var eq = eqId ? Store.findBy(Store.setup.load().equipments, 'id', eqId) : null;
    var h = haz ? Store.hazard(haz) : null;
    badge($('b-equip'), !!eq, eq ? eq.name : '');
    badge($('b-hazard'), !!h, h ? h.label : '');
  }

  /* -----------------------------------------------------------------
     접수 번호 — 누구인지가 들어 있지 않다
     ----------------------------------------------------------------- */

  function makeTicket() {
    // 날짜 + 무작위 4자리. 사람과 이어지는 값을 쓰지 않는다.
    var now = new Date();
    var day = String(now.getFullYear()).slice(2) +
      ('0' + (now.getMonth() + 1)).slice(-2) +
      ('0' + now.getDate()).slice(-2);
    var rand = String(Math.floor(Math.random() * 10000));
    while (rand.length < 4) rand = '0' + rand;
    return 'R-' + day + '-' + rand;
  }

  /* -----------------------------------------------------------------
     보내기

     ★ 저장하는 값은 이 여섯 개뿐이다.
       id · processId · equipmentId · hazard · memo · status · createdAt · ticket
       사람과 이어지는 값은 하나도 없다.
     ----------------------------------------------------------------- */

  function send() {
    var equipmentId = UI.pickedValue('equip');
    var hazard = UI.pickedValue('hazard');

    if (!equipmentId) { UI.toast('어디인지 먼저 골라 주세요.'); return; }
    if (!hazard) { UI.toast('무엇이 위험한지 골라 주세요.'); return; }

    var eq = Store.findBy(Store.setup.load().equipments, 'id', equipmentId);
    var ticket = makeTicket();

    var result = Store.reports.update(function (list) {
      list.push({
        id: Store.uid(),
        ticket: ticket,
        // 설비가 속한 공정을 적는다. 담당자가 어디를 봐야 하는지 알아야 한다.
        // 이 값은 설비에서 나온 것이고, 신고한 사람에게서 나온 것이 아니다.
        processId: eq ? eq.processId : '',
        equipmentId: equipmentId,
        hazard: hazard,
        memo: $('memo').value.trim(),
        status: 'received',
        createdAt: new Date().toISOString()
      });
    });

    if (!result.ok) {
      UI.toast('보내지 못했습니다. 이 브라우저의 저장소가 막혀 있습니다.');
      return;
    }

    showDone(ticket);
    render();
  }

  function showDone(ticket) {
    $('view-form').hidden = true;
    $('view-done').hidden = false;
    $('ticket').textContent = ticket;

    var listen = $('done-listen');
    listen.textContent = '';
    listen.appendChild(UI.audioButton(function () {
      return { text: '알려 주셔서 고맙습니다. 접수 번호는 ' + ticket + ' 입니다.', lang: 'ko' };
    }, '접수 안내 듣기'));
    listen.appendChild(UI.el('span', 'label', '들어 보기'));

    UI.speak({ text: '알려 주셔서 고맙습니다. 접수되었습니다.', lang: 'ko' });
    window.scrollTo(0, 0);
  }

  function reset() {
    UI.$$('input[name="equip"]').forEach(function (n) { n.checked = false; });
    UI.$$('input[name="hazard"]').forEach(function (n) { n.checked = false; });
    $('memo').value = '';
    refreshBadges();
    $('view-done').hidden = true;
    $('view-form').hidden = false;
    window.scrollTo(0, 0);
  }

  /* -----------------------------------------------------------------
     들어온 신고 목록

     ★ "내 신고" 를 보여 줄 수 없다. 익명이라 누가 냈는지 저장하지 않으므로
       가려낼 방법이 없다. 그게 익명이라는 뜻이다.
       그래서 현장 전체의 신고를 보여 주고, 왜 그런지 화면에 적는다.
     ----------------------------------------------------------------- */

  function renderList() {
    var list = $('report-list');
    list.textContent = '';

    var state = Store.setup.load();
    var all = Store.reports.load().slice().sort(function (a, b) {
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    });

    $('list-why').textContent =
      '누가 알렸는지는 저장되지 않으므로 "내가 낸 것" 만 골라 볼 수 없습니다. ' +
      '그게 이름을 남기지 않는다는 뜻입니다.';

    if (!all.length) {
      list.appendChild(UI.emptyRow('아직 들어온 신고가 없습니다.'));
      return;
    }

    all.forEach(function (r) {
      var eq = Store.findBy(state.equipments, 'id', r.equipmentId);
      var haz = Store.hazard(r.hazard);

      var li = UI.el('li', 'report-item');

      var ico = UI.el('span', 'ico', haz ? haz.icon : '⚠');
      ico.setAttribute('aria-hidden', 'true');
      li.appendChild(ico);

      var body = UI.el('div', 'body');
      body.appendChild(UI.el('strong', null,
        (haz ? haz.label : '위험') + ' · ' + (eq ? eq.name : '설비 미지정')));
      if (r.memo) body.appendChild(UI.el('p', 'memo', r.memo));
      body.appendChild(UI.el('p', 'meta',
        [r.ticket, UI.formatDate(r.createdAt)].filter(Boolean).join(' · ')));
      li.appendChild(body);

      // 처리 상태 — 알린 것이 어떻게 됐는지 보여야 다음에도 알린다
      if (r.status === 'resolved') li.appendChild(UI.okBadge('조치됨'));
      else if (r.status === 'urgent') li.appendChild(UI.stopBadge('긴급'));
      else li.appendChild(UI.waitBadge('확인 중'));

      list.appendChild(li);
    });
  }

  function renderAnonListen() {
    var box = $('anon-listen');
    box.textContent = '';
    box.appendChild(UI.audioButton(function () {
      return {
        text: '누가 알렸는지는 저장하지 않습니다. 관리자도 알 수 없습니다. 걱정하지 말고 알려 주세요.',
        lang: 'ko'
      };
    }, '익명 안내 듣기'));
    box.appendChild(UI.el('span', 'label', '설명 듣기'));
  }

  /* -----------------------------------------------------------------
     그리기
     ----------------------------------------------------------------- */

  function render() {
    renderVoiceNote();
    renderList();
    refreshBadges();
  }

  /* -----------------------------------------------------------------
     이벤트 연결
     ----------------------------------------------------------------- */

  $('pick-equip').addEventListener('change', refreshBadges);
  $('pick-hazard').addEventListener('change', refreshBadges);
  $('btn-send').addEventListener('click', send);
  $('btn-again').addEventListener('click', reset);

  window.addEventListener('pagehide', UI.stopSpeak);
  UI.onVoicesReady(renderVoiceNote);

  window.addEventListener('storage', function (e) {
    if (e.key === Store.reports.KEY || e.key === Store.setup.KEY) render();
  });

  buildPickers();
  renderAnonListen();
  render();
})();
