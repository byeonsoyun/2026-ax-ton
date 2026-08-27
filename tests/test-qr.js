/* QR 코드 인코더 (D1) — 규격 대조 + 되읽기

   ★★ 이 검사가 왜 이렇게 생겼나

   눈으로 "QR 처럼 생겼다" 를 확인하는 것은 검사가 아니다.
   스캔이 안 되는 그림도 QR 처럼 생겼다. 그래서 두 갈래로 본다.

     ① 규격이 정한 상수와 대조한다 — 형식정보 · 버전정보 · 생성 다항식 · 용량표.
        이 값들은 ISO/IEC 18004 에 적힌 것이고 우리가 정할 수 있는 것이 아니다.
        하나라도 틀리면 만들어진 QR 은 통째로 못 읽힌다.

     ② 만든 QR 을 **규격대로 다시 읽는다.** 인코더와 다른 길로 간다 —
        격자에서 형식정보를 읽어 마스크를 알아내고, 마스크를 풀고,
        지그재그로 비트를 모으고, 블록을 되돌리고,
        **오류정정 신드롬이 0인지** 본다. 그리고 원문이 나오는지 본다.

   이것도 "내 글씨를 내가 읽는 것" 이라 규격 자체를 오해했으면 못 잡는다.
   그래서 ① 이 함께 있어야 하고, 마지막에는 **폰으로 실제로 찍어 봐야 한다.**
   그 확인은 07-next-tasks.md 의 D1 항목에 적어 두었다.
*/

const { boot, ok, eq, has, report } = require('./harness');

/* qr.js 는 화면 없이도 도는 순수 계산이라 아무 화면에나 얹어 꺼내 쓴다 */
const t = boot('admin/content.html',
  { login: 'kim@daesung.co.kr', role: 'admin' });
const QR = t.win.QR;

const bin = (n, w) => n.toString(2).padStart(w, '0');

/* =================================================================
   ① 규격 상수 대조
   ================================================================= */
{
  /* --- 형식 정보 (BCH 15,5 · 오류정정 M) ---
     규격 부록의 표에 그대로 적혀 있는 값들이다. */
  eq('형식정보 M · 마스크0', bin(QR.formatBits(0), 15), '101010000010010');
  eq('형식정보 M · 마스크1', bin(QR.formatBits(1), 15), '101000100100101');
  eq('형식정보 M · 마스크2', bin(QR.formatBits(2), 15), '101111001111100');
  eq('형식정보 M · 마스크7', bin(QR.formatBits(7), 15), '100101010100000');

  /* --- 버전 정보 (BCH 18,6 · 버전 7부터) --- */
  eq('버전정보 v7', QR.versionBits(7), 0x07C94);
  eq('버전정보 v8', QR.versionBits(8), 0x085BC);
  eq('버전정보 v9', QR.versionBits(9), 0x09A99);
  eq('버전정보 v10', QR.versionBits(10), 0x0A4D3);

  /* --- 오류정정 생성 다항식 ---
     계수를 α 지수로 바꾸면 규격 표와 같아야 한다. */
  const LOG = {};
  { let x = 1; for (let i = 0; i < 255; i++) { LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11D; } }
  const expo = (n) => QR.rsGenerator(n).map((c) => LOG[c]).join(',');

  eq('생성 다항식 10차', expo(10), '0,251,67,46,61,118,70,64,94,32,45');
  eq('생성 다항식 16차', expo(16),
    '0,120,104,107,109,102,161,76,3,91,191,147,169,182,194,225,120');
  eq('생성 다항식 26차', expo(26),
    '0,173,125,158,2,103,182,118,17,145,201,111,28,165,53,161,21,245,142,13,102,48,227,153,145,218,70');

  /* --- 용량표 ---
     ★ 표를 손으로 적었다. 계산과 어긋나면 만들어진 QR 이 통째로 깨진다.
       두 갈래로 확인한다 (표 vs 데이터 코드워드에서 계산). */
  const CAP = [14, 26, 42, 62, 84, 106, 122, 152, 180, 213];
  for (let v = 1; v <= 10; v++) {
    const header = 4 + (v < 10 ? 8 : 16);
    const calc = Math.floor((QR.dataCodewords(v) * 8 - header) / 8);
    eq('v' + v + ' 용량 — 표', QR.capacityOf(v), CAP[v - 1]);
    eq('v' + v + ' 용량 — 계산과 같다', calc, CAP[v - 1]);
    eq('v' + v + ' 격자 크기', QR.sizeOf(v), v * 4 + 17);
  }

  /* --- 버전 고르기 --- */
  eq('14바이트는 v1', QR.versionFor(14), 1);
  eq('15바이트는 v2', QR.versionFor(15), 2);
  eq('213바이트는 v10', QR.versionFor(213), 10);
  eq('★ 214바이트는 담을 수 없다 — 0', QR.versionFor(214), 0);
}

/* =================================================================
   ② 만든 QR 을 규격대로 다시 읽는다
   ================================================================= */

const EXP = new Array(512), LOGT = new Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) { EXP[i] = x; LOGT[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11D; }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
}
const gmul = (a, b) => (a === 0 || b === 0) ? 0 : EXP[LOGT[a] + LOGT[b]];

/* 블록 나눔 표를 검사 쪽에도 따로 적는다 —
   qr.js 의 표를 가져다 쓰면 표가 틀려도 둘이 사이좋게 틀린다. */
const TBL = {
  1: { ec: 10, g1: 1, d1: 16, g2: 0, d2: 0 },
  2: { ec: 16, g1: 1, d1: 28, g2: 0, d2: 0 },
  3: { ec: 26, g1: 1, d1: 44, g2: 0, d2: 0 },
  4: { ec: 18, g1: 2, d1: 32, g2: 0, d2: 0 },
  5: { ec: 24, g1: 2, d1: 43, g2: 0, d2: 0 },
  6: { ec: 16, g1: 4, d1: 27, g2: 0, d2: 0 },
  7: { ec: 18, g1: 4, d1: 31, g2: 0, d2: 0 },
  8: { ec: 22, g1: 2, d1: 38, g2: 2, d2: 39 },
  9: { ec: 22, g1: 3, d1: 36, g2: 2, d2: 37 },
  10: { ec: 26, g1: 4, d1: 43, g2: 1, d2: 44 },
};
const ALIGN = {
  1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34],
  7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
};

/* 데이터가 들어갈 수 없는 자리 */
function functionMap(version) {
  const size = version * 4 + 17;
  const f = [];
  for (let r = 0; r < size; r++) f.push(new Array(size).fill(0));
  const mark = (r, c) => { if (r >= 0 && c >= 0 && r < size && c < size) f[r][c] = 1; };

  const finder = (top, left) => {
    for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) mark(top + r, left + c);
  };
  finder(0, 0); finder(0, size - 7); finder(size - 7, 0);

  for (let i = 0; i < size; i++) { mark(6, i); mark(i, 6); }

  const pos = ALIGN[version];
  for (let i = 0; i < pos.length; i++) {
    for (let j = 0; j < pos.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === pos.length - 1) ||
          (i === pos.length - 1 && j === 0)) continue;
      for (let r = -2; r <= 2; r++) for (let c = -2; c <= 2; c++) mark(pos[i] + r, pos[j] + c);
    }
  }

  for (let i = 0; i <= 8; i++) { mark(8, i); mark(i, 8); }
  for (let i = 0; i < 8; i++) { mark(8, size - 1 - i); mark(size - 1 - i, 8); }
  mark(size - 8, 8);

  if (version >= 7) {
    for (let i = 0; i < 18; i++) {
      const a = size - 11 + (i % 3), b = Math.floor(i / 3);
      mark(b, a); mark(a, b);
    }
  }
  return f;
}

const maskAt = (k, r, c) => {
  switch (k) {
    case 0: return (r + c) % 2 === 0;
    case 1: return r % 2 === 0;
    case 2: return c % 3 === 0;
    case 3: return (r + c) % 3 === 0;
    case 4: return (Math.floor(c / 3) + Math.floor(r / 2)) % 2 === 0;
    case 5: return ((r * c) % 2) + ((r * c) % 3) === 0;
    case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
    default: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
  }
};

function decode(code) {
  const { size, version, modules } = code;

  /* 형식 정보를 격자에서 읽는다 — 인코더가 무엇을 썼는지 안 보고 */
  let raw = 0;
  for (let i = 0; i <= 5; i++) raw |= modules[i][8] << i;
  raw |= modules[7][8] << 6;
  raw |= modules[8][8] << 7;
  raw |= modules[8][7] << 8;
  for (let i = 9; i < 15; i++) raw |= modules[8][14 - i] << i;
  const fmt = raw ^ 0x5412;
  const ecLevel = fmt >> 13;
  const mask = (fmt >> 10) & 7;

  const f = functionMap(version);

  /* 마스크를 푼다 */
  const m = modules.map((row) => row.slice());
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) if (!f[r][c] && maskAt(mask, r, c)) m[r][c] ^= 1;
  }

  /* 지그재그로 비트를 모은다 */
  const bits = [];
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        const upward = ((right + 1) & 2) === 0;
        const r = upward ? (size - 1 - vert) : vert;
        if (!f[r][c]) bits.push(m[r][c]);
      }
    }
  }
  const cw = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    let v = 0;
    for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
    cw.push(v);
  }

  /* 섞은 것을 되돌린다 */
  const tb = TBL[version];
  const blocks = [];
  for (let i = 0; i < tb.g1; i++) blocks.push({ data: [], ec: [], len: tb.d1 });
  for (let i = 0; i < tb.g2; i++) blocks.push({ data: [], ec: [], len: tb.d2 });

  let p = 0;
  const maxD = Math.max(tb.d1, tb.d2);
  for (let i = 0; i < maxD; i++) {
    for (const b of blocks) if (i < b.len) b.data.push(cw[p++]);
  }
  for (let i = 0; i < tb.ec; i++) for (const b of blocks) b.ec.push(cw[p++]);

  /* ★ 오류정정 신드롬이 0이어야 한다.
       0이 아니면 스캐너는 "손상된 코드" 로 보고 복원을 시도하다 실패한다. */
  let syndromeOk = true;
  for (const b of blocks) {
    const poly = b.data.concat(b.ec);
    for (let i = 0; i < tb.ec; i++) {
      let acc = 0;
      for (let j = 0; j < poly.length; j++) {
        acc ^= gmul(poly[j], EXP[(i * (poly.length - 1 - j)) % 255]);
      }
      if (acc !== 0) syndromeOk = false;
    }
  }

  /* 원문을 꺼낸다 */
  let data = [];
  for (const b of blocks) data = data.concat(b.data);
  const db = [];
  for (const byte of data) for (let i = 7; i >= 0; i--) db.push((byte >>> i) & 1);

  let at = 0;
  const take = (n) => { let v = 0; for (let i = 0; i < n; i++) v = (v << 1) | db[at++]; return v; };
  const mode = take(4);
  const len = take(version < 10 ? 8 : 16);
  const out = [];
  for (let i = 0; i < len; i++) out.push(take(8));

  return { ecLevel, mask, mode, len, syndromeOk, text: Buffer.from(out).toString('utf8') };
}

/* --- 우리가 실제로 쓰는 주소 --- */
{
  const url = 'https://2026-ax-ton.vercel.app/worker/learn.html?course=c-press';
  const code = QR.encode(url);

  ok('★ 우리 교육 주소가 QR 로 만들어진다', !!code);
  eq('버전 5면 충분하다', code.version, 5);
  eq('격자 37칸', code.size, 37);

  const d = decode(code);
  eq('★ 오류정정 M 으로 만들어진다', d.ecLevel, 0);
  eq('★ 격자에서 읽은 마스크가 인코더가 고른 것과 같다', d.mask, code.mask);
  eq('바이트 모드', d.mode, 4);
  eq('★ 오류정정 신드롬이 0이다', d.syndromeOk, true);
  eq('★★ 되읽으면 원문이 그대로 나온다', d.text, url);
}

/* --- 버전 1~10 전부 --- */
{
  let bad = [];
  for (let v = 1; v <= 10; v++) {
    const cap = QR.capacityOf(v);
    // 그 버전이 딱 되는 길이 (아스키)
    const s = Array.from({ length: cap }, (_, i) => String.fromCharCode(33 + (i % 90))).join('');
    const code = QR.encode(s);
    if (!code) { bad.push('v' + v + ' 인코딩 실패'); continue; }
    if (code.version !== v) bad.push('v' + v + ' → v' + code.version);

    const d = decode(code);
    if (!d.syndromeOk) bad.push('v' + v + ' 신드롬');
    if (d.text !== s) bad.push('v' + v + ' 원문');
    if (d.mask !== code.mask) bad.push('v' + v + ' 마스크');
  }
  ok('★★ 버전 1~10 전부 되읽어서 원문이 나온다', bad.length === 0, bad.join(' | '));
}

/* --- 한글도 담긴다 (UTF-8) --- */
{
  const s = '프레스 3호기 안전교육';
  const code = QR.encode(s);
  const d = decode(code);
  eq('★ 한글이 UTF-8 로 담긴다', d.text, s);
  eq('한 글자가 3바이트', QR.utf8Bytes('프').length, 3);
  eq('아스키는 1바이트', QR.utf8Bytes('a').length, 1);
}

/* --- 담을 수 없으면 null. 깨진 그림을 그리지 않는다 --- */
{
  eq('★ 너무 길면 null 을 돌려준다 — 스캔 안 되는 그림을 그리지 않는다',
    QR.encode('x'.repeat(214)), null);
  ok('빈 글자도 죽지 않는다', !!QR.encode(''));
}

/* =================================================================
   격자 자체 — 기능 무늬가 제자리에 있는가
   ================================================================= */
{
  const code = QR.encode('https://2026-ax-ton.vercel.app/worker/learn.html?course=c-press');
  const m = code.modules;
  const size = code.size;

  /* 찾기 무늬 — 세 모서리. 이게 없으면 스캐너가 QR 인 줄도 모른다 */
  const finderOk = (top, left) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const inner = Math.max(Math.abs(r - 3), Math.abs(c - 3));
        const want = (inner !== 2 && inner <= 3) ? 1 : 0;
        if (m[top + r][left + c] !== want) return false;
      }
    }
    return true;
  };
  ok('★ 찾기 무늬 — 왼쪽 위', finderOk(0, 0));
  ok('★ 찾기 무늬 — 오른쪽 위', finderOk(0, size - 7));
  ok('★ 찾기 무늬 — 왼쪽 아래', finderOk(size - 7, 0));

  /* 구분 여백 — 찾기 무늬 둘레 한 줄은 반드시 흰색 */
  let sepOk = true;
  for (let i = 0; i < 8; i++) {
    if (m[7][i] || m[i][7]) sepOk = false;
    if (m[7][size - 1 - i] || m[i][size - 8]) sepOk = false;
    if (m[size - 8][i] || m[size - 1 - i][7]) sepOk = false;
  }
  ok('★ 찾기 무늬 둘레가 비어 있다', sepOk);

  /* 타이밍 무늬 — 6번 줄·칸이 검·흰 번갈아 */
  let timingOk = true;
  for (let i = 8; i < size - 8; i++) {
    if (m[6][i] !== (i % 2 === 0 ? 1 : 0)) timingOk = false;
    if (m[i][6] !== (i % 2 === 0 ? 1 : 0)) timingOk = false;
  }
  ok('★ 타이밍 무늬가 번갈아 간다', timingOk);

  /* 항상 검은 칸 */
  eq('★ 규격이 정한 검은 칸이 있다', m[size - 8][8], 1);
}

/* =================================================================
   SVG 로 그리기
   ================================================================= */
{
  const url = 'https://2026-ax-ton.vercel.app/worker/learn.html?course=c-press';
  const node = QR.svg(url, { label: '테스트 QR' });

  ok('SVG 를 만든다', !!node);
  eq('그림이라고 알려 준다', node.getAttribute('role'), 'img');
  eq('무엇인지 읽어 줄 이름이 있다', node.getAttribute('aria-label'), '테스트 QR');

  /* ★ 여백(quiet zone) 4칸. 없으면 스캐너가 QR 의 끝을 못 찾는다 —
       "왜 어떤 폰에서만 안 찍히지" 의 가장 흔한 원인이다. */
  const code = QR.encode(url);
  eq('★ 사방에 여백 4칸을 남긴다',
    node.getAttribute('viewBox'),
    '0 0 ' + (code.size + 8) + ' ' + (code.size + 8));
  eq('여백은 4칸', QR.QUIET, 4);

  /* ★ 흰 바탕을 직접 깐다. 배경색에 기대면 어두운 화면에서 반전돼 안 찍힌다 */
  const bg = node.querySelector('rect');
  ok('★ 흰 바탕을 직접 깐다', !!bg && bg.getAttribute('fill') === '#ffffff',
    bg && bg.getAttribute('fill'));

  const path = node.querySelector('path');
  ok('검은 칸을 그린다', !!path && path.getAttribute('fill') === '#000000');
  ok('그릴 것이 있다', path.getAttribute('d').length > 100);

  /* ★ 외부 요청 0건 — 이미지 파일을 부르지 않는다 */
  ok('★ 외부 이미지를 부르지 않는다',
    !node.querySelector('image') && node.innerHTML.indexOf('http') === -1);

  eq('★ 담을 수 없으면 SVG 도 만들지 않는다', QR.svg('x'.repeat(214)), null);
}

report('QR 코드 인코더');
