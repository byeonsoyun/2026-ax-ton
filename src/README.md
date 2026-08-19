# src — 안전교육 이해도 검증 플랫폼

정적 HTML + 바닐라 JS. **빌드가 없습니다.** `src/index.html` 을 브라우저로 더블클릭하면 그대로 열립니다.

---

## 시작하기

```bash
git checkout develop && git pull      # 뼈대 받기
git checkout feature/본인이름
git merge develop
```

`src/index.html` 을 열고 **예시 데이터 채우기** 를 누르세요. 계정과 사업장 데이터가 한 번에 생깁니다.

| 아이디 | 비밀번호 | 역할 | 도착 화면 |
|---|---|---|---|
| `W-4821-07` | 1234 | 노동자 | `worker/home.html` |
| `kim@daesung.co.kr` | 1234 | 담당자 | `admin/dashboard.html` |
| `oper@safety.kr` | 1234 | 운영자 | `admin/library.html` |

---

## 지켜야 할 규칙 하나

> **1화면 = HTML 1개 + JS 1개, 주인은 1명.**

네 명이 부딪히지 않는 이유의 전부입니다. 같은 파일을 두 사람이 열지 않으니 충돌이 날 자리가 없습니다.

**`assets/` 는 네 명이 함께 쓰는 유일한 폴더입니다.** 여기를 고쳐야 하면 팀에 먼저 말하세요.
자기 트랙에만 필요한 스타일은 `worker/worker.css` 또는 `admin/admin.css` 에 쓰면 됩니다.

---

## 담당

| 트랙 | 담당 | 화면 |
|---|---|---|
| 노동자 A | | `home` · `learn`(기능3) · `quiz`(기능4) |
| 노동자 B | | `report`(기능8) · `talk`(기능7) · `my` |
| 관리자 C | | `dashboard`(기능6) · `content`(기능2) |
| 관리자 D | byeonsoyun | `setup`(기능1, 완료) · `proof`(기능5) · `library`(기능9) |

`quiz`(기능4)가 가장 무겁습니다. 발표 대본이 "제품의 심장"이라고 못박은 화면입니다.

각 파일 맨 위 주석에 담당 · 기능번호 · 읽는 키 · 쓰는 키 · 근거 문서가 적혀 있습니다.

---

## 폴더

```
src/
├── index.html        로그인 — 여기서 역할이 갈린다
├── signup.html       회원가입
├── assets/           ★ 공용. 고치기 전에 팀에 말할 것
│   ├── store.js        데이터 계층 — 두 팀의 계약
│   ├── auth.js         로그인 · 세션 · 화면 가드
│   ├── ui.js           배지 · 칩 · 목록 · 토스트
│   ├── seed.js         예시 데이터
│   ├── login.js        로그인 화면 로직
│   ├── signup.js       회원가입 화면 로직
│   ├── app.css         공통 컴포넌트
│   ├── style.css       토큰 · 버튼 · 배지 · 폼
│   └── style-admin.css adminbar · sec-head · kpi · btn-sm · tabbar
├── worker/           ★ 노동자 팀 2명
│   ├── worker.css
│   └── home / learn / quiz / report / talk / my  (.html + .js)
└── admin/            ★ 관리자 팀 2명
    ├── admin.css
    └── setup / dashboard / content / proof / library  (.html + .js)
```

---

## 데이터 — 두 팀이 만나는 유일한 지점

**화면 코드는 `localStorage` 를 직접 부르지 않습니다.** 반드시 `Store` 를 거칩니다.
나중에 서버가 생기면 `store.js` 하나만 바꾸면 되기 때문입니다.

| 저장소 | 쓰는 쪽 | 읽는 쪽 |
|---|---|---|
| `Store.accounts` | 회원가입 | 로그인 |
| `Store.session` | 로그인 | 모든 화면(가드) |
| `Store.setup` | 관리자 기능1 | 노동자 전부 · 관리자 전부 |
| `Store.library` | 운영자 기능9 | 관리자 기능2 · 노동자 기능3 |
| `Store.courses` | 관리자 기능2 | 노동자 기능3·4 |
| `Store.progress` | 노동자 기능3·4 | 관리자 기능5·6 |
| `Store.reports` | 노동자 기능8 | 관리자 기능6 |
| `Store.posts` | 노동자 기능7 | 노동자 기능7 |

저장소마다 `load()` `save(data)` `update(fn)` `updatedAt()` `clear()` 가 있습니다.

```js
var courses = Store.courses.load();              // 읽기
Store.progress.update(function (list) {          // 읽기 → 고치기 → 저장
  list.push({ workerId: user.userId, courseId: 'c-press', quiz: { passed: true } });
});
```

**모양을 바꾸려면 반드시 팀에 알리세요.** 한쪽이 쓰고 다른 쪽이 읽습니다.

상대 팀 화면이 아직 없어도 `seed.js` 의 예시 데이터로 개발하면 됩니다.

---

## 화면 가드

모든 페이지 `<head>` 에 세 줄이 들어갑니다. 순서가 중요합니다.

```html
<script src="../assets/store.js"></script>
<script src="../assets/auth.js"></script>
<script>Auth.require('worker');</script>
```

세션이 없으면 로그인으로, 역할이 다르면 자기 역할의 첫 화면으로 돌려보냅니다.

---

## 새 화면을 만들 때

1. `worker/` 또는 `admin/` 아래에 `이름.html` + `이름.js` 를 만듭니다
2. 같은 트랙의 기존 화면을 복사해 시작하세요 — 상단바 · 탭바 · 가드가 이미 맞춰져 있습니다
3. 경로는 **상대경로**로 씁니다 (`../assets/...`).
   절대경로(`/assets/...`)를 쓰면 `file://` 로 열었을 때 깨집니다
4. 탭바에 넣어야 하면 그 트랙의 모든 HTML 을 함께 고쳐야 하므로 팀에 말하세요

---

## 이 코드가 지키는 규칙

문서에서 온 제약입니다. 나중에 뜯어고치면 비용이 큽니다.

- **외부 요청 0건** — CDN · 웹폰트 · 외부 이미지를 쓰지 않습니다. 픽토그램은 이모지입니다.
  덕분에 인터넷 없이 `file://` 로 열려 확인이 가장 빠릅니다
- **색상만으로 상태를 구분하지 않습니다** — 배지는 아이콘 + 글자 + 색 3중 (`UI.okBadge` 등)
- **터치 타깃** — 노동자 화면은 전부 60px(`--tap-min`). 관리자 화면은 주요 버튼만 60px,
  표 안 보조 조작은 40px(`.btn-sm`)
- **외국인등록번호 · 여권번호를 받지 않습니다**
- **위험요소 신고는 익명입니다** — `reports` 에 신고자를 식별할 값을 넣지 마세요
- **검수 완료가 아닌 문구는 안전 지시로 쓰지 않습니다** — `library` 의 `status === 'reviewed'` 만
- **"면책" 표현을 쓰지 않습니다** — 증빙은 교육 실시의 기록일 뿐 법적 책임을 대신하지 않습니다
- **사용자가 넣은 문자열은 `textContent` 로만** 넣습니다 (`UI.el` 사용). `innerHTML` 금지

---

## 저장 위치가 브라우저라서 생기는 일

- **오리진별로 갈립니다.** `file://` · `localhost` · `*.vercel.app` 의 데이터가 전부 별개입니다.
  로컬에서 넣은 설비가 배포 주소에 안 보이는 것은 고장이 아닙니다
- **다른 기기에서는 안 보입니다.** 발표 때 심사위원 폰으로 열면 빈 화면입니다
- **시크릿 모드나 사이트 데이터 삭제 시 사라집니다.** 발표 전 `Store.exportAll()` 로 백업하세요
- **약 5MB 제한.** 사진을 base64 로 넣으면 몇 장 만에 찹니다.
  사진이 필요해지는 시점이 서버가 필요해지는 시점입니다

---

## 배포

Vercel — **Root Directory `src`**, Framework `Other`, Build Command 비움.
빌드가 없으므로 push 하면 그대로 올라갑니다.
