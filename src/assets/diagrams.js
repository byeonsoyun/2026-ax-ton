/* ===================================================================
   diagrams.js — 설비 도해와 그 위의 이름 붙은 위험 구역

   두 화면이 같은 그림을 본다.
     기능4 (worker/quiz)    노동자가 위험 지점을 짚는다
     기능2 (admin/content)  담당자가 정답이 될 위험 구역을 고른다
   같은 그림을 두 벌 두면 한쪽만 고쳐졌을 때 정답 자리가 어긋난다.

   ★ 사진이 아니라 그림이다.
     외부 이미지를 불러올 수 없고(외부 요청 0건), 사진을 base64 로 넣으면
     저장소 5MB 를 몇 장에 채운다.
     실제 설비 사진이 필요해지는 시점이 서버가 필요해지는 시점이다.

   ★ 좌표계는 viewBox="0 0 100 100" 이다. 좌표가 곧 퍼센트라
     courses 의 answer { x, y, r } 이 화면 크기와 무관하게 같은 자리를 가리킨다.

   ★ innerHTML 을 쓰지 않는다. createElementNS 로 만든다.
   =================================================================== */

var Diagrams = (function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  /* 도형 — [태그, 속성]. 채운 도형은 fill/stroke 를 따로 지정한다. */
  var SHAPES = {
    press: [
      ['rect',   { x: 8, y: 6, width: 84, height: 88, rx: 3 }],
      ['circle', { cx: 20, cy: 18, r: 6 }],
      ['line',   { x1: 20, y1: 12, x2: 20, y2: 18 }],
      ['circle', { cx: 78, cy: 18, r: 7 }],
      ['line',   { x1: 78, y1: 18, x2: 83, y2: 13 }],
      ['rect',   { x: 30, y: 34, width: 40, height: 9, fill: 'currentColor', stroke: 'none', opacity: '.85' }],
      ['line',   { x1: 50, y1: 43, x2: 50, y2: 58 }],
      ['rect',   { x: 32, y: 58, width: 36, height: 12, 'stroke-width': 2.5 }],
      ['line',   { x1: 14, y1: 70, x2: 86, y2: 70 }],
      ['rect',   { x: 72, y: 76, width: 11, height: 7, rx: 1 }]
    ],
    booth: [
      ['rect',   { x: 6, y: 10, width: 88, height: 80, rx: 3 }],
      ['circle', { cx: 78, cy: 22, r: 9 }],
      ['line',   { x1: 72, y1: 16, x2: 84, y2: 28 }],
      ['line',   { x1: 84, y1: 16, x2: 72, y2: 28 }],
      ['rect',   { x: 30, y: 52, width: 24, height: 22, 'stroke-width': 2.5 }],
      ['path',   { d: 'M22 56 L30 60 L22 64' }],
      ['circle', { cx: 18, cy: 60, r: 3, fill: 'currentColor', stroke: 'none', opacity: '.8' }],
      ['rect',   { x: 8, y: 74, width: 16, height: 16 }],
      ['rect',   { x: 72, y: 70, width: 16, height: 18, rx: 2 }],
      ['line',   { x1: 72, y1: 76, x2: 88, y2: 76 }]
    ],
    panel: [
      ['rect',   { x: 18, y: 8, width: 64, height: 84, rx: 3 }],
      ['rect',   { x: 26, y: 16, width: 48, height: 20 }],
      ['line',   { x1: 34, y1: 16, x2: 34, y2: 36 }],
      ['line',   { x1: 50, y1: 16, x2: 50, y2: 36 }],
      ['line',   { x1: 66, y1: 16, x2: 66, y2: 36 }],
      ['rect',   { x: 30, y: 46, width: 20, height: 14, rx: 2, fill: 'currentColor', stroke: 'none', opacity: '.8' }],
      ['line',   { x1: 62, y1: 50, x2: 62, y2: 62, 'stroke-width': 2.5 }],
      ['line',   { x1: 56, y1: 62, x2: 68, y2: 62, 'stroke-width': 2.5 }],
      ['line',   { x1: 58, y1: 66, x2: 66, y2: 66, 'stroke-width': 2.5 }],
      ['line',   { x1: 60, y1: 70, x2: 64, y2: 70, 'stroke-width': 2.5 }],
      ['circle', { cx: 76, cy: 50, r: 3 }],
      ['rect',   { x: 30, y: 76, width: 40, height: 8, rx: 2 }]
    ],
    /* 도해를 그려 두지 않은 설비. 구역도 주지 않고, 그림 아무 곳이나 짚는 방식으로 넘어간다. */
    generic: [
      ['rect',   { x: 12, y: 14, width: 76, height: 72, rx: 4 }],
      ['circle', { cx: 30, cy: 30, r: 7 }],
      ['rect',   { x: 34, y: 46, width: 32, height: 14, fill: 'currentColor', stroke: 'none', opacity: '.8' }],
      ['rect',   { x: 34, y: 66, width: 32, height: 10, 'stroke-width': 2.5 }],
      ['rect',   { x: 68, y: 70, width: 12, height: 8, rx: 1 }]
    ]
  };

  /* 이름 붙은 구역.
     label 은 화면 낭독기가 읽는 이름이 되고,
     consequence 는 그곳을 짚었을 때 "실제로 어떤 사고가 되는지" 다. */
  var ZONES = {
    press: [
      { x: 20, y: 18, w: 18, h: 18, label: '전원 스위치',
        consequence: '전원 스위치는 작업 전에 차단하는 곳입니다. 손이 끼이는 자리는 아닙니다.' },
      { x: 78, y: 18, w: 20, h: 20, label: '잔류 압력 게이지',
        consequence: '게이지는 압력이 남아 있는지 확인하는 곳입니다. 손이 끼이는 자리는 아닙니다.' },
      { x: 50, y: 51, w: 40, h: 24, label: '램과 금형 사이 작업 지점',
        consequence: '램이 내려오는 자리입니다. 전원이 꺼져 있어도 남아 있는 압력으로 램이 떨어져 손이 끼입니다.' },
      { x: 77, y: 79, w: 18, h: 16, label: '안전핀 삽입구',
        consequence: '안전핀은 램이 떨어지지 않게 고정하는 곳입니다. 손이 끼이는 자리는 아닙니다.' }
    ],
    booth: [
      { x: 78, y: 22, w: 22, h: 22, label: '환기팬',
        consequence: '환기팬은 유증기를 빼내는 곳입니다. 팬이 멈추면 위험해지지만, 팬 자체를 만지는 작업은 아닙니다.' },
      { x: 40, y: 62, w: 30, h: 26, label: '도장 작업 구역',
        consequence: '분사한 도료의 유증기가 이곳에 모입니다. 방독마스크 없이 들어가면 질식하거나 중독됩니다.' },
      { x: 16, y: 82, w: 20, h: 18, label: '출입구',
        consequence: '출입구는 대피 통로입니다. 막아 두면 안 되지만, 마스크가 필요한 자리는 아닙니다.' },
      { x: 80, y: 79, w: 20, h: 22, label: '도료 저장통',
        consequence: '도료 저장통은 화기를 멀리해야 하는 곳입니다. 도장 작업을 하는 자리는 아닙니다.' }
    ],
    panel: [
      { x: 50, y: 26, w: 52, h: 24, label: '노출된 단자대',
        consequence: '전기가 흐르는 단자가 드러난 곳입니다. 차단하지 않고 만지면 감전됩니다.' },
      { x: 40, y: 53, w: 24, h: 18, label: '주 차단기',
        consequence: '주 차단기는 전원을 내리는 곳입니다. 여기를 먼저 내려야 나머지가 안전해집니다.' },
      { x: 62, y: 60, w: 18, h: 18, label: '접지 단자',
        consequence: '접지 단자는 새어 나온 전기를 땅으로 보내는 곳입니다.' },
      { x: 78, y: 40, w: 14, h: 14, label: '문 손잡이',
        consequence: '문 손잡이입니다. 전기가 흐르는 자리는 아닙니다.' },
      { x: 50, y: 80, w: 40, h: 14, label: '케이블 인입구',
        consequence: '케이블이 들어오는 곳입니다. 피복이 벗겨져 있으면 감전 위험이 있습니다.' }
    ],
    generic: []
  };

  /* 설비의 위험유형으로 어느 도해를 쓸지 고른다.
     설비 id 로 고르면 담당자가 직접 등록한 설비(id 가 자동 생성값)에는 못 맞는다. */
  function nameFor(equipment) {
    var h = (equipment && equipment.hazards) || [];
    if (h.indexOf('pinch') !== -1) return 'press';
    if (h.indexOf('fire') !== -1 || h.indexOf('chemical') !== -1 || h.indexOf('choke') !== -1) return 'booth';
    if (h.indexOf('shock') !== -1) return 'panel';
    return 'generic';
  }

  function has(name) { return !!SHAPES[name]; }

  function svg(name) {
    var shapes = SHAPES[name] || SHAPES.generic;

    var root = document.createElementNS(NS, 'svg');
    root.setAttribute('viewBox', '0 0 100 100');
    root.setAttribute('fill', 'none');
    root.setAttribute('stroke', 'currentColor');
    root.setAttribute('stroke-width', '1.5');
    root.setAttribute('stroke-linecap', 'round');
    root.setAttribute('aria-hidden', 'true');

    shapes.forEach(function (shape) {
      var node = document.createElementNS(NS, shape[0]);
      var attrs = shape[1];
      Object.keys(attrs).forEach(function (key) {
        node.setAttribute(key, String(attrs[key]));
      });
      root.appendChild(node);
    });

    return root;
  }

  function zones(name) {
    return (ZONES[name] || []).slice();
  }

  /* 정답 원 안에 들어오는지. 기능4 는 채점에, 기능2 는 "이 구역을 고르면
     어떤 원이 되는지" 를 되짚는 데 쓴다. */
  function inAnswer(answer, x, y) {
    if (!answer || typeof answer.x !== 'number') return false;
    var dx = x - answer.x;
    var dy = y - answer.y;
    return Math.sqrt(dx * dx + dy * dy) <= (answer.r || 12);
  }

  /* 구역 하나를 정답으로 삼는 원. 구역 중심에 반지름은 구역이 확실히 들어올 만큼. */
  function answerFor(zone) {
    return { x: zone.x, y: zone.y, r: 12 };
  }

  return {
    nameFor: nameFor, has: has, svg: svg, zones: zones,
    inAnswer: inAnswer, answerFor: answerFor
  };
})();
