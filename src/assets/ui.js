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

  /* -------------------------------------------------------------------
     음성 — 문해력을 전제하지 않는다 (SCREEN §4 · PRD §9.1)

     브라우저 내장 speechSynthesis 만 쓴다. 외부 요청 0건 규칙 때문에
     클라우드 TTS 를 부를 수 없고, 부르지 않아도 대부분의 기기에서 소리가 난다.

     ★ 그 언어 음성이 기기에 없을 때 조용히 실패하지 않는다.
       크메르어 음성이 깔린 안드로이드는 흔하지 않다. 소리가 안 났는데
       난 줄 알고 넘어가면, 글자를 못 읽는 사람은 아무것도 못 받은 채 통과한다.
       그래서 한국어로 읽고, 그 사실을 화면에 적는다 (voiceNote).
     ------------------------------------------------------------------- */

  var VOICE_TAG = {
    km: 'km-KH', id: 'id-ID', vi: 'vi-VN',
    ne: 'ne-NP', th: 'th-TH', ko: 'ko-KR'
  };

  function speechReady() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  /* 이 기기에 그 언어 음성이 실제로 있는지.
     getVoices() 는 첫 호출에서 빈 배열을 주는 브라우저가 있다(목록을 비동기로 읽는다).
     그때는 false 가 아니라 null — "아직 모른다" 를 돌려준다.
     모르는 것을 없다고 답하면 있는 음성을 안 쓰고 한국어로 읽어 버린다. */
  function hasVoice(langCode) {
    if (!speechReady()) return false;
    var voices = window.speechSynthesis.getVoices();
    if (!voices || !voices.length) return null;
    var head = (VOICE_TAG[langCode] || langCode || '').split('-')[0];
    for (var i = 0; i < voices.length; i++) {
      if ((voices[i].lang || '').split('-')[0] === head) return true;
    }
    return false;
  }

  /* 음성 목록이 준비되면 한 번 부른다. 화면이 안내 문구를 다시 그릴 기회다. */
  function onVoicesReady(fn) {
    if (!speechReady()) return;
    if (window.speechSynthesis.getVoices().length) { fn(); return; }
    if (typeof window.speechSynthesis.addEventListener !== 'function') return;
    window.speechSynthesis.addEventListener('voiceschanged', function once() {
      window.speechSynthesis.removeEventListener('voiceschanged', once);
      fn();
    });
  }

  function stopSpeak() {
    if (speechReady()) window.speechSynthesis.cancel();
  }

  /* 읽어 준다.
     speech 는 문자열이거나 { text, lang, ko } — ko 는 그 언어 음성이 없을 때 읽을 한국어.
     돌려주는 값은 실제로 읽은 언어 코드다. 화면이 "지금 한국어로 읽었다"를 적을 수 있어야 한다. */
  function speak(speech, langCode) {
    if (!speechReady()) return '';

    var text = (speech && speech.text != null) ? speech.text : speech;
    var lang = (speech && speech.lang) || langCode || 'ko';
    var ko = (speech && speech.ko) || '';
    if (!text) return '';

    window.speechSynthesis.cancel();

    if (hasVoice(lang) === false) {      // 없다고 확인된 경우에만 한국어로 돌린다
      lang = 'ko';
      if (ko) text = ko;
    }

    var u = new SpeechSynthesisUtterance(String(text));
    u.lang = VOICE_TAG[lang] || lang;
    u.rate = 0.9;      // 모국어가 아닌 사람이 듣는다. 기본 속도는 빠르다
    window.speechSynthesis.speak(u);
    return lang;
  }

  /* 60px 원형 음성 버튼. style.css 의 .btn-audio 를 쓴다.
     getSpeech 를 함수로 받는 이유 — 내용이 바뀌어도 버튼을 다시 만들지 않는다. */
  function audioButton(getSpeech, label) {
    var btn = el('button', 'btn-audio');
    btn.type = 'button';
    btn.setAttribute('aria-label', label || '소리로 듣기');
    var ico = el('span', null, '🔊');
    ico.setAttribute('aria-hidden', 'true');
    btn.appendChild(ico);
    btn.addEventListener('click', function () {
      speak(typeof getSpeech === 'function' ? getSpeech() : getSpeech);
    });
    return btn;
  }

  /* 화면에 적을 한 줄. 문제가 없으면 빈 문자열 — 아무 말도 하지 않는다. */
  function voiceNote(langCode) {
    if (!speechReady()) return '이 브라우저는 음성 읽기를 지원하지 않습니다. 글자로만 보입니다.';
    if (hasVoice(langCode) === false) {
      var l = Store.language(langCode);
      return '이 기기에 ' + ((l && l.name) || langCode) + ' 음성이 없어 한국어로 읽어 드립니다.';
    }
    return '';
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
    warnIfBlocked: warnIfBlocked, formatDate: formatDate,

    // 음성 — 노동자 화면 전부가 쓴다
    speak: speak, stopSpeak: stopSpeak, audioButton: audioButton,
    hasVoice: hasVoice, onVoicesReady: onVoicesReady, voiceNote: voiceNote
  };
})();
