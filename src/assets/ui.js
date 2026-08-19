/* ===================================================================
   ui.js — 화면 다섯 개가 똑같이 다시 만들게 되는 조각들

   ★ 여기 있는 것을 각자 화면에서 다시 만들지 말 것.
     같은 배지를 네 사람이 네 가지 모양으로 만들면 그때부터 디자인이 흩어진다.

   ★ 새로 필요한 공용 조각이 생기면 팀에 말하고 여기 추가한다.
     이 파일은 네 명이 공유하므로, 말없이 고치면 충돌한다.

   문서에서 온 규칙 중 이 파일이 지키는 것
     · 상태는 색만으로 구분하지 않는다 — 배지는 아이콘 + 글자 + 색 3중
     · 사용자가 넣은 문자열은 항상 textContent 로만 넣는다 (innerHTML 금지)
   =================================================================== */

var UI = (function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* 요소 하나 만들기.
     텍스트를 textContent 로만 넣는다 — 설비 이름 한 줄로 화면이 깨지면 안 된다. */
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  /* 상태 배지 — 아이콘 + 글자 + 색.
     흑백으로 봐도 뜻이 남아야 한다 (SCREEN §4 · PRD §9.4) */
  function badge(kind, icon, text) {
    var node = el('span', 'badge ' + kind);
    var i = el('span', null, icon);
    i.setAttribute('aria-hidden', 'true');
    node.appendChild(i);
    node.appendChild(document.createTextNode(' ' + text));
    return node;
  }

  function okBadge(text)      { return badge('badge-ok', '✓', text); }
  function waitBadge(text)    { return badge('badge-wait', '●', text); }
  function stopBadge(text)    { return badge('badge-stop', '!', text); }
  function neutralBadge(text) { return badge('badge-neutral', '○', text); }

  /* 검수 상태 배지 — library 의 status 를 그대로 받는다 */
  function phraseBadge(status) {
    var s = Store.PHRASE_STATUS[status] || Store.PHRASE_STATUS.waiting;
    return badge(s.badge, s.icon, s.label);
  }

  /* 선택 칩 — 언어 / 위험유형 / 픽토그램.
     체크박스를 감춘 label 이다. :has() 없이 :checked + span 으로 칠해서
     구형 안드로이드 웹뷰에서도 상태가 보인다 (PRD §9.1 저사양 지원). */
  function chip(opts) {
    var label = el('label');
    var input = document.createElement('input');
    input.type = opts.type || 'checkbox';
    input.name = opts.name;
    input.value = opts.value;
    if (opts.checked) input.checked = true;
    if (opts.disabled) input.disabled = true;

    var box = el('span', 'chip');
    if (opts.icon) box.appendChild(el('span', 'ico', opts.icon));
    if (opts.label) box.appendChild(el('span', null, opts.label));
    if (opts.sub) box.appendChild(el('span', 'sub', opts.sub));
    box.appendChild(el('span', 'mark', '✓'));

    label.appendChild(input);
    label.appendChild(box);
    return label;
  }

  function checkedValues(name, root) {
    return $$('input[name="' + name + '"]:checked', root).map(function (n) { return n.value; });
  }

  function pickedValue(name, root) {
    var node = (root || document).querySelector('input[name="' + name + '"]:checked');
    return node ? node.value : '';
  }

  /* select 를 다시 채우되 고르던 값은 살린다.
     목록을 갈아끼울 때마다 선택이 첫 항목으로 튀면 입력하다 말고 다시 골라야 한다. */
  function fillSelect(select, items, getValue, getLabel) {
    var keep = select.value;
    select.textContent = '';
    items.forEach(function (item) {
      var opt = document.createElement('option');
      opt.value = getValue(item);
      opt.textContent = getLabel(item);
      select.appendChild(opt);
    });
    if (keep) select.value = keep;
    if (!select.value && items.length) select.selectedIndex = 0;
  }

  /* 저장됐다는 사실이 눈에 보여야 한다 */
  var toastTimer = null;
  function toast(msg) {
    var box = $('toast');
    if (!box) {                       // 페이지에 자리가 없으면 하나 만들어 둔다
      box = el('div', 'toast');
      box.id = 'toast';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    box.textContent = msg;
    box.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { box.hidden = true; }, 2200);
  }

  /* 빈 목록 — 무엇을 하면 되는지 한 줄로 말한다 */
  function emptyRow(text) {
    var li = el('li');
    li.appendChild(el('p', 'empty', text));
    return li;
  }

  /* 목록 한 줄 — 아이콘 + 제목 + 부제 */
  function itemRow(icon, title, meta) {
    var li = el('li', 'item');
    li.appendChild(el('span', 'ico', icon));
    var body = el('div', 'body');
    body.appendChild(el('strong', null, title));
    if (meta) body.appendChild(el('p', 'meta', meta));
    li.appendChild(body);
    return li;
  }

  /* 관리자 화면 상단 머리띠를 채운다. 세 화면이 똑같이 필요하다. */
  function fillAdminBar(user) {
    var setup = Store.setup.load();
    var nameNode = $('head-site');
    var subNode = $('head-sub');
    if (nameNode) nameNode.textContent = setup.site.name || user.siteName || '사업장 미등록';
    if (subNode) {
      subNode.textContent = [user.name, user.title].filter(Boolean).join(' · ') || user.userId;
    }
    var chipNode = $('role-chip');
    if (chipNode) {
      chipNode.className = 'role-chip ' + (user.role === 'operator' ? 'operator' : 'admin');
      chipNode.textContent = '';
      var ico = el('span', null, user.role === 'operator' ? '🔍' : '🛠');
      ico.setAttribute('aria-hidden', 'true');
      chipNode.appendChild(ico);
      chipNode.appendChild(document.createTextNode(' ' + Store.role(user.role).label));
    }
    var out = $('btn-logout');
    if (out) out.addEventListener('click', Auth.logout);
  }

  /* 노동자 화면 상단 머리띠.
     관리자 화면과 색이 달라야 한다 — 같은 폰을 돌려 쓸 때 지금 누구 화면인지 헷갈리면 안 된다. */
  function fillWorkerBar(user) {
    var setup = Store.setup.load();
    var nameNode = $('head-site');
    var subNode = $('head-sub');
    if (nameNode) nameNode.textContent = setup.site.name || user.siteName || '';
    if (subNode) {
      var lang = Store.language(user.lang);
      var proc = Store.findBy(setup.processes, 'id', user.processId);
      subNode.textContent = [user.userId, lang && lang.name, proc && proc.name]
        .filter(Boolean).join(' · ');
    }
    var out = $('btn-logout');
    if (out) out.addEventListener('click', Auth.logout);
  }

  /* 하단 탭에서 지금 페이지에 표시를 준다.
     탭은 페이지마다 복사되므로, 현재 위치 표시만 여기서 공통으로 한다. */
  function markCurrentTab() {
    var here = location.pathname.split('/').pop();
    $$('.tabbar a').forEach(function (a) {
      if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  /* 저장소가 막힌 환경(시크릿 모드 등)이면 화면 위에 알린다 */
  function warnIfBlocked() {
    var node = $('blocked');
    if (node) node.hidden = Store.available();
  }

  function formatDate(iso) {
    if (!iso) return '';
    try { return new Date(iso).toLocaleString('ko-KR'); } catch (e) { return ''; }
  }

  return {
    $: $, $$: $$, el: el,
    badge: badge, okBadge: okBadge, waitBadge: waitBadge,
    stopBadge: stopBadge, neutralBadge: neutralBadge, phraseBadge: phraseBadge,
    chip: chip, checkedValues: checkedValues, pickedValue: pickedValue,
    fillSelect: fillSelect, toast: toast,
    emptyRow: emptyRow, itemRow: itemRow,
    fillAdminBar: fillAdminBar, fillWorkerBar: fillWorkerBar,
    markCurrentTab: markCurrentTab,
    warnIfBlocked: warnIfBlocked, formatDate: formatDate
  };
})();
