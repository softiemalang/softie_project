# Astrology Implementation Plan · Astro-1 ~ Astro-5

기준일: 2026-07-26
전제: Phase Astro-0 문서만 완료되었으며 제품 코드와 지원 상태는 변경되지 않았다.

## 0. 현재 불변식

다음 상태는 Astro-3 Activation 승인 전까지 유지한다.

- 사주: 실제 계산
- 자미두수: experimental / needs_external_verification
- 점성학: simulation_blocked / availableForChat false
- Unified Context: unified_2system
- Chat Handoff: Astrology 상태만 표시
- 프론트: 현재 단순한 출생정보 → 질문 → 자료 생성 → 복사 흐름

## 1. 선행 결정

Astro-1 코드 착수 전 반드시 결정:

1. Swiss Ephemeris license mode
   - Professional License 계약 또는 전체 AGPL 전략
2. 배포 binding
   - 우선: 공식 C 코어의 내부 최소 WASM binding
   - 대안: `@swisseph/browser` 별도 권리 해결 후 exact-version spike
3. ephemeris mode
   - 권장: `swisseph`를 요청하고 effective flag가 같을 때만 성공
   - Moshier silent fallback 금지
4. 고위도 정책
   - Placidus 실패 시 다른 house system 자동 대체 금지
5. 독립 Placidus/True Node reference
   - source, version, 사용 조건 확정
6. timezone resolver
   - native Temporal만 의존하지 않는 IANA ambiguity 보존 방식

결정은 작은 ADR 또는 `docs/astrology-adapter-evaluation.md`의 결정 기록 갱신으로 남긴다.

## 2. Astro-1 · Adapter 연결, 아직 Chat 차단

### 목표

- 실제 Natal Ephemeris Adapter 구현
- UTC/좌표 정규화
- 실제 CalculationContext 초안 생성
- Activation은 금지

### 변경 파일

신규:

- `src/astrology/adapters/astrologyAdapterContract.js`
- `src/astrology/adapters/verifiedEphemerisAdapter.js`
- `src/astrology/adapters/blockedSimulationAdapter.js`
- `src/astrology/time/astrologyTimeResolver.js`
- `src/astrology/astrologyPipeline.js`
- `test/astrologyAdapterContract.test.js`
- `test/astrologyTimeResolver.test.js`
- `test/astrologyPipelineBlocked.test.js`

수정:

- `src/astrology/astrologyContract.js`
- `src/astrology/aspectResolver.js`
- `src/astrology/astrologyPatternContext.js`
- `package.json`과 lockfile: 사용자 승인과 라이선스 결정 후에만
- `vite.config.js`: 실제 spike에서 필요한 최소 asset 설정만

보존:

- `planetResolver.js`, `houseResolver.js`는 Simulation Lab 자산
- Interpretation Prep UI, 사주, 자미두수 파일은 수정하지 않음

### 구현 순서

1. license decision과 source pin 기록
2. pure contract 및 blocked adapter 작성
3. timezone resolver와 UTC candidate 작성
4. exact-version WASM binding spike
5. 행성/Node/속도 정규화
6. ASC·MC·Placidus 정규화와 fallback 거부
7. aspect 파생 규칙 versioning, `applying` 상수 제거
8. CalculationContext를 `adapter_connected_unverified`로 생성
9. three-system pipeline에는 계속 blocked descriptor를 반환

### 테스트 순서

1. input schema와 오류 코드
2. normal/gap/overlap/unknown/range time
3. longitude/sign/retrograde invariants
4. house count와 high-latitude error
5. requested/effective ephemeris mode 불일치 실패
6. Context가 verified로 기본 승격되지 않음
7. Unified/Handoff 차단 회귀
8. Vite build
9. Vercel Preview WASM asset smoke

### 종료 기준

- 실제 Adapter가 별도 테스트 경로에서 계산 가능
- 제품 경로는 여전히 `simulation_blocked`
- `availableForChat`이 항상 false
- Golden Gate가 없으면 InterpretationContext를 Unified에 전달할 수 없음

### 롤백 기준

- WASM/Vite build 불안정
- artifact hash 재현 실패
- effective ephemeris mode 확인 불가
- license 조건 미해결
- 고위도 fallback 탐지 불가

롤백은 Adapter import를 제거하고 blocked adapter를 유지한다. Simulation을 대체재로 활성화하지 않는다.

## 3. Astro-2 · Golden Fixture와 Activation Gate

### 목표

- Golden Fixture Runner 구현
- regression 및 external validation
- 중앙 Activation Registry 구현
- 여전히 Chat 값 출력 금지

### 변경 파일

신규:

- `src/astrology/validation/astrologyGoldenFixtures.js`
- `src/astrology/validation/astrologyValidationRunner.js`
- `src/astrology/validation/astrologyActivationRegistry.js`
- `test/fixtures/astrology/golden/`
- `test/astrologyGoldenValidation.test.js`
- `test/astrologyActivationGate.test.js`

수정:

- `src/astrology/astrologyPipeline.js`
- `src/astrology/astrologyContract.js`
- `src/interpretationPrep/unifiedInterpretationContext.js`
- `test/unifiedInterpretationContext.test.js`

### 구현 순서

1. raw source artifact와 provenance schema
2. `swetest` regression fixture
3. JPL/USNO 행성 external fixture
4. 독립 Placidus/ASC/MC/True Node fixture
5. circular angle comparator와 항목별 tolerance
6. browser/Node 동일 runner
7. report artifact와 hash
8. Activation Registry fingerprint
9. Unified 중앙 eligibility predicate

### 테스트 순서

1. fixture schema와 source tier
2. tolerance null/TBD이면 Gate pending
3. 필드·경계 coverage 부족 시 Gate pending
4. 숫자 mismatch 시 fail
5. Boolean retrograde mismatch 시 fail
6. artifact/version/hash mismatch 시 fail
7. 같은 engine 결과만으로 external 통과 불가
8. 임의 `availableForChat: true` descriptor 우회 불가
9. Vercel deployment smoke report

### 종료 기준

- `regression_verified` 및 `externally_verified`를 구분
- 모든 Gate가 versioned report로 재현 가능
- Registry와 runtime artifact가 일치
- 제품은 계속 blocked 상태

### 롤백 기준

- 독립 source provenance 부족
- 허용 오차 근거 부족
- fixture 실패 또는 coverage 공백
- 브라우저와 Node 결과 불일치

## 4. Astro-3 · InterpretationContext와 3-System 참여

### 목표

- 검증된 Astrology Context만 제품 경로에 연결
- Formatter 4종 구현
- Unified Context 참여
- 조건 충족 시에만 unified_3system

### 변경 파일

신규:

- `src/astrology/astrologyTopicSelector.js`

수정:

- `src/astrology/astrologyContract.js`
- `src/astrology/astrologyPatternContext.js`
- `src/interpretationPrep/threeSystemPrepPipeline.js`
- `src/interpretationPrep/unifiedInterpretationContext.js`
- `src/interpretationPrep/handoffFormatters.js`
- `src/interpretationPrep/chatHandoffPackage.js`
- `src/interpretationPrep/engineCapabilities.js`
- 관련 테스트

프론트 UI는 변경하지 않는다.

### 구현 순서

1. Gate-passed CalculationContext -> InterpretationContext
2. component availability와 uncertainty mapping
3. topic selector
4. `formatAstrologyStatus`
5. `formatAstrologyFull`
6. `formatAstrologyQuickFacts`
7. `formatAstrologyTopic`
8. Unified eligibility 적용
9. 모든 조건 통과 시 capability와 available 상태 승격

### 주제별 연결

- personality: Sun, Moon, ASC, element/modality, personal-planet aspects
- career: MC, 2/6/10 houses, Saturn, Jupiter, related aspects
- relationship: Moon, Venus, Mars, 7 house, related aspects
- timing: Natal-only 미지원 문구. Transit 생성 금지

### 테스트 순서

1. exact time full chart
2. unknown/range/ambiguous time partial chart
3. high-latitude house unavailable
4. four Handoff modes
5. topic별 실제 데이터 차이
6. privacy minimal
7. blocked/unverified Adapter 값 미출력
8. 1/2/3-system availability
9. UI에 Lab 미노출
10. browser rendered QA

### 종료 기준

- Gate 통과 artifact에서만 `availableForChat: true`
- 세 체계 모두 eligible일 때만 `unified_3system`
- 입력별 미지원 구성요소가 명시됨
- Natal timing이 Transit처럼 출력되지 않음

### 롤백 기준

- Gate 우회 가능
- Simulation 또는 fallback 값 노출
- fixture fingerprint mismatch
- UI가 잘못된 지원 상태 표시
- Handoff가 체계 용어를 직접 혼합

## 5. Astro-4 · Chat 대화 품질 평가

### 목표

- 실제 Chat에서 자료 충분성, 체계 분리, 불확실성 보존 평가
- 계산 정확도 Gate와 해석 품질 평가를 혼합하지 않음

### 변경 파일

- `test/fixtures/interpretation/astrologyHandoffCases.js`
- `scratch/astrologyHandoffQualityEvaluation.js`
- `test/astrologyHandoffQuality.test.js`
- 필요 시 docs 평가 보고서

### 평가 질문

- personality, career, relationship
- exact/unknown/ambiguous birth time
- 시스템 간 공통점과 차이
- 결정론·인과 혼합·미지원 값 생성 금지

### 종료 기준

- 계산값을 변경하거나 보완 생성하지 않음
- 각 체계 근거가 독립적으로 인용됨
- 사용자의 실제 경험을 확인하는 질문 포함
- 낮은 confidence와 후보 조건이 대화에 유지됨

### 롤백 기준

- 점성학 용어가 사주·자미두수 원인처럼 사용됨
- 값 없는 house/ASC 생성
- 운명·미래 단정

## 6. Astro-5 · Transit Adapter

### 목표

- Natal과 독립된 현재 시기 계산
- target UTC Instant 기반 Transit
- Natal/Transit 근거와 버전을 분리

### 예상 파일

- `src/astrology/adapters/transitAdapterContract.js`
- `src/astrology/astrologyTransitPipeline.js`
- `src/astrology/astrologyTransitContext.js`
- `src/astrology/validation/transitGoldenFixtures.js`
- 관련 formatter 및 테스트

### 원칙

- Natal 위치로 현재 시기를 추정하지 않는다.
- Transit Adapter는 Natal Gate를 재사용하되 별도 fixture/report를 갖는다.
- 대상 시점 timezone과 UTC Instant를 별도로 기록한다.
- transit-to-natal aspect RuleSet을 versioning한다.
- Astro-5 전에는 timing formatter가 미지원 상태를 유지한다.

## 7. 공통 검증 명령

각 Phase에서:

```sh
npm test
npm run build
git diff --check
git status --short --branch
```

Astro-1 이후 추가:

- local production preview의 WASM/data fetch
- Vercel Preview smoke
- Adapter fingerprint 확인
- Golden report 재현
- Handoff에 blocked 값이 없는지 검색

## 8. 위험 목록

| 위험 | 완화 |
| --- | --- |
| Swiss/Wrapper 라이선스 오해 | 코드 전 법적 결정, 두 저작권 층 분리 |
| ephemeris silent fallback | requested/effective flag와 error 강제 검사 |
| WASM source와 npm tarball 불일치 | exact version, source commit, SHA-256 |
| CDN 변동 | 배포 artifact에 고정 |
| DST gap/overlap 자동 보정 | candidate/reject 계약 |
| Placidus 고위도 Porphyry fallback | effective system 불일치 시 houses unavailable |
| same-engine 검증을 external로 오인 | source tier 분리 |
| Context 기본 high/verified | 필수 meta와 registry 기반 파생 |
| Unified descriptor 우회 | 중앙 eligibility predicate |
| aspect applying 오표시 | 속도 근거 계산 또는 null |
| unknown time 정오 확정 | interval candidate와 consensus |
| Natal을 timing으로 오용 | Transit을 Astro-5로 분리 |

## 9. 자미두수 별도 후속

Astrology Phase와 분리된 Ziwei Validation 과제로 기록한다. 이번 계획에서 자미두수 규칙은 변경하지 않는다.

- 입춘과 음력 설 사이
- 윤달
- 자시 경계
- 사화 연간 기준
- 오행국별 대표 사례
- 14주성 대표 배치

## 10. 최종 롤백 원칙

- 실패 시 Astrology descriptor를 `simulation_blocked`로 되돌린다.
- `ENGINE_CAPABILITIES.astrology.calculation`을 false로 유지한다.
- 실제/실험 값을 삭제하지 않고 검증 자산으로 보존한다.
- 사주·자미두수·프론트 동선은 건드리지 않는다.
- Simulation을 임시 대체 계산으로 활성화하지 않는다.
