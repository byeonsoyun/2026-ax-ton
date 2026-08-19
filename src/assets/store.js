/* ===================================================================
   store.js — 이 서비스의 모든 데이터가 지나가는 단 하나의 문

   서버도 DB도 없다. 브라우저 localStorage 하나에만 쌓인다.

   ★ 화면 코드는 localStorage 를 직접 부르지 않는다. 반드시 이 파일을 거친다.
     나중에 서버가 생기면 이 파일만 바꾸면 되기 때문이다.

   ★ 아래 키 목록은 노동자 팀과 관리자 팀이 만나는 유일한 지점이다.
     한쪽이 쓰고 다른 쪽이 읽으므로, 모양을 바꾸려면 반드시 팀에 알린다.

       키          쓰는 쪽           읽는 쪽
       accounts    회원가입          로그인
       session     로그인            모든 화면(가드)
       setup       관리자 기능1      노동자 전부 · 관리자 전부
       library     운영자 기능9      관리자 기능2 · 노동자 기능3
       courses     관리자 기능2      노동자 기능3·4
       progress    노동자 기능3·4    관리자 기능5·6
       reports     노동자 기능8      관리자 기능6
       posts       노동자 기능7      노동자 기능7

   ES 모듈(import/export)을 쓰지 않는다. file:// 로 열면 모듈이 CORS 로 막히는데,
   "인터넷 없이 그냥 열린다"(외부 요청 0건 규칙)를 잃고 싶지 않다.
   =================================================================== */

var Store = (function () {
  'use strict';

  var PREFIX = 'safety.';
  var VERSION = 1;

  /* -----------------------------------------------------------------
     공통 어휘 — 화면과 저장이 같은 목록을 본다.
     여기 없는 값은 저장되지 않고, 저장된 값 중 여기 없는 것은 화면에서 무시된다.
     ----------------------------------------------------------------- */

  var LANGUAGES = [
    { code: 'km', name: '크메르어',     native: 'ភាសាខ្មែរ' },
    { code: 'id', name: '인도네시아어', native: 'Bahasa Indonesia' },
    { code: 'vi', name: '베트남어',     native: 'Tiếng Việt' },
    { code: 'ne', name: '네팔어',       native: 'नेपाली' },
    { code: 'th', name: '태국어',       native: 'ภาษาไทย' },
    { code: 'ko', name: '한국어',       native: '한국어' }
  ];

  var HAZARDS = [
    { code: 'pinch',    label: '끼임',     icon: '⚙' },
    { code: 'shock',    label: '감전',     icon: '⚡' },
    { code: 'fire',     label: '화재',     icon: '🔥' },
    { code: 'fall',     label: '추락',     icon: '🪜' },
    { code: 'choke',    label: '질식',     icon: '😷' },
    { code: 'chemical', label: '화학물질', icon: '🧪' }
  ];

  var ICONS = ['⚙', '🏭', '🔧', '🔩', '⚡', '🔥', '🧪', '🧯', '📦', '🚜'];

  /* 사업장 규모는 11-admin-start.html 의 가입 폼과 같은 3구간을 쓴다.
     같은 개념을 두 화면이 다르게 물으면 나중에 합칠 때 값을 손으로 옮겨야 한다. */
  var SIZE_BANDS = ['10인 미만', '10~49인', '50인 이상'];

  var ROLES = [
    { code: 'worker',   label: '노동자',        landing: 'worker/home.html' },
    { code: 'admin',    label: '사업장 담당자', landing: 'admin/dashboard.html' },
    { code: 'operator', label: '시스템 운영자', landing: 'admin/library.html' }
  ];

  /* 검수 상태 3종 — SCREEN 기능9 의 데이터 정의를 그대로 쓴다 */
  var PHRASE_STATUS = {
    reviewed: { label: '검수 완료', badge: 'badge-ok',   icon: '✓' },
    waiting:  { label: '검수 대기', badge: 'badge-wait', icon: '●' },
    stopped:  { label: '사용 중지', badge: 'badge-stop', icon: '■' }
  };

  function arr(v) { return Array.isArray(v) ? v : []; }
  function obj(v) { return (v && typeof v === 'object' && !Array.isArray(v)) ? v : {}; }

  function available() {
    try {
      localStorage.setItem(PREFIX + 'probe', '1');
      localStorage.removeItem(PREFIX + 'probe');
      return true;
    } catch (e) {
      return false;
    }
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* -----------------------------------------------------------------
     저장소 하나를 만드는 공장

     저장 모양은 전부 { v, updatedAt, data } 로 통일한다.
     v 가 있어야 나중에 모양이 바뀌었을 때 옛 데이터를 옮길 자리가 생긴다.
     이게 없으면 "브라우저 캐시 지우세요" 말고는 답이 없어진다.

     normalize(data) 는 읽어 온 값을 화면이 기대하는 모양으로 다듬는다.
     빠진 필드를 채우고, 배열이어야 할 것이 아니면 배열로 바꾼다.
     ----------------------------------------------------------------- */
  function makeStore(name, makeDefault, normalize) {
    var KEY = PREFIX + name + '.v' + VERSION;

    function load() {
      var raw;
      try {
        raw = localStorage.getItem(KEY);
      } catch (e) {
        return makeDefault();          // 저장소가 막힌 환경. 화면은 그대로 뜬다
      }
      if (!raw) return makeDefault();

      try {
        var box = JSON.parse(raw);
        // 봉투가 씌워지기 전에 저장된 값이 남아 있을 수 있다. 그대로 받아 준다.
        var data = (box && typeof box === 'object' && 'data' in box) ? box.data : box;
        return normalize(data);
      } catch (e) {
        return makeDefault();          // 값이 깨져 있어도 앱이 죽지 않는다
      }
    }

    function save(data) {
      try {
        localStorage.setItem(KEY, JSON.stringify({
          v: VERSION,
          updatedAt: new Date().toISOString(),
          data: data
        }));
        return true;
      } catch (e) {
        return false;
      }
    }

    /* 읽기 → 고치기 → 저장 한 사이클. 화면 코드는 되도록 이것만 쓴다. */
    function update(fn) {
      var data = load();
      var replaced = fn(data);
      if (replaced !== undefined) data = replaced;
      return { data: data, ok: save(data) };
    }

    function updatedAt() {
      try {
        var box = JSON.parse(localStorage.getItem(KEY));
        return (box && box.updatedAt) || null;
      } catch (e) {
        return null;
      }
    }

    function clear() {
      try { localStorage.removeItem(KEY); return true; } catch (e) { return false; }
    }

    return {
      KEY: KEY, load: load, save: save, update: update,
      updatedAt: updatedAt, clear: clear
    };
  }

  /* 목록형 저장소는 전부 같은 모양이라 한 번에 찍어 낸다 */
  function listStore(name) {
    return makeStore(name, function () { return []; }, arr);
  }

  /* 1. accounts — 회원가입이 쓰고 로그인이 읽는다
        { userId, pw, role, name, title, siteName, lang, processId } */
  var accounts = listStore('accounts');

  /* 2. session — 로그인이 쓰고 모든 화면이 읽는다 */
  var session = makeStore('session',
    function () { return { userId: '', role: '', at: null }; },
    function (d) {
      d = obj(d);
      return { userId: d.userId || '', role: d.role || '', at: d.at || null };
    });

  /* 3. setup — 관리자 기능1 (사업장 · 언어 · 공정 · 설비 · 노동자) */
  var setup = makeStore('setup',
    function () {
      return {
        site: { name: '', sizeBand: SIZE_BANDS[1] },
        languages: [], processes: [], equipments: [], workers: []
      };
    },
    function (d) {
      d = obj(d);
      return {
        site: {
          name: (d.site && d.site.name) || '',
          sizeBand: (d.site && d.site.sizeBand) || SIZE_BANDS[1]
        },
        languages: arr(d.languages),
        processes: arr(d.processes),
        equipments: arr(d.equipments),
        workers: arr(d.workers)
      };
    });

  /* 4. library — 운영자 기능9. 안전 문구와 언어별 검수 상태
        { id, category, ko, translations: { km: { text, back } }, status }
        status 는 PHRASE_STATUS 의 세 가지 중 하나.
        검수 완료가 아닌 문구는 안전 지시로 쓰지 않는다 (SCREEN 기능9 · PRD §9.3). */
  var library = listStore('library');

  /* 5. courses — 관리자 기능2 가 만든 교육. 노동자 기능3·4 가 읽는다
        { id, title, equipmentId, languages: [], phraseIds: [],
          quiz: [ { id, type, prompt } ], approved, createdAt } */
  var courses = listStore('courses');

  /* 6. progress — 노동자 기능3·4 가 쓰고 관리자 기능5·6 이 읽는다
        { workerId, courseId, lang, learnedAt,
          quiz: { score, passed, answers, at } }
        통과하지 못하면 교육 완료로 기록되지 않는다 (SCREEN 기능4). */
  var progress = listStore('progress');

  /* 7. reports — 노동자 기능8 위험요소 신고. 관리자 기능6 이 처리한다
        { id, processId, equipmentId, hazard, memo, status, createdAt }
        ★ 신고자 식별 정보를 넣지 않는다. 익명이 기본이다 (PRD §9.2).
          익명성이 깨지면 신고가 멈추고, 선행지표도 함께 사라진다. */
  var reports = listStore('reports');

  /* 8. posts — 노동자 기능7 현장 즉시 소통 게시판
        { id, title, body, author, anonymous, createdAt, comments: [] } */
  var posts = listStore('posts');

  var ALL = [accounts, session, setup, library, courses, progress, reports, posts];

  /* -----------------------------------------------------------------
     전체 내보내기 / 불러오기 / 초기화

     서버가 없으니 데이터가 이 브라우저를 벗어나지 못한다.
     발표 전 백업하거나 다른 기기로 옮길 통로가 하나는 있어야 한다.
     ----------------------------------------------------------------- */

  var PAIRS = [
    [accounts, 'accounts'], [session, 'session'], [setup, 'setup'],
    [library, 'library'], [courses, 'courses'], [progress, 'progress'],
    [reports, 'reports'], [posts, 'posts']
  ];

  function exportAll() {
    var out = { v: VERSION, exportedAt: new Date().toISOString() };
    for (var i = 0; i < PAIRS.length; i++) out[PAIRS[i][1]] = PAIRS[i][0].load();
    return JSON.stringify(out, null, 2);
  }

  function importAll(text) {
    var parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return { ok: false, reason: 'JSON 형식이 아닙니다.' };
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, reason: '설정 데이터의 모양이 아닙니다.' };
    }
    for (var i = 0; i < PAIRS.length; i++) {
      if (parsed[PAIRS[i][1]] !== undefined) PAIRS[i][0].save(parsed[PAIRS[i][1]]);
    }
    return { ok: true };
  }

  function resetAll() {
    for (var i = 0; i < ALL.length; i++) ALL[i].clear();
    return true;
  }

  /* 어휘를 코드로 찾는 helper — 화면마다 다시 만들지 않게 여기 둔다 */
  function findBy(list, key, value) {
    for (var i = 0; i < list.length; i++) {
      if (list[i][key] === value) return list[i];
    }
    return null;
  }
  function language(code) { return findBy(LANGUAGES, 'code', code); }
  function hazard(code)   { return findBy(HAZARDS, 'code', code); }
  function role(code)     { return findBy(ROLES, 'code', code); }

  return {
    // 어휘
    LANGUAGES: LANGUAGES, HAZARDS: HAZARDS, ICONS: ICONS,
    SIZE_BANDS: SIZE_BANDS, ROLES: ROLES, PHRASE_STATUS: PHRASE_STATUS,
    language: language, hazard: hazard, role: role, findBy: findBy,

    // 저장소 8개
    accounts: accounts, session: session, setup: setup, library: library,
    courses: courses, progress: progress, reports: reports, posts: posts,

    // 공통
    uid: uid, available: available,
    exportAll: exportAll, importAll: importAll, resetAll: resetAll
  };
})();
