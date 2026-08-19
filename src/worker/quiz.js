/* ===================================================================
   quiz.js — 이해도 검증

   담당: 노동자 A
   기능번호: 기능4
   읽는 키: courses, setup
   쓰는 키: progress
   근거: SCREEN 기능4 · PRD §2.2 · 발표 대본 ②-둘째

   문항 유형 세 가지 — hotspot(사진에서 위험 지점 터치)
   choice(올바른 작업 고르기)
   match(보호구 연결하기). 문항은 음성으로 읽어 주고, 통과하지 못하면 progress 에 passed:false 로 남아 교육 완료로 기록되지 않습니다. 미통과는 노동자의 실패가 아니라 교육의 실패로 적습니다. 최초 통과율 100%는 문항이 쉬운 것이라 지표 실패로 봅니다(목표 70~85%).

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
    { label: 'courses (교육)', count: Store.courses.load().length },
    { label: 'setup (사업장·설비)', count: Store.setup.load().length },
    { label: 'progress (수강·검증 이력)', count: Store.progress.load().length }
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
