/* ===================================================================
   signup.js — 회원가입 화면 (signup.html)

   담당: 공용
   쓰는 키: accounts, session
   읽는 키: setup (노동자 가입 시 언어·공정 선택지)

   ★ 노동자의 언어 선택지는 기능1에서 등록한 언어만 나온다.
     "등록 안 한 언어는 이후 어떤 화면에도 안 나온다"는 규칙이 여기서도 지켜진다.
   =================================================================== */

(function () {
  'use strict';

  var $ = UI.$;

  UI.warnIfBlocked();

  function showError(msg) {
    var box = $('join-error');
    box.textContent = msg;
    box.hidden = false;
  }

  /* 역할 칩 3개 */
  var roleBox = $('pick-role');
  Store.ROLES.forEach(function (r, i) {
    roleBox.appendChild(UI.chip({
      type: 'radio', name: 'role', value: r.code,
      icon: r.code === 'worker' ? '👷' : (r.code === 'admin' ? '🛠' : '🔍'),
      label: r.label,
      checked: i === 0
    }));
  });

  var setup = Store.setup.load();

  /* 노동자 언어 선택지 — 기능1에서 등록한 언어만 */
  function fillWorkerFields() {
    var langs = setup.languages.map(function (code) { return Store.language(code); })
                               .filter(Boolean);

    UI.fillSelect($('join-lang'), langs,
      function (l) { return l.code; },
      function (l) { return l.name + '  ' + l.native; });

    UI.fillSelect($('join-proc'), setup.processes,
      function (p) { return p.id; },
      function (p) { return p.icon + '  ' + p.name; });

    // 사업장 설정이 아직 없으면 노동자 가입이 성립하지 않는다. 이유를 적어 준다.
    var hint = $('join-lang-hint');
    if (!langs.length) {
      hint.textContent = '아직 등록된 언어가 없습니다. 담당자가 사업장·설비 등록을 먼저 마쳐야 합니다.';
    } else {
      hint.textContent = '사업장에 등록된 언어만 나옵니다.';
    }
  }

  function currentRole() { return UI.pickedValue('role') || 'worker'; }

  function syncRoleFields() {
    var role = currentRole();
    var isWorker = role === 'worker';

    $('fields-worker').hidden = !isWorker;
    $('fields-admin').hidden = isWorker;

    $('join-id').placeholder = isWorker ? 'W-4821-07' : 'name@company.co.kr';
    $('join-id-hint').textContent = isWorker
      ? '사업장에서 받은 식별번호입니다.'
      : '업무용 이메일을 아이디로 씁니다.';

    if (role === 'operator') $('join-title').value = '시스템 운영자 (내부)';
  }

  roleBox.addEventListener('change', syncRoleFields);

  $('form-signup').addEventListener('submit', function (e) {
    e.preventDefault();
    $('join-error').hidden = true;

    var role = currentRole();
    var input = {
      userId: $('join-id').value,
      pw: $('join-pw').value,
      role: role
    };

    if (role === 'worker') {
      input.lang = $('join-lang').value;
      input.processId = $('join-proc').value;
      input.siteName = setup.site.name;
      if (!input.lang) {
        showError('등록된 언어가 없어 가입할 수 없습니다. 담당자에게 사업장 설정을 요청하세요.');
        return;
      }
    } else {
      input.name = $('join-name').value;
      input.title = $('join-title').value;
      input.siteName = $('join-site').value;
    }

    var result = Auth.signup(input);
    if (!result.ok) { showError(result.reason); return; }

    // 가입하면 바로 로그인시킨다. 방금 만든 계정을 다시 치게 하지 않는다.
    var logged = Auth.login(input.userId, input.pw);
    if (!logged.ok) { showError(logged.reason); return; }
    location.href = logged.landing;
  });

  fillWorkerFields();
  syncRoleFields();
})();
