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
      writerName(item), UI.formatDate(item.createdAt), '조회 ' + (item.views || 0)
    ].join(' · ');
    $('p-body').textContent = item.body || '';

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
     쓰기
     ----------------------------------------------------------------- */

  function savePost() {
    var title = $('w-title').value.trim();
    if (!title) { UI.toast('제목을 적어 주세요.'); $('w-title').focus(); return; }

    var anon = isAnon('anon');

    var result = Store.posts.update(function (list) {
      list.push({
        id: Store.uid(),
        title: title,
        body: $('w-body').value.trim(),
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

    $('w-title').value = '';
    $('w-body').value = '';
    UI.$$('input[name="anon"]').forEach(function (n) { n.checked = false; });

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

  $('btn-new').addEventListener('click', function () { show('write'); });
  $('btn-write-cancel').addEventListener('click', function () { show('list'); });
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
