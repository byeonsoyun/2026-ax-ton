/* ===================================================================
   auth.js — 로그인 · 세션 · 화면 가드

   ★ 이것은 진짜 인증이 아니다.
     서버가 없으므로 비밀번호가 브라우저에 평문으로 들어간다.
     감출 방법이 없고, 감춘 척하는 게 더 나쁘므로 화면에 목업이라고 적는다.
     실제 서비스가 되려면 이 파일 전체가 서버 API 호출로 바뀐다.

   쓰는 곳
     로그인 화면      Auth.login(userId, pw)
     회원가입 화면    Auth.signup({...})
     나머지 모든 화면 Auth.require('worker')   ← <head> 에서 한 줄

   store.js 가 먼저 읽혀 있어야 한다.
   =================================================================== */

var Auth = (function () {
  'use strict';

  /* 이 페이지가 src/ 에서 몇 칸 안에 있는지.
     worker/home.html 은 한 칸 안이라 로그인 화면이 ../index.html 이다.
     절대경로(/index.html)를 쓰면 file:// 로 열었을 때 깨진다. */
  function baseDir() {
    var path = location.pathname;
    return (/\/(worker|admin)\//.test(path)) ? '../' : '';
  }

  function current() {
    var s = Store.session.load();
    if (!s.userId || !s.role) return null;

    // 세션에 남아 있어도 계정이 지워졌으면 로그인 상태가 아니다
    var acc = Store.findBy(Store.accounts.load(), 'userId', s.userId);
    if (!acc) return null;

    return {
      userId: acc.userId,
      role: acc.role,
      name: acc.name || '',
      title: acc.title || '',
      siteName: acc.siteName || '',
      lang: acc.lang || '',
      processId: acc.processId || ''
    };
  }

  function signup(input) {
    var userId = (input.userId || '').trim();
    var pw = input.pw || '';
    var role = input.role || '';

    if (!userId) return { ok: false, reason: '아이디를 입력해 주세요.' };
    if (!pw) return { ok: false, reason: '비밀번호를 입력해 주세요.' };
    if (!Store.role(role)) return { ok: false, reason: '역할을 골라 주세요.' };

    var list = Store.accounts.load();
    if (Store.findBy(list, 'userId', userId)) {
      return { ok: false, reason: '이미 있는 아이디입니다.' };
    }

    var account = {
      userId: userId,
      pw: pw,
      role: role,
      name: (input.name || '').trim(),
      title: input.title || '',
      siteName: (input.siteName || '').trim(),
      lang: input.lang || '',
      processId: input.processId || ''
    };

    list.push(account);
    if (!Store.accounts.save(list)) {
      return { ok: false, reason: '이 브라우저에 저장할 수 없습니다.' };
    }
    return { ok: true, account: account };
  }

  function login(userId, pw) {
    userId = (userId || '').trim();
    var acc = Store.findBy(Store.accounts.load(), 'userId', userId);

    // 아이디가 없는 경우와 비밀번호가 틀린 경우를 구분해서 알려 주지 않는다.
    // 목업이라도 "그 아이디는 있다"를 흘리는 화면을 만들어 두면 그대로 굳는다.
    if (!acc || acc.pw !== pw) {
      return { ok: false, reason: '아이디 또는 비밀번호가 맞지 않습니다.' };
    }

    var ok = Store.session.save({
      userId: acc.userId,
      role: acc.role,
      at: new Date().toISOString()
    });
    if (!ok) return { ok: false, reason: '이 브라우저에 로그인 상태를 저장할 수 없습니다.' };

    return { ok: true, account: acc, landing: Store.role(acc.role).landing };
  }

  function logout() {
    Store.session.clear();
    location.href = baseDir() + 'index.html';
  }

  /* 로그인 후 역할에 맞는 화면으로 보낸다 */
  function go(role) {
    var r = Store.role(role);
    location.href = baseDir() + (r ? r.landing : 'index.html');
  }

  /* -----------------------------------------------------------------
     화면 가드 — 모든 페이지가 <head> 에서 한 번 부른다

       <script src="../assets/store.js"></script>
       <script src="../assets/auth.js"></script>
       <script>Auth.require('worker');</script>

     allowed 는 문자열 하나 또는 배열.
     세션이 없으면 로그인으로, 역할이 다르면 자기 자리로 돌려보낸다.
     ----------------------------------------------------------------- */
  /* 지금 화면의 "worker/xxx.html?..." 부분. 로그인 뒤 돌아올 자리다 (D1). */
  function wantedPath() {
    var m = /\/((?:worker|admin)\/[a-z0-9-]+\.html)$/i.exec(location.pathname || '');
    if (!m) return '';
    return m[1] + (location.search || '');
  }

  /* 로그인 화면이 받은 ?next= 를 검사한다.

     ★ 넘어온 값을 그대로 믿고 보내면 링크 하나로 아무 데나 보낼 수 있게 된다.
       우리 화면 경로 모양만 받는다. */
  function safeNext(raw) {
    var value = String(raw || '');
    if (!value) return '';
    if (value.indexOf('//') !== -1 || value.indexOf('\\') !== -1 ||
        value.indexOf('..') !== -1 || value.indexOf(':') !== -1) return '';
    if (!/^(worker|admin)\/[a-z0-9-]+\.html(\?[A-Za-z0-9=&%._-]*)?$/.test(value)) return '';
    return value;
  }

  /* 그 역할이 갈 수 있는 자리면 돌려주고, 아니면 빈 문자열.
     빈 문자열이면 부르는 쪽이 그 역할의 첫 화면으로 보낸다. */
  function nextFor(role, raw) {
    var value = safeNext(raw);
    if (!value) return '';
    var area = value.split('/')[0];
    if (role === 'worker') return area === 'worker' ? value : '';
    return area === 'admin' ? value : '';
  }

  /* 로그인이 안 돼 있을 때 갈 곳.

     ★ 어디로 가려던 것인지 함께 넘긴다 (D1).
       설비 앞 QR 을 찍은 사람은 로그인이 안 돼 있을 수 있다.
       그냥 로그인으로 보내면 어느 교육을 찍었는지가 사라지고,
       QR 은 그냥 "로그인 화면으로 가는 그림" 이 된다. */
  function loginUrl() {
    var here = wantedPath();
    return baseDir() + 'index.html' +
      (here ? '?next=' + encodeURIComponent(here) : '');
  }

  function require(allowed) {
    var user = current();

    if (!user) {
      location.replace(loginUrl());
      return null;
    }

    var list = Array.isArray(allowed) ? allowed : [allowed];
    if (list.indexOf(user.role) === -1) {
      // 로그인은 했는데 남의 화면에 들어온 경우. 로그인으로 튕기면 왜 튕겼는지 모른다.
      // 자기 역할의 첫 화면으로 보낸다.
      location.replace(baseDir() + Store.role(user.role).landing);
      return null;
    }

    return user;
  }

  return {
    current: current,
    signup: signup,
    login: login,
    logout: logout,
    go: go,
    require: require,
    baseDir: baseDir,
    nextFor: nextFor,
    safeNext: safeNext,
    wantedPath: wantedPath,
    loginUrl: loginUrl
  };
})();
