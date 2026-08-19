/* ===================================================================
   store.js — 기능1 사업장·설비 등록의 저장 계층

   서버도 DB도 없다. 브라우저 localStorage 하나에만 쌓인다.
   그래서 아래 두 가지가 이 파일의 전부다.

   1. 키 하나에 객체 하나로 넣는다. 조각내면 부분 저장이 어긋났을 때
      어디가 깨졌는지 알 수 없게 된다.
   2. 읽을 때 항상 기본값과 합친다. 스키마가 늘어난 뒤에도
      옛 데이터가 남은 브라우저에서 앱이 죽지 않아야 한다.

   ES 모듈(import/export)을 쓰지 않는다. file:// 로 열면 모듈이 CORS 로 막히는데,
   "인터넷 없이 그대로 열린다"(screens.html 외부 요청 0건 규칙)를 잃고 싶지 않다.
   =================================================================== */

var Store = (function () {
  'use strict';

  var KEY = 'safety.setup.v1';
  var VERSION = 1;

  /* 등록 어휘 — 화면과 저장이 같은 목록을 본다.
     여기 없는 값은 저장되지 않고, 저장된 값 중 여기 없는 것은 화면에서 무시된다. */

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

  function blank() {
    return {
      version: VERSION,
      updatedAt: null,
      site: { name: '', sizeBand: SIZE_BANDS[1] },
      languages: [],
      processes: [],
      equipments: [],
      workers: []
    };
  }

  function arr(v) { return Array.isArray(v) ? v : []; }

  /* 저장된 상태를 읽는다. 없거나 깨졌으면 빈 상태를 준다 — 절대 예외를 던지지 않는다. */
  function load() {
    var base = blank();
    var raw;
    try {
      raw = localStorage.getItem(KEY);
    } catch (e) {
      // 시크릿 모드나 저장소 차단 환경. 화면은 그대로 동작하되 저장만 안 된다.
      return base;
    }
    if (!raw) return base;

    try {
      var saved = JSON.parse(raw);
      if (!saved || typeof saved !== 'object') return base;
      return {
        version: VERSION,
        updatedAt: saved.updatedAt || null,
        site: {
          name: (saved.site && saved.site.name) || '',
          sizeBand: (saved.site && saved.site.sizeBand) || base.site.sizeBand
        },
        languages: arr(saved.languages),
        processes: arr(saved.processes),
        equipments: arr(saved.equipments),
        workers: arr(saved.workers)
      };
    } catch (e) {
      return base;
    }
  }

  /* 저장한다. 저장이 막힌 환경이면 false 를 돌려주고 화면이 그 사실을 알린다. */
  function save(state) {
    state.version = VERSION;
    state.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* 읽기 → 고치기 → 저장 한 사이클. 화면 코드는 이것만 쓴다. */
  function update(fn) {
    var state = load();
    fn(state);
    return { state: state, ok: save(state) };
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function exportJSON() {
    return JSON.stringify(load(), null, 2);
  }

  /* 붙여넣은 JSON 을 되돌린다. 형식이 아니면 저장하지 않고 이유를 돌려준다. */
  function importJSON(text) {
    var parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return { ok: false, reason: 'JSON 형식이 아닙니다.' };
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, reason: '설정 데이터의 모양이 아닙니다.' };
    }
    var next = blank();
    next.site.name = (parsed.site && parsed.site.name) || '';
    next.site.sizeBand = (parsed.site && parsed.site.sizeBand) || next.site.sizeBand;
    next.languages = arr(parsed.languages);
    next.processes = arr(parsed.processes);
    next.equipments = arr(parsed.equipments);
    next.workers = arr(parsed.workers);
    return save(next) ? { ok: true } : { ok: false, reason: '이 브라우저에 저장할 수 없습니다.' };
  }

  function reset() {
    try {
      localStorage.removeItem(KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  /* 저장 자체가 가능한 환경인지 — 시크릿 모드/차단 여부를 화면이 알아야 한다 */
  function available() {
    try {
      localStorage.setItem(KEY + '.probe', '1');
      localStorage.removeItem(KEY + '.probe');
      return true;
    } catch (e) {
      return false;
    }
  }

  return {
    KEY: KEY,
    LANGUAGES: LANGUAGES,
    HAZARDS: HAZARDS,
    ICONS: ICONS,
    SIZE_BANDS: SIZE_BANDS,
    load: load,
    save: save,
    update: update,
    uid: uid,
    exportJSON: exportJSON,
    importJSON: importJSON,
    reset: reset,
    available: available
  };
})();
