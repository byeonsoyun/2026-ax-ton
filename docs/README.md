# 개발 문서

이주노동자 안전교육 이해도 검증 플랫폼 — 팀 개발 문서입니다.

**코드나 깃허브를 잘 몰라도 됩니다.** 아래 순서대로만 따라오시면 됩니다.

---

## 어떤 상황에 무엇을 읽나요

| 상황 | 읽을 것 |
|---|---|
| **오늘 처음입니다** | [00-getting-started.md](00-getting-started.md) — 설치부터 첫 화면까지 |
| **개발을 시작합니다** | [03-prompts.md](03-prompts.md) — 내 포지션 프롬프트를 복사해 Claude Code 에 붙여넣기 |
| **내가 뭘 맡았죠?** | [02-positions.md](02-positions.md) — 포지션 카드 4장 |
| **이 프로젝트가 뭐죠?** | [01-project-map.md](01-project-map.md) — 폴더 · 데이터 · 화면 전체 지도 |
| **오늘 한 일을 남깁니다** | [04-devlog.md](04-devlog.md) — 개발일지 쓰는 법 |
| **뭔가 막혔습니다** | [05-troubleshooting.md](05-troubleshooting.md) — 충돌 · push 실패 · 화면이 안 뜸 |

---

## 처음이라면 이 순서

1. **[00-getting-started.md](00-getting-started.md)** 를 위에서부터 그대로 따라 합니다 (한 번만)
2. **[02-positions.md](02-positions.md)** 에서 내 포지션 카드를 읽습니다 (5분)
3. **[03-prompts.md](03-prompts.md)** 에서 내 블록을 복사해 Claude Code 에 붙여넣습니다
4. 이제 개발하시면 됩니다

---

## 알아두면 좋은 것

**git 명령어를 직접 칠 필요가 없습니다.**
저장소에 [`CLAUDE.md`](../CLAUDE.md) 가 있어서 Claude Code 가 자동으로 읽습니다.
작업을 시작하면 알아서 최신 코드를 받아오고, 한 덩어리가 끝나면 알아서 저장하고 올립니다.
개발일지도 알아서 적어 줍니다.

**PR 과 머지는 관리자(P1)가 합니다.** 나머지 세 분은 본인 브랜치에 올리기만 하면 됩니다.

**빌드가 없습니다.** `npm install` 같은 건 안 합니다.
`src/index.html` 을 더블클릭하면 그게 바로 화면입니다.

---

## 폴더

```
2026-ax-ton/
├── CLAUDE.md        Claude Code 가 자동으로 읽는 규칙
├── docs/            지금 보고 계신 곳
│   └── devlog/      각자의 개발일지
├── git-rules/       팀 git 규칙 원본
└── src/             ★ 실제 코드
```
