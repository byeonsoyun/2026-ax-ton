# 03. 개발 프롬프트 — 복사해서 붙여넣기

> **★ 2026-08-21 — 개인 개발로 전환됐습니다.**
> 아래는 **팀 네 명으로 진행하던 때의 기록**입니다. 포지션(P1~P4) 구분은 이제 없습니다.
> 지금 무엇을 하면 되는지는 [`07-next-tasks.md`](07-next-tasks.md) 하나만 보시면 됩니다.
>
> 다만 아래의 **화면별 요구사항과 제약은 여전히 정확합니다.**
> 기획에서 온 것이라 포지션 구분과 무관하게 유효합니다.


**내 포지션 블록을 통째로 복사해서 Claude Code 에 붙여넣고 엔터를 누르세요.**

---

## 내 포지션이 아직 안 정해졌다면

**아래 블록을 대신 쓰세요.** Claude 가 남아 있는 포지션을 알아서 알려 줍니다.

```
나는 이 프로젝트 팀원인데 아직 어느 포지션인지 안 정해졌어.
나는 코드와 깃허브를 잘 몰라. 어려운 말은 한 번 풀어서 설명해 줘.

먼저 이것부터 해 줘.
1. git branch --show-current 로 내 브랜치를 확인해 줘
2. docs/devlog/ 안의 파일들을 읽어서 이미 누가 어느 포지션을 가져갔는지 확인해 줘
3. docs/02-positions.md 를 읽고, 아직 남아 있는 포지션이 각각 무슨 화면을 만드는지
   한 줄씩 쉽게 설명해 줘
4. 내가 고르면 docs/devlog/<내브랜치이름>.md 를 만들고 거기에 포지션을 기록해 줘
   (다음부터는 안 물어봐도 되게)

그다음 docs/03-prompts.md 에서 내 포지션 블록을 읽고 그대로 따라 줘.
```

고르고 나면 아래에서 내 포지션 블록을 복사해 두시면 됩니다.
(안 하셔도 됩니다 — Claude 가 위 4번에서 기록해 두면 다음부터 알아서 압니다.)

---

## 쓰는 법

1. VS Code 터미널에서 `claude` 를 쳐서 Claude Code 를 엽니다
2. 아래에서 내 포지션의 회색 상자를 **처음부터 끝까지** 드래그해 복사합니다
3. Claude Code 에 붙여넣고 엔터
4. Claude 가 알아서 최신 코드를 받아오고, 무엇부터 할지 알려 줍니다

> ## 사실 이것도 안 해도 됩니다
>
> Claude Code 에 **"나 뭐 하면 되는지 알려줘"** 라고만 써도 됩니다.
> 브랜치를 보고 내 포지션을 알아내서, 지금 상태와 다음 할 일을 알려 줍니다.
> 아래 프롬프트는 **처음 한 번 맥락을 자세히 주고 싶을 때** 쓰세요.

> **하루에 한 번만 하면 됩니다.** 같은 세션 안에서는 다시 안 붙여넣어도 됩니다.
>
> 사실 저장소에 [`CLAUDE.md`](../CLAUDE.md) 가 있어서 규칙은 자동으로 적용됩니다.
> 아래 프롬프트는 **"오늘 내가 뭘 할지"** 를 정해 주는 역할입니다.

---

## 자주 쓰는 짧은 명령

포지션 프롬프트를 한 번 붙여넣은 뒤에는 이런 말만 하면 됩니다.

| 하고 싶은 것 | 이렇게 말하세요 |
|---|---|
| 시작 | `나 뭐 하면 되는지 알려줘.` |
| 만들기 | `1번부터 만들어 주세요.` |
| 확인 | `지금 뭘 확인하면 되는지 알려 주세요.` |
| 저장 | `여기까지 저장해 주세요.` |
| 마무리 | `오늘은 여기까지 할게요. 정리해 주세요.` |
| 막힘 | `(오류 메시지 붙여넣기) 이거 어떻게 하죠?` |
| 이해 안 됨 | `방금 뭘 한 건지 쉬운 말로 설명해 주세요.` |

**모르면 물어보세요.** "이거 왜 이렇게 했어요?" 라고 물으면 설명해 줍니다.

---

# P1 · 관리 + 노동자 핵심 (변소윤)

```
나는 이 프로젝트의 P1 담당이고 브랜치는 feature/byeonsoyun 이야.
전체 관리도 겸하고 있어.

[프로젝트]
이주노동자 안전교육 이해도 검증 플랫폼.
서명은 참석의 증거일 뿐 이해의 증거가 아니라는 문제에서 출발했어.
노동자가 글자를 읽지 않고도 이해했는지 확인하고, 그 기록을 법정 교육 증빙으로 만들어.
정적 HTML + 바닐라 JS, 빌드 없음. 서버도 DB도 없고 데이터는 브라우저 localStorage 에만 있어.

[내 담당 파일]
- src/worker/learn.html / learn.js   기능3 안전교육 수강
- src/worker/quiz.html  / quiz.js    기능4 이해도 검증  ← 제품의 심장
- src/admin/setup.html  / setup.js   기능1 (이미 완성됨)
- src/assets/**                      공용 모듈 (내가 관리)
- docs/**, CLAUDE.md                 문서 (내가 관리)

[내가 쓰는 데이터]
- 읽기: Store.courses, Store.library, Store.setup
- 쓰기: Store.progress
내가 progress 모양을 바꾸면 P3 의 dashboard 와 P4 의 proof 가 깨져.
바꿔야 하면 먼저 알려 줘.

[기능4가 이 제품의 심장이야]
글자를 한 자도 읽지 않고 끝낼 수 있어야 해. 문항은 음성으로 읽어 줘.
문항 3유형: hotspot(사진에서 위험 지점 터치) / choice(올바른 작업 고르기) / match(보호구 연결)
문항 모양은 src/assets/seed.js 의 COURSES[].quiz 에 있어.
통과 못 하면 progress 에 passed:false 로 남기고 교육 완료로 기록하지 않아.
미통과는 노동자의 실패가 아니라 교육의 실패로 적어.

[지켜야 할 것]
- 외부 요청 0건. CDN·웹폰트·외부 이미지·아이콘 폰트·npm 패키지 금지. 픽토그램은 `assets/icons.js`
- innerHTML 금지. UI.el 로 textContent 만
- ES 모듈(import/export) 금지. file:// 에서 CORS 로 막혀
- 상태는 색만으로 구분하지 않기. 아이콘+글자+색 (UI.okBadge 등)
- 노동자 화면 터치 타깃 60px, 문해력 비전제
- localStorage 직접 호출 금지. 반드시 Store 를 거칠 것

[git]
작업 시작할 때 알아서 git pull origin develop 해 줘.
한 덩어리가 끝날 때마다 알아서 commit 하고 feature/byeonsoyun 에 push 해 줘.
커밋 태그는 feat: fix: docs: style: refactor: chore: 중에 골라 쓰고 제목은 한글로.
main 이나 develop 에는 직접 push 하지 마.

[개발일지]
commit 하기 전에 docs/devlog/byeonsoyun.md 에 오늘 한 일을 한 줄 적어 줘.
없으면 docs/devlog/_template.md 를 보고 만들어 줘.

[확인]
src/index.html 을 브라우저로 열고 "예시 데이터 채우기" 누른 뒤
W-4821-07 / 1234 로 로그인하면 노동자 화면이 나와.

먼저 docs/01-project-map.md 와 내 담당 파일들을 읽고,
[지금 상태]
내 담당 화면은 이미 골격이 들어가 있어서 동작해. 빈 화면이 아니야.
docs/07-next-tasks.md 에서 내 포지션 절을 읽고, 지금 상태를 한 문단으로 말해 준 다음
다음 할 일 하나만 제안해 줘.
각 화면의 "절대 지우지 말 것" 은 기획에서 온 제약이니까 지우지 마.

아직 코드는 쓰지 마.
```

---

# P2 · 노동자 생활 화면

```
나는 이 프로젝트의 P2 담당이야. 브랜치 이름은 git branch --show-current 로 확인해 줘.
나는 코드와 깃허브를 잘 몰라. 어려운 말은 한 번 풀어서 설명해 줘.

[프로젝트]
이주노동자 안전교육 이해도 검증 플랫폼.
서명은 참석의 증거일 뿐 이해의 증거가 아니라는 문제에서 출발했어.
노동자가 글자를 읽지 않고도 이해했는지 확인하고, 그 기록을 법정 교육 증빙으로 만들어.
정적 HTML + 바닐라 JS, 빌드 없음. 서버도 DB도 없고 데이터는 브라우저 localStorage 에만 있어.

[내 담당 파일 — 이것만 고쳐]
- src/worker/home.html   / home.js     홈
- src/worker/report.html / report.js   기능8 위험요소 신고
- src/worker/talk.html   / talk.js     기능7 현장 즉시 소통
- src/worker/my.html     / my.js       마이페이지
- src/worker/worker.css                노동자 화면 스타일 (P1 과 공유)

[열지 말 것]
- src/admin/ 폴더 전체 (관리자 팀 담당)
- src/worker/learn.* 와 src/worker/quiz.* (P1 담당)
- src/assets/ 안의 파일 — 읽는 건 자유지만 고쳐야 하면 먼저 나한테 물어봐

[내가 쓰는 데이터]
- 읽기: Store.setup, Store.courses, Store.progress, Store.posts, Store.reports
- 쓰기: Store.reports (신고), Store.posts (게시글)
localStorage 를 직접 부르지 말고 반드시 Store 를 거쳐.

[각 화면이 할 일]
home   — 안전 문구 배너(음성 포함), 수강→검증→완료 3단계 상태, 메뉴 4개(수강·신고·소통·마이)
report — 설비 선택(그림) → 위험유형 선택(픽토그램) → 음성메모(선택) → 접수
talk   — 게시판. 제목·작성자·작성일·조회수·댓글. 익명으로도 쓸 수 있어야 해
my     — 회원정보, 수강 이력, 수강 증빙 출력, 신고 이력

[꼭 지켜야 하는 것]
★ 위험요소 신고는 익명이 기본이야. Store.reports 에 신고자를 알아볼 수 있는 값을
  절대 넣지 마. 익명이 깨지면 아무도 신고를 안 하게 되고 제품의 전제가 무너져.
★ 증빙은 생성 후 수정 불가. 미이수 항목을 숨기는 경로를 만들지 마.
- 외부 요청 0건. CDN·웹폰트·외부 이미지·아이콘 폰트·npm 패키지 금지. 픽토그램은 `assets/icons.js`
- innerHTML 금지. UI.el 로 textContent 만
- ES 모듈(import/export) 금지. file:// 에서 CORS 로 막혀
- 상태는 색만으로 구분하지 않기. 아이콘+글자+색 (UI.okBadge 등)
- 노동자 화면은 터치 타깃 60px, 문해력 비전제(음성 병행)

[git — 내가 명령어 칠 필요 없게 알아서 해 줘]
작업 시작할 때 git pull origin develop.
한 덩어리 끝날 때마다 commit 하고 내 feature 브랜치에 push.
커밋 태그는 feat: fix: docs: style: refactor: chore: 중에 골라 쓰고 제목은 한글로.
main 이나 develop 에는 절대 직접 push 하지 마. PR 과 머지는 관리자가 해.

[개발일지]
commit 하기 전에 docs/devlog/<내브랜치이름>.md 에 오늘 한 일을 한 줄 적어 줘.
없으면 docs/devlog/_template.md 를 보고 만들어 줘.

[확인]
src/index.html 을 브라우저로 열고 "예시 데이터 채우기" 누른 뒤
W-4821-07 / 1234 로 로그인하면 내 화면이 나와.
화면을 고쳤으면 내가 뭘 눌러서 확인하면 되는지 구체적으로 알려 줘.

먼저 docs/01-project-map.md 와 docs/02-positions.md 의 P2 카드,
그리고 내 담당 파일 4개를 읽고,
[지금 상태]
내 담당 화면은 이미 골격이 들어가 있어서 동작해. 빈 화면이 아니야.
docs/07-next-tasks.md 에서 내 포지션 절을 읽고, 지금 상태를 한 문단으로 말해 준 다음
다음 할 일 하나만 제안해 줘.
각 화면의 "절대 지우지 말 것" 은 기획에서 온 제약이니까 지우지 마.

아직 코드는 쓰지 마.
```

---

# P3 · 담당자 화면

```
나는 이 프로젝트의 P3 담당이야. 브랜치 이름은 git branch --show-current 로 확인해 줘.
나는 코드와 깃허브를 잘 몰라. 어려운 말은 한 번 풀어서 설명해 줘.

[프로젝트]
이주노동자 안전교육 이해도 검증 플랫폼.
서명은 참석의 증거일 뿐 이해의 증거가 아니라는 문제에서 출발했어.
노동자가 글자를 읽지 않고도 이해했는지 확인하고, 그 기록을 법정 교육 증빙으로 만들어.
정적 HTML + 바닐라 JS, 빌드 없음. 서버도 DB도 없고 데이터는 브라우저 localStorage 에만 있어.

[내 담당 파일 — 이것만 고쳐]
- src/admin/dashboard.html / dashboard.js   기능6 담당자 대시보드
- src/admin/content.html   / content.js     기능2 교육 콘텐츠 생성·승인
- src/admin/admin.css                       관리자 화면 스타일 (P4 와 공유)

[열지 말 것]
- src/worker/ 폴더 전체 (노동자 팀 담당)
- src/admin/setup.*, proof.*, library.* (다른 사람 담당)
- src/assets/ 안의 파일 — 읽는 건 자유지만 고쳐야 하면 먼저 나한테 물어봐

[내가 쓰는 데이터]
- 읽기: Store.progress, Store.reports, Store.setup, Store.courses, Store.library
- 쓰기: Store.courses (내가 만든 교육), Store.reports (조치 상태)
내가 만든 courses 를 P1 의 learn/quiz 화면이 읽어. 모양을 바꾸면 먼저 알려 줘.
localStorage 를 직접 부르지 말고 반드시 Store 를 거쳐.

[dashboard — 기능6]
★ 이 화면의 핵심은 이수율이 아니라 "언어별·항목별 취약점"이야.
  이수율은 작은 타일로 두고, 이해도 취약 항목 막대를 가장 크게 펴.
블록 순서: AI 개입 없음 고지 → 이수 현황(작게) → 이해도 취약 항목(가장 크게)
          → 조치 대상 → 위험요소 신고 큐(익명) → 다음 교육 기한 → 증빙 생성 진입

화면 안에 이 문장들을 꼭 적어:
- "이 목록은 노동자 평가가 아니라 콘텐츠 개선 신호입니다"
- "미통과는 노동자의 실패가 아니라 교육의 실패로 기록됩니다"
- "개인별 점수의 인사·평가 목적 내보내기는 제공하지 않습니다"
- 이 화면은 AI 가 개입하지 않아. 기록을 그대로 센 값만 보여 줘

docs/mockups/12-admin-dashboard.html 에 정적 목업이 있어.
새로 만들지 말고 그걸 옮겨 온 뒤 Store 의 실제 데이터로 바꾸는 게 훨씬 빨라.
옮길 때 뭘 버리고 뭘 가져오는지는 docs/mockups/README.md 에 있어.

[content — 기능2]
설비 선택 → 언어 선택 → 문구 고르기 → 승인·QR 발급 → Store.courses 에 저장
★ AI 는 문구를 새로 쓰지 않고, 사람이 검수한 라이브러리에서 고르기만 해.
  오역이 그대로 사고가 되기 때문이야.
★ Store.library 에서 status 가 'reviewed' 인 문구만 선택지에 올려.
★ 언어는 기능1에서 등록한 것(Store.setup.load().languages)만 나와야 해.

[그 외 지켜야 할 것]
- 외부 요청 0건. CDN·웹폰트·외부 이미지·아이콘 폰트·npm 패키지 금지. 픽토그램은 `assets/icons.js`
- innerHTML 금지. UI.el 로 textContent 만
- ES 모듈(import/export) 금지. file:// 에서 CORS 로 막혀
- 상태는 색만으로 구분하지 않기. 아이콘+글자+색 (UI.okBadge 등)
- 관리자 화면은 주요 버튼만 60px, 표 안 보조 조작은 40px (.btn-sm)
- "면책" 표현 금지

[git — 내가 명령어 칠 필요 없게 알아서 해 줘]
작업 시작할 때 git pull origin develop.
한 덩어리 끝날 때마다 commit 하고 내 feature 브랜치에 push.
커밋 태그는 feat: fix: docs: style: refactor: chore: 중에 골라 쓰고 제목은 한글로.
main 이나 develop 에는 절대 직접 push 하지 마. PR 과 머지는 관리자가 해.

[개발일지]
commit 하기 전에 docs/devlog/<내브랜치이름>.md 에 오늘 한 일을 한 줄 적어 줘.
없으면 docs/devlog/_template.md 를 보고 만들어 줘.

[확인]
src/index.html 을 브라우저로 열고 "예시 데이터 채우기" 누른 뒤
kim@daesung.co.kr / 1234 로 로그인하면 내 화면이 나와.
화면을 고쳤으면 내가 뭘 눌러서 확인하면 되는지 구체적으로 알려 줘.

먼저 docs/01-project-map.md 와 docs/02-positions.md 의 P3 카드,
그리고 내 담당 파일 2개를 읽고,
[지금 상태]
내 담당 화면은 이미 골격이 들어가 있어서 동작해. 빈 화면이 아니야.
docs/07-next-tasks.md 에서 내 포지션 절을 읽고, 지금 상태를 한 문단으로 말해 준 다음
다음 할 일 하나만 제안해 줘.
각 화면의 "절대 지우지 말 것" 은 기획에서 온 제약이니까 지우지 마.

아직 코드는 쓰지 마.
```

---

# P4 · 증빙과 검수

```
나는 이 프로젝트의 P4 담당이야. 브랜치 이름은 git branch --show-current 로 확인해 줘.
나는 코드와 깃허브를 잘 몰라. 어려운 말은 한 번 풀어서 설명해 줘.

[프로젝트]
이주노동자 안전교육 이해도 검증 플랫폼.
서명은 참석의 증거일 뿐 이해의 증거가 아니라는 문제에서 출발했어.
노동자가 글자를 읽지 않고도 이해했는지 확인하고, 그 기록을 법정 교육 증빙으로 만들어.
정적 HTML + 바닐라 JS, 빌드 없음. 서버도 DB도 없고 데이터는 브라우저 localStorage 에만 있어.

[내 담당 파일 — 이것만 고쳐]
- src/admin/proof.html   / proof.js     기능5 교육 증빙 생성
- src/admin/library.html / library.js   기능9 안전 문구 라이브러리 (운영자)
- src/admin/admin.css                   관리자 화면 스타일 (P3 과 공유)

[열지 말 것]
- src/worker/ 폴더 전체 (노동자 팀 담당)
- src/admin/setup.*, dashboard.*, content.* (다른 사람 담당)
- src/assets/ 안의 파일 — 읽는 건 자유지만 고쳐야 하면 먼저 나한테 물어봐

[내가 쓰는 데이터]
- 읽기: Store.progress, Store.courses, Store.setup, Store.library
- 쓰기: Store.library (검수 상태)
내가 검수 통과시킨 문구만 P3 의 content 화면이 교육에 쓸 수 있어.
localStorage 를 직접 부르지 말고 반드시 Store 를 거쳐.

[proof — 기능5]
증빙 작성 시간을 2시간에서 5분으로 줄이는 게 도입의 현실적인 이유야.
일시·언어·문항·점수·서명을 담은 교육일지를 만들어.
PDF 는 브라우저 인쇄로 충분해. window.print() + @media print CSS 를 써.
★ 외부 PDF 라이브러리를 절대 넣지 마 (외부 요청 0건 규칙).
★ 생성된 기록은 수정할 수 없어야 해.
★ 미이수자와 이해도 미달자를 문서에서 숨기는 경로를 만들지 마.
★ "면책" 표현을 쓰지 마. 교육 실시의 증빙일 뿐 법적 책임을 대신하지 않아.

[library — 기능9]
사용자에게 보이지 않지만 제품 신뢰의 단일 최대 요인이야.
블록 순서: AI 여기까지 고지 → 오역 신고 큐(맨 위) → 역번역 대조
          → 문구 목록 → 라이브러리 상태
★ 오역 신고는 접수하는 순간 사용 중지야. 확인한 뒤 내리는 순서가 아니야.
★ AI 는 초안·역번역 대조·음성합성까지. 승인은 사람이 해.

역번역 대조가 이 화면의 핵심 장면이야. seed.js 의 ph-3 이 그 예야:
  원문   "프레스가 멈춰도 손을 넣지 마십시오"
  역번역 "프레스가 꺼지면 손을 넣어도 됩니다"
부정이 뒤집혀 정반대 지시가 된 걸 사람 검수자가 잡는 장면을 만들어 줘.

검수 상태 3종은 Store.PHRASE_STATUS 에 있어 (reviewed / waiting / stopped).
배지는 UI.phraseBadge(status) 로 만들어.

docs/mockups/13-operator-library.html 에 정적 목업이 있어.
옮기는 법은 docs/mockups/README.md 를 봐.

[그 외 지켜야 할 것]
- 외부 요청 0건. CDN·웹폰트·외부 이미지·아이콘 폰트·npm 패키지 금지. 픽토그램은 `assets/icons.js`
- innerHTML 금지. UI.el 로 textContent 만
- ES 모듈(import/export) 금지. file:// 에서 CORS 로 막혀
- 상태는 색만으로 구분하지 않기. 아이콘+글자+색
- 관리자 화면은 주요 버튼만 60px, 표 안 보조 조작은 40px (.btn-sm)

[git — 내가 명령어 칠 필요 없게 알아서 해 줘]
작업 시작할 때 git pull origin develop.
한 덩어리 끝날 때마다 commit 하고 내 feature 브랜치에 push.
커밋 태그는 feat: fix: docs: style: refactor: chore: 중에 골라 쓰고 제목은 한글로.
main 이나 develop 에는 절대 직접 push 하지 마. PR 과 머지는 관리자가 해.

[개발일지]
commit 하기 전에 docs/devlog/<내브랜치이름>.md 에 오늘 한 일을 한 줄 적어 줘.
없으면 docs/devlog/_template.md 를 보고 만들어 줘.

[확인]
src/index.html 을 브라우저로 열고 "예시 데이터 채우기" 누른 뒤
- 증빙(proof) 확인:   kim@daesung.co.kr / 1234
- 문구(library) 확인: oper@safety.kr    / 1234
화면을 고쳤으면 내가 뭘 눌러서 확인하면 되는지 구체적으로 알려 줘.

먼저 docs/01-project-map.md 와 docs/02-positions.md 의 P4 카드,
그리고 내 담당 파일 2개를 읽고,
[지금 상태]
내 담당 화면은 이미 골격이 들어가 있어서 동작해. 빈 화면이 아니야.
docs/07-next-tasks.md 에서 내 포지션 절을 읽고, 지금 상태를 한 문단으로 말해 준 다음
다음 할 일 하나만 제안해 줘.
각 화면의 "절대 지우지 말 것" 은 기획에서 온 제약이니까 지우지 마.

아직 코드는 쓰지 마.
```

---

## 프롬프트가 잘 먹혔는지 확인하는 법

붙여넣고 나면 Claude 가 이렇게 반응해야 정상입니다.

- 지금 브랜치가 무엇인지 확인함
- `git pull` 을 실행함
- 내 담당 파일을 읽음
- **코드를 바로 쓰지 않고** 무엇부터 할지 3단계로 제안함

바로 코드를 쓰기 시작하면 `아직 코드는 쓰지 말고 계획부터 알려 주세요.` 라고 말하세요.
