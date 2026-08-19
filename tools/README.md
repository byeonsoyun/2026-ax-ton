# 로컬 전용 도구 (git에 포함 안 됨)

영상 렌더링 파이프라인이 쓰는 무료 로컬 TTS 엔진. Vercel에는 배포되지 않고
개발자 PC에서 영상을 미리 렌더링할 때만 쓴다 (PRD-safety.md F-01 4단계 참고).

## 설치 방법 (다른 팀원 PC에서)

1. https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_windows_amd64.zip 다운받아
   `tools/piper/piper/piper.exe`가 되도록 압축 풀기
2. 베트남어 음성 모델 다운로드:
   - https://huggingface.co/rhasspy/piper-voices/resolve/main/vi/vi_VN/vivos/x_low/vi_VN-vivos-x_low.onnx
   - https://huggingface.co/rhasspy/piper-voices/resolve/main/vi/vi_VN/vivos/x_low/vi_VN-vivos-x_low.onnx.json
   - 둘 다 `tools/piper/models/`에 넣기
3. `.env.local`에 경로 설정 (`.env.local.example` 참고)

## 언어별 TTS 커버리지 (확인 완료)

- 한국어: Windows 내장 SAPI 음성(Microsoft Heami) — Windows에 한국어 언어팩이 설치되어 있어야 함
- 베트남어: Piper `vi_VN-vivos-x_low`
- 크메르어: 무료 로컬 TTS 옵션을 못 찾음 — 영상 렌더링 미지원, 기존 웹 슬라이드+브라우저 TTS로 폴백
