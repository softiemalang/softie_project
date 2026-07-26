# Astro-1 Readiness Decision · Astro-0.75

기준일: 2026-07-26
최종 판정: `astro_1_blocked`

## Gate

```json
{
  "licenseDocumentationReviewed": "pass",
  "professionalLicenseScopeConfirmed": "pending",
  "agplImpactAssessed": "pass",
  "browserWasmRedistributionConfirmed": "pending",
  "ephemerisDataRedistributionConfirmed": "pending",
  "wasmBuild": "pass",
  "wasmReproducibility": "pass",
  "viteLocal": "pass",
  "vercelPreview": "fail",
  "ephemerisFallbackDetection": "pass",
  "placidusFallbackDetection": "pass",
  "timezoneResolverDecision": "pass",
  "independentPlanetReference": "pass",
  "independentMoonReference": "pass",
  "independentAscReference": "pass",
  "independentMcReference": "pass",
  "independentPlacidusReference": "pass",
  "independentTrueNodeReference": "pending",
  "referenceBuildReproducibility": "pass",
  "referenceArtifactProvenance": "pass",
  "referenceTermsCompliance": "pass"
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
- Astrolog 8.00을 Swiss/Placalc/JPL Web 없이 Matrix-only로 빌드
- Astrolog ASC·MC·Placidus 구현 source와 build provenance 고정
- 중위도·남반구 raw fixture 2회 반복 일치
- 고위도 Placidus warning과 Porphyry fallback 탐지
- reference executable SHA-256 및 repeat build 일치
- 외부 executable과 사용자 출생정보가 Git에 포함되지 않음

차단:

- AGPL 또는 Professional License 경로가 아직 확정되지 않음
- Professional 계약의 Browser WASM 및 data static asset 재배포 범위가
  Astrodienst 서면 답변 전 `pending`
- 실제 Swiss artifact의 Vercel Preview 검증을 라이선스 때문에 수행하지 않음
- Swiss `SE_TRUE_NODE`와 정의·보정이 같은 독립 True Node 기준 미확정

독립 ASC/MC/Placidus의 `pass`는 source와 provenance가 확보됐다는 뜻이다.
Swiss와의 수치 허용 오차 검증은 Astro-2 Golden Fixture에서 별도 수행한다.

## Astro-1 진행 가능 범위

현재 가능한 작업:

- 격리 Spike 개선
- Binding source/build script 검토
- 작성된 Astrodienst 문의 초안 검토 및 실제 발송 준비
- JPL Horizons fixture 수집 설계
- 독립 True Node 정의 및 JPL state-vector 유도 가능성 연구
- Astro-1 코드 구조 설계와 비공개 Adapter 작업 준비

Astro-1 제품 구현 착수는 아직 허용하지 않는다. 라이선스 Gate가 확정되면
독립 True Node가 pending인 동안에도 `astro_1_conditionally_ready`로
재판정하여 Adapter 구현과 Astro-2 준비만 허용할 수 있다.

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
2. [문의 초안](./astrology-license-inquiry.md)을 검토하고 Astrodienst에 발송
3. 브라우저 WASM/data 재배포와 환경 범위의 서면 답변 보존
4. True Node 독립 기준 확정 또는 Astro-1 필수값 범위 재결정
5. 라이선스 허용 후 exact Swiss artifact를 Vercel Preview에 배포
6. Preview의 MIME, cache, Safari/Chromium, fingerprint 재검증
7. License/Reference Gate를 다시 판정

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
- [라이선스 해결 기록](./astrology-license-resolution.md)
- [Astrodienst 문의 초안](./astrology-license-inquiry.md)
- [WASM Spike](./astrology-wasm-spike-report.md)
- [배포 Spike](./astrology-deployment-spike-report.md)
- [독립 기준 출처](./astrology-reference-source-decision.md)
- [독립 Reference 평가](./astrology-independent-reference-evaluation.md)
- [True Node 기준](./astrology-true-node-reference.md)
- [Reference Spike](./astrology-reference-spike-report.md)
- [시간대 Resolver](./astrology-timezone-resolver-decision.md)
- [Astro-1~5 구현 계획](./astrology-implementation-plan.md)
