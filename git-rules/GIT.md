# 🚀 프로젝트명 (Project Name)

> 프로젝트에 대한 간단한 한 줄 설명을 입력해주세요.

---

## 👥 팀원 안내 및 브랜치 역할

- **`main`**: 최종 배포 및 완성된 프로젝트를 관리하는 브랜치 (직접 Push 금지)
- **`develop`**: 다음 배포를 위해 각자 개발한 기능을 합치는 기준 브랜치 (직접 Push 금지)
- **`feature/이름`**: 개인별 기능 개발 브랜치

| 구분 | 담당 팀원 | 브랜치명 | 역할 및 담당 기능 |
| :--- | :--- | :--- | :--- |
| **Main** | 전체 관리자 (팀장) | `main` | 최종 완성본 관리 |
| **Develop** | 팀 전체 | `develop` | 통합 개발 및 테스트 브랜치 |
| **Feature 1** | 팀원 1 (팀장) | `feature/team1` | 전체 구조 설계 및 A 기능 개발 |
| **Feature 2** | 팀원 2 | `feature/team2` | B 기능 개발 |
| **Feature 3** | 팀원 3 | `feature/team3` | C 기능 개발 |

---

## 💡 Git 작업 3대 수칙

1. **작업 전 최신화**: 매일 작업 시작 직전 `develop` 브랜치의 최신 코드를 당겨옵니다 (`git pull origin develop`).
2. **직접 Push 금지**: `main`과 `develop` 브랜치에는 직접 Push하지 않고, 본인의 `feature/이름` 브랜치에서만 작업합니다.
3. **PR을 통한 Merge**: 작업이 완료되면 GitHub에서 Pull Request(PR)를 생성하고 팀원 승인 후 합칩니다.

---

## 🔰 초보자를 위한 단계별 Git 작업 가이드

### 1단계: 프로젝트 내 컴퓨터로 가져오기 (초기 1회만)
컴퓨터의 작업 폴더에서 터미널(또는 Git Bash)을 열고 아래 명령어를 입력합니다.

```bash
# 1. GitHub 저장소 전체 복사
git clone [https://github.com/계정이름/레포지토리이름.git](https://github.com/계정이름/레포지토리이름.git)

# 2. 프로젝트 폴더 안으로 이동
cd 레포지토리이름

```

---

### 2단계: 내 개인 브랜치로 이동하기

작업하기 전, 항상 내 브랜치에 위치해 있는지 확인합니다.

```bash
# 본인의 기능 브랜치로 이동
git checkout feature/본인이름

# 현재 브랜치 위치 확인 (* 표시가 내 브랜치에 있어야 함)
git branch

```

---

### 3단계: 최신 코드 가져와서 작업 시작하기

다른 팀원이 올려둔 최신 코드를 내 브랜치로 가져와 충돌을 예방합니다.

```bash
# develop 브랜치의 최신 코드를 내 브랜치로 당겨오기
git pull origin develop

```

*(명령어 실행 후 VS Code 등 에디터를 열고 코드를 작성합니다.)*

---

### 4단계: 작업 내용 저장하고 올려주기 (Push)

기능 구현이나 수정을 마쳤다면 내 로컬 저장소에 저장하고 GitHub로 올립니다.

```bash
# 1. 변경된 모든 파일 선택
git add .

# 2. 변경 사항 설명 작성 (커밋)
git commit -m "feat: 로그인 화면 UI 구현"

# 3. GitHub의 내 브랜치로 올리기
git push origin feature/본인이름

```

---

### 5단계: GitHub 웹사이트에서 PR(Pull Request) 보내기

1. GitHub 저장소 웹 페이지 접속 후 상단의 **`Compare & pull request`** 버튼을 누릅니다.
2. **브랜치 방향 필수 확인**: `base: develop` ← `compare: feature/본인이름`
3. 오늘 작업한 주요 내용을 작성하고 `Create pull request`를 클릭합니다.
4. 팀원 리뷰 및 확인 후 `develop` 브랜치로 Merge(합치기)를 진행합니다.

---

## 📝 커밋 메시지 컨벤션 (Commit Convention)

커밋 작성 시 메시지 맨 앞에 아래 태그를 붙여주세요.

* `feat:` 새로운 기능 추가
* `fix:` 버그 및 오류 수정
* `docs:` 문서 수정 (README.md 등)
* `style:` 코드 포맷팅, 세미콜론 누락 등 (로직 변경 없음)
* `refactor:` 코드 리팩토링 (기능 변경 없이 성능/구조 개선)
* `chore:` 빌드 설정, 패키지 매니저 수정 등

---

## 🚨 자주 발생하는 상황 및 해결법

### Q1. 코드를 수정했는데 `git pull`이나 브랜치 이동(`checkout`)이 안 돼요!

> **원인**: 작업 중인 코드가 아직 저장(Commit)되지 않았기 때문입니다.
> **해결**: 진행하던 작업을 먼저 저장(`git add .` → `git commit -m "작업 중"`)한 뒤, pull이나 checkout을 진행하세요.

### Q2. 충돌(Conflict)이 발생했다고 떠요!

> **원인**: 여러 팀원이 같은 파일의 같은 줄을 동시에 수정했을 때 발생합니다.
> **해결**: VS Code에서 코드 위에 뜨는 `Accept Current Change`(내 코드 유지) 또는 `Accept Incoming Change`(팀원 코드 반영) 중 하나를 클릭해 코드를 정돈한 뒤, `git add .` → `git commit` → `git push`를 다시 진행하세요.

```

```
