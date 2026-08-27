/* ===================================================================
   qr.js — QR 코드를 직접 만든다 (D1)

   담당: 공용
   근거: SCREEN 기능2 · ISO/IEC 18004

   ★ 왜 직접 짜는가
     이 프로젝트는 외부 요청이 0건이다 (CDN · npm · 웹폰트 전부 금지).
     그 규칙이 "인터넷 없이 file:// 로 그냥 열린다" 를 지탱하고 있고,
     그게 이 프로젝트의 확인 방법 전체다. QR 라이브러리 하나를 들이는 순간
     그것을 잃는다. 그래서 인코딩을 여기서 만든다.

   ★★ 스캔되지 않는 "QR 처럼 생긴 그림" 을 그리지 않는다.
     설비 앞에 붙여 놓고 안 찍히면, 노동자는 교육을 못 듣고
     담당자는 붙였다고 믿는다. 그게 아무것도 안 붙인 것보다 나쁘다.
     그래서 규격을 줄여서 흉내 내지 않고, 되는 범위를 좁게 잡되
     그 범위 안에서는 규격대로 만든다.

   만드는 범위 — 바이트 모드 · 오류정정 M · 버전 1~10 (최대 213바이트)
     · 바이트 모드: URL 은 전부 여기 들어간다
     · 오류정정 M(약 15% 복원): 현장 벽에 붙는 종이다. 기름이 튀고 긁힌다.
       L 은 너무 약하고, Q·H 는 같은 주소에 더 큰 그림이 필요하다
     · 버전 10 까지: 이 서비스의 주소는 60바이트 안쪽이라 버전 4면 된다.
       열 배 여유를 두고 끊었다. 넘으면 null 을 돌려주고, 부르는 쪽이
       "주소가 너무 깁니다" 라고 화면에 적는다 — 조용히 깨진 그림을 내지 않는다

   ES 모듈을 쓰지 않는다. file:// 에서 CORS 로 막힌다.
   =================================================================== */

var QR = (function () {
  'use strict';

  /* -----------------------------------------------------------------
     GF(256) — 오류정정 계산이 도는 수 체계

     8비트 값끼리 곱하고 나누려면 이런 체계가 필요하다.
     원시 다항식은 규격이 정한 0x11D 다.
     ----------------------------------------------------------------- */

  var EXP = new Array(512);
  var LOG = new Array(256);

  (function buildTables() {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11D;
    }
    for (i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();

  function gmul(a, b) {
    if (a === 0 || b === 0) return 0;
    return EXP[LOG[a] + LOG[b]];
  }

  /* 오류정정 코드워드 n개를 만드는 생성 다항식.
     계수는 높은 차수부터 담는다. */
  function rsGenerator(n) {
    var poly = [1];
    for (var i = 0; i < n; i++) {
      var next = [];
      for (var z = 0; z <= poly.length; z++) next.push(0);
      for (var j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gmul(poly[j], EXP[i]);
      }
      poly = next;
    }
    return poly;
  }

  /* 데이터 코드워드에 붙일 오류정정 코드워드 */
  function rsEncode(data, ecLen) {
    var gen = rsGenerator(ecLen);
    var res = data.slice();
    var i, j;
    for (i = 0; i < ecLen; i++) res.push(0);

    for (i = 0; i < data.length; i++) {
      var factor = res[i];
      if (factor === 0) continue;
      for (j = 0; j < gen.length; j++) res[i + j] ^= gmul(gen[j], factor);
    }
    return res.slice(data.length);
  }

  /* -----------------------------------------------------------------
     버전별 표 (오류정정 M 만)

     ec  — 블록 하나에 붙는 오류정정 코드워드 수
     g1/d1 — 1군 블록 수 / 블록당 데이터 코드워드
     g2/d2 — 2군 (없으면 0)

     capacity — 바이트 모드로 담을 수 있는 글자 바이트 수.
       계산으로도 나오지만 규격 표를 그대로 적어 두고 검사로 맞춰 본다.
       표가 틀리면 만들어진 QR 이 통째로 못 읽히므로, 두 갈래로 확인한다.
     ----------------------------------------------------------------- */

  var VERSIONS = {
    1:  { ec: 10, g1: 1, d1: 16, g2: 0, d2: 0, capacity: 14,  align: [] },
    2:  { ec: 16, g1: 1, d1: 28, g2: 0, d2: 0, capacity: 26,  align: [6, 18] },
    3:  { ec: 26, g1: 1, d1: 44, g2: 0, d2: 0, capacity: 42,  align: [6, 22] },
    4:  { ec: 18, g1: 2, d1: 32, g2: 0, d2: 0, capacity: 62,  align: [6, 26] },
    5:  { ec: 24, g1: 2, d1: 43, g2: 0, d2: 0, capacity: 84,  align: [6, 30] },
    6:  { ec: 16, g1: 4, d1: 27, g2: 0, d2: 0, capacity: 106, align: [6, 34] },
    7:  { ec: 18, g1: 4, d1: 31, g2: 0, d2: 0, capacity: 122, align: [6, 22, 38] },
    8:  { ec: 22, g1: 2, d1: 38, g2: 2, d2: 39, capacity: 152, align: [6, 24, 42] },
    9:  { ec: 22, g1: 3, d1: 36, g2: 2, d2: 37, capacity: 180, align: [6, 26, 46] },
    10: { ec: 26, g1: 4, d1: 43, g2: 1, d2: 44, capacity: 213, align: [6, 28, 50] }
  };

  var MIN_VERSION = 1;
  var MAX_VERSION = 10;

  function dataCodewords(v) {
    var t = VERSIONS[v];
    return t.g1 * t.d1 + t.g2 * t.d2;
  }

  function sizeOf(v) { return v * 4 + 17; }

  /* 이 길이를 담을 수 있는 가장 작은 버전. 없으면 0. */
  function versionFor(byteLength) {
    for (var v = MIN_VERSION; v <= MAX_VERSION; v++) {
      if (byteLength <= VERSIONS[v].capacity) return v;
    }
    return 0;
  }

  /* -----------------------------------------------------------------
     글자 → 바이트 (UTF-8)

     우리 주소는 전부 아스키지만, 설비 이름이 섞일 수도 있으니
     한글도 제대로 담기게 해 둔다.
     ----------------------------------------------------------------- */

  function utf8Bytes(str) {
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);

      // 서로게이트 쌍을 하나의 코드포인트로 되돌린다
      if (c >= 0xD800 && c <= 0xDBFF && i + 1 < str.length) {
        var next = str.charCodeAt(i + 1);
        if (next >= 0xDC00 && next <= 0xDFFF) {
          c = 0x10000 + ((c - 0xD800) << 10) + (next - 0xDC00);
          i++;
        }
      }

      if (c < 0x80) {
        out.push(c);
      } else if (c < 0x800) {
        out.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F));
      } else if (c < 0x10000) {
        out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
      } else {
        out.push(0xF0 | (c >> 18), 0x80 | ((c >> 12) & 0x3F),
          0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
      }
    }
    return out;
  }

  /* -----------------------------------------------------------------
     데이터 코드워드 만들기
     ----------------------------------------------------------------- */

  function makeDataCodewords(bytes, version) {
    var bits = [];

    function put(value, length) {
      for (var i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
    }

    put(4, 4);                                   // 바이트 모드
    put(bytes.length, version < 10 ? 8 : 16);    // 글자 수 — 버전 10부터 16비트
    for (var i = 0; i < bytes.length; i++) put(bytes[i], 8);

    var capacity = dataCodewords(version) * 8;

    // 끝 표시 — 자리가 모자라면 들어가는 만큼만
    put(0, Math.min(4, capacity - bits.length));

    // 바이트 경계까지 0
    while (bits.length % 8 !== 0) bits.push(0);

    // 남는 자리는 규격이 정한 두 값을 번갈아 채운다
    var pads = [0xEC, 0x11];
    var k = 0;
    while (bits.length < capacity) { put(pads[k % 2], 8); k++; }

    var cw = [];
    for (i = 0; i < bits.length; i += 8) {
      var v = 0;
      for (var j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
      cw.push(v);
    }
    return cw;
  }

  /* 블록으로 나누고 오류정정을 붙인 뒤 규격대로 섞는다.
     ★ 섞는 이유 — 한 군데가 크게 더러워져도 손상이 여러 블록에 흩어져야
       각 블록이 자기 힘으로 복원할 수 있다. 섞지 않으면 한 블록이 통째로 죽는다. */
  function interleave(dataCw, version) {
    var t = VERSIONS[version];
    var blocks = [];
    var pos = 0;
    var i, b;

    for (i = 0; i < t.g1; i++) { blocks.push(dataCw.slice(pos, pos + t.d1)); pos += t.d1; }
    for (i = 0; i < t.g2; i++) { blocks.push(dataCw.slice(pos, pos + t.d2)); pos += t.d2; }

    var ecBlocks = blocks.map(function (blk) { return rsEncode(blk, t.ec); });

    var out = [];
    var maxData = Math.max(t.d1, t.d2);
    for (i = 0; i < maxData; i++) {
      for (b = 0; b < blocks.length; b++) {
        if (i < blocks[b].length) out.push(blocks[b][i]);
      }
    }
    for (i = 0; i < t.ec; i++) {
      for (b = 0; b < ecBlocks.length; b++) out.push(ecBlocks[b][i]);
    }
    return out;
  }

  /* -----------------------------------------------------------------
     형식 정보 · 버전 정보

     둘 다 BCH 부호다. 이 값이 틀리면 스캐너가 마스크를 못 풀어서
     그림은 멀쩡한데 아무것도 안 읽힌다.
     ----------------------------------------------------------------- */

  /* 오류정정 M 의 형식 비트는 0 이다 (L=1 · M=0 · Q=3 · H=2) */
  var EC_FORMAT_BITS = 0;

  function formatBits(mask) {
    var data = (EC_FORMAT_BITS << 3) | mask;
    var rem = data;
    for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    return ((data << 10) | rem) ^ 0x5412;
  }

  function versionBits(version) {
    var rem = version;
    for (var i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
    return (version << 12) | rem;
  }

  /* -----------------------------------------------------------------
     격자 그리기
     ----------------------------------------------------------------- */

  function blankGrid(size) {
    var grid = [];
    for (var r = 0; r < size; r++) {
      var row = [];
      for (var c = 0; c < size; c++) row.push(0);
      grid.push(row);
    }
    return grid;
  }

  /* 기능 무늬(찾기·타이밍·정렬·형식)를 그린다.
     fixed[r][c] 가 1이면 데이터가 들어갈 수 없는 자리다. */
  function drawFunctionPatterns(m, fixed, version) {
    var size = sizeOf(version);
    var i, j, r, c;

    function set(r2, c2, v) {
      if (r2 < 0 || c2 < 0 || r2 >= size || c2 >= size) return;
      m[r2][c2] = v;
      fixed[r2][c2] = 1;
    }

    /* 찾기 무늬 — 7×7. 세 모서리에 있어서 스캐너가 방향을 잡는다 */
    function finder(top, left) {
      for (r = -1; r <= 7; r++) {
        for (c = -1; c <= 7; c++) {
          var inner = Math.max(Math.abs(r - 3), Math.abs(c - 3));
          var on = (r >= 0 && r <= 6 && c >= 0 && c <= 6) && (inner !== 2 && inner <= 3);
          set(top + r, left + c, on ? 1 : 0);      // -1 줄은 구분 여백(흰 테두리)
        }
      }
    }

    finder(0, 0);
    finder(0, size - 7);
    finder(size - 7, 0);

    /* 타이밍 무늬 — 6번 줄과 6번 칸. 격자 간격을 알려 준다 */
    for (i = 8; i < size - 8; i++) {
      var on2 = (i % 2 === 0) ? 1 : 0;
      set(6, i, on2);
      set(i, 6, on2);
    }

    /* 정렬 무늬 — 5×5. 크면 휘어지므로 중간중간 기준점을 둔다.
       세 모서리(찾기 무늬 자리)에는 그리지 않는다 */
    var pos = VERSIONS[version].align;
    for (i = 0; i < pos.length; i++) {
      for (j = 0; j < pos.length; j++) {
        var corner = (i === 0 && j === 0) ||
          (i === 0 && j === pos.length - 1) ||
          (i === pos.length - 1 && j === 0);
        if (corner) continue;

        for (r = -2; r <= 2; r++) {
          for (c = -2; c <= 2; c++) {
            var d = Math.max(Math.abs(r), Math.abs(c));
            set(pos[i] + r, pos[j] + c, (d !== 1) ? 1 : 0);
          }
        }
      }
    }

    /* 형식 정보 자리를 미리 막는다. 값은 마스크를 고른 뒤에 채운다.

       ★ 6번은 건너뛴다. (6,8)과 (8,6)은 형식 정보가 아니라 **타이밍 무늬**다.
         여기까지 0으로 덮으면 타이밍 무늬에 구멍이 두 개 나고,
         스캐너가 격자 간격을 잘못 재서 통째로 못 읽는다.
         그림은 멀쩡해 보이는데 안 찍히는, 가장 찾기 어려운 종류의 고장이다. */
    for (i = 0; i <= 8; i++) {
      if (i === 6) continue;
      set(8, i, 0);
      set(i, 8, 0);
    }
    for (i = 0; i < 8; i++) { set(8, size - 1 - i, 0); set(size - 1 - i, 8, 0); }

    /* 항상 검은 한 칸 */
    set(size - 8, 8, 1);

    /* 버전 정보 — 버전 7부터 */
    if (version >= 7) {
      var vb = versionBits(version);
      for (i = 0; i < 18; i++) {
        var bit = (vb >>> i) & 1;
        var a = size - 11 + (i % 3);
        var b = Math.floor(i / 3);
        set(b, a, bit);
        set(a, b, bit);
      }
    }
  }

  /* 데이터를 오른쪽 아래에서부터 두 칸씩 지그재그로 채운다 */
  function drawCodewords(m, fixed, version, codewords) {
    var size = sizeOf(version);
    var bit = 0;
    var total = codewords.length * 8;

    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;              // 6번 칸은 타이밍 무늬라 건너뛴다

      for (var vert = 0; vert < size; vert++) {
        for (var j = 0; j < 2; j++) {
          var c = right - j;
          var upward = ((right + 1) & 2) === 0;
          var r = upward ? (size - 1 - vert) : vert;

          if (fixed[r][c] || bit >= total) continue;
          m[r][c] = (codewords[bit >>> 3] >>> (7 - (bit & 7))) & 1;
          bit++;
        }
      }
    }
    return bit;
  }

  /* -----------------------------------------------------------------
     마스크

     ★ 왜 필요한가 — 데이터가 우연히 찾기 무늬를 닮거나 한쪽이 통째로
       검게 나오면 스캐너가 못 읽는다. 여덟 가지로 뒤집어 보고
       가장 읽기 좋은 것을 고른다.
     ----------------------------------------------------------------- */

  function maskAt(mask, r, c) {
    switch (mask) {
      case 0: return (r + c) % 2 === 0;
      case 1: return r % 2 === 0;
      case 2: return c % 3 === 0;
      case 3: return (r + c) % 3 === 0;
      case 4: return (Math.floor(c / 3) + Math.floor(r / 2)) % 2 === 0;
      case 5: return ((r * c) % 2) + ((r * c) % 3) === 0;
      case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
      default: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
    }
  }

  function applyMask(m, fixed, mask) {
    for (var r = 0; r < m.length; r++) {
      for (var c = 0; c < m.length; c++) {
        if (!fixed[r][c] && maskAt(mask, r, c)) m[r][c] ^= 1;
      }
    }
  }

  function drawFormat(m, fixed, version, mask) {
    var size = sizeOf(version);
    var bits = formatBits(mask);
    var i;

    function set(r, c, v) { m[r][c] = v; fixed[r][c] = 1; }

    for (i = 0; i <= 5; i++) set(i, 8, (bits >>> i) & 1);
    set(7, 8, (bits >>> 6) & 1);
    set(8, 8, (bits >>> 7) & 1);
    set(8, 7, (bits >>> 8) & 1);
    for (i = 9; i < 15; i++) set(8, 14 - i, (bits >>> i) & 1);

    for (i = 0; i < 8; i++) set(8, size - 1 - i, (bits >>> i) & 1);
    for (i = 8; i < 15; i++) set(size - 15 + i, 8, (bits >>> i) & 1);

    set(size - 8, 8, 1);      // 항상 검은 칸
  }

  /* 규격이 정한 네 가지 벌점. 낮을수록 읽기 좋다. */
  function penalty(m) {
    var size = m.length;
    var score = 0;
    var r, c, run, i;

    // 1. 같은 색이 5칸 이상 이어지는 줄
    for (r = 0; r < size; r++) {
      run = 1;
      for (c = 1; c < size; c++) {
        if (m[r][c] === m[r][c - 1]) { run++; } else { if (run >= 5) score += 3 + (run - 5); run = 1; }
      }
      if (run >= 5) score += 3 + (run - 5);
    }
    for (c = 0; c < size; c++) {
      run = 1;
      for (r = 1; r < size; r++) {
        if (m[r][c] === m[r - 1][c]) { run++; } else { if (run >= 5) score += 3 + (run - 5); run = 1; }
      }
      if (run >= 5) score += 3 + (run - 5);
    }

    // 2. 같은 색 2×2 덩어리
    for (r = 0; r < size - 1; r++) {
      for (c = 0; c < size - 1; c++) {
        var v = m[r][c];
        if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) score += 3;
      }
    }

    // 3. 찾기 무늬를 닮은 무늬 (1011101 양옆에 흰 4칸)
    var A = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
    var B = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];

    function matches(get, start) {
      var a = true, b = true;
      for (i = 0; i < 11; i++) {
        var v2 = get(start + i);
        if (v2 !== A[i]) a = false;
        if (v2 !== B[i]) b = false;
      }
      return a || b;
    }

    for (r = 0; r < size; r++) {
      for (c = 0; c + 11 <= size; c++) {
        if (matches(function (k) { return m[r][k]; }, c)) score += 40;
      }
    }
    for (c = 0; c < size; c++) {
      for (r = 0; r + 11 <= size; r++) {
        if (matches(function (k) { return m[k][c]; }, r)) score += 40;
      }
    }

    // 4. 검은 칸 비율이 50% 에서 멀수록
    var dark = 0;
    for (r = 0; r < size; r++) for (c = 0; c < size; c++) dark += m[r][c];
    var percent = (dark * 100) / (size * size);
    score += Math.floor(Math.abs(percent - 50) / 5) * 10;

    return score;
  }

  /* -----------------------------------------------------------------
     만들기
     ----------------------------------------------------------------- */

  /* text 를 담은 QR 을 만든다.
     담을 수 없으면 null 을 돌려준다 — 부르는 쪽이 화면에 이유를 적는다.

     돌려주는 것: { version, size, modules, mask, bytes } */
  function encode(text) {
    var bytes = utf8Bytes(String(text == null ? '' : text));
    var version = versionFor(bytes.length);
    if (!version) return null;

    var codewords = interleave(makeDataCodewords(bytes, version), version);
    var size = sizeOf(version);

    var best = null;
    for (var mask = 0; mask < 8; mask++) {
      var m = blankGrid(size);
      var fixed = blankGrid(size);

      drawFunctionPatterns(m, fixed, version);
      drawCodewords(m, fixed, version, codewords);
      applyMask(m, fixed, mask);
      drawFormat(m, fixed, version, mask);

      var score = penalty(m);
      if (!best || score < best.score) best = { score: score, mask: mask, modules: m };
    }

    return {
      version: version,
      size: size,
      modules: best.modules,
      mask: best.mask,
      bytes: bytes.length
    };
  }

  /* -----------------------------------------------------------------
     SVG 로 그리기

     ★ 이미지 파일을 만들지 않는다. 외부 요청 0건이어야 하고,
       화면 크기나 인쇄 배율이 달라져도 안 깨져야 한다.
       설비 그림(diagrams.js)이 이미 같은 방식이다.

     ★ 여백(quiet zone) 4칸을 반드시 남긴다.
       규격이 정한 것이고, 없으면 스캐너가 QR 의 끝을 못 찾는다.
       "왜 어떤 폰에서만 안 찍히지" 의 가장 흔한 원인이다.
     ----------------------------------------------------------------- */

  var NS = 'http://www.w3.org/2000/svg';
  var QUIET = 4;

  function svg(text, opts) {
    var code = encode(text);
    if (!code) return null;

    opts = opts || {};
    var side = code.size + QUIET * 2;

    var node = document.createElementNS(NS, 'svg');
    node.setAttribute('viewBox', '0 0 ' + side + ' ' + side);
    node.setAttribute('role', 'img');
    node.setAttribute('aria-label', opts.label || 'QR 코드');
    node.setAttribute('shape-rendering', 'crispEdges');

    /* 흰 바탕을 직접 깐다. 배경색에 기대면 어두운 화면에서 반전돼
       스캔이 안 된다 — QR 은 밝은 바탕에 어두운 칸이어야 한다. */
    var bg = document.createElementNS(NS, 'rect');
    bg.setAttribute('x', '0');
    bg.setAttribute('y', '0');
    bg.setAttribute('width', String(side));
    bg.setAttribute('height', String(side));
    bg.setAttribute('fill', '#ffffff');
    node.appendChild(bg);

    /* 한 칸씩 rect 를 만들면 노드가 수천 개가 된다.
       가로로 이어진 칸을 한 조각으로 묶어 path 하나로 그린다. */
    var d = [];
    for (var r = 0; r < code.size; r++) {
      var c = 0;
      while (c < code.size) {
        if (!code.modules[r][c]) { c++; continue; }
        var start = c;
        while (c < code.size && code.modules[r][c]) c++;
        d.push('M' + (start + QUIET) + ' ' + (r + QUIET) +
          'h' + (c - start) + 'v1h-' + (c - start) + 'z');
      }
    }

    var path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d.join(''));
    path.setAttribute('fill', '#000000');
    node.appendChild(path);

    return node;
  }

  return {
    encode: encode,
    svg: svg,

    // 검사와 화면이 함께 보는 값들
    versionFor: versionFor,
    capacityOf: function (v) { return VERSIONS[v] ? VERSIONS[v].capacity : 0; },
    sizeOf: sizeOf,
    dataCodewords: dataCodewords,
    formatBits: formatBits,
    versionBits: versionBits,
    rsGenerator: rsGenerator,
    utf8Bytes: utf8Bytes,
    MAX_VERSION: MAX_VERSION,
    QUIET: QUIET
  };
})();
