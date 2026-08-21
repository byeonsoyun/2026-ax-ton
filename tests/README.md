# tests — 브라우저 없이 화면을 돌려 보는 검증

이 폴더는 **저장소의 규칙을 어기지 않습니다.** `src/` 는 여전히 의존성 0 이고
빌드가 없습니다. `jsdom` 은 여기서만 쓰고 **저장소 밖에** 깔립니다.

브라우저 자동화 도구가 없어서 눈으로 확인할 방법이 없었습니다.
그래서 `jsdom` 위에 실제 DOM 을 만들고 `src/` 의 화면 스크립트를 그대로 돌립니다.
**목업이 아니라 실제 배포될 코드가 돌아갑니다.**

## 돌리는 방법

`jsdom` 을 저장소 밖 아무 폴더에 깔고, `NODE_PATH` 로 그 폴더를 가리킵니다.

```bash
mkdir -p ~/jsdom-box && cd ~/jsdom-box && npm i jsdom     # 한 번만
cd <저장소>
NODE_PATH=~/jsdom-box/node_modules node tests/run-all.js   # 전부
NODE_PATH=~/jsdom-box/node_modules node tests/test-quiz.js # 하나만
```

Windows PowerShell 이면:

```powershell
$env:NODE_PATH = "$HOME\jsdom-box\node_modules"
node tests/run-all.js
```

**저장소 안에 `npm install` 을 하지 마세요.** `node_modules/` 가 생기면
"인터넷 없이 그냥 열린다" 는 이 프로젝트의 성질이 흐려집니다.

## 무엇이 들어 있나

| 파일 | 무엇을 본다 |
|---|---|
| `harness.js` | 공용 하네스. `<head>` 3줄 순서를 그대로 재현하고 예시 데이터를 채운 뒤 화면 스크립트를 돌린다 |
| `test-smoke.js` | **회귀 검사** — 화면 11개가 전부 오류 없이 뜨는지. 공용 파일을 고쳤으면 이것부터 |
| `test-learn.js` | 기능3 안전교육 수강 |
| `test-quiz.js` | 기능4 이해도 검증 (문항 3유형) |
| `test-library.js` | 기능9 안전 문구 라이브러리 |
| `test-content.js` | 기능2 교육 콘텐츠 생성·승인 |
| `test-proof.js` | 기능5 교육 증빙 |
| `test-dashboard.js` | 기능6 담당자 대시보드 |
| `test-worker.js` | 노동자 화면 4개 (홈·신고·소통·마이) |
| `test-docs.js` | 문서 검증 — "나 뭐 하면 되는지" 에 답할 수 있는가 |

## 여기서 지키는 것

검사는 동작만 보지 않습니다. **제품 원칙이 코드에 남아 있는지도 봅니다** —
`Store.reports` 에 신고자 식별값이 없는지 · 미이수자를 숨기는 경로가 없는지 ·
"면책" 이라는 낱말이 증빙에 없는지 같은 것들입니다.
이 검사가 깨지면 규칙이 조용히 사라진 것입니다.

## 언제 돌리나

- `src/assets/` 의 공용 파일을 고쳤을 때 — **반드시** (11화면이 다 읽습니다)
- `Store` 의 8개 키 모양을 넓혔을 때 — 그 키를 읽는 화면의 검사를 함께
- 커밋하기 전에 한 번
