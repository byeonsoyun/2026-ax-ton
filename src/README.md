# src — 실제 코드

정적 HTML + 바닐라 JS. **빌드가 없습니다.** `index.html` 을 브라우저로 더블클릭하면 그대로 열립니다.

---

## 문서는 `docs/` 에 있습니다

| 무엇 | 어디 |
|---|---|
| 처음 시작하기 | [`../docs/00-getting-started.md`](../docs/00-getting-started.md) |
| **폴더 · 데이터 · 화면 전체 지도** | [`../docs/01-project-map.md`](../docs/01-project-map.md) |
| 내 담당이 무엇인지 | [`../docs/02-positions.md`](../docs/02-positions.md) |
| Claude Code 복붙 프롬프트 | [`../docs/03-prompts.md`](../docs/03-prompts.md) |
| 막혔을 때 | [`../docs/05-troubleshooting.md`](../docs/05-troubleshooting.md) |

구조와 규칙 설명은 **`docs/01-project-map.md` 하나에만** 둡니다.
여기저기 적어 두면 한쪽만 고쳤을 때 금방 틀린 문서가 생깁니다.

---

## 폴더

```
src/
├── index.html      로그인 — 여기서 역할이 갈린다
├── signup.html     회원가입
├── assets/         ★ 공용. 고치기 전에 팀에 알릴 것
├── worker/         ★ 노동자 팀 (P1 · P2)
└── admin/          ★ 관리자 팀 (P3 · P4)
```

**규칙 하나: 1화면 = HTML 1개 + JS 1개, 주인은 1명.**
각 파일 맨 위 주석에 담당 · 기능번호 · 읽는 키 · 쓰는 키가 적혀 있습니다.

---

## 바로 확인하기

1. `index.html` 더블클릭
2. **예시 데이터 채우기** 누르기
3. 로그인 — 비밀번호는 전부 `1234`

| 아이디 | 역할 | 도착 |
|---|---|---|
| `W-4821-07` | 노동자 | `worker/home.html` |
| `kim@daesung.co.kr` | 담당자 | `admin/dashboard.html` |
| `oper@safety.kr` | 운영자 | `admin/library.html` |

---

## 배포

Vercel — **Root Directory `src`**, Framework `Other`, Build Command 비움.
빌드가 없으므로 push 하면 그대로 올라갑니다.
