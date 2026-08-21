/* ===================================================================
   library.js — 기능9 안전 문구 라이브러리 (운영자)

   담당: P4
   기능번호: 기능9
   읽는 키: library
   쓰는 키: library
   근거: SCREEN 기능9 · PRD §9.3

   ★ 이 화면은 노동자에게 보이지 않지만 제품 신뢰의 단일 최대 요인이다.
     검수를 지나지 않은 문구가 안전 지시로 나가면 오역이 그대로 사고가 된다.

   이 파일이 코드로 지키는 것 —

   · 오역 신고는 접수하는 순간 status 를 'stopped' 로 내린다.
     확인한 뒤 내리는 순서가 아니다. 오역이 걸린 문구가 현장에 한 시간 더
     붙어 있는 것이 더 위험하다.

   · 역번역 차이 표시는 AI 가 찾은 것이고, 승인·중지는 사람이 누른다.
     화면에 그 경계를 적는다 (AI 여기까지).

   · 'reviewed' 로 올리려면 번역이 하나라도 있어야 한다.
     번역이 없는 문구를 검수 완료로 두면 기능2 선택지에 빈 문구가 올라간다.

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

  var filter = 'all';

  /* -----------------------------------------------------------------
     읽기
     ----------------------------------------------------------------- */

  function phrases() { return Store.library.load(); }

  function langsOf(phrase) {
    var t = phrase.translations || {};
    return Object.keys(t).filter(function (code) { return t[code] && t[code].text; });
  }

  /* 아직 조치하지 않은 오역 신고 */
  function openFlags(phrase) {
    return (Array.isArray(phrase.flags) ? phrase.flags : [])
      .filter(function (f) { return f && !f.resolvedAt; });
  }

  /* -----------------------------------------------------------------
     역번역 대조

     번역문을 다시 한국어로 돌린 것이 원문과 다른 곳을 표시한다.
     ph-3 처럼 부정이 뒤집히면 "넣지 마십시오" 가 "넣어도 됩니다" 가 되는데,
     그 두 낱말이 원문에 없다는 사실로 잡힌다.

     ★ 이것은 사람이 볼 곳을 좁혀 주는 것뿐이다. 판정은 사람이 한다.
     ----------------------------------------------------------------- */

  function words(text) {
    return String(text || '').split(/\s+/).filter(Boolean);
  }

  /* 낱말의 어간만 비교한다 — "마십시오" 와 "마세요" 를 다르다고 하면
     표시가 너무 많아져서 정작 뒤집힌 곳이 묻힌다. */
  function stem(word) {
    return word.replace(/[.,!?"'()]/g, '').slice(0, 2);
  }

  function diffWords(original, back) {
    var have = {};
    words(original).forEach(function (w) { have[stem(w)] = true; });
    return words(back).map(function (w) {
      return { text: w, isNew: !have[stem(w)] };
    });
  }

  /* ★ 여기가 이 화면에서 가장 중요한 검사다.

     낱말이 다른 것만으로는 위험을 가릴 수 없다.
     "환기팬이 돌지 않으면" 이 "팬이 꺼져 있으면" 이 되는 것은 말만 바꿔 쓴 것이고,
     "손을 넣지 마십시오" 가 "손을 넣어도 됩니다" 가 되는 것은 정반대 지시다.
     둘을 같은 세기로 표시하면 운영자가 표시를 무시하게 되고,
     그러면 정작 뒤집힌 문구가 그냥 지나간다.

     그래서 부정 표현의 개수가 맞는지를 따로 본다.
     한쪽에만 "마십시오 / 않 / 금지" 가 있으면 뜻이 뒤집혔을 수 있다. */
  var NEGATIONS = /(마십시오|마세요|마시오|하지\s*말|않|없|아니|못\s|금지|불가)/g;

  function negationCount(text) {
    var found = String(text || '').match(NEGATIONS);
    return found ? found.length : 0;
  }

  function negationFlipped(original, back) {
    if (!back) return false;
    // 한쪽은 부정이고 다른 쪽은 부정이 아니면 뒤집힌 것이다
    return (negationCount(original) > 0) !== (negationCount(back) > 0);
  }

  function diffCell(title, text, marks) {
    var cell = UI.el('div', 'diff-cell' + (marks ? ' flag' : ''));
    cell.appendChild(UI.el('h4', null, title));

    var p = UI.el('p');
    if (!marks) {
      p.textContent = text;
    } else {
      marks.forEach(function (token, i) {
        if (i) p.appendChild(document.createTextNode(' '));
        if (token.isNew) p.appendChild(UI.el('mark', null, token.text));
        else p.appendChild(document.createTextNode(token.text));
      });
    }
    cell.appendChild(p);
    return cell;
  }

  /* -----------------------------------------------------------------
     쓰기 — 전부 Store.library.update 한 사이클을 지난다
     ----------------------------------------------------------------- */

  function commit(fn, message) {
    var result = Store.library.update(fn);
    render();
    if (!result.ok) UI.toast('저장하지 못했습니다. 이 브라우저의 저장소가 막혀 있습니다.');
    else if (message) UI.toast(message);
  }

  function setStatus(id, status) {
    if (status === 'reviewed') {
      var target = Store.findBy(phrases(), 'id', id);
      if (target && !langsOf(target).length) {
        UI.toast('번역이 하나도 없는 문구는 검수 완료로 둘 수 없습니다.');
        return;
      }
      if (target && openFlags(target).length) {
        if (!window.confirm(
          '이 문구에는 아직 처리하지 않은 오역 신고가 있습니다.\n' +
          '신고를 처리하지 않고 다시 쓰기로 하시겠습니까?')) return;
      }
    }

    commit(function (list) {
      var p = Store.findBy(list, 'id', id);
      if (!p) return;
      p.status = status;
      // 다시 쓰기로 했다면 그 판단으로 신고를 닫는다. 신고가 계속 열려 있으면
      // 큐에 남아서 무엇을 처리했는지 알 수 없다.
      if (status === 'reviewed') {
        (p.flags || []).forEach(function (f) {
          if (!f.resolvedAt) f.resolvedAt = new Date().toISOString();
        });
      }
    }, status === 'reviewed' ? '검수 완료로 올렸습니다.' : '사용 중지로 내렸습니다.');
  }

  /* ★ 접수 = 즉시 중지. 두 동작이 한 사이클 안에 같이 일어난다. */
  function fileFlag(id, note) {
    commit(function (list) {
      var p = Store.findBy(list, 'id', id);
      if (!p) return;
      if (!Array.isArray(p.flags)) p.flags = [];
      p.flags.push({ note: note, at: new Date().toISOString(), resolvedAt: null });
      p.status = 'stopped';
    }, '접수했습니다. 이 문구는 지금부터 사용 중지입니다.');
  }

  /* -----------------------------------------------------------------
     1. 오역 신고 큐
     ----------------------------------------------------------------- */

  function renderFlagQueue(list) {
    var box = $('flag-queue');
    box.textContent = '';

    var flagged = list.filter(function (p) { return openFlags(p).length; });

    if (!flagged.length) {
      box.appendChild(UI.el('p', 'empty', '처리할 오역 신고가 없습니다.'));
      return;
    }

    flagged.forEach(function (p) {
      var item = UI.el('div', 'queue-item');
      item.setAttribute('data-urgent', 'yes');   // 오역 신고는 전부 긴급이다

      var top = UI.el('div', 'queue-top');
      top.appendChild(UI.el('strong', null, p.ko));
      top.appendChild(UI.phraseBadge(p.status));
      item.appendChild(top);

      openFlags(p).forEach(function (f) {
        item.appendChild(UI.el('p', 'body', f.note || '(내용 없음)'));
        item.appendChild(UI.el('p', 'meta', '접수 ' + UI.formatDate(f.at)));
      });

      var row = UI.el('div', 'btn-row');

      var fixed = UI.el('button', 'btn-sm go', '고쳐졌습니다 — 다시 사용');
      fixed.type = 'button';
      fixed.addEventListener('click', function () { setStatus(p.id, 'reviewed'); });
      row.appendChild(fixed);

      var keep = UI.el('button', 'btn-sm', '신고만 닫기 (중지 유지)');
      keep.type = 'button';
      keep.addEventListener('click', function () {
        commit(function (all) {
          var t = Store.findBy(all, 'id', p.id);
          (t.flags || []).forEach(function (f) {
            if (!f.resolvedAt) f.resolvedAt = new Date().toISOString();
          });
        }, '신고를 닫았습니다. 문구는 계속 사용 중지입니다.');
      });
      row.appendChild(keep);

      item.appendChild(row);
      box.appendChild(item);
    });
  }

  /* -----------------------------------------------------------------
     2. 판정이 필요한 문구 — 검수 대기 + 사용 중지
     ----------------------------------------------------------------- */

  function renderReview(list) {
    var box = $('review-list');
    box.textContent = '';

    var need = list.filter(function (p) { return p.status !== 'reviewed'; });

    if (!need.length) {
      box.appendChild(UI.el('p', 'empty', '판정이 필요한 문구가 없습니다.'));
      return;
    }

    need.forEach(function (p) {
      var block = UI.el('div', 'review-block');

      var head = UI.el('div', 'queue-top');
      head.appendChild(UI.el('strong', null, p.ko));
      head.appendChild(UI.phraseBadge(p.status));
      block.appendChild(head);

      var langs = langsOf(p);
      if (!langs.length) {
        block.appendChild(UI.el('p', 'empty', '아직 번역이 없습니다. 초안 번역이 들어오면 대조할 수 있습니다.'));
      }

      langs.forEach(function (code) {
        var t = p.translations[code];
        var lang = Store.language(code);
        var langName = lang ? lang.name : code;
        var marks = diffWords(p.ko, t.back);
        var newCount = marks.filter(function (m) { return m.isNew; }).length;
        var flipped = negationFlipped(p.ko, t.back);

        block.appendChild(UI.el('p', 'meta', langName));

        // 부정이 뒤집힌 경우만 크게 경고한다. 나머지는 낱말 개수만 알린다.
        if (flipped) {
          var alarm = UI.el('p', 'flip-warn');
          alarm.appendChild(UI.el('strong', null, '★ 부정이 뒤집혔을 수 있습니다'));
          alarm.appendChild(document.createTextNode(
            ' — 한쪽에만 금지 표현이 있습니다. 그대로 나가면 정반대 지시가 됩니다.'));
          block.appendChild(alarm);
        }

        var diff = UI.el('div', 'diff' + (flipped ? ' danger' : ''));
        diff.appendChild(diffCell('원문 (한국어)', p.ko, null));
        diff.appendChild(diffCell('역번역 — ' + langName + ' 를 한국어로 되돌린 것',
          t.back, newCount ? marks : null));
        block.appendChild(diff);

        var note = newCount
          ? '원문에 없는 낱말 ' + newCount + '개를 표시했습니다. 말만 바꿔 쓴 것인지 뜻이 달라진 것인지는 사람이 봅니다.'
          : '역번역이 원문과 같습니다.';
        block.appendChild(UI.el('p', 'diff-note', note));

        block.appendChild(UI.el('p', 'meta', '번역문 — ' + t.text));
      });

      var row = UI.el('div', 'btn-row');

      var okBtn = UI.el('button', 'btn-sm go', '검수 완료 — 안전 지시로 쓴다');
      okBtn.type = 'button';
      okBtn.addEventListener('click', function () { setStatus(p.id, 'reviewed'); });
      row.appendChild(okBtn);

      if (p.status !== 'stopped') {
        var stopBtn = UI.el('button', 'btn-sm danger', '사용 중지');
        stopBtn.type = 'button';
        stopBtn.addEventListener('click', function () { setStatus(p.id, 'stopped'); });
        row.appendChild(stopBtn);
      }

      block.appendChild(row);
      box.appendChild(block);
    });
  }

  /* -----------------------------------------------------------------
     3. 문구 목록
     ----------------------------------------------------------------- */

  function renderRows(list) {
    var body = $('phrase-rows');
    body.textContent = '';

    var shown = filter === 'all' ? list : list.filter(function (p) { return p.status === filter; });

    if (!shown.length) {
      var empty = UI.el('tr');
      var cell = UI.el('td');
      cell.colSpan = 5;
      cell.appendChild(UI.el('p', 'empty', '해당하는 문구가 없습니다.'));
      empty.appendChild(cell);
      body.appendChild(empty);
      return;
    }

    shown.forEach(function (p) {
      var tr = UI.el('tr');

      var first = UI.el('td');
      first.appendChild(document.createTextNode(p.ko));
      if (openFlags(p).length) {
        first.appendChild(UI.el('span', 'sub', '오역 신고 ' + openFlags(p).length + '건'));
      }
      tr.appendChild(first);

      tr.appendChild(UI.el('td', null, p.category || '-'));

      var langCell = UI.el('td');
      var chips = UI.el('div', 'chips');
      var langs = langsOf(p);
      if (!langs.length) {
        chips.appendChild(UI.el('span', 'badge badge-neutral', '번역 없음'));
      } else {
        langs.forEach(function (code) {
          var lang = Store.language(code);
          chips.appendChild(UI.el('span', 'badge badge-neutral', lang ? lang.name : code));
        });
      }
      langCell.appendChild(chips);
      tr.appendChild(langCell);

      var statusCell = UI.el('td');
      statusCell.appendChild(UI.phraseBadge(p.status));
      tr.appendChild(statusCell);

      var actCell = UI.el('td');
      var row = UI.el('div', 'btn-row');

      if (p.status !== 'reviewed') {
        var okBtn = UI.el('button', 'btn-sm go', '검수 완료');
        okBtn.type = 'button';
        okBtn.addEventListener('click', function () { setStatus(p.id, 'reviewed'); });
        row.appendChild(okBtn);
      }
      if (p.status !== 'stopped') {
        var stopBtn = UI.el('button', 'btn-sm danger', '사용 중지');
        stopBtn.type = 'button';
        stopBtn.addEventListener('click', function () { setStatus(p.id, 'stopped'); });
        row.appendChild(stopBtn);
      }
      actCell.appendChild(row);
      tr.appendChild(actCell);

      body.appendChild(tr);
    });
  }

  /* -----------------------------------------------------------------
     4. 라이브러리 상태
     ----------------------------------------------------------------- */

  function renderStats(list) {
    var box = $('stats');
    box.textContent = '';

    var count = function (status) {
      return list.filter(function (p) { return p.status === status; }).length;
    };
    var flagged = list.filter(function (p) { return openFlags(p).length; }).length;

    var tiles = [
      { label: '검수 완료', value: count('reviewed'), unit: '개',
        hint: '안전 지시로 쓸 수 있습니다', alert: false },
      { label: '검수 대기', value: count('waiting'), unit: '개',
        hint: '아직 쓰이지 않습니다', alert: false },
      { label: '오역 신고', value: flagged, unit: '건',
        hint: '접수 즉시 사용 중지된 것', alert: flagged > 0 },
      { label: '사용 중지', value: count('stopped'), unit: '개',
        hint: '어떤 화면에도 나오지 않습니다', alert: false },
      { label: '전체', value: list.length, unit: '개',
        hint: '원래 목표는 200개입니다', alert: false }
    ];

    tiles.forEach(function (t) {
      var cell = UI.el('div', 'kpi' + (t.alert ? ' alert' : ''));
      cell.appendChild(UI.el('dt', null, t.label));
      var dd = UI.el('dd', null, String(t.value));
      dd.appendChild(UI.el('small', null, t.unit));
      cell.appendChild(dd);
      cell.appendChild(UI.el('p', 'hint', t.hint));
      box.appendChild(cell);
    });
  }

  /* -----------------------------------------------------------------
     신고 폼의 문구 선택
     ----------------------------------------------------------------- */

  function renderFlagForm(list) {
    // 이미 중지된 문구는 다시 신고할 이유가 적다. 쓰이고 있는 것만 올린다.
    var usable = list.filter(function (p) { return p.status !== 'stopped'; });
    UI.fillSelect($('flag-phrase'), usable,
      function (p) { return p.id; },
      function (p) { return p.ko; });
    $('form-flag').hidden = !usable.length;
  }

  /* -----------------------------------------------------------------
     그리기 — 상태가 바뀌면 전부 다시 그린다.
     부분 갱신을 하면 큐와 목록과 타일이 금방 서로 어긋난다.
     ----------------------------------------------------------------- */

  function render() {
    var list = phrases();
    renderFlagQueue(list);
    renderReview(list);
    renderRows(list);
    renderStats(list);
    renderFlagForm(list);

    ['all', 'reviewed', 'waiting', 'stopped'].forEach(function (key) {
      var btn = $('filter-' + key);
      if (btn) btn.setAttribute('aria-pressed', filter === key ? 'true' : 'false');
    });
  }

  /* -----------------------------------------------------------------
     이벤트 연결
     ----------------------------------------------------------------- */

  $('form-flag').addEventListener('submit', function (e) {
    e.preventDefault();
    var id = $('flag-phrase').value;
    var note = $('flag-note').value.trim();
    if (!id) { UI.toast('신고할 문구를 골라 주세요.'); return; }
    if (!note) { UI.toast('무엇이 잘못됐는지 한 줄 적어 주세요.'); $('flag-note').focus(); return; }
    fileFlag(id, note);
    $('flag-note').value = '';
  });

  ['all', 'reviewed', 'waiting', 'stopped'].forEach(function (key) {
    var btn = $('filter-' + key);
    if (btn) btn.addEventListener('click', function () { filter = key; render(); });
  });

  window.addEventListener('storage', function (e) {
    if (e.key === Store.library.KEY) render();
  });

  render();
})();
