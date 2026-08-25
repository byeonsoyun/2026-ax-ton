/* ===================================================================
   login.js — 로그인 화면 (index.html)

   담당: 공용
   쓰는 키: session · (첫 방문이면 Seed 가 나머지 7개 키를 한 번 채운다)
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

  /* 처음 여는 브라우저면 예시 데이터를 채운다.
     서버가 없어 계정도 이 브라우저 안에만 있다. 배포 주소에 QR 로 들어온 노동자에게
     "예시 데이터 채우기를 누르세요" 라고 할 수는 없으므로, 빈 브라우저면 알아서 채운다.

     ★ fillIfEmpty 는 계정이 하나라도 있으면 아무것도 하지 않는다.
       fill() 로 바꾸면 담당자가 등록한 사업장이 새로고침마다 예시로 되돌아간다.
     ★ 로그인 확인 뒤에 둔다. 앞에 두면 세션만 남고 계정이 지워진 상태에서
       자동 채우기가 그 세션을 되살려, 로그인하지 않은 사람이 화면 안으로 들어간다.
     ★ 저장이 막힌 브라우저에서는 부르지 않는다. fill() 은 아무것도 저장하지 못한 채
       true 를 돌려주므로, "채웠습니다" 라고 적어 놓고 목록은 비는 화면이 된다. */
  var seededNow = Store.available() && Seed.fillIfEmpty();

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
    UI.toast('초기화했습니다. 새로고침하면 예시 데이터가 다시 채워집니다.');
  });

  // 조용히 채우면 "내가 넣지도 않았는데 왜 있지" 가 된다. 채웠으면 채웠다고 적는다.
  if (seededNow) $('seed-auto').hidden = false;

  renderAccounts();
})();
