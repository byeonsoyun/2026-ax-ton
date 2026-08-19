/* ===================================================================
   seed.js — 예시 데이터

   ★ 이 파일이 없으면 네 명이 병렬로 개발할 수 없다.

     노동자 팀의 기능3·4 는 관리자 팀의 기능2 가 만든 교육을 읽는다.
     기능2 가 아직 없으면 노동자 팀은 화면에 띄울 것이 없어 손을 못 댄다.
     그래서 8개 키를 전부 그럴듯한 값으로 미리 채워 둔다.

     자기 담당 화면을 만들 때는 상대 팀 화면이 없어도
     여기 데이터를 읽어서 개발하면 된다.

   ★ id 는 손으로 적은 고정값이다.
     courses 가 equipments 를 가리키고 progress 가 courses 를 가리키므로,
     매번 새 id 가 나오면 서로 연결이 끊긴다.

   발표 시연 준비에도 그대로 쓴다. 로그인 화면의 "예시 데이터 채우기" 버튼이 부른다.
   =================================================================== */

var Seed = (function () {
  'use strict';

  /* 시연 계정 3개. 비밀번호는 전부 1234 — 화면에도 그대로 적어 둔다.
     서버가 없어 어차피 평문이고, 감춘 척하는 게 더 나쁘다. */
  var ACCOUNTS = [
    { userId: 'W-4821-07', pw: '1234', role: 'worker',
      name: '', title: '', siteName: '대성정밀', lang: 'km', processId: 'p-press' },
    { userId: 'W-4821-11', pw: '1234', role: 'worker',
      name: '', title: '', siteName: '대성정밀', lang: 'id', processId: 'p-paint' },
    { userId: 'kim@daesung.co.kr', pw: '1234', role: 'admin',
      name: '김현수', title: '현장 관리자 · 생산팀장', siteName: '대성정밀', lang: '', processId: '' },
    { userId: 'oper@safety.kr', pw: '1234', role: 'operator',
      name: '이수진', title: '시스템 운영자 (내부)', siteName: '', lang: '', processId: '' }
  ];

  var SETUP = {
    site: { name: '대성정밀', sizeBand: '10~49인' },
    languages: ['km', 'id', 'vi'],
    processes: [
      { id: 'p-press',    name: '프레스', icon: '⚙' },
      { id: 'p-paint',    name: '도장',   icon: '🔥' },
      { id: 'p-assembly', name: '조립',   icon: '🔧' }
    ],
    equipments: [
      { id: 'e-press3', processId: 'p-press', name: '프레스 3호기',
        icon: '⚙', hazards: ['pinch', 'shock'], note: '' },
      { id: 'e-booth1', processId: 'p-paint', name: '도장 부스 1',
        icon: '🔥', hazards: ['fire', 'chemical', 'choke'], note: '' },
      { id: 'e-panel',  processId: 'p-press', name: '배전반 A',
        icon: '⚡', hazards: ['shock'], note: '' }
    ],
    workers: [
      { id: 'W-4821-07', lang: 'km', processId: 'p-press' },
      { id: 'W-4821-11', lang: 'id', processId: 'p-paint' },
      { id: 'W-4821-03', lang: 'vi', processId: 'p-assembly' }
    ]
  };

  /* 안전 문구 라이브러리.
     back 은 역번역 — 번역문을 다시 한국어로 돌린 것이다.
     ph-3 은 부정이 뒤집혀 정반대 지시가 된 경우로, 사람 검수자가 잡아야 하는 장면이다. */
  var LIBRARY = [
    { id: 'ph-1', category: '프레스', status: 'reviewed',
      ko: '프레스가 멈춰도 손을 넣지 마십시오',
      translations: {
        km: { text: 'កុំដាក់ដៃចូល', back: '프레스가 멈춰도 손을 넣지 마십시오' },
        id: { text: 'Jangan masukkan tangan', back: '손을 넣지 마십시오' },
        vi: { text: 'Không cho tay vào', back: '손을 넣지 마십시오' }
      } },
    { id: 'ph-2', category: '프레스', status: 'reviewed',
      ko: '작업 전 전원을 차단하십시오',
      translations: {
        km: { text: 'កាត់ចរន្តអគ្គិសនី', back: '작업 전 전원을 차단하십시오' },
        id: { text: 'Matikan daya sebelum bekerja', back: '작업 전 전원을 끄십시오' },
        vi: { text: 'Tắt nguồn trước khi làm việc', back: '작업 전 전원을 끄십시오' }
      } },
    { id: 'ph-3', category: '프레스', status: 'stopped',
      ko: '프레스가 멈춰도 손을 넣지 마십시오',
      translations: {
        id: { text: 'Jika mesin mati, boleh masukkan tangan',
              back: '프레스가 꺼지면 손을 넣어도 됩니다' }
      } },
    { id: 'ph-4', category: '도장', status: 'reviewed',
      ko: '도장 작업 시 방독마스크를 착용하십시오',
      translations: {
        km: { text: 'ពាក់ម៉ាស់ការពារឧស្ម័ន', back: '방독마스크를 착용하십시오' },
        id: { text: 'Kenakan masker gas', back: '방독마스크를 착용하십시오' }
      } },
    { id: 'ph-5', category: '도장', status: 'waiting',
      ko: '환기팬이 돌지 않으면 작업을 시작하지 마십시오',
      translations: {
        id: { text: 'Jangan mulai jika kipas mati', back: '팬이 꺼져 있으면 시작하지 마십시오' }
      } },
    { id: 'ph-6', category: '공통', status: 'reviewed',
      ko: '비상정지 버튼은 설비 오른쪽 아래에 있습니다',
      translations: {
        km: { text: 'ប៊ូតុងបញ្ឈប់សង្គ្រោះបន្ទាន់', back: '비상정지 버튼은 설비 오른쪽 아래에 있습니다' },
        vi: { text: 'Nút dừng khẩn cấp ở phía dưới bên phải', back: '비상정지 버튼은 오른쪽 아래에 있습니다' }
      } }
  ];

  /* 교육 콘텐츠.
     quiz 의 type 세 가지는 발표 대본의 검증 방식을 그대로 옮긴 것이다.
       hotspot — 사진에서 위험 지점 터치하기
       choice  — 올바른 작업 고르기
       match   — 보호구 연결하기
     문항은 음성으로 읽어 주므로 글자를 한 자도 읽지 않고 끝낼 수 있어야 한다. */
  var COURSES = [
    { id: 'c-press', title: '프레스 3호기 안전교육', equipmentId: 'e-press3',
      languages: ['km', 'id', 'vi'], phraseIds: ['ph-1', 'ph-2', 'ph-6'],
      approved: true, createdAt: '2026-08-01T02:00:00.000Z',
      quiz: [
        { id: 'q1', type: 'hotspot', hazard: 'pinch',
          prompt: '이 설비에서 손이 끼일 수 있는 곳을 누르세요',
          answer: { x: 52, y: 44, r: 14 } },
        { id: 'q2', type: 'choice', hazard: 'pinch',
          prompt: '프레스가 멈췄습니다. 어떻게 해야 합니까?',
          options: ['손을 넣어 부품을 꺼낸다', '전원을 차단하고 관리자를 부른다', '발로 눌러 본다'],
          answer: 1 },
        { id: 'q3', type: 'match', hazard: 'shock',
          prompt: '작업에 맞는 보호구를 연결하세요',
          pairs: [['프레스 작업', '안전장갑'], ['배전반 점검', '절연장갑']] }
      ] },
    { id: 'c-paint', title: '도장 부스 1 안전교육', equipmentId: 'e-booth1',
      languages: ['id'], phraseIds: ['ph-4', 'ph-6'],
      approved: true, createdAt: '2026-08-03T01:00:00.000Z',
      quiz: [
        { id: 'q1', type: 'choice', hazard: 'fire',
          prompt: '도장 작업 중 불이 났습니다. 먼저 무엇을 합니까?',
          options: ['물을 뿌린다', '환기팬을 끄고 대피한다', '창문을 연다'],
          answer: 1 },
        { id: 'q2', type: 'hotspot', hazard: 'chemical',
          prompt: '방독마스크를 써야 하는 구역을 누르세요',
          answer: { x: 38, y: 60, r: 16 } }
      ] }
  ];

  /* 수강·검증 이력.
     W-4821-11 은 화재 대응에서 미통과 — 담당자 대시보드의 "이해도 취약 항목"이 여기서 나온다.
     미통과는 노동자의 실패가 아니라 교육의 실패로 기록한다 (SCREEN 기능4). */
  var PROGRESS = [
    { workerId: 'W-4821-07', courseId: 'c-press', lang: 'km',
      learnedAt: '2026-08-10T01:20:00.000Z',
      quiz: { score: 100, passed: true, answers: [1, 1, 1], at: '2026-08-10T01:32:00.000Z' } },
    { workerId: 'W-4821-11', courseId: 'c-paint', lang: 'id',
      learnedAt: '2026-08-11T05:10:00.000Z',
      quiz: { score: 50, passed: false, answers: [0, 1], at: '2026-08-11T05:24:00.000Z' } },
    { workerId: 'W-4821-03', courseId: 'c-press', lang: 'vi',
      learnedAt: null, quiz: null }
  ];

  /* 위험요소 신고 — 신고자 식별 정보가 없다. 익명이 기본이다 (PRD §9.2). */
  var REPORTS = [
    { id: 'r-1', processId: 'p-press', equipmentId: 'e-press3', hazard: 'pinch',
      memo: '덮개가 흔들려서 손이 들어갈 틈이 생겼습니다.',
      status: 'urgent', createdAt: '2026-08-09T00:30:00.000Z' },
    { id: 'r-2', processId: 'p-paint', equipmentId: 'e-booth1', hazard: 'choke',
      memo: '환기팬 소음과 진동이 심합니다.',
      status: 'received', createdAt: '2026-08-13T07:15:00.000Z' }
  ];

  var POSTS = [
    { id: 'po-1', title: '프레스 교대 시간 바뀐 것 맞나요?', body: '오늘부터 30분 당겨진다고 들었습니다.',
      author: 'W-4821-07', anonymous: false, createdAt: '2026-08-14T02:00:00.000Z',
      comments: [{ author: '김현수', body: '맞습니다. 다음 주까지만입니다.', createdAt: '2026-08-14T02:40:00.000Z' }] },
    { id: 'po-2', title: '도장실 마스크 어디서 받나요', body: '',
      author: '', anonymous: true, createdAt: '2026-08-15T23:10:00.000Z', comments: [] }
  ];

  /* 지금 저장된 것을 덮어쓰고 예시 데이터를 넣는다.
     세션은 건드리지 않는다 — 채우자마자 로그인이 풀리면 당황스럽다. */
  function fill() {
    Store.accounts.save(ACCOUNTS);
    Store.setup.save(SETUP);
    Store.library.save(LIBRARY);
    Store.courses.save(COURSES);
    Store.progress.save(PROGRESS);
    Store.reports.save(REPORTS);
    Store.posts.save(POSTS);
    return true;
  }

  /* 계정이 하나도 없을 때만 채운다.
     처음 여는 사람이 빈 화면에서 막히지 않게 하되, 쓰던 데이터는 건드리지 않는다. */
  function fillIfEmpty() {
    if (Store.accounts.load().length) return false;
    return fill();
  }

  return { fill: fill, fillIfEmpty: fillIfEmpty, ACCOUNTS: ACCOUNTS };
})();
