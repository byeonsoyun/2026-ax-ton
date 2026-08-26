/* ===================================================================
   talk.js — 기능7 현장 즉시 소통

   담당: P2
   기능번호: 기능7
   읽는 키: posts
   쓰는 키: posts
   근거: SCREEN 기능7 · PRD §4.4

   교육 밖의 질문이 오갈 자리. 게시글은 제목 · 작성자 · 작성일 · 조회수 · 댓글.

   ★ 이름을 감추고 쓸 수 있다.
     감추면 author 를 저장하지 않는다 — 빈 문자열로 둔다.
     "익명" 이라고 표시만 하고 실제로는 아이디를 담아 두면,
     나중에 화면 한 줄 고치는 것으로 익명이 풀린다.

   ★ 여기 오가는 말은 안전 지시가 아니다.
     검수를 지난 문구만 안전 지시로 쓴다는 규칙은 그대로다.
     이 화면의 글은 사람들끼리 하는 이야기다.

   ★ 감춘 글은 본인도 고치거나 지울 수 없다 (C3).
     누가 썼는지를 저장하지 않으니 "내 글" 이라는 것을 증명할 방법이 없다.
     증명할 방법을 만들면 그것이 곧 익명을 푸는 열쇠가 된다.
     그래서 못 한다고 화면에 적는다 — 조용히 버튼만 없으면 고장으로 보인다.

   ★ 고치면서 이름을 감추는 것은 되돌릴 수 없다.
     감추는 순간 author 를 지우므로 그 뒤로는 본인도 손댈 수 없다.
     되돌릴 수 없는 일은 먼저 물어본다.

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
    return { id: user.userId, lang: user.lang || row.lang || 'ko' };
  }

  var me = whoAmI();
  var openId = null;      // 지금 보고 있는 글
  var editingId = null;   // 고치는 중인 글. null 이면 새로 쓰는 것이다

  /* -----------------------------------------------------------------
     읽기
     ----------------------------------------------------------------- */

  function posts() {
    return Store.posts.load().slice().sort(function (a, b) {
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    });
  }

  function postOf(id) { return Store.findBy(Store.posts.load(), 'id', id); }

  function writerName(item) {
    // 감춘 글은 아이디가 아예 없다. 없는 것을 없다고 보여 준다.
    return item.anonymous || !item.author ? '이름 감춤' : item.author;
  }

  function renderVoiceNote() {
    var note = UI.voiceNote(me.lang);
    var box = $('voicenote');
    box.textContent = note;
    box.hidden = !note;
  }

  function show(which) {
    $('view-list').hidden = which !== 'list';
    $('view-write').hidden = which !== 'write';
    $('view-post').hidden = which !== 'post';
    window.scrollTo(0, 0);
  }

  /* -----------------------------------------------------------------
     이름 감추기 칩 — 목록과 댓글 두 곳에서 쓴다
     ----------------------------------------------------------------- */

  function buildAnonChips() {
    [['pick-anon', 'anon'], ['pick-canon', 'canon']].forEach(function (pair) {
      var box = $(pair[0]);
      box.textContent = '';
      box.appendChild(UI.chip({
        type: 'checkbox', name: pair[1], value: 'yes',
        icon: '🕶', label: '이름 감추기', sub: '아이디를 저장하지 않습니다'
      }));
    });

    /* 이름 감추기를 켜고 끌 때마다 되돌릴 수 없다는 안내를 갱신한다 (C3).
       ★ 칸에 건다 — 칩은 다시 만들어질 수 있지만 칸은 그대로다.
         change 는 입력칸에서 칸으로 올라온다. */
    $('pick-anon').addEventListener('change', renderAnonWarn);
  }

  function isAnon(name) {
    return UI.checkedValues(name).indexOf('yes') !== -1;
  }

  /* -----------------------------------------------------------------
     화면 A — 글 목록
     ----------------------------------------------------------------- */

  function renderList() {
    var list = $('post-list');
    list.textContent = '';

    var all = posts();
    if (!all.length) {
      list.appendChild(UI.emptyRow('아직 글이 없습니다. 위에서 첫 글을 써 보세요.'));
      return;
    }

    all.forEach(function (item) {
      var li = UI.el('li', 'post-item');

      var open = UI.el('button', 'post-open');
      open.type = 'button';

      var body = UI.el('div', 'body');
      body.appendChild(UI.el('strong', null, item.title));
      body.appendChild(UI.el('p', 'meta', [
        writerName(item),
        UI.formatDate(item.createdAt),
        '조회 ' + (item.views || 0),
        '댓글 ' + ((item.comments || []).length)
      ].join(' · ')));
      open.appendChild(body);

      var count = UI.el('span', 'comment-count');
      count.appendChild(UI.el('span', 'n', String((item.comments || []).length)));
      var label = UI.el('span', 'l', '댓글');
      count.appendChild(label);
      open.appendChild(count);

      open.addEventListener('click', function () { openPost(item.id); });
      li.appendChild(open);
      list.appendChild(li);
    });
  }

  /* -----------------------------------------------------------------
     화면 C — 글 하나
     ----------------------------------------------------------------- */

  function openPost(id) {
    // 조회수는 열 때 한 번 올린다
    Store.posts.update(function (list) {
      var item = Store.findBy(list, 'id', id);
      if (item) item.views = (item.views || 0) + 1;
    });

    openId = id;
    renderPost();
    show('post');
  }

  function renderPost() {
    var item = postOf(openId);
    if (!item) { show('list'); return; }

    $('p-title').textContent = item.title;
    $('p-meta').textContent = [
      writerName(item), UI.formatDate(item.createdAt), '조회 ' + (item.views || 0),
      item.editedAt ? '고침 ' + UI.formatDate(item.editedAt) : null
    ].filter(Boolean).join(' · ');
    $('p-body').textContent = item.body || '';

    // 내 글이면 고치기·지우기, 감춘 글이면 왜 못 하는지 (C3)
    renderMineActions(item);

    // 글자를 못 읽어도 내용을 들을 수 있게
    var listen = $('p-listen');
    listen.textContent = '';
    listen.appendChild(UI.audioButton(function () {
      return { text: item.title + '. ' + (item.body || ''), lang: 'ko' };
    }, '글 읽어 주기'));
    listen.appendChild(UI.el('span', 'label', '읽어 주기'));

    var comments = item.comments || [];
    $('p-count').textContent = String(comments.length);

    var box = $('p-comments');
    box.textContent = '';

    if (!comments.length) {
      box.appendChild(UI.emptyRow('아직 댓글이 없습니다.'));
    } else {
      comments.forEach(function (c) {
        var li = UI.el('li', 'comment-item');
        var head = UI.el('p', 'meta');
        head.textContent = [
          (c.anonymous || !c.author) ? '이름 감춤' : c.author,
          UI.formatDate(c.createdAt)
        ].join(' · ');
        li.appendChild(head);
        li.appendChild(UI.el('p', 'body', c.body));
        box.appendChild(li);
      });
    }
  }


  /* -----------------------------------------------------------------
     내 글 수정·삭제 (C3)

     ★ 감춘 글은 손댈 수 없다. author 를 저장하지 않으니 "내 글" 임을
       증명할 방법이 없고, 증명할 방법을 만드는 순간 그것이 익명을 푸는
       열쇠가 된다. 못 하는 이유를 화면에 적는다 — 버튼만 조용히 없으면
       글을 못 읽는 사람에게는 그냥 고장이다.
     ----------------------------------------------------------------- */

  function isMine(item) {
    return !!item && !item.anonymous && !!item.author && item.author === me.id;
  }

  function renderMineActions(item) {
    var box = $('p-mine');
    if (!box) return;
    box.textContent = '';

    /* 감춘 글 — 누구의 글이든 여기서는 손댈 수 없다.
       "내 것인지" 를 따지지 않는다. 따질 수 있으면 익명이 아니다. */
    if (item.anonymous || !item.author) {
      var note = UI.el('p', 'anon-note');
      note.appendChild(UI.el('span', 'ico', '🕶'));
      note.appendChild(document.createTextNode(
        ' 이름을 감추고 쓴 글입니다. 누가 썼는지 저장하지 않으므로 ' +
        '글쓴이 본인도 고치거나 지울 수 없습니다.'));
      box.appendChild(note);
      return;
    }

    if (!isMine(item)) return;      // 남의 글 — 아무 말도 하지 않는다

    var row = UI.el('div', 'btn-row');

    var edit = UI.el('button', 'btn-sm', '✏ 고치기');
    edit.type = 'button';
    edit.addEventListener('click', function () { startEdit(item.id); });
    row.appendChild(edit);

    var del = UI.el('button', 'btn-sm danger', '🗑 지우기');
    del.type = 'button';
    del.addEventListener('click', function () { removePost(item.id); });
    row.appendChild(del);

    box.appendChild(row);
  }

  /* 글쓰기 화면을 그대로 다시 쓴다. 화면을 하나 더 만들면 이름 감추기 칩과
     저장 경로가 두 벌이 되고, 한쪽만 고쳐지는 날이 온다. */
  function startEdit(id) {
    var item = postOf(id);
    if (!isMine(item)) return;

    editingId = id;
    $('w-title').value = item.title || '';
    $('w-body').value = item.body || '';
    UI.$$('input[name="anon"]').forEach(function (n) { n.checked = false; });

    $('t-write').textContent = '글 고치기';
    $('btn-write-save').textContent = '고친 것 올리기';
    renderAnonWarn();
    show('write');
  }

  function endEdit() {
    editingId = null;
    $('t-write').textContent = '새로 쓰기';
    $('btn-write-save').textContent = '올리기';
    $('w-title').value = '';
    $('w-body').value = '';
    UI.$$('input[name="anon"]').forEach(function (n) { n.checked = false; });
    renderAnonWarn();
  }

  /* 고치면서 이름을 감추면 author 가 지워진다 — 그 뒤로는 본인도 못 고친다.
     되돌릴 수 없는 일이라 누르기 전에 적어 둔다. */
  function renderAnonWarn() {
    var box = $('w-anonwarn');
    if (!box) return;
    var on = editingId && isAnon('anon');
    box.textContent = on
      ? '⚠ 이름을 감추면 누가 썼는지가 지워집니다. 되돌릴 수 없고, 그 뒤로는 이 글을 고치거나 지울 수 없습니다.'
      : '';
    box.hidden = !on;
  }

  function removePost(id) {
    var item = postOf(id);
    if (!isMine(item)) return;

    if (!window.confirm('이 글을 지웁니다. 달린 댓글도 함께 사라집니다.\n되돌릴 수 없습니다.')) return;

    var result = Store.posts.update(function (list) {
      var at = -1;
      list.forEach(function (p, i) { if (p.id === id) at = i; });
      if (at !== -1) list.splice(at, 1);
    });

    if (!result.ok) {
      UI.toast('지우지 못했습니다. 이 브라우저의 저장소가 막혀 있습니다.');
      return;
    }

    UI.stopSpeak();
    openId = null;
    renderList();
    show('list');
    UI.toast('지웠습니다.');
  }
  /* -----------------------------------------------------------------
     쓰기
     ----------------------------------------------------------------- */

  function savePost() {
    var title = $('w-title').value.trim();
    if (!title) { UI.toast('제목을 적어 주세요.'); $('w-title').focus(); return; }

    var anon = isAnon('anon');
    var body = $('w-body').value.trim();

    /* 고치는 중 — 그 글만 바꾼다 (C3) */
    if (editingId) {
      var target = postOf(editingId);
      if (!isMine(target)) {          // 그 사이에 사라졌거나 남의 글이 됐다
        UI.toast('이 글은 고칠 수 없습니다.');
        endEdit();
        renderList();
        show('list');
        return;
      }

      /* ★ 되돌릴 수 없다. 감추는 순간 author 가 지워져 본인도 못 고친다. */
      if (anon && !window.confirm(
        '이름을 감추면 누가 썼는지가 지워집니다.\n' +
        '되돌릴 수 없고, 그 뒤로는 이 글을 고치거나 지울 수 없습니다.\n\n' +
        '그래도 감출까요?')) return;

      var edited = Store.posts.update(function (list) {
        var item = Store.findBy(list, 'id', editingId);
        if (!item) return;
        item.title = title;
        item.body = body;
        // 감추면 아이디를 지운다. 표시만 감추는 것이 아니다.
        if (anon) { item.author = ''; item.anonymous = true; }
        item.editedAt = new Date().toISOString();
      });

      if (!edited.ok) {
        UI.toast('고치지 못했습니다. 이 브라우저의 저장소가 막혀 있습니다.');
        return;
      }

      var wasId = editingId;
      endEdit();
      openId = wasId;
      renderPost();
      renderList();
      show('post');
      UI.toast('고쳤습니다.');
      return;
    }

    var result = Store.posts.update(function (list) {
      list.push({
        id: Store.uid(),
        title: title,
        body: body,
        // ★ 감추면 아이디를 담지 않는다. 표시만 감추는 것이 아니다.
        author: anon ? '' : me.id,
        anonymous: anon,
        createdAt: new Date().toISOString(),
        views: 0,
        comments: []
      });
    });

    if (!result.ok) {
      UI.toast('올리지 못했습니다. 이 브라우저의 저장소가 막혀 있습니다.');
      return;
    }

    endEdit();
    renderList();
    show('list');
    UI.toast('올렸습니다.');
  }

  function saveComment() {
    var body = $('c-body').value.trim();
    if (!body) { UI.toast('댓글을 적어 주세요.'); $('c-body').focus(); return; }

    var anon = isAnon('canon');

    var result = Store.posts.update(function (list) {
      var item = Store.findBy(list, 'id', openId);
      if (!item) return;
      if (!Array.isArray(item.comments)) item.comments = [];
      item.comments.push({
        author: anon ? '' : me.id,
        anonymous: anon,
        body: body,
        createdAt: new Date().toISOString()
      });
    });

    if (!result.ok) {
      UI.toast('올리지 못했습니다. 이 브라우저의 저장소가 막혀 있습니다.');
      return;
    }

    $('c-body').value = '';
    UI.$$('input[name="canon"]').forEach(function (n) { n.checked = false; });
    renderPost();
    renderList();
    UI.toast('댓글을 올렸습니다.');
  }

  /* -----------------------------------------------------------------
     이벤트 연결
     ----------------------------------------------------------------- */

  /* ★ 새로 쓰기로 들어올 때 고치던 상태를 반드시 푼다.
     안 풀면 고치다 말고 나갔다 온 사람이 "새 글" 을 쓴 줄 알고 옛 글을 덮어쓴다. */
  $('btn-new').addEventListener('click', function () { endEdit(); show('write'); });
  $('btn-write-cancel').addEventListener('click', function () { endEdit(); show('list'); });
  $('btn-write-save').addEventListener('click', savePost);
  $('btn-post-back').addEventListener('click', function () {
    UI.stopSpeak();
    openId = null;
    renderList();
    show('list');
  });
  $('btn-comment').addEventListener('click', saveComment);
  window.addEventListener('pagehide', UI.stopSpeak);
  UI.onVoicesReady(renderVoiceNote);

  window.addEventListener('storage', function (e) {
    if (e.key !== Store.posts.KEY) return;
    renderList();
    if (openId) renderPost();
  });

  buildAnonChips();
  renderVoiceNote();
  renderList();
  show('list');
})();
