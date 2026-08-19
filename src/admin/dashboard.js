/* ===================================================================
   dashboard.js — 담당자 대시보드

   담당: 관리자 C
   기능번호: 기능6
   읽는 키: progress, reports, setup, courses
   쓰는 키: reports
   근거: SCREEN 기능6 (F-06) · PRD §2.2 §9.2 · 목업 12-admin-dashboard.html

   이수 현황(작은 타일)
   이해도 취약 항목(가장 크게)
   조치 대상
   익명 신고 처리 큐
   다음 교육 기한. "인도네시아어 화재 대응 40%" 같은 값은 노동자 평가가 아니라 콘텐츠 개선 신호라고 화면 안에 적습니다. 개인별 점수의 인사·평가 목적 내보내기를 제공하지 않습니다. 이 화면은 AI가 개입하지 않습니다 — 기록을 그대로 센 값만 보여 줍니다. projects/campus-ax-ton/code/12-admin-dashboard.html 에 정적 목업이 있으니 그대로 옮겨 오면 됩니다.

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
    { label: 'reports (신고)', count: Store.reports.load().length },
    { label: 'setup (사업장·설비)', count: Store.setup.load().length },
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
