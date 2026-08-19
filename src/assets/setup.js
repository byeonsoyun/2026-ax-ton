/* ===================================================================
   setup.js — 기능1 화면 로직

   상태는 localStorage 한 곳에만 있다. 이 파일은 상태를 들고 있지 않고,
   바뀔 때마다 Store.load() 로 다시 읽어서 화면 전체를 다시 그린다.
   화면이 여러 곳에 흩어져 있어서, 부분 갱신을 하면 어느 한 군데가
   금방 실제 데이터와 어긋난다.

   문서에서 온 규칙 중 이 파일이 코드로 지키는 것 두 가지 —
   · 등록하지 않은 언어는 어디에도 나오지 않는다 (노동자 언어 select)
   · 공정이 없으면 설비를 만들 수 없다 (설비 폼 잠금)
   =================================================================== */

(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  /* 사용자가 넣은 문자열은 항상 텍스트로만 넣는다.
     innerHTML 로 이름을 끼워 넣으면 설비 이름 한 줄로 화면이 깨진다. */
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  var toastTimer = null;
  function toast(msg) {
    var box = $('toast');
    box.textContent = msg;
    box.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { box.hidden = true; }, 2200);
  }

  /* 선택 칩 하나. label 로 감싸서 클릭 영역이 칩 전체가 되게 한다. */
  function chip(opts) {
    var label = el('label');
    var input = document.createElement('input');
    input.type = opts.type;
    input.name = opts.name;
    input.value = opts.value;
    if (opts.checked) input.checked = true;

    var box = el('span', 'chip');
    if (opts.icon) box.appendChild(el('span', 'ico', opts.icon));
    if (opts.label) box.appendChild(el('span', null, opts.label));
    if (opts.sub) box.appendChild(el('span', 'sub', opts.sub));
    box.appendChild(el('span', 'mark', '✓'));

    label.appendChild(input);
    label.appendChild(box);
    return label;
  }

  function badge(node, done, doneText, todoText) {
    node.className = 'badge ' + (done ? 'badge-ok' : 'badge-neutral');
    node.textContent = '';
    var icon = el('span', null, done ? '✓' : '○');
    icon.setAttribute('aria-hidden', 'true');
    node.appendChild(icon);
    node.appendChild(document.createTextNode(' ' + (done ? doneText : todoText)));
  }

  function langName(code) {
    for (var i = 0; i < Store.LANGUAGES.length; i++) {
      if (Store.LANGUAGES[i].code === code) return Store.LANGUAGES[i].name;
    }
    return code;
  }

  function hazardOf(code) {
    for (var i = 0; i < Store.HAZARDS.length; i++) {
      if (Store.HAZARDS[i].code === code) return Store.HAZARDS[i];
    }
    return null;
  }

  function processName(state, id) {
    for (var i = 0; i < state.processes.length; i++) {
      if (state.processes[i].id === id) return state.processes[i].name;
    }
    return '삭제된 공정';
  }

  /* select 를 다시 채우되 고르던 값은 살린다.
     목록을 갈아끼울 때마다 선택이 첫 항목으로 튀면 입력하다 말고 다시 골라야 한다. */
  function fillSelect(select, items, getValue, getLabel) {
    var keep = select.value;
    select.textContent = '';
    for (var i = 0; i < items.length; i++) {
      var opt = document.createElement('option');
      opt.value = getValue(items[i]);
      opt.textContent = getLabel(items[i]);
      select.appendChild(opt);
    }
    if (keep) select.value = keep;
    if (!select.value && items.length) select.selectedIndex = 0;
  }

  /* -----------------------------------------------------------------
     한 번만 만드는 부분 — 고정 목록에서 나오는 칩과 select
     ----------------------------------------------------------------- */

  function buildStaticControls() {
    var size = $('site-size');
    for (var i = 0; i < Store.SIZE_BANDS.length; i++) {
      var opt = document.createElement('option');
      opt.value = Store.SIZE_BANDS[i];
      opt.textContent = Store.SIZE_BANDS[i];
      size.appendChild(opt);
    }

    var langBox = $('pick-lang');
    Store.LANGUAGES.forEach(function (lang) {
      langBox.appendChild(chip({
        type: 'checkbox', name: 'lang', value: lang.code,
        label: lang.name, sub: lang.native
      }));
    });

    var hazBox = $('pick-hazard');
    Store.HAZARDS.forEach(function (h) {
      hazBox.appendChild(chip({
        type: 'checkbox', name: 'hazard', value: h.code,
        icon: h.icon, label: h.label
      }));
    });

    [['pick-proc-icon', 'proc-icon'], ['pick-equip-icon', 'equip-icon']].forEach(function (pair) {
      var box = $(pair[0]);
      Store.ICONS.forEach(function (icon, idx) {
        box.appendChild(chip({
          type: 'radio', name: pair[1], value: icon,
          icon: icon, checked: idx === 0
        }));
      });
    });
  }

  function checkedValues(name) {
    var nodes = document.querySelectorAll('input[name="' + name + '"]:checked');
    var out = [];
    for (var i = 0; i < nodes.length; i++) out.push(nodes[i].value);
    return out;
  }

  function pickedValue(name) {
    var node = document.querySelector('input[name="' + name + '"]:checked');
    return node ? node.value : '';
  }

  /* -----------------------------------------------------------------
     그리기 — 상태가 바뀔 때마다 전부 다시 그린다
     ----------------------------------------------------------------- */

  function render() {
    var state = Store.load();

    /* --- 상단 머리띠 --- */
    $('head-site').textContent = state.site.name || '사업장 미등록';
    $('head-size').textContent = state.site.name
      ? state.site.sizeBand + ' · 노동자 ' + state.workers.length + '명'
      : '설정을 마치면 이 구성을 기준으로 모든 교육이 만들어집니다';

    /* --- 1. 사업장 --- */
    if (document.activeElement !== $('site-name')) $('site-name').value = state.site.name;
    $('site-size').value = state.site.sizeBand;
    badge($('b-site'), !!state.site.name, '등록됨', '미설정');

    /* --- 2. 언어 --- */
    var langInputs = document.querySelectorAll('input[name="lang"]');
    for (var i = 0; i < langInputs.length; i++) {
      langInputs[i].checked = state.languages.indexOf(langInputs[i].value) !== -1;
    }
    badge($('b-lang'), state.languages.length > 0, state.languages.length + '개 언어', '미설정');

    /* --- 3. 공정 --- */
    renderProcesses(state);
    badge($('b-proc'), state.processes.length > 0, state.processes.length + '개 공정', '미설정');

    /* --- 4. 설비 --- */
    // 공정이 없으면 설비를 만들 수 없다. 문구가 아니라 폼 자체를 잠근다.
    var hasProcess = state.processes.length > 0;
    $('equip-lock').hidden = hasProcess;
    $('equip-fields').disabled = !hasProcess;
    fillSelect($('equip-proc'), state.processes,
      function (p) { return p.id; },
      function (p) { return p.icon + '  ' + p.name; });
    renderEquipments(state);
    badge($('b-equip'), state.equipments.length > 0, state.equipments.length + '대', '미설정');

    /* --- 5. 노동자 --- */
    // 언어 select 에는 2번에서 켠 언어만 나온다.
    // "등록 안 한 언어는 이후 어떤 화면에도 안 나온다"는 규칙이 여기서 실제로 지켜진다.
    var ready = hasProcess && state.languages.length > 0;
    $('worker-lock').hidden = ready;
    $('worker-fields').disabled = !ready;
    fillSelect($('worker-lang'), state.languages,
      function (code) { return code; },
      function (code) { return langName(code); });
    fillSelect($('worker-proc'), state.processes,
      function (p) { return p.id; },
      function (p) { return p.icon + '  ' + p.name; });
    renderWorkers(state);
    badge($('b-worker'), state.workers.length > 0, state.workers.length + '명', '미설정');

    /* --- 우측 요약 --- */
    renderSummary(state);
  }

  function emptyRow(list, text) {
    var li = el('li');
    li.appendChild(el('p', 'empty', text));
    list.appendChild(li);
  }

  function itemRow(icon, title, meta) {
    var li = el('li', 'item');
    li.appendChild(el('span', 'ico', icon));
    var body = el('div', 'body');
    body.appendChild(el('strong', null, title));
    if (meta) body.appendChild(el('p', 'meta', meta));
    li.appendChild(body);
    return li;
  }

  function deleteButton(label, onClick) {
    var row = el('div', 'btn-row');
    var btn = el('button', 'btn-sm danger', '삭제');
    btn.type = 'button';
    btn.setAttribute('aria-label', label);
    btn.addEventListener('click', onClick);
    row.appendChild(btn);
    return row;
  }

  function renderProcesses(state) {
    var list = $('list-proc');
    list.textContent = '';
    if (!state.processes.length) {
      emptyRow(list, '아직 등록된 공정이 없습니다. 위에서 하나 추가해 주세요.');
      return;
    }
    state.processes.forEach(function (p) {
      var used = state.equipments.filter(function (e) { return e.processId === p.id; }).length;
      var li = itemRow(p.icon, p.name, used ? '설비 ' + used + '대' : '설비 없음');
      li.appendChild(deleteButton(p.name + ' 공정 삭제', function () { removeProcess(p); }));
      list.appendChild(li);
    });
  }

  function renderEquipments(state) {
    var list = $('list-equip');
    list.textContent = '';
    if (!state.equipments.length) {
      emptyRow(list, '아직 등록된 설비가 없습니다.');
      return;
    }
    state.equipments.forEach(function (eq) {
      var li = itemRow(eq.icon, eq.name, processName(state, eq.processId));

      var tags = el('div', 'tags');
      if (!eq.hazards.length) {
        tags.appendChild(el('span', 'badge badge-neutral', '위험유형 없음'));
      } else {
        eq.hazards.forEach(function (code) {
          var h = hazardOf(code);
          if (!h) return;
          var b = el('span', 'badge badge-wait');
          var icon = el('span', null, h.icon);
          icon.setAttribute('aria-hidden', 'true');
          b.appendChild(icon);
          b.appendChild(document.createTextNode(' ' + h.label));
          tags.appendChild(b);
        });
      }
      li.querySelector('.body').appendChild(tags);

      li.appendChild(deleteButton(eq.name + ' 설비 삭제', function () { removeEquipment(eq); }));
      list.appendChild(li);
    });
  }

  function renderWorkers(state) {
    var list = $('list-worker');
    list.textContent = '';
    if (!state.workers.length) {
      emptyRow(list, '아직 등록된 노동자가 없습니다.');
      return;
    }
    state.workers.forEach(function (w) {
      var li = itemRow('👷', w.id, langName(w.lang) + ' · ' + processName(state, w.processId));
      li.appendChild(deleteButton(w.id + ' 삭제', function () { removeWorker(w); }));
      list.appendChild(li);
    });
  }

  function renderSummary(state) {
    var steps = [
      { what: '1. 사업장 기본정보', done: !!state.site.name,          note: state.site.name || '미입력' },
      { what: '2. 사용 언어',      done: state.languages.length > 0,  note: state.languages.length + '개' },
      { what: '3. 공정',           done: state.processes.length > 0,  note: state.processes.length + '개' },
      { what: '4. 설비',           done: state.equipments.length > 0, note: state.equipments.length + '대' },
      { what: '5. 노동자',         done: state.workers.length > 0,    note: state.workers.length + '명' }
    ];

    var list = $('checklist');
    list.textContent = '';
    steps.forEach(function (s) {
      var li = el('li');
      li.setAttribute('data-done', s.done ? 'yes' : 'no');
      li.appendChild(el('span', 'what', s.what));
      var b = el('span', 'badge ' + (s.done ? 'badge-ok' : 'badge-neutral'));
      var icon = el('span', null, s.done ? '✓' : '○');
      icon.setAttribute('aria-hidden', 'true');
      b.appendChild(icon);
      b.appendChild(document.createTextNode(' ' + s.note));
      li.appendChild(b);
      list.appendChild(li);
    });

    $('kpi-equip').textContent = '';
    $('kpi-equip').appendChild(document.createTextNode(String(state.equipments.length)));
    $('kpi-equip').appendChild(el('small', null, '대'));

    $('kpi-worker').textContent = '';
    $('kpi-worker').appendChild(document.createTextNode(String(state.workers.length)));
    $('kpi-worker').appendChild(el('small', null, '명'));

    $('updated-at').textContent = state.updatedAt
      ? '마지막 저장 ' + new Date(state.updatedAt).toLocaleString('ko-KR')
      : '아직 저장된 내용이 없습니다.';
  }

  /* -----------------------------------------------------------------
     쓰기 — 전부 Store.update 한 사이클을 지난다
     ----------------------------------------------------------------- */

  function commit(fn, message) {
    var result = Store.update(fn);
    render();
    if (!result.ok) {
      toast('저장하지 못했습니다. 이 브라우저의 저장소가 막혀 있습니다.');
    } else if (message) {
      toast(message);
    }
  }

  function removeProcess(p) {
    var state = Store.load();
    var equipCount = state.equipments.filter(function (e) { return e.processId === p.id; }).length;
    var workerCount = state.workers.filter(function (w) { return w.processId === p.id; }).length;

    // 공정을 지우면 그 아래 설비와 노동자의 소속이 사라진다. 무엇이 함께 지워지는지 먼저 말한다.
    var msg = '"' + p.name + '" 공정을 삭제할까요?';
    if (equipCount || workerCount) {
      msg += '\n\n설비 ' + equipCount + '대와 노동자 ' + workerCount + '명도 함께 삭제됩니다.';
    }
    if (!window.confirm(msg)) return;

    commit(function (s) {
      s.processes = s.processes.filter(function (x) { return x.id !== p.id; });
      s.equipments = s.equipments.filter(function (x) { return x.processId !== p.id; });
      s.workers = s.workers.filter(function (x) { return x.processId !== p.id; });
    }, '공정을 삭제했습니다.');
  }

  function removeEquipment(eq) {
    if (!window.confirm('"' + eq.name + '" 설비를 삭제할까요?')) return;
    commit(function (s) {
      s.equipments = s.equipments.filter(function (x) { return x.id !== eq.id; });
    }, '설비를 삭제했습니다.');
  }

  function removeWorker(w) {
    if (!window.confirm('"' + w.id + '" 을(를) 삭제할까요?')) return;
    commit(function (s) {
      s.workers = s.workers.filter(function (x) { return x.id !== w.id; });
    }, '노동자를 삭제했습니다.');
  }

  function bindEvents() {
    /* 1. 사업장 */
    $('form-site').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('site-name').value.trim();
      if (!name) { toast('사업장명을 입력해 주세요.'); $('site-name').focus(); return; }
      var size = $('site-size').value;
      commit(function (s) { s.site.name = name; s.site.sizeBand = size; }, '사업장 정보를 저장했습니다.');
    });

    /* 2. 언어 — 고르는 즉시 저장 */
    $('pick-lang').addEventListener('change', function () {
      var picked = checkedValues('lang');
      commit(function (s) { s.languages = picked; });
    });

    /* 3. 공정 */
    $('form-proc').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('proc-name').value.trim();
      if (!name) { toast('공정 이름을 입력해 주세요.'); $('proc-name').focus(); return; }

      var state = Store.load();
      var dup = state.processes.some(function (p) { return p.name === name; });
      if (dup) { toast('같은 이름의 공정이 이미 있습니다.'); return; }

      var icon = pickedValue('proc-icon') || Store.ICONS[0];
      commit(function (s) {
        s.processes.push({ id: Store.uid(), name: name, icon: icon });
      }, '공정을 추가했습니다.');
      $('proc-name').value = '';
      $('proc-name').focus();
    });

    /* 4. 설비 */
    $('form-equip').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('equip-name').value.trim();
      if (!name) { toast('설비 이름을 입력해 주세요.'); $('equip-name').focus(); return; }

      var processId = $('equip-proc').value;
      if (!processId) { toast('소속 공정을 골라 주세요.'); return; }

      var hazards = checkedValues('hazard');
      var icon = pickedValue('equip-icon') || Store.ICONS[0];

      commit(function (s) {
        s.equipments.push({
          id: Store.uid(), processId: processId, name: name,
          icon: icon, hazards: hazards, note: ''
        });
      }, '설비를 추가했습니다.');

      $('equip-name').value = '';
      // 위험유형은 초기화한다. 다음 설비에 앞 설비의 위험이 딸려 들어가면 안 된다.
      var boxes = document.querySelectorAll('input[name="hazard"]');
      for (var i = 0; i < boxes.length; i++) boxes[i].checked = false;
      $('equip-name').focus();
    });

    /* 5. 노동자 */
    $('form-worker').addEventListener('submit', function (e) {
      e.preventDefault();
      var id = $('worker-id').value.trim();
      if (!id) { toast('식별번호를 입력해 주세요.'); $('worker-id').focus(); return; }

      var state = Store.load();
      if (state.workers.some(function (w) { return w.id === id; })) {
        toast('이미 등록된 식별번호입니다.');
        return;
      }

      var lang = $('worker-lang').value;
      var processId = $('worker-proc').value;
      if (!lang || !processId) { toast('언어와 공정을 골라 주세요.'); return; }

      commit(function (s) {
        s.workers.push({ id: id, lang: lang, processId: processId });
      }, '노동자를 추가했습니다.');

      $('worker-id').value = '';
      $('worker-id').focus();
    });

    /* 데이터 주고받기 */
    $('btn-export').addEventListener('click', function () {
      $('jsonbox').value = Store.exportJSON();
      $('jsonbox').select();
      toast('JSON 을 아래 상자에 꺼냈습니다. 복사해 두세요.');
    });

    $('btn-import').addEventListener('click', function () {
      var text = $('jsonbox').value.trim();
      if (!text) { toast('불러올 JSON 을 아래 상자에 붙여넣어 주세요.'); return; }
      if (!window.confirm('지금 저장된 내용을 붙여넣은 JSON 으로 덮어씁니다. 계속할까요?')) return;

      var result = Store.importJSON(text);
      if (!result.ok) { toast('불러오지 못했습니다 — ' + result.reason); return; }
      render();
      toast('불러왔습니다.');
    });

    $('btn-reset').addEventListener('click', function () {
      if (!window.confirm('이 브라우저에 저장된 설정을 전부 지웁니다.\n되돌릴 수 없습니다. 계속할까요?')) return;
      Store.reset();
      $('jsonbox').value = '';
      render();
      toast('초기화했습니다.');
    });

    /* 다른 탭에서 같은 페이지를 열어 두고 고쳤을 때 이 탭도 따라간다 */
    window.addEventListener('storage', function (e) {
      if (e.key === Store.KEY) render();
    });
  }

  buildStaticControls();
  bindEvents();
  $('blocked').hidden = Store.available();
  render();
})();
