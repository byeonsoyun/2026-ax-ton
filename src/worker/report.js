/* ===================================================================
   report.js — 위험요소 신고

   담당: 노동자 B
   기능번호: 기능8
   읽는 키: setup
   쓰는 키: reports
   근거: 화면.txt 신고 페이지 · SCREEN 기능8 · PRD §9.2

   설비 선택(그림 목록) → 위험유형 선택(픽토그램) → 음성메모(선택) → 접수. ★ 신고는 익명이 기본입니다. reports 에 신고자를 식별할 수 있는 값을 절대 넣지 마세요. 익명성이 깨지면 신고가 멈추고, 재해 감소의 선행지표도 함께 사라집니다.

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

  UI.fillWorkerBar(user);
  UI.markCurrentTab();
  UI.warnIfBlocked();

  /* ---------------------------------------------------------------
     아래는 껍데기 확인용입니다. 실제 화면을 만들 때 지우세요.
     --------------------------------------------------------------- */

  var peek = [
    { label: 'setup (사업장·설비)', count: Store.setup.load().length },
    { label: 'reports (신고)', count: Store.reports.load().length }
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
