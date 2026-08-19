/* ===================================================================
   library.js — 안전 문구 라이브러리

   담당: 관리자 D
   기능번호: 기능9
   읽는 키: library
   쓰는 키: library
   근거: SCREEN 기능9 (F-08) · PRD §9.3 §10 · 목업 13-operator-library.html

   오역 신고 큐(본문 맨 위)
   역번역 대조
   문구 목록
   검수 상태 3종(완료 / 대기 / 중지). ★ 오역 신고는 접수하는 순간 사용 중지입니다. 확인한 뒤 내리는 순서가 아닙니다. seed 의 ph-3 이 부정이 뒤집혀 정반대 지시가 된 예입니다 — 역번역 대조로 잡는 장면을 만드세요. ★ AI는 초안
   역번역 대조
   음성합성까지. 승인은 사람이 합니다. projects/campus-ax-ton/code/13-operator-library.html 에 정적 목업이 있습니다.

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
    { label: 'library (안전 문구)', count: Store.library.load().length }
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
