# Astro-1 Readiness Decision

기준일: 2026-07-26
최종 판정: `astro_1_blocked`

## Gate

```json
{
  "licenseDecision": "pending",
  "wasmBuild": "pass",
  "wasmReproducibility": "pass",
  "viteLocal": "pass",
  "vercelPreview": "fail",
  "ephemerisFallbackDetection": "pass",
  "placidusFallbackDetection": "pass",
  "timezoneResolverDecision": "pass",
  "independentPlanetReference": "pass",
  "independentPlacidusReference": "pending",
  "independentTrueNodeReference": "pending"
}
```

`vercelPreview: fail`은 플랫폼 transport 실패를 뜻하지 않는다. 라이선스 때문에 실제 Swiss WASM/data를 Preview에 배포하지 않아 제품 후보 artifact의 Preview Gate가 아직 통과하지 못했다는 뜻이다. 라이선스 중립 probe의 Vercel transport는 성공했다.

## 판단 근거

통과:

- 공식 Swiss C Core를 Emscripten으로 빌드 가능
- 고정 output path에서 bit-for-bit 재현
- Vite dev/build/local preview에서 실제 Swiss 계산
- requested/effective Ephemeris flags로 Moshier fallback 탐지
- Placidus 오류 코드와 Porphyry 반환 결과 탐지
- Temporal 기반 gap/overlap 후보 보존 방식 검증
- JPL Horizons를 행성·달 독립 기준으로 선택

차단:

- AGPL 또는 Professional License 경로를 사용자가 아직 승인하지 않음
- 실제 Swiss artifact의 Vercel Preview 검증을 라이선스 때문에 수행하지 않음
- 독립 ASC/MC/Placidus 후보의 non-Swiss build artifact 미확정
- 독립 True Node 기준 미확정

## Astro-1 진행 가능 범위

현재 가능한 작업:

- 격리 Spike 개선
- Binding source/build script 검토
- 계약에 필요한 Astrodienst 질문 정리
- Astrolog non-Swiss house reference build 연구
- JPL Horizons fixture 수집 설계
- 독립 True Node 정의와 산출 방식 조사

현재 불가능한 작업:

- Swiss 제품 의존성 또는 artifact 추가
- 공개 Vercel Preview/Production에 Swiss asset 배포
- `src/interpretationPrep/threeSystemPrepPipeline.js` 연결
- Astrology CalculationContext 정식 활성화
- `availableForChat: true`
- `unified_3system`
- Chat Handoff 실제 Astrology 값 출력

## 다음 작업

1. 사용자가 AGPL 전략 또는 Professional License 협의 경로를 결정
2. Professional 후보라면 Astrodienst로부터 브라우저 WASM/data 재배포 서면 확인
3. Astrolog을 Swiss/Placalc 없이 빌드하고 ASC/MC/Placidus raw fixture 보존
4. True Node 독립 기준 확정
5. 라이선스 허용 후 exact Swiss artifact를 Vercel Preview에 배포
6. Preview의 MIME, cache, Safari/Chromium, fingerprint 재검증
7. 모든 Gate를 다시 판정

## 제품 불변식

Astro-0.5 완료 후에도:

- 사주: 실제 계산
- 자미두수: `experimental`, `needs_external_verification`
- 점성학: `simulation_blocked`
- `availableForChat: false`
- `calculationResult: null`
- `interpretationContext: null`
- Unified Context: `unified_2system`
- Chat Handoff: Astrology 실제 값 없음
- 프론트: 현재 단순 흐름 유지

관련 문서:

- [라이선스 결정](./astrology-license-decision.md)
- [WASM Spike](./astrology-wasm-spike-report.md)
- [배포 Spike](./astrology-deployment-spike-report.md)
- [독립 기준 출처](./astrology-reference-source-decision.md)
- [시간대 Resolver](./astrology-timezone-resolver-decision.md)
- [Astro-1~5 구현 계획](./astrology-implementation-plan.md)
