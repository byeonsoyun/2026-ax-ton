/* ===================================================================
   content.js — 교육 콘텐츠 생성 · 승인

   담당: 관리자 C
   기능번호: 기능2
   읽는 키: setup, library
   쓰는 키: courses
   근거: SCREEN 기능2 · PRD §9.3

   설비 선택 → 언어 선택 → 문구 고르기 → 승인
   QR 발급. ★ AI는 문구를 새로 쓰지 않고 사람이 검수한 라이브러리에서 고르기만 합니다. 오역이 그대로 사고가 되기 때문입니다. library 에서 status 가 reviewed 인 문구만 선택지에 올리세요. 만든 결과는 courses 에 저장되고, 노동자의 기능3·4가 그것을 읽습니다.

   -------------------------------------------------------------------
   여기부터 만드시면 됩니다.

   · 데이터는 반드시 Store 를 거칩니다. localStorage 를 직접 부르지 마세요.
     나중에 서버가 생기면 store.js 하나만 바꾸면 되기 때문입니다.
   · 배지 · 칩 · 목록 · 토스트 같은 공용 조각은 ../assets/ui.js 에 있습니다.
     각자 다시 만들면 네 화면의 디자인이 흩어집니다.
   · 공용 파일(assets/)을 고쳐야 하면 팀에 먼저 말하세요. 네 명이 함께 씁니다.
   · 예시 데이터는 로그인 화면의 "예시 데이터 채우기" 버튼으로 채웁니다.
   =================================================================== */

(function () {
  'use strict';

  var user = Auth.current();

  UI.fillAdminBar(user);
  UI.markCurrentTab();
  UI.warnIfBlocked();

  /* ---------------------------------------------------------------
     아래는 껍데기 확인용입니다. 실제 화면을 만들 때 지우세요.
     --------------------------------------------------------------- */

  var peek = [
    { label: 'setup (사업장·설비)', count: Store.setup.load().length },
    { label: 'library (안전 문구)', count: Store.library.load().length },
    { label: 'courses (교육)', count: Store.courses.load().length }
  ];

  var box = UI.$('peek');
  peek.forEach(function (row) {
    var cell = UI.el('div', 'kpi' + (row.count ? '' : ' alert'));
    cell.appendChild(UI.el('dt', null, row.label));
    var dd = UI.el('dd', null, String(row.count));
    dd.appendChild(UI.el('small', null, '건'));
    cell.appendChild(dd);
    cell.appendChild(UI.el('p', 'hint', row.count ? '읽을 수 있습니다' : '비어 있습니다'));
    box.appendChild(cell);
  });
})();
