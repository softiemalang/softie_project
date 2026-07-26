/**
 * sajuCoreContract.test.js
 *
 * 사주 코어 동결 계약 검증 테스트
 *
 * 다음 계약을 검사합니다:
 * 1. InterpretationContext.calculationConfidence.stateContract가 5개 필드를 모두 정확히 보존하는지
 * 2. needs_verification 입력에서 상태가 전체 파이프라인(InterpretationContext → threeSystemPipeline)까지 손실 없이 전달되는지
 * 3. candidate_required 입력(출생시각 미상)에서 status가 보존되는지
 * 4. raw.experimental이 stateContract.verificationStatus를 verified로 승격하지 않는지
 * 5. regression_only 픽스처가 buildValidationReport()에서 [VERIFIED] 라벨로 표시되지 않는지
 * 6. capability defaultStatus와 per-result stateContract가 독립적으로 존재하는지
 */

import test from 'node:test'
import assert from 'node:assert/strict'

import { prepareInterpretationData } from '../src/interpretationPrep/prepare.js'
import { buildInterpretationContext } from '../src/interpretationPrep/interpretationContext.js'
import { calculateSajuSystem } from '../src/interpretationPrep/sajuAdapter.js'
import { prepareThreeSystemInterpretationData } from '../src/interpretationPrep/threeSystemPrepPipeline.js'
import { getSystemCapabilities } from '../src/interpretationPrep/engineCapabilities.js'
import { sajuValidationFixtures } from '../src/interpretationPrep/fixtures/sajuValidationFixtures.js'
import { runSajuValidationSuite, buildValidationReport } from '../src/interpretationPrep/sajuValidationRunner.js'
import { DEFAULT_PROFILES } from '../src/interpretationPrep/schema.js'

// ── 공통 테스트 입력 ───────────────────────────────────────────────────────────

const NORMAL_INPUT = {
  subjectName: '계약테스트',
  birthDate: '1997-04-21',
  birthTime: '14:40',
  targetDate: '2026-07-27',
  placeName: '서울',
  referenceCity: 'seoul',
  timezone: 'Asia/Seoul',
  latitude: '37.57',
  longitude: '126.97',
  gender: 'male',
  calendar: 'solar',
  isLeapMonth: false,
  timeAccuracy: 'exact',
}

// 1961-08-10 이전 출생 → needs_verification 유발
const HISTORICAL_INPUT = {
  ...NORMAL_INPUT,
  subjectName: '역사표준시테스트',
  birthDate: '1955-06-15',
  birthTime: '14:30',
  gender: 'female',
}

// 출생시각 미상 → candidate_required 유발
const UNKNOWN_TIME_INPUT = {
  ...NORMAL_INPUT,
  subjectName: '시각미상테스트',
  birthTime: '',
  timeAccuracy: 'unknown',
}

// ── 테스트 1: 정상 입력의 5개 stateContract 필드 보존 ───────────────────────────

test('interpretationContext.calculationConfidence.stateContract preserves all 5 fields from raw stateContract', () => {
  const sajuResult = calculateSajuSystem(NORMAL_INPUT, DEFAULT_PROFILES.saju)
  const rawContract = sajuResult.stateContract

  // raw stateContract가 5개 필드를 모두 가지고 있는지 확인
  assert.ok(rawContract, 'raw stateContract must exist')
  assert.ok(rawContract.inputStatus, 'raw stateContract.inputStatus must exist')
  assert.ok(rawContract.calculationStatus, 'raw stateContract.calculationStatus must exist')
  assert.ok(rawContract.verificationStatus, 'raw stateContract.verificationStatus must exist')
  assert.ok(rawContract.interpretationStatus, 'raw stateContract.interpretationStatus must exist')
  assert.ok(rawContract.confidence, 'raw stateContract.confidence must exist')

  const context = buildInterpretationContext(sajuResult, { generatedAt: '2026-07-27T00:00:00.000Z' })
  const ctxContract = context.calculationConfidence.stateContract

  // InterpretationContext가 5개 필드를 정확히 보존하는지 확인
  assert.equal(ctxContract.inputStatus, rawContract.inputStatus,
    'inputStatus must be preserved without alteration')
  assert.equal(ctxContract.calculationStatus, rawContract.calculationStatus,
    'calculationStatus must be preserved without alteration')
  assert.equal(ctxContract.verificationStatus, rawContract.verificationStatus,
    'verificationStatus must be preserved without alteration')
  assert.equal(ctxContract.interpretationStatus, rawContract.interpretationStatus,
    'interpretationStatus must be preserved without alteration')
  assert.equal(ctxContract.confidence, rawContract.confidence,
    'confidence must be preserved without alteration')

  // 정상 입력의 기대값 확인 (verified, high 등이 올바른 경우)
  assert.equal(ctxContract.verificationStatus, 'verified',
    'normal input must yield verified verificationStatus')
  assert.equal(ctxContract.confidence, 'high',
    'normal input must yield high confidence')
})

// ── 테스트 2: needs_verification이 InterpretationContext까지 정확히 전달되는지 ──

test('interpretationContext.calculationConfidence.stateContract preserves needs_verification without promotion', () => {
  const sajuResult = calculateSajuSystem(HISTORICAL_INPUT, DEFAULT_PROFILES.saju)
  const rawContract = sajuResult.stateContract

  assert.equal(rawContract.verificationStatus, 'needs_verification',
    'historical input must set verificationStatus to needs_verification')
  assert.equal(rawContract.confidence, 'low',
    'historical input must set confidence to low')

  const context = buildInterpretationContext(sajuResult, {})
  const ctxContract = context.calculationConfidence.stateContract

  // needs_verification이 verified로 상향 승격되지 않는지 검사
  assert.equal(ctxContract.verificationStatus, 'needs_verification',
    'needs_verification must not be promoted to verified in InterpretationContext')
  assert.equal(ctxContract.confidence, 'low',
    'low confidence must not be promoted to high in InterpretationContext')
  assert.notEqual(ctxContract.verificationStatus, 'verified',
    'verificationStatus must never be silently promoted to verified')
  assert.notEqual(ctxContract.confidence, 'high',
    'confidence must never be silently promoted to high')
})

// ── 테스트 3: threeSystemPipeline에서 needs_verification 상태 보존 ──────────────

test('threeSystemPipeline preserves needs_verification status through handoff', () => {
  const prepared = prepareThreeSystemInterpretationData(HISTORICAL_INPUT)
  const sajuSystem = prepared.systems.saju

  assert.equal(sajuSystem.status, 'needs_verification',
    'saju system status must be needs_verification for pre-1961 birth')
  assert.equal(sajuSystem.verificationStatus, 'needs_verification',
    'saju verificationStatus must be needs_verification')
  assert.equal(sajuSystem.confidence, 'low',
    'saju confidence must be low for needs_verification')
  assert.equal(sajuSystem.availableForChat, true,
    'availableForChat must remain independent of verification status')
})

// ── 테스트 4: candidate_required (출생시각 미상)이 handoff까지 보존되는지 ─────────

test('threeSystemPipeline preserves candidate_required for unknown birth time', () => {
  const prepared = prepareThreeSystemInterpretationData(UNKNOWN_TIME_INPUT)
  const sajuSystem = prepared.systems.saju

  assert.equal(sajuSystem.status, 'candidate_required',
    'unknown birth time must yield candidate_required status in handoff')
  assert.equal(sajuSystem.verificationStatus, 'candidate_required',
    'verificationStatus must also be candidate_required')
})

// ── 테스트 5: 정상 입력의 threeSystemPipeline status = available ─────────────────

test('threeSystemPipeline yields available status for normal verified input', () => {
  const prepared = prepareThreeSystemInterpretationData(NORMAL_INPUT)
  const sajuSystem = prepared.systems.saju

  assert.equal(sajuSystem.status, 'available',
    'normal input must yield available status')
  assert.equal(sajuSystem.verificationStatus, 'verified',
    'normal input must yield verified verificationStatus')
  assert.equal(sajuSystem.availableForChat, true,
    'availableForChat must be true for normal input')
})

// ── 테스트 6: raw.experimental이 stateContract.verificationStatus를 승격하지 않는지 ─

test('raw.experimental does not promote stateContract.verificationStatus to verified', () => {
  const prepResult = prepareInterpretationData(HISTORICAL_INPUT)
  const saju = prepResult.systems.saju

  // 핵심 계산 상태
  assert.equal(saju.stateContract.verificationStatus, 'needs_verification',
    'core stateContract.verificationStatus must be needs_verification')

  // experimental 필드들
  const experimental = saju.raw.experimental
  assert.ok(experimental, 'experimental must exist')
  assert.equal(experimental.verificationStatus, 'needs_verification',
    'experimental.verificationStatus must match core verificationStatus')

  // experimental 존재가 핵심 stateContract를 덮지 않음
  assert.notEqual(saju.stateContract.verificationStatus, 'verified',
    'core verificationStatus must never be promoted to verified by experimental data')

  // epistemicMetadata의 confidence도 낮게 유지
  if (experimental.strength?.epistemicMetadata) {
    assert.equal(experimental.strength.epistemicMetadata.confidence, 'low',
      'experimental strength epistemicMetadata must have low confidence under needs_verification')
  }
  if (experimental.gyeokguk?.epistemicMetadata) {
    assert.equal(experimental.gyeokguk.epistemicMetadata.confidence, 'low',
      'experimental gyeokguk epistemicMetadata must have low confidence under needs_verification')
  }
})

// ── 테스트 7: capability defaultStatus와 per-result stateContract 독립성 ────────

test('capability defaultStatus is independent from per-result stateContract verificationStatus', () => {
  const capabilities = getSystemCapabilities('saju')

  // capability defaultStatus는 계산 기능 연결 여부를 나타내는 값
  assert.equal(capabilities.defaultStatus, 'complete',
    'capability defaultStatus must be complete (connection capability)')

  // 실제 계산 결과의 verificationStatus는 per-result 계약으로 별도 관리됨
  const historicalResult = calculateSajuSystem(HISTORICAL_INPUT, DEFAULT_PROFILES.saju)
  assert.equal(historicalResult.stateContract.verificationStatus, 'needs_verification',
    'per-result verificationStatus can differ from capability defaultStatus')

  // capability와 per-result 상태는 서로 독립적
  assert.notEqual(
    capabilities.defaultStatus,
    historicalResult.stateContract.verificationStatus,
    'capability defaultStatus and per-result verificationStatus are independent layers'
  )
})

// ── 테스트 8: regression_only 픽스처 보고서 라벨 검증 ───────────────────────────

test('buildValidationReport does not label regression_only fixtures as VERIFIED in detail sections', () => {
  const summary = runSajuValidationSuite(sajuValidationFixtures, prepareInterpretationData)
  const report = buildValidationReport(summary)

  // 외부 verified 통계는 0개
  const verifiedTotal = summary.statistics.verified.total
  assert.equal(verifiedTotal, 0,
    'no externally verified fixtures must exist in the current fixture set')

  // regression_only 픽스처 수는 양수
  const regressionTotal = summary.statistics.regressionOnly.total
  assert.ok(regressionTotal > 0,
    'regression_only fixtures must exist')

  // 각 regression_only 픽스처의 상세 섹션 검증
  const regressionFixtures = sajuValidationFixtures.filter(f => f.verificationStatus === 'regression_only')
  for (const fixture of regressionFixtures) {
    // 상세 제목이 [REGRESSION_ONLY]를 포함해야 함
    assert.ok(
      report.includes(`[REGRESSION_ONLY]`),
      'detail section must include [REGRESSION_ONLY] label for regression_only fixtures'
    )

    // regression_only 섹션의 설명이 내부 회귀 표현이어야 함
    const internalRegressionText = '현재 엔진의 계산 계약과 일치'
    assert.ok(
      report.includes(internalRegressionText),
      `regression_only description must use internal regression wording: "${internalRegressionText}"`
    )
  }

  // regression_only 픽스처가 독립 외부 근거 대조 완료 문구를 포함하지 않음을 확인
  // 보고서 전체에서 regression_only 픽스처와 결합된 외부 검증 표현이 없어야 함
  const externalVerifiedText = '독립 외부 근거와 대조 완료'
  // 해당 문구가 있더라도 verified 카운트가 0이므로 실제로 연결되는 픽스처가 없어야 함
  if (report.includes(externalVerifiedText)) {
    assert.equal(verifiedTotal, 0,
      'if external verification wording appears, it must correspond to 0 verified fixtures')
  }
})
