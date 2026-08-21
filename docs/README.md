# 개발 문서

이주노동자 안전교육 이해도 검증 플랫폼 — 팀 개발 문서입니다.

**코드나 깃허브를 잘 몰라도 됩니다.** 아래 순서대로만 따라오시면 됩니다.

---

## 어떤 상황에 무엇을 읽나요

| 상황 | 읽을 것 |
|---|---|
| **나 뭐 하면 되죠?** | [07-next-tasks.md](07-next-tasks.md) — 내 포지션의 다음 할 일 ★ |
| **오늘 처음입니다** | [00-getting-started.md](00-getting-started.md) — 설치부터 첫 화면까지 |
| **개발을 시작합니다** | [03-prompts.md](03-prompts.md) — 내 포지션 프롬프트를 복사해 Claude Code 에 붙여넣기 |
| **내가 뭘 맡았죠?** | [02-positions.md](02-positions.md) — 포지션 카드 4장 |
| **이 프로젝트가 뭐죠?** | [01-project-map.md](01-project-map.md) — 폴더 · 데이터 · 화면 전체 지도 |
| **오늘 한 일을 남깁니다** | [04-devlog.md](04-devlog.md) — 개발일지 쓰는 법 |
| **무엇이 먼저죠?** | [06-feature-priority.md](06-feature-priority.md) — 필수 / 사용성 / 향후 3층 |
| **뭔가 막혔습니다** | [05-troubleshooting.md](05-troubleshooting.md) — 충돌 · push 실패 · 화면이 안 뜸 |
| **화면을 새로 안 만들고 싶습니다** | [mockups/README.md](mockups/README.md) — 기획 시안 옮겨 오는 법 |

> **포지션이 아직 안 정해졌어도 시작할 수 있습니다.**
> Claude Code 를 열면 남아 있는 포지션을 알려 주고, 고르면 기록해 둡니다.
> [03-prompts.md](03-prompts.md) 맨 위의 "포지션이 아직 안 정해졌다면" 블록을 쓰세요.

---

## 처음이라면 이 순서

1. **[00-getting-started.md](00-getting-started.md)** 를 위에서부터 그대로 따라 합니다 (한 번만)
2. Claude Code 를 열고 **"나 뭐 하면 되는지 알려줘"** 라고 씁니다

끝입니다. 브랜치를 보고 내 포지션을 알아내서, 지금 상태와 다음 할 일을 알려 줍니다.
문서를 미리 읽지 않아도 됩니다.

더 알고 싶으면 — [02-positions.md](02-positions.md) 내 포지션 카드 ·
[07-next-tasks.md](07-next-tasks.md) 내 할 일 목록 ·
[03-prompts.md](03-prompts.md) 복붙 프롬프트

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
