/* ===================================================================
   proof.js — 교육 증빙 생성

   담당: 관리자 D
   기능번호: 기능5
   읽는 키: progress, courses, setup
   쓰는 키: 없음
   근거: SCREEN 기능5 · 발표 대본 ②-셋째

   일시
   언어
   문항
   점수
   서명을 그대로 담은 교육일지를 만듭니다. ★ 생성된 기록은 수정할 수 없고, 미이수자와 이해도 미달자를 문서에서 숨기는 경로를 만들지 않습니다. ★ "면책" 표현을 쓰지 않습니다. 교육 실시의 증빙일 뿐 법적 책임을 대신하지 않습니다. PDF는 브라우저 인쇄(window.print + @media print)로 충분합니다 — 외부 라이브러리를 넣지 마세요.

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
    { label: 'progress (수강·검증 이력)', count: Store.progress.load().length },
    { label: 'courses (교육)', count: Store.courses.load().length },
    { label: 'setup (사업장·설비)', count: Store.setup.load().length }
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
