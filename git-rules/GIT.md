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
