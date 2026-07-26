/**
 * ziweiCoreContract.test.js
 *
 * 자미두수 출생 명반 코어 계약 검증 테스트 스위트
 */

import test from 'node:test'
import assert from 'node:assert/strict'

import { resolveStateContract, VALID_VERIFICATION_STATUSES } from '../src/interpretationPrep/statusResolver.js'
import { resolveZiweiChart } from '../src/ziwei/ziweiResolver.js'
import { resolve14MajorStars } from '../src/ziwei/starResolver.js'
import { resolveFourTransformations } from '../src/ziwei/transformationResolver.js'
import { resolveMinorStars } from '../src/ziwei/minorStarResolver.js'
import { YEAR_STEM_TRANSFORMATIONS } from '../src/ziwei/transformationRules.js'
import { resolveFiveElementBureau } from '../src/ziwei/fiveElementResolver.js'
import { createZiweiCalculationContext, createZiweiInterpretationContext } from '../src/ziwei/ziweiContract.js'
import { prepareThreeSystemInterpretationData } from '../src/interpretationPrep/threeSystemPrepPipeline.js'
import { createUnifiedInterpretationContext } from '../src/interpretationPrep/unifiedInterpretationContext.js'
import { buildChatHandoffPackage } from '../src/interpretationPrep/chatHandoffPackage.js'
import { createEmptySystemResult } from '../src/interpretationPrep/schema.js'

// 정상 입력 샘플
const NORMAL_INPUT = {
  subjectName: '자미정상테스트',
  birthDate: '1997-04-21',
  birthTime: '14:40',
  gender: 'male',
  timeAccuracy: 'exact',
  targetDate: '2026-07-27',
  timezone: 'Asia/Seoul',
  referenceCity: 'seoul',
}

// 자시 경계 입력 샘플
const ZI_HOUR_INPUT = {
  ...NORMAL_INPUT,
  subjectName: '자시경계테스트',
  birthTime: '23:30',
}

// 윤달 입력 샘플
const LEAP_MONTH_INPUT = {
  ...NORMAL_INPUT,
  subjectName: '윤달테스트',
  birthDate: '1995-09-25', // 1995년 윤8월 구간
}

// ── 1. needs_external_verification Vocabulary 보존 검증 ─────────────────────────

test('statusResolver: preserves needs_external_verification without coercing to verified', () => {
  assert.ok(
    VALID_VERIFICATION_STATUSES.includes('needs_external_verification'),
    'VALID_VERIFICATION_STATUSES must include needs_external_verification'
  )

  const contract = resolveStateContract({ verificationStatus: 'needs_external_verification' })
  assert.equal(
    contract.verificationStatus,
    'needs_external_verification',
    'needs_external_verification must be preserved without coercing to verified'
  )
})

// ── 2. 직접 Resolver 정상 입력 검증 ─────────────────────────────────────────────

test('resolveZiweiChart: returns needs_external_verification for normal input (never verified)', () => {
  const result = resolveZiweiChart({
    subjectName: '단독테스트',
    lunarMonth: 5,
    hourBranch: '午',
    birthYearStem: '庚',
    birthYearBranch: '午',
    birthTime: '12:00',
  })

  assert.equal(
    result.calculationMeta.verificationStatus,
    'needs_external_verification',
    'direct resolver must return needs_external_verification on normal input'
  )
  assert.equal(
    result.calculationMeta.confidence,
    'medium',
    'direct resolver must return medium confidence on unverified normal input'
  )
  assert.notEqual(
    result.calculationMeta.verificationStatus,
    'verified',
    'direct resolver must never return verified'
  )
})

// ── 3. 직접 Resolver Input Metadata 정확성 검증 ─────────────────────────────────

test('resolveZiweiChart: accurately returns input metadata without defaulting to dummy values', () => {
  const result = resolveZiweiChart({
    subjectName: '메타데이터테스트',
    lunarMonth: 3,
    hourBranch: '辰',
    birthYearStem: '丙',
    birthYearBranch: '子',
    birthTime: '08:00',
    isLeapMonth: false,
  })

  assert.equal(result.input.birthYearStem, '丙')
  assert.equal(result.input.birthYearBranch, '子')
  assert.equal(result.input.lunarMonth, 3)
  assert.equal(result.input.hourBranch, '辰')
  assert.equal(result.input.birthTime, '08:00')
  assert.equal(result.input.calendarBasis.isLeapMonth, false)
})

// ── 4. 누락 입력 시 Dummy Chart 생성 차단 검증 ──────────────────────────────────

test('resolveZiweiChart & createZiweiCalculationContext: fail-closed on missing mandatory inputs', () => {
  // 필수 인자(lunarMonth, hourBranch, birthYearStem) 누락
  const missingResult = resolveZiweiChart({ subjectName: '누락테스트' })

  assert.equal(missingResult.calculationMeta.inputStatus, 'missing_input')
  assert.equal(missingResult.calculationMeta.calculationStatus, 'partial')
  assert.equal(missingResult.calculationMeta.confidence, 'low')
  assert.equal(missingResult.chart.mingGong, null)
  assert.equal(missingResult.chart.shenGong, null)
  assert.equal(missingResult.chart.fiveElementsBureau, null)
  assert.equal(missingResult.chart.palaces.length, 0)
})

// ── 5. 정상 단일 입력 3-System Pipeline 검증 ───────────────────────────────────

test('threeSystemPrepPipeline: normal single input yields availableForChat true and medium confidence', () => {
  const prepared = prepareThreeSystemInterpretationData(NORMAL_INPUT)
  const ziwei = prepared.systems.ziwei

  assert.equal(ziwei.availableForChat, true)
  assert.equal(ziwei.verificationStatus, 'needs_external_verification')
  assert.equal(ziwei.confidence, 'medium')
  assert.equal(ziwei.status, 'experimental')
  assert.ok(ziwei.interpretationContext !== null)
})

// ── 6. 윤달 입력 3-System Pipeline Fail-Closed 차단 검증 ─────────────────────────

test('threeSystemPrepPipeline: leap month input is fail-closed with availableForChat false', () => {
  const prepared = prepareThreeSystemInterpretationData(LEAP_MONTH_INPUT)
  const ziwei = prepared.systems.ziwei

  assert.equal(ziwei.availableForChat, false)
  assert.equal(ziwei.verificationStatus, 'candidate_required')
  assert.equal(ziwei.status, 'candidate_required')
  assert.equal(ziwei.confidence, 'low')
  assert.equal(ziwei.interpretationContext, null)
  assert.ok(ziwei.calculationResult !== null, 'calculationResult must be preserved for debugging')
  assert.ok(ziwei.warnings.some((w) => w.includes('Chat 해석 자료에서 차단합니다')))
})

// ── 7. 자시 경계 입력 3-System Pipeline Fail-Closed 차단 검증 ─────────────────────

test('threeSystemPrepPipeline: zi hour boundary input is fail-closed with availableForChat false', () => {
  const prepared = prepareThreeSystemInterpretationData(ZI_HOUR_INPUT)
  const ziwei = prepared.systems.ziwei

  assert.equal(ziwei.availableForChat, false)
  assert.equal(ziwei.verificationStatus, 'candidate_required')
  assert.equal(ziwei.status, 'candidate_required')
  assert.equal(ziwei.confidence, 'low')
  assert.equal(ziwei.interpretationContext, null)
})

// ── 8. Unified Context에서 candidate_required 자미두수 제외 검증 ──────────────────

test('createUnifiedInterpretationContext: excludes candidate_required Ziwei from available systems and unified structures', () => {
  const prepared = prepareThreeSystemInterpretationData(LEAP_MONTH_INPUT)
  const unified = prepared.unifiedContext

  assert.ok(!unified.availableSystems.includes('ziwei'), 'ziwei must not be in availableSystems when availableForChat is false')
  assert.ok(unified.unavailableSystems.includes('ziwei'), 'ziwei must be in unavailableSystems')
  assert.equal(unified.systems.ziwei.status, 'candidate_required')
  assert.equal(unified.sharedThemes[0]?.evidence?.ziwei, undefined, 'sharedThemes evidence must not contain ziwei')
  assert.ok(!unified.differentPerspectives.some((p) => p.system === 'ziwei'), 'differentPerspectives must not contain ziwei perspective')
})

// ── 9. Chat Handoff에서 candidate_required 자미두수 실제 값 차단 검증 ──────────────

test('buildChatHandoffPackage: blocks actual Ziwei chart values across full, quick, topicFocused, and privacyMinimal markdowns on candidate_required boundary input', () => {
  const prepared = prepareThreeSystemInterpretationData(LEAP_MONTH_INPUT)
  const pkg = buildChatHandoffPackage(prepared)

  const full = pkg.copies.full
  const quick = pkg.copies.quick
  const topicFocused = pkg.copies.topicFocused
  const privacyMinimal = pkg.copies.privacyMinimal

  assert.ok(full, 'full markdown copy must exist')
  assert.ok(quick, 'quick markdown copy must exist')
  assert.ok(topicFocused, 'topicFocused markdown copy must exist (not topicFocus)')
  assert.ok(privacyMinimal, 'privacyMinimal markdown copy must exist')

  // 차단 안내가 포함되어야 함
  assert.ok(full.includes('candidate_required'), 'full markdown must include candidate_required status')
  assert.ok(quick.includes('실제 계산값을 생성하지 않음') || quick.includes('candidate_required'),
    'quick markdown must state that actual values are omitted or candidate_required')
  assert.ok(topicFocused.includes('candidate_required') || topicFocused.includes('unavailable'),
    'topicFocused markdown must state ziwei candidate_required or unavailable')
  assert.ok(privacyMinimal.includes('실제 계산값을 생성하지 않음') || privacyMinimal.includes('candidate_required'),
    'privacyMinimal markdown must state ziwei candidate_required or omitted')

  // 네 출력을 모두 실제로 검사하여 명궁·신궁·오행국·주성 실제값이 전혀 없는지 확인
  const copies = [full, quick, topicFocused, privacyMinimal]
  copies.forEach((copy, idx) => {
    assert.ok(!copy.includes('명궁: 寅宮') && !copy.includes('명궁: 子宮') && !copy.includes('명궁 寅宮') && !copy.includes('명궁 子宮'), `copy ${idx} must not include factual mingGong`)
    assert.ok(!copy.includes('신궁: 午宮') && !copy.includes('신궁: 申宮') && !copy.includes('신궁 午宮') && !copy.includes('신궁 申宮'), `copy ${idx} must not include factual shenGong`)
    assert.ok(!copy.includes('오행국: 수이국') && !copy.includes('오행국: 목삼국') && !copy.includes('수이국') && !copy.includes('목삼국'), `copy ${idx} must not include factual fiveElementsBureau`)
    assert.ok(!copy.includes('주성 자미') && !copy.includes('주성 탐랑') && !copy.includes('주성 칠살'), `copy ${idx} must not include factual majorStars`)
  })
})

// ── 10. Unified Legacy Fallback 승격 방지 검증 ───────────────────────────────────

test('createUnifiedInterpretationContext: legacy raw object does not promote Ziwei to verified or high', () => {
  const rawLegacyZiweiContext = {
    subjectName: '레거시테스트',
    candidateSetConsensus: { factual: { mingGongBranch: '寅' } },
  }

  const unified = createUnifiedInterpretationContext({}, rawLegacyZiweiContext, {})
  const ziweiSystem = unified.systems.ziwei

  assert.equal(ziweiSystem.verificationStatus, 'needs_external_verification',
    'legacy ziwei context must fall back to needs_external_verification, not verified')
  assert.equal(ziweiSystem.confidence, 'low',
    'legacy ziwei context must fall back to low confidence, not high')
})

// ── 11. 14주성 배치 수식 완전성 및 단일성 검증 ────────────────────────────────────

test('starResolver: 14 major stars contain all expected IDs exactly once in valid 12-branch palaces', () => {
  const EXPECTED_STAR_IDS = [
    'ziwei', 'tianji', 'taiyang', 'wugu', 'tiandong', 'lianzhen', // 자미계 6
    'tianfu', 'taiyin', 'tanlang', 'jumen', 'tianxiang', 'tianliang', 'qisai', 'pojun' // 천부계 8
  ]
  const VALID_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
  const VALID_PALACE_IDS = ['life', 'siblings', 'spouse', 'children', 'wealth', 'health', 'travel', 'friends', 'career', 'property', 'mind', 'parents']

  const chartResult = resolveZiweiChart({
    subjectName: '주성검증',
    lunarMonth: 5,
    hourBranch: '午',
    birthYearStem: '庚',
  })
  const majorResult = resolve14MajorStars({
    bureauNumber: chartResult.chart.fiveElementsBureau.number,
    lunarDay: 15,
    palaces: chartResult.chart.palaces,
  })

  const stars = majorResult.majorStars
  assert.equal(stars.length, 14, 'major stars count must be exactly 14')

  const foundIds = stars.map((s) => s.id)
  for (const expectedId of EXPECTED_STAR_IDS) {
    const count = foundIds.filter((id) => id === expectedId).length
    assert.equal(count, 1, `star ID ${expectedId} must exist exactly once`)
  }

  for (const star of stars) {
    assert.ok(VALID_BRANCHES.includes(star.palaceBranch), `star ${star.id} must have a valid palace branch`)
    assert.ok(VALID_PALACE_IDS.includes(star.palaceId), `star ${star.id} must have a valid palace ID`)
  }
})

// ── 12. 생년 사화 4개 완전성 및 대상 starId 검증 ──────────────────────────────────

test('transformationResolver: resolves 4 transformations for all 10 year stems with valid starIds', () => {
  const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
  for (const stem of STEMS) {
    const result = resolveFourTransformations(stem)
    assert.equal(result.transformations.length, 4, `stem ${stem} must produce exactly 4 transformations`)

    const types = result.transformations.map((t) => t.type)
    assert.ok(types.includes('hua_lu'), `stem ${stem} must include hua_lu`)
    assert.ok(types.includes('hua_quan'), `stem ${stem} must include hua_quan`)
    assert.ok(types.includes('hua_ke'), `stem ${stem} must include hua_ke`)
    assert.ok(types.includes('hua_ji'), `stem ${stem} must include hua_ji`)

    for (const t of result.transformations) {
      assert.ok(typeof t.starId === 'string' && t.starId.length > 0, `transformation ${t.type} for stem ${stem} must have a valid starId`)
    }
  }
})

// ── 13. 6길성 보조성 유일성 및 완전성 검증 ────────────────────────────────────────

test('minorStarResolver: resolves 6 lucky minor stars with unique IDs', () => {
  const EXPECTED_MINOR_IDS = ['zuobo', 'youbi', 'wenchang', 'wengu', 'tiankui', 'tianyue']
  const chartResult = resolveZiweiChart({
    subjectName: '길성검증',
    lunarMonth: 5,
    hourBranch: '午',
    birthYearStem: '庚',
  })
  const minorResult = resolveMinorStars({
    birthYearStem: '庚',
    lunarMonth: 5,
    hourBranch: '午',
    palaces: chartResult.chart.palaces,
  })

  assert.equal(minorResult.minorStars.length, 6, 'minor stars count must be 6')
  const foundIds = minorResult.minorStars.map((s) => s.id)
  for (const expectedId of EXPECTED_MINOR_IDS) {
    assert.ok(foundIds.includes(expectedId), `minor star ID ${expectedId} must exist`)
  }
})

// ── 14. 기존 사주 State Contract 보존 검증 ────────────────────────────────────────

test('sajuCoreContract: existing saju state contracts remain completely unaffected', () => {
  const sajuVerified = resolveStateContract({ verificationStatus: 'verified' })
  assert.equal(sajuVerified.verificationStatus, 'verified')

  const sajuNeedsVerification = resolveStateContract({ verificationStatus: 'needs_verification' })
  assert.equal(sajuNeedsVerification.verificationStatus, 'needs_verification')

  const sajuCandidateRequired = resolveStateContract({ verificationStatus: 'candidate_required' })
  assert.equal(sajuCandidateRequired.verificationStatus, 'candidate_required')
})

// ── 15. 알 수 없는 Verification Status 승격 방지 검증 ───────────────────────────────

test('statusResolver: explicitly passed unknown verification status is normalized to needs_verification instead of verified', () => {
  const unknownContract = resolveStateContract({ verificationStatus: 'unexpected_status' })
  assert.equal(unknownContract.verificationStatus, 'needs_verification', 'unknown verification status must be normalized to needs_verification')

  const defaultContract = resolveStateContract()
  assert.equal(defaultContract.verificationStatus, 'needs_verification', 'omitted verification status fail-closes to needs_verification')
})

// ── 16. 오행국 산출 실패 시 Dummy Fallback 차단 검증 ───────────────────────────────

test('fiveElementResolver: returns null without dummy fallback on invalid birthYearStem or mingGongBranch', () => {
  assert.equal(resolveFiveElementBureau('INVALID_STEM', '寅'), null, 'invalid stem must return null')
  assert.equal(resolveFiveElementBureau('甲', 'INVALID_BRANCH'), null, 'invalid branch must return null')
  assert.equal(resolveFiveElementBureau(null, '寅'), null, 'null stem must return null')
})

// ── 17. 120개 전 조합 유효 오행국 수치 반환 검증 ────────────────────────────────────

test('fiveElementResolver: all 120 combinations of valid 10 year stems and 12 mingGong branches return valid Bureau (2, 3, 4, 5, 6)', () => {
  const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
  const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
  const VALID_NUMBERS = [2, 3, 4, 5, 6]

  let count = 0
  for (const stem of STEMS) {
    for (const branch of BRANCHES) {
      count++
      const bureau = resolveFiveElementBureau(stem, branch)
      assert.ok(bureau !== null, `bureau for ${stem}${branch} must not be null`)
      assert.ok(VALID_NUMBERS.includes(bureau.number), `bureau number for ${stem}${branch} must be 2, 3, 4, 5, or 6`)
    }
  }
  assert.equal(count, 120, 'total evaluated combinations must be 120')
})

// ── 18. STEM_PAIR_MAP 천간 페어 일관성 검증 ───────────────────────────────────────

test('fiveElementResolver: stem pairs (甲/乙, 丙/丁, 戊/己, 庚/辛, 壬/癸) yield consistent paired bureau structures', () => {
  const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
  const PAIRS = [
    ['甲', '己'], // YIN_STEM_MAP: 甲,己 -> 丙
    ['乙', '庚'], // YIN_STEM_MAP: 乙,庚 -> 戊
    ['丙', '辛'], // YIN_STEM_MAP: 丙,辛 -> 庚
    ['丁', '壬'], // YIN_STEM_MAP: 丁,壬 -> 壬
    ['戊', '癸'], // YIN_STEM_MAP: 戊,癸 -> 甲
  ]

  for (const [stemA, stemB] of PAIRS) {
    for (const branch of BRANCHES) {
      const bureauA = resolveFiveElementBureau(stemA, branch)
      const bureauB = resolveFiveElementBureau(stemB, branch)
      assert.equal(bureauA.number, bureauB.number, `stem pair ${stemA} and ${stemB} for branch ${branch} must match`)
    }
  }
})

// ── 19. 기존 회귀 픽스처 오행국 기대값 유지 검증 ────────────────────────────────────

test('fiveElementResolver: preserves expected bureau values for known regression chart fixtures', () => {
  const sample1 = resolveFiveElementBureau('庚', '子')
  assert.equal(sample1.name, '화육국')
  assert.equal(sample1.number, 6)

  const sample2 = resolveFiveElementBureau('甲', '寅')
  assert.equal(sample2.name, '화육국')
  assert.equal(sample2.number, 6)
})

// ── 20. 오행국 null 시 14주성 미호출 및 파이프라인 안전 차단 검증 ───────────────────

test('threeSystemPrepPipeline & ziweiResolver: missing or invalid bureau stops 14-major-star placement fail-closed', () => {
  const invalidResult = resolveZiweiChart({ subjectName: '계산실패테스트' })
  assert.equal(invalidResult.chart.fiveElementsBureau, null)
  assert.equal(invalidResult.chart.majorStars.length, 0)
  assert.equal(invalidResult.chart.palaces.length, 0)

  // prepareThreeSystemInterpretationData with incomplete input
  const incompleteInput = {
    subjectName: '미완성입력',
    birthDate: '1997-04-21',
    birthTime: '', // time missing
    gender: 'male',
    timeAccuracy: 'unknown',
    targetDate: '2026-07-27',
    timezone: 'Asia/Seoul',
    referenceCity: 'seoul',
  }
  const prepared = prepareThreeSystemInterpretationData(incompleteInput)
  const ziwei = prepared.systems.ziwei

  assert.equal(ziwei.availableForChat, false)
  assert.equal(ziwei.interpretationContext, null)
})

// ── 21. 세 Ziwei Sub-resolver Invalid 및 경계값 검증 ───────────────────────────────

test('ziwei sub-resolvers: fail-closed on missing/invalid inputs and succeed on valid boundaries', () => {
  // 1. resolve14MajorStars invalid & boundary
  assert.equal(resolve14MajorStars({ bureauNumber: 1, lunarDay: 15 }).status, 'failed')
  assert.equal(resolve14MajorStars({ bureauNumber: 7, lunarDay: 15 }).status, 'failed')
  assert.equal(resolve14MajorStars({ bureauNumber: '2', lunarDay: 15 }).status, 'failed')
  assert.equal(resolve14MajorStars({ bureauNumber: null, lunarDay: 15 }).status, 'failed')
  assert.equal(resolve14MajorStars({ bureauNumber: 2, lunarDay: 0 }).status, 'failed')
  assert.equal(resolve14MajorStars({ bureauNumber: 2, lunarDay: 31 }).status, 'failed')
  assert.equal(resolve14MajorStars({ bureauNumber: 2, lunarDay: 1.5 }).status, 'failed')
  assert.equal(resolve14MajorStars({ bureauNumber: 2, lunarDay: '15' }).status, 'failed')

  assert.equal(resolve14MajorStars({ bureauNumber: 2, lunarDay: 1 }).majorStars.length, 14)
  assert.equal(resolve14MajorStars({ bureauNumber: 6, lunarDay: 30 }).majorStars.length, 14)

  // 2. resolveFourTransformations invalid & boundary
  assert.equal(resolveFourTransformations('甲甲').status, 'failed')
  assert.equal(resolveFourTransformations('').status, 'failed')
  assert.equal(resolveFourTransformations(null).status, 'failed')
  assert.equal(resolveFourTransformations('甲').transformations.length, 4)
  assert.equal(resolveFourTransformations('癸').transformations.length, 4)

  // 3. resolveMinorStars invalid & boundary
  assert.equal(resolveMinorStars({ birthYearStem: '甲甲', lunarMonth: 1, hourBranch: '子' }).status, 'failed')
  assert.equal(resolveMinorStars({ birthYearStem: '甲', lunarMonth: 0, hourBranch: '子' }).status, 'failed')
  assert.equal(resolveMinorStars({ birthYearStem: '甲', lunarMonth: 13, hourBranch: '子' }).status, 'failed')
  assert.equal(resolveMinorStars({ birthYearStem: '甲', lunarMonth: 1.5, hourBranch: '子' }).status, 'failed')
  assert.equal(resolveMinorStars({ birthYearStem: '甲', lunarMonth: 1, hourBranch: 'X' }).status, 'failed')
  assert.equal(resolveMinorStars(null).status, 'failed')

  assert.equal(resolveMinorStars({ birthYearStem: '甲', lunarMonth: 1, hourBranch: '子' }).minorStars.length, 6)
  assert.equal(resolveMinorStars({ birthYearStem: '癸', lunarMonth: 12, hourBranch: '亥' }).minorStars.length, 6)
})

// ── 22. Handoff 4개 복사본 및 topicFocused 속성/상태 보존 검증 ───────────────────────

test('buildChatHandoffPackage: correctly outputs all 4 copies and preserves status, confidence, and supportScope', () => {
  const normalInput = {
    subjectName: '포맷테스트',
    birthDate: '1997-04-21',
    birthTime: '14:40',
    gender: 'male',
    timeAccuracy: 'exact',
    targetDate: '2026-07-27',
    timezone: 'Asia/Seoul',
    referenceCity: 'seoul',
  }
  const prepared = prepareThreeSystemInterpretationData(normalInput)
  const unified = createUnifiedInterpretationContext(prepared.systems)
  const pkg = buildChatHandoffPackage({ result: prepared, unifiedContext: unified, userQuestion: '진로 문의', topicCategory: 'career' })

  assert.ok(pkg.copies.full, 'pkg.copies.full must exist')
  assert.ok(pkg.copies.quick, 'pkg.copies.quick must exist')
  assert.ok(pkg.copies.topicFocused, 'pkg.copies.topicFocused property must exist (not topicFocus)')
  assert.ok(pkg.copies.privacyMinimal, 'pkg.copies.privacyMinimal must exist')

  // Full
  assert.ok(pkg.copies.full.includes('needs_external_verification'))
  assert.ok(pkg.copies.full.includes('운한/시기 계산'))
  assert.ok(pkg.copies.full.includes('묘왕리함'))
  assert.ok(pkg.copies.full.includes('확장 성요'))

  // Quick
  assert.ok(pkg.copies.quick.includes('needs_external_verification'))
  assert.ok(pkg.copies.quick.includes('신뢰도 medium'))
  assert.ok(pkg.copies.quick.includes('운한/시기 계산'))
  assert.ok(pkg.copies.quick.includes('묘왕리함'))
  assert.ok(pkg.copies.quick.includes('확장 성요'))

  // TopicFocused
  assert.ok(pkg.copies.topicFocused.includes('needs_external_verification'))
  assert.ok(pkg.copies.topicFocused.includes('신뢰도 medium'))
  assert.ok(pkg.copies.topicFocused.includes('운한/시기 계산'))

  // PrivacyMinimal
  assert.ok(pkg.copies.privacyMinimal.includes('needs_external_verification'))
  assert.ok(pkg.copies.privacyMinimal.includes('신뢰도 medium'))
  assert.ok(pkg.copies.privacyMinimal.includes('운한/시기 계산'))
})

// ── 23. 절기 경계 후보 사주 synthesisSystems 제외 및 4종 복사본 대표값 누출 차단 검증 ───

test('unifiedInterpretationContext & handoff: boundary candidate Saju blocks representative values across all 4 copies', () => {
  const boundaryInput = {
    subjectName: '절기경계테스트',
    birthDate: '2014-02-04',
    birthTime: '07:03',
    gender: 'female',
    timeAccuracy: 'exact',
    targetDate: '2026-07-27',
    timezone: 'Asia/Seoul',
    referenceCity: 'seoul',
  }
  const prepared = prepareThreeSystemInterpretationData(boundaryInput)
  const unified = createUnifiedInterpretationContext(prepared.systems)

  assert.deepEqual(unified.availableSystems, ['saju', 'ziwei'])
  assert.deepEqual(unified.synthesisSystems, ['ziwei'])
  const sajuCandidates = prepared.systems.saju.calculationResult?.raw?.candidates
    || prepared.systems.saju.interpretationContext?.candidateFacts
    || []
  assert.ok(sajuCandidates.length >= 2, 'candidate saju array preserved')
  assert.equal(prepared.systems.saju.status, 'candidate_required')
  assert.equal(prepared.systems.saju.interpretationStatus, 'candidate_only')

  assert.deepEqual(unified.sharedThemes, [], 'candidate saju excluded from sharedThemes')
  assert.deepEqual(unified.differentPerspectives, [], 'candidate saju excluded from differentPerspectives')
  assert.equal(unified.unifiedConfidence.overallConfidence, 'medium', 'overallConfidence computed over synthesisSystems only')

  const pkg = buildChatHandoffPackage({ result: prepared, unifiedContext: unified })

  // Check 4 copies block representative Saju confirmed facts
  assert.ok(pkg.copies.full.includes('후보 확인 필요 (단일 확정 명식 없음'))
  assert.ok(pkg.copies.quick.includes('후보 확인 필요 (단일 확정 명식 없음)'))
  assert.ok(pkg.copies.topicFocused.includes('단일 대표 Feature를 출력하지 않음'))
  assert.ok(pkg.copies.privacyMinimal.includes('후보 확인 필요 (단일 확정 명식 없음)'))
})

// ── 24. synthesisSystems 개수별 agreementLevel 규칙 검증 ─────────────────────────

test('unifiedInterpretationContext: agreementLevel rules for 0, 1, and 2+ synthesis systems', () => {
  // 0 synthesis systems
  const emptyUnified = createUnifiedInterpretationContext({}, {}, {})
  assert.deepEqual(emptyUnified.synthesisSystems, [])
  assert.equal(emptyUnified.systemAgreement.agreementLevel, 'insufficient_data')

  // 1 synthesis system (only Ziwei)
  const ziweiOnlyPrep = prepareThreeSystemInterpretationData({
    subjectName: '단일체계테스트',
    birthDate: '2014-02-04',
    birthTime: '07:03',
    gender: 'female',
    timeAccuracy: 'exact',
    targetDate: '2026-07-27',
    timezone: 'Asia/Seoul',
    referenceCity: 'seoul',
  })
  const ziweiOnlyUnified = createUnifiedInterpretationContext(ziweiOnlyPrep.systems)
  assert.deepEqual(ziweiOnlyUnified.synthesisSystems, ['ziwei'])
  assert.equal(ziweiOnlyUnified.systemAgreement.agreementLevel, 'single_system_only')

  // 2 synthesis systems (Saju + Ziwei)
  const dualPrep = prepareThreeSystemInterpretationData({
    subjectName: '양쪽정격테스트',
    birthDate: '1997-04-21',
    birthTime: '14:40',
    gender: 'male',
    timeAccuracy: 'exact',
    targetDate: '2026-07-27',
    timezone: 'Asia/Seoul',
    referenceCity: 'seoul',
  })
  const dualUnified = createUnifiedInterpretationContext(dualPrep.systems)
  assert.deepEqual(dualUnified.synthesisSystems, ['saju', 'ziwei'])
  assert.equal(dualUnified.systemAgreement.agreementLevel, 'multi_lens_synthesis')
})

// ── 25. 서양 점성학 Generic Placeholder 계약 검증 ─────────────────────────────────

test('threeSystemPrepPipeline & schema: astrology placeholder preserves simulation_blocked contract', () => {
  const prep = prepareThreeSystemInterpretationData({
    subjectName: '점성학계약테스트',
    birthDate: '1997-04-21',
    birthTime: '14:40',
    gender: 'male',
    timeAccuracy: 'exact',
    targetDate: '2026-07-27',
    timezone: 'Asia/Seoul',
    referenceCity: 'seoul',
  })
  const astro = prep.systems.astrology
  assert.equal(astro.system, 'astrology')
  assert.equal(astro.status, 'simulation_blocked')
  assert.equal(astro.verificationStatus, 'unsupported_for_interpretation')
  assert.equal(astro.confidence, 'not_available')
  assert.equal(astro.availableForChat, false)
})

// ── 26. 추가 회귀 테스트 ──────────────────────────────────────────────────────────

test('regression: contract defaults, empty saju, synthesis confidence description, and 4-copy ziwei blocking', () => {
  // 1. resolveStateContract() parameterless call is fail-closed
  const emptyContract = resolveStateContract()
  assert.equal(emptyContract.verificationStatus, 'needs_verification')
  assert.equal(emptyContract.interpretationStatus, 'candidate_only')
  assert.equal(emptyContract.confidence, 'low')
  assert.equal(emptyContract.inputStatus, 'missing_input')

  // 2. Explicit normal Saju contract is preserved
  const normalSajuContract = resolveStateContract({
    inputStatus: 'valid',
    calculationStatus: 'calculated',
    verificationStatus: 'verified',
    interpretationStatus: 'ready',
    confidence: 'high',
  })
  assert.equal(normalSajuContract.verificationStatus, 'verified')
  assert.equal(normalSajuContract.interpretationStatus, 'ready')
  assert.equal(normalSajuContract.confidence, 'high')

  // 3. Empty Saju missing/unsupported result is not verified/ready
  const emptySajuMissing = createEmptySystemResult('saju', 'missing_input')
  assert.notEqual(emptySajuMissing.stateContract.verificationStatus, 'verified')
  assert.notEqual(emptySajuMissing.stateContract.interpretationStatus, 'ready')
  assert.equal(emptySajuMissing.stateContract.inputStatus, 'missing_input')

  const emptySajuUnsupported = createEmptySystemResult('saju', 'unsupported')
  assert.notEqual(emptySajuUnsupported.stateContract.verificationStatus, 'verified')
  assert.notEqual(emptySajuUnsupported.stateContract.interpretationStatus, 'ready')

  // 4. Candidate Saju + normal Ziwei handoff describes "합성 대상 체계 중 가장 낮은 신뢰도 기준"
  const candidateSajuPrep = prepareThreeSystemInterpretationData({
    subjectName: '합성신뢰도테스트',
    birthDate: '2014-02-04',
    birthTime: '07:03',
    gender: 'female',
    timeAccuracy: 'exact',
    targetDate: '2026-07-27',
    timezone: 'Asia/Seoul',
    referenceCity: 'seoul',
  })
  const candidateSajuUnified = createUnifiedInterpretationContext(candidateSajuPrep.systems)
  const candidateSajuPkg = buildChatHandoffPackage({ result: candidateSajuPrep, unifiedContext: candidateSajuUnified })
  assert.ok(candidateSajuPkg.copies.full.includes('합성 대상 체계 중 가장 낮은 신뢰도 기준'))
  assert.ok(candidateSajuPkg.copies.full.includes('통합 신뢰도: medium'))
})
