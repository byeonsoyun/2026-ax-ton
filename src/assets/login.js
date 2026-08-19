/* ===================================================================
   login.js — 로그인 화면 (index.html)

   담당: 공용
   쓰는 키: session
   읽는 키: accounts

   여기서 역할이 갈리고, 그 뒤로는 두 팀의 화면이 서로 만나지 않는다.
   =================================================================== */

(function () {
  'use strict';

  var $ = UI.$;

  /* 이미 로그인돼 있으면 자기 자리로 보낸다.
     로그인 화면을 다시 보여 주면 "로그아웃된 건가?" 하고 헷갈린다. */
  var already = Auth.current();
  if (already) {
    location.replace(Store.role(already.role).landing);
    return;
  }

  UI.warnIfBlocked();

  function showError(msg) {
    var box = $('login-error');
    box.textContent = msg;
    box.hidden = false;
  }

  function clearError() {
    $('login-error').hidden = true;
  }

  /* 시연 계정 목록 — 지금 저장돼 있는 계정을 그대로 보여 준다.
     하드코딩한 목록을 보여 주면 초기화한 뒤에도 있는 것처럼 보인다. */
  function renderAccounts() {
    var list = $('demo-accounts');
    list.textContent = '';

    var accounts = Store.accounts.load();
    if (!accounts.length) {
      list.appendChild(UI.emptyRow('아직 계정이 없습니다. 위 버튼을 눌러 예시 데이터를 채우세요.'));
      return;
    }

    accounts.forEach(function (acc) {
      var role = Store.role(acc.role);
      var li = UI.el('li', 'demo-account');

      var body = UI.el('div', 'body');
      body.appendChild(UI.el('strong', null, acc.userId));
      body.appendChild(UI.el('p', 'meta',
        (role ? role.label : acc.role) + (acc.name ? ' · ' + acc.name : '')));
      li.appendChild(body);

      // 누르면 아이디·비밀번호가 채워진다. 시연 중 오타로 막히는 일이 없게 한다.
      var btn = UI.el('button', 'btn-sm', '이 계정으로');
      btn.type = 'button';
      btn.addEventListener('click', function () {
        $('login-id').value = acc.userId;
        $('login-pw').value = acc.pw;
        clearError();
        $('login-pw').focus();
      });
      li.appendChild(btn);

      list.appendChild(li);
    });
  }

  $('form-login').addEventListener('submit', function (e) {
    e.preventDefault();
    clearError();

    var result = Auth.login($('login-id').value, $('login-pw').value);
    if (!result.ok) {
      showError(result.reason);
      $('login-pw').focus();
      return;
    }
    location.href = result.landing;
  });

  $('btn-seed').addEventListener('click', function () {
    if (Store.accounts.load().length &&
        !window.confirm('지금 저장된 계정과 데이터를 예시 데이터로 덮어씁니다. 계속할까요?')) return;
    Seed.fill();
    renderAccounts();
    UI.toast('예시 데이터를 채웠습니다.');
  });

  $('btn-reset').addEventListener('click', function () {
    if (!window.confirm('이 브라우저에 저장된 내용을 전부 지웁니다.\n되돌릴 수 없습니다. 계속할까요?')) return;
    Store.resetAll();
    renderAccounts();
    UI.toast('초기화했습니다.');
  });

  renderAccounts();
})();
