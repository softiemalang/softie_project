/**
 * Self-Contained Deterministic Base v0
 *
 * Canonical machine-readable deterministic foundation for Saju, Ziwei,
 * and Western Astrology designed for single-file attachment in ChatGPT/Gemini.
 *
 * Core Invariants:
 * 1. Canonical source of truth is structured JSON.
 * 2. Strictly limited to:
 *    - Normalized calculation inputs (input)
 *    - Deterministic calculation outputs (fact)
 *    - RuleSet / source provenance (source)
 *    - Machine-readable support & unknown boundaries (unknown)
 * 3. 0% SYNTHESIS, 0% trait/personality connections, 0% chat coaching/seeds,
 *    0% question-dependent filtering.
 * 4. Western Astrology strictly preserved as inactive research artifact
 *    (isInactiveResearch: true, activation.serviceEligibility: "blocked", usable: false).
 */

import {
  GANYEOJIDONG_DAY_PILLARS,
  formatSajuPillars,
} from './handoffFormatters.js'
import { normalizeSajuPolicyContractForConsumer } from '../saju/engine/sajuPolicyContract.js'
import { formatSajuPolicyBoundary } from '../saju/policyDisplay.js'
import { angularDistanceDegrees } from '../astrology/astrologyAngles.js'
import { MAJOR_ASPECTS, ORB_BOUNDARY_THRESHOLD_DEGREES } from '../astrology/astrologyAspects.js'
import { calculateWholeSignHouse } from '../astrology/astrologyHouses.js'
import { PERSONAL_DISTRIBUTION_BODIES, SUPPORTED_DISTRIBUTION_BODIES } from '../astrology/astrologyDistribution.js'
import { SIGN_METADATA } from '../astrology/astrologyRulers.js'

export const FOUNDATION_VERSION = 'deterministic-base-v0'
export const CANONICAL_SCHEMA_VERSION = 'tri-system-deterministic-base-v0'

export const SYSTEM_DISPLAY_NAMES = Object.freeze({
  saju: '사주 (Four Pillars)',
  ziwei: '자미두수 (Ziwei Dou Shu)',
  astrology: '서양 점성학 (Western Astrology)',
})

/**
 * Machine-readable Fact Provenance Groundings for Saju Stable FACTs.
 * Distinguishes classical textual references, modern astronomical methods,
 * implementation policies, and conflicting lineages without assigning
 * semantic authority.
 */
export const SAJU_FACT_GROUNDINGS = Object.freeze([
  {
    factKey: 'timing.daYun.direction',
    factLabel: '대운 순역 방향 (양남음녀 순행, 음남양녀 역행)',
    evidenceType: 'primary_textual_witness',
    authorityScope: 'classical_textual_reference_unverified',
    classicalWitness: '《삼명통회》 권2(論大運): 「陽男陰女順行，陰男陽女逆行」, 《연해자평》 권1(起運氣例)',
    modernPolicy: null,
    distinctionNote: '해당 문헌의 규칙 문구를 참조해 기록한 항목이며, 특정 판본·전승·의미의 독립 검증은 별도임',
  },
  {
    factKey: 'timing.daYun.startAge.conversionRate',
    factLabel: '대운수 기운 환산 비율 (3일=1년, 1일=4개월, 1시=10일, 12분=1일)',
    evidenceType: 'primary_textual_witness',
    authorityScope: 'classical_textual_reference_unverified',
    classicalWitness: '《삼명통회》 권2(論大運): 「三日為一歲，一日為四箇月，一時為十日」, 《낙록자소식부》: 「折除乃三日為年」',
    modernPolicy: null,
    distinctionNote: '해당 문헌의 환산 문구를 참조해 기록한 비율이며, 특정 판본·전승·적용 범위의 독립 검증은 별도임',
  },
  {
    factKey: 'timing.daYun.firstStartDate.calendarMapping',
    factLabel: '대운 시작일 그레고리력 날짜 매핑 및 소수점 나이',
    evidenceType: 'implementation_policy',
    authorityScope: 'modern_calendar_arithmetic_policy',
    classicalWitness: '문헌상 정수 나이/달수 단위의 개략 기산만 언급되며, 정확한 판본·locator는 이 패키지에서 확정하지 않음',
    modernPolicy: 'source-ratio-rounded-360-30-calendar (1년 360일·1개월 30일 상징 분해 후 그레고리력 clamping 가산)',
    distinctionNote: '문헌 참조 범위와 그레고리력 날짜·소수점 나이 환산 정책을 분리 기록하며, 후자는 엔진의 현대 역법 접합 정책임',
  },
  {
    factKey: 'pillars.month.fiveTigers',
    factLabel: '월두법 (오호둔법 五虎遁을 이용한 월간 도출)',
    evidenceType: 'primary_textual_witness',
    authorityScope: 'classical_textual_reference_unverified',
    classicalWitness: '《삼명통회》 권2(五虎遁): 「甲己之年，正月起丙寅」, 《연해자평》',
    modernPolicy: null,
    distinctionNote: '연간(年干)에 따라 인월(정월)의 천간을 정하고 순차 배속하는 문헌 참조 규칙이며, 특정 판본·전승의 독립 검증은 별도임',
  },
  {
    factKey: 'pillars.hour.fiveRats',
    factLabel: '시두법 (오서둔법 五鼠遁을 이용한 시간 도출)',
    evidenceType: 'primary_textual_witness',
    authorityScope: 'classical_textual_reference_unverified',
    classicalWitness: '《삼명통회》 권2(五鼠遁): 「甲己起甲子」, 《연해자평》',
    modernPolicy: null,
    distinctionNote: '일간(日干)에 따라 자시 천간을 정하고 순차 배속하는 문헌 참조 규칙이며, 특정 판본·전승의 독립 검증은 별도임',
  },
  {
    factKey: 'pillars.year.solarBoundary',
    factLabel: '연주 세수(歲首) 기준 (입춘 분기)',
    evidenceType: 'modern_astronomical_method',
    authorityScope: 'classical_principle_modern_astronomical_computation',
    classicalWitness: '《연해자평》(月令節氣), 《삼명통회》(論節氣)에 입춘을 연도의 시작으로 삼는 원칙이 언급되는 것으로 참조되며, 정확한 판본·locator는 이 패키지에서 확정하지 않음',
    modernPolicy: 'Jean Meeus 태양 황경 315° 시황경 정기법 수치 적분 (li-chun-apparent-solar-315)',
    distinctionNote: '입춘 기준에 관한 문헌 참조와 분·초 단위 황경 계산 정책을 분리 기록하며, 후자는 현대 천문학적 구현임',
  },
  {
    factKey: 'pillars.month.solarBoundary',
    factLabel: '월주 지지 12절월 분기 (12 節 절입시)',
    evidenceType: 'modern_astronomical_method',
    authorityScope: 'classical_principle_modern_astronomical_computation',
    classicalWitness: '《삼명통회》, 《연해자평》에 12절기로 인월부터 축월까지 월건을 배속하는 원칙이 언급되는 것으로 참조되며, 정확한 판본·locator는 이 패키지에서 확정하지 않음',
    modernPolicy: 'Jean Meeus 황경 30° 간격 정기법 12절기 절입시 계산 (jie-solar-longitude-30-degree)',
    distinctionNote: '12절 기준에 관한 문헌 참조와 중기(中氣)를 배제하는 현대 정기법 수치 계산을 분리 기록함',
  },
  {
    factKey: 'solarTime.apparentSolarTime',
    factLabel: '진태양시 보정 (KST 135°E 대비 경도차 -32.12분 + NOAA 균시차 EoT)',
    evidenceType: 'modern_astronomical_method',
    authorityScope: 'astronomy_method_not_classical_saju_mandate',
    classicalWitness: '고대 해시계(규표/일구) 자연 시각 환경을 가리키는 설명만 참조되며, 경도 환산식의 정확한 판본·locator는 이 패키지에서 확정하지 않음',
    modernPolicy: '서울(126.97°E) 경도 편차 4분/도 환산 및 NOAA Spencer(1971) fractional-year equation of time 합산 (local-apparent-solar-kst)',
    distinctionNote: '문헌 참조 범위와 표준시·균시차를 현대 시계 시간에 접합하는 천문학적 보정 정책을 분리 기록함',
  },
  {
    factKey: 'pillars.day.boundary',
    factLabel: '자시 일주 분리 (00:00 자정 롤오버, 조자시/야자시 구분)',
    evidenceType: 'conflicting_lineage',
    authorityScope: 'unresolved_classical_lineage_arbitrated_by_engine_policy',
    classicalWitness: '《신당서》 권25(起于子半)의 자반 구분과 《연해자평》/원수산(23:00 자초설) 등 서로 다른 선택이 보고된 것으로 참조되며, 정확한 판본·locator는 이 패키지에서 확정하지 않음',
    modernPolicy: 'solar-midnight-split-zi (진태양시 00:00 기준 일주 분리 정책을 엔진 기본값으로 채택)',
    distinctionNote: '서로 다른 문헌·학파 선택과 엔진 정책을 분리 기록하며, 엔진은 명시적 구현 정책으로 선택함',
  },
  {
    factKey: 'solarTerms.uncertaintyWindow',
    factLabel: '절기 경계 오차 불확실성 윈도우 (±20분)',
    evidenceType: 'implementation_policy',
    authorityScope: 'numerical_precision_margin_policy',
    classicalWitness: null,
    modernPolicy: 'SOLAR_TERM_UNCERTAINTY_MINUTES = 20 (Meeus 간이식과 공인 정밀 역표 KASI/HKO 간 최대 편차 ≤15분을 방어하는 계산 안전 마진)',
    distinctionNote: '천문 계산 정밀도 한계를 관리하기 위한 순수 소프트웨어 공학적 방어 정책',
  },
  {
    factKey: 'elementsAndTenGods',
    factLabel: '오행 생극제화 및 일간 기준 십성(十神) 표출',
    evidenceType: 'primary_textual_witness',
    authorityScope: 'classical_system_reference_unverified',
    classicalWitness: '《연해자평》(十神), 《삼명통회》(干支五行論)',
    modernPolicy: null,
    distinctionNote: '일간을 기준으로 타 간지와의 생극 관계를 10가지 신(神)으로 분류하는 문헌 참조 체계이며, 특정 판본·전승의 권위는 확정하지 않음',
  },
  {
    factKey: 'branchRelations',
    factLabel: '지지 삼합·육합·충·형·파·해',
    evidenceType: 'primary_textual_witness',
    authorityScope: 'classical_system_reference_unverified',
    classicalWitness: '《자평진전》(論支中刑沖會合), 《삼명통회》',
    modernPolicy: null,
    distinctionNote: '지지 방합/삼합/육합 및 형충파해 상호작용을 기록한 문헌 참조 체계이며, 특정 판본·전승의 권위는 확정하지 않음',
  },
])

/**
 * Extract Saju Deterministic Base
 */
export function extractSajuFoundation(sajuInput = {}, options = {}) {
  const system = sajuInput.systems?.saju || sajuInput
  const calcResult = system.calculationResult || sajuInput.systems?.saju || sajuInput
  const raw = calcResult?.raw || system.raw || {}
  const context = system.interpretationContext || system.context || sajuInput.interpretationContext || {}
  const policyContract = normalizeSajuPolicyContractForConsumer(
    system.policyContract
      ?? calcResult?.policyContract
      ?? raw.policyContract
      ?? context.policyContract,
  )

  const isCandidate = system.verificationStatus === 'candidate_required' || system.interpretationStatus === 'candidate_only'

  // 1. INPUT (정규화된 계산 입력 기초)
  const norm = sajuInput.input?.normalized
    || sajuInput.input
    || calcResult?.input?.normalized
    || calcResult?.input
    || system.input
    || options.input
    || {}
  const input = {
    subjectName: norm.subjectName || sajuInput.subjectName || system.subjectName || null,
    birthDate: norm.birthDate || null,
    birthTime: norm.birthTime || null,
    calendar: norm.calendar || 'solar',
    isLeapMonth: Boolean(norm.isLeapMonth),
    timezone: norm.timezone || 'Asia/Seoul',
    latitude: norm.latitude != null ? String(norm.latitude) : null,
    longitude: norm.longitude != null ? String(norm.longitude) : null,
    timeAccuracy: norm.timeAccuracy || 'exact',
  }

  // 2. FACT (결정론적 계산 사실)
  const pillars = {
    year: raw.pillars?.year?.value || (raw.pillars?.year?.stem && raw.pillars?.year?.branch ? `${raw.pillars.year.stem}${raw.pillars.year.branch}` : null) || context.candidateSetConsensus?.factual?.yearPillar || null,
    month: raw.pillars?.month?.value || (raw.pillars?.month?.stem && raw.pillars?.month?.branch ? `${raw.pillars.month.stem}${raw.pillars.month.branch}` : null) || context.candidateSetConsensus?.factual?.monthPillar || null,
    day: raw.pillars?.day?.value || (raw.pillars?.day?.stem && raw.pillars?.day?.branch ? `${raw.pillars.day.stem}${raw.pillars.day.branch}` : null) || context.candidateSetConsensus?.factual?.dayPillar || null,
    hour: raw.pillars?.hour?.value || (raw.pillars?.hour?.stem && raw.pillars?.hour?.branch ? `${raw.pillars.hour.stem}${raw.pillars.hour.branch}` : null) || context.candidateSetConsensus?.factual?.hourPillar || null,
  }
  const dayMaster = isCandidate
    ? '후보 확인 필요 (단일 확정 불가)'
    : (raw.dayMaster?.stem || context.candidateSetConsensus?.factual?.dayMaster || '후보 확인 필요')

  const dayPillar = pillars.day
  const isGanyeojidong = Boolean(dayPillar && GANYEOJIDONG_DAY_PILLARS.has(dayPillar))

  const facts = {
    pillarsFormatted: isCandidate ? '후보 확인 필요 (단일 확정 명식 없음)' : formatSajuPillars(raw, context),
    pillars,
    dayMaster,
    elementsDistribution: raw.elements?.counts || {},
    tenGodsVisible: raw.tenGods?.visible || {},
    branchRelations: (raw.branchRelations?.items || []).map((item) => ({
      name: item.name || item.type,
      branches: item.branches || [],
      positions: item.positions || [],
    })),
    stemRelations: raw.stemRelations?.items || [],
    isGanyeojidong,
    timing: {
      daYun: raw.timing?.daYun || null,
      seUn: raw.timing?.periods?.year || null,
      wolUn: raw.timing?.periods?.month || null,
      ilJin: raw.timing?.periods?.day || null,
    },
    policyBoundary: formatSajuPolicyBoundary(policyContract),
  }

  // 3. SOURCE (출처, 고서 문헌 서지 전승 및 한계)
  const source = {
    lineageTexts: [
      { title: '연해자평(淵海子平)', focus: '일간 중심(일주론) 주체 설정, 월령 중심 계절 환경 배속, 십성/지장간 구조' },
      { title: '삼명통회(三命通會)', focus: '연월일시 4기둥 시간 구조 및 오행 생극제화 상호작용' },
      { title: '적천수(滴天髓)', focus: '계절과 음양 오행의 득기(得氣) 및 양강·음순의 기세 관점' },
      { title: '자평진전(子平真詮)', focus: '형·충·회·합의 지지 상호작용 및 격국/용신의 구조적 질서' },
      { title: '궁통보감(窮通寶鑑)', focus: '태어난 계절의 조후(한난조습) 균형 관점' },
    ],
    structuralReference: {
      isGanyeojidong,
      dayPillar: dayPillar || null,
      citation: '간여지동 12개 일주 분류 체계 (천명선생 사주천궁 문헌 분류)',
    },
    historicalLimitations: {
      unresolvedEdition: true,
      historicalAuthority: 'insufficient_evidence',
      historicalFact: false,
      note: '고서 판본 전승이 미확정이며 현대 수치 계산 엔진과의 매핑 차이가 존재함',
    },
    factGroundings: SAJU_FACT_GROUNDINGS,
  }

  // 4. UNKNOWN (계산 불확실성 및 지원 상태)
  const exp = raw.experimental || {}
  const unknown = {
    personalValidity: 'not_established',
    isPsychometrics: false,
    experimentalProfiling: {
      status: 'experimental',
      gyeokguk: exp.gyeokguk?.name || (typeof exp.gyeokguk === 'string' ? exp.gyeokguk : 'experimental'),
      shinsal: Array.isArray(exp.shinsal) ? exp.shinsal.map((s) => s.name || s).join(', ') : (typeof exp.shinsal === 'string' ? exp.shinsal : 'experimental'),
      strength: exp.strength?.level || (typeof exp.strength === 'string' ? exp.strength : 'experimental'),
      yongShin: exp.yongShin?.ruleType ? `${exp.yongShin.ruleType}(${exp.yongShin.primaryYongShinElement || ''})` : (typeof exp.yongShin === 'string' ? exp.yongShin : 'experimental'),
    },
    uncertaintyFactors: raw.calculationUncertainty || context.uncertainFactors || [],
    warnings: [
      ...(system.warnings || []),
      ...(calcResult.warnings || []),
    ],
  }

  return {
    domain: 'saju',
    displayName: SYSTEM_DISPLAY_NAMES.saju,
    isInactiveResearch: false,
    activation: {
      isActivated: true,
      status: system.status || 'available',
      reason: null,
    },
    verificationStatus: system.verificationStatus || 'needs_verification',
    confidence: system.confidence || 'medium',
    input,
    fact: facts,
    source,
    unknown,
  }
}

/**
 * Extract Ziwei Deterministic Base
 */
export function extractZiweiFoundation(ziweiInput = {}, options = {}) {
  const system = ziweiInput.systems?.ziwei || ziweiInput
  const calcResult = system.calculationResult || ziweiInput.systems?.ziwei || ziweiInput
  const chart = calcResult?.chart || system.chart || {}
  const context = system.interpretationContext || system.context || {}
  const lunar = system.sourceDerivation?.lunarConversion || calcResult?.input?.calendarBasis || {}
  const scope = system.supportScope || calcResult?.supportScope || {
    timingStatus: 'unsupported',
    brightnessStatus: 'unsupported',
    extendedMinorStarsStatus: 'unsupported',
  }

  const isAvailable = Boolean(system.availableForChat !== false && (chart.palaces || context.palaceContexts))

  // 1. INPUT (음력 변환 및 출생 간지 기초)
  const input = {
    lunarBasis: {
      lunarYear: lunar.lunarYear || calcResult?.input?.calendarBasis?.lunarYear || null,
      lunarMonth: lunar.lunarMonth || calcResult?.input?.lunarMonth || null,
      lunarDay: lunar.lunarDay || calcResult?.input?.calendarBasis?.lunarDay || null,
      isLeapMonth: Boolean(lunar.isLeapMonth),
    },
    stemsBranches: {
      birthYearStem: calcResult?.input?.birthYearStem || null,
      birthYearBranch: calcResult?.input?.birthYearBranch || null,
      hourBranch: calcResult?.input?.hourBranch || null,
    },
  }

  // 2. FACT (결정론적 계산 사실)
  const facts = {
    lunarBasis: input.lunarBasis,
    stemsBranches: input.stemsBranches,
    mingShenGong: {
      mingGongBranch: chart.mingGong?.branch || context.candidateSetConsensus?.factual?.mingGongBranch || null,
      shenGongBranch: chart.shenGong?.branch || context.candidateSetConsensus?.factual?.shenGongBranch || null,
    },
    bureau: {
      name: chart.fiveElementsBureau?.name || context.candidateSetConsensus?.factual?.fiveElementsBureau || null,
      number: chart.fiveElementsBureau?.number || null,
    },
    majorStars: (chart.majorStars || []).map((star) => ({
      id: star.id,
      name: star.name,
      palaceBranch: star.palaceBranch,
      palaceName: star.palaceName,
    })),
    transformations: (chart.transformations || []).map((t) => ({
      name: t.name,
      starId: t.starId,
    })),
    minorStars: (chart.minorStars || []).map((star) => ({
      id: star.id,
      name: star.name,
      palaceBranch: star.palaceBranch,
      palaceName: star.palaceName,
    })),
    palaces: Object.values(context.palaceContexts || {}).map((p) => ({
      palaceId: p.palaceId,
      palaceName: p.palaceName,
      branch: p.branch,
      majorStars: (p.own?.majorStars || []).map((s) => s.name),
      minorStars: (p.own?.minorStars || []).map((s) => s.name),
      transformations: (p.own?.transformations || []).map((t) => t.name),
      opposite: p.relationship?.opposite?.palaceName || null,
      trines: (p.relationship?.trine?.palaces || []).map((t) => t.palaceName),
    })),
  }

  // 3. SOURCE (규칙 버전 및 도출 근거)
  const source = {
    ruleSetProfile: calcResult?.input?.ruleSet?.profileVersion || 'ziwei-fixed-ruleset-experimental-v1',
    ruleSetVersions: calcResult?.calculationMeta?.ruleSetVersions || {},
    sourceDerivation: '사주 계산 결과의 연간·연지·시지 및 로컬 음력 변환 테이블 파생',
  }

  // 4. UNKNOWN (미지원 범위 및 검증 상태)
  const unknown = {
    verificationStatus: system.verificationStatus || 'needs_external_verification',
    supportScope: {
      timingStatus: scope.timingStatus || 'unsupported',
      brightnessStatus: scope.brightnessStatus || 'unsupported',
      extendedMinorStarsStatus: scope.extendedMinorStarsStatus || 'unsupported',
      supported: scope.supported || ['명궁·신궁 지지', '오행국', '14주성', '4대 사화', '6길성'],
    },
    candidates: calcResult?.candidates || {},
    warnings: system.warnings || [],
  }

  return {
    domain: 'ziwei',
    displayName: SYSTEM_DISPLAY_NAMES.ziwei,
    isInactiveResearch: false,
    activation: {
      isActivated: isAvailable,
      status: system.status || (isAvailable ? 'experimental' : 'unavailable'),
      reason: isAvailable ? 'experimental_fixed_ruleset' : 'candidate_required_or_data_missing',
    },
    verificationStatus: system.verificationStatus || 'needs_external_verification',
    confidence: system.confidence || 'medium',
    input,
    fact: facts,
    source,
    unknown,
  }
}

const ASTROLOGY_RULE_SET_VERSION = 'mallang-astrology-rule-core-v0'
const ASTROLOGY_SHA256_RE = /^[a-f0-9]{64}$/
const ASTROLOGY_RUNNER_IDENTITY_RE = /^sha256:[a-f0-9]{64}$/
const ASTROLOGY_BODY_IDS = Object.freeze([...SUPPORTED_DISTRIBUTION_BODIES])
const ASTROLOGY_SIGN_IDS = Object.freeze(Object.keys(SIGN_METADATA))
const ASTROLOGY_POINT_IDS = new Set([...ASTROLOGY_BODY_IDS, 'ascendant', 'midheaven'])
const ASTROLOGY_ASPECT_DEFINITIONS = new Map(MAJOR_ASPECTS.map((definition) => [definition.id, definition]))
const ASTROLOGY_REQUIRED_PROVENANCE_REFS = Object.freeze([
  'providerBundle',
  'rawChart',
  'ruleChart',
  'adapter',
  'readiness',
  'documents.adapter',
  'documents.raw',
  'documents.rule',
  'ephemeris.bsp',
  'ephemeris.evaluatorSelection',
  'runtime.runner',
])
const ASTROLOGY_INTERPRETATION_BOUNDARY = Object.freeze({
  availableForInterpretation: false,
  scope: 'softie_project_internal_interpretation_service_runtime_integration',
  meaning: 'internal_service_runtime_not_connected',
  generalChatDownstream: 'not_prohibited',
  userRequestedInterpretation: 'allowed_with_fact_interpretation_boundary',
})

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function uniqueStrings(values = []) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))].sort()
}

function hasSha256(value) {
  return typeof value === 'string' && ASTROLOGY_SHA256_RE.test(value)
}

function normalizeLongitudeDegrees(value) {
  const normalized = value % 360
  return normalized < 0 ? normalized + 360 : normalized
}

function signIndexFromLongitude(value) {
  return Math.floor(normalizeLongitudeDegrees(value) / 30)
}

function claimSourceRefs(claim) {
  return uniqueStrings([
    ...(Array.isArray(claim?.sourceRefs) ? claim.sourceRefs : []),
    ...(Array.isArray(claim?.value?.sourceRefs) ? claim.value.sourceRefs : []),
  ])
}

function expectedOrbBoundaryStatus(maxOrbDegrees, orbDegrees) {
  const distanceToBoundaryDegrees = Math.abs(maxOrbDegrees - orbDegrees)
  return {
    distanceToBoundaryDegrees,
    status: distanceToBoundaryDegrees <= ORB_BOUNDARY_THRESHOLD_DEGREES ? 'near_orb_boundary' : 'normal',
  }
}

function featureEntriesValid(entries, expectedStatus, requireReason = false) {
  if (!Array.isArray(entries)) return false
  return entries.every((entry) => (
    isObject(entry)
    && typeof entry.feature === 'string'
    && entry.status === expectedStatus
    && (!requireReason || typeof entry.reason === 'string')
    && Array.isArray(entry.sourceRefs)
    && entry.sourceRefs.length > 0
    && entry.sourceRefs.every((ref) => typeof ref === 'string' && ref.length > 0)
  ))
}

function isAstrologyPacketCandidate(value) {
  return isObject(value)
    && value.schemaVersion === 'astrology-interpretation-packet-v1'
    && (
      typeof value.packetStatus === 'string'
      || Array.isArray(value.verifiedBodies)
      || Array.isArray(value.majorAspects)
      || isObject(value.identities)
    )
}

function createAstrologyProvenance(packet) {
  const missing = []
  const identities = packet?.identities || {}
  const sourceDocuments = packet?.provenance?.sourceDocuments || {}
  const sourceRefs = Array.isArray(packet?.provenance?.sourceRefs) ? packet.provenance.sourceRefs : []
  const orchestration = packet?.sourceOrchestration || {}

  if (!packet) missing.push('packet')
  if (packet?.schemaVersion !== 'astrology-interpretation-packet-v1') missing.push('packet.schemaVersion')
  if (typeof packet?.packetVersion !== 'string' || packet.packetVersion.length === 0) missing.push('packet.packetVersion')
  if (packet?.packetStatus !== 'complete') missing.push('packet.packetStatus')
  if (packet?.usable !== false) missing.push('packet.usable')
  if (packet?.inputCompleteness !== 'complete') missing.push('packet.inputCompleteness')
  if (!hasSha256(packet?.packetContentSha256)) missing.push('packet.packetContentSha256')

  for (const field of ['providerBundleSha256', 'rawChartSha256', 'ruleChartSha256', 'adapterSha256', 'readinessSha256']) {
    if (!hasSha256(identities[field])) missing.push(`identities.${field}`)
  }
  if (!hasSha256(identities.kernel?.hash) || identities.kernel?.hashStatus !== 'verified') missing.push('identities.kernel')
  if (!isFiniteNumber(identities.kernel?.coverage?.start) || !isFiniteNumber(identities.kernel?.coverage?.end)) missing.push('identities.kernel.coverage')
  if (identities.runner?.protocolVersion !== 'de405-canonical-v2-protocol-v1') missing.push('identities.runner.protocolVersion')
  if (identities.runner?.protocolStatus !== 'verified') missing.push('identities.runner.protocolStatus')
  if (identities.runner?.identityStatus !== 'verified') missing.push('identities.runner.identityStatus')
  if (!ASTROLOGY_RUNNER_IDENTITY_RE.test(identities.runner?.runnerIdentity || '')) missing.push('identities.runner.runnerIdentity')
  if (identities.evaluator?.status !== 'verified' || identities.evaluator?.evaluator !== 'de405-canonical-v2') missing.push('identities.evaluator')

  if (sourceDocuments.rawSchema !== 'astrology-raw-chart-v1') missing.push('provenance.sourceDocuments.rawSchema')
  if (sourceDocuments.ruleSchema !== 'astrology-rule-chart-v0') missing.push('provenance.sourceDocuments.ruleSchema')
  if (sourceDocuments.rawChartHash !== identities.rawChartSha256) missing.push('provenance.sourceDocuments.rawChartHash')
  if (sourceDocuments.ruleChartHash !== identities.ruleChartSha256) missing.push('provenance.sourceDocuments.ruleChartHash')
  if (orchestration.status !== 'completed') missing.push('sourceOrchestration.status')
  if (orchestration.providerBundleSha256 !== identities.providerBundleSha256) missing.push('sourceOrchestration.providerBundleSha256')
  if (orchestration.rawChartSha256 !== identities.rawChartSha256) missing.push('sourceOrchestration.rawChartSha256')
  if (orchestration.ruleChartSha256 !== identities.ruleChartSha256) missing.push('sourceOrchestration.ruleChartSha256')

  for (const requiredRef of ASTROLOGY_REQUIRED_PROVENANCE_REFS) {
    if (!sourceRefs.includes(requiredRef)) missing.push(`provenance.sourceRefs:${requiredRef}`)
  }

  const activation = packet?.activation || {}
  if (activation.availableForInterpretation !== false) missing.push('activation.availableForInterpretation')
  if (activation.integrationStatus !== 'not_connected') missing.push('activation.integrationStatus')
  if (activation.serviceEligibility !== 'blocked') missing.push('activation.serviceEligibility')
  if (activation.reason !== 'interpretation_packet_not_activated') missing.push('activation.reason')

  const epistemicClassification = packet?.epistemicClassification || {}
  if (epistemicClassification.observedFacts !== 'observed_or_calculated') missing.push('epistemicClassification.observedFacts')
  if (epistemicClassification.ruleCoreOutputs !== 'deterministically_derived') missing.push('epistemicClassification.ruleCoreOutputs')
  if (epistemicClassification.unsupported !== 'unsupported') missing.push('epistemicClassification.unsupported')
  if (epistemicClassification.activation !== 'blocked') missing.push('epistemicClassification.activation')
  if (!featureEntriesValid(packet?.unsupportedFeatures, 'unsupported')) missing.push('unsupportedFeatures')
  if (!featureEntriesValid(packet?.blockedFeatures, 'blocked', true)) missing.push('blockedFeatures')

  return {
    complete: missing.length === 0,
    missing: uniqueStrings(missing),
    packetSchemaVersion: packet?.schemaVersion || null,
    packetVersion: packet?.packetVersion || null,
    packetStatus: packet?.packetStatus || null,
    packetContentSha256: packet?.packetContentSha256 || null,
    sourceDocuments: {
      rawSchema: sourceDocuments.rawSchema || null,
      rawChartHash: sourceDocuments.rawChartHash || null,
      ruleSchema: sourceDocuments.ruleSchema || null,
      ruleChartHash: sourceDocuments.ruleChartHash || null,
    },
    sourceIdentities: {
      providerBundleSha256: identities.providerBundleSha256 || null,
      rawChartSha256: identities.rawChartSha256 || null,
      ruleChartSha256: identities.ruleChartSha256 || null,
      adapterSha256: identities.adapterSha256 || null,
      readinessSha256: identities.readinessSha256 || null,
      kernel: identities.kernel ? {
        hash: identities.kernel.hash || null,
        hashStatus: identities.kernel.hashStatus || null,
        coverage: identities.kernel.coverage || null,
      } : null,
      runner: identities.runner ? {
        protocolVersion: identities.runner.protocolVersion || null,
        protocolStatus: identities.runner.protocolStatus || null,
        identityStatus: identities.runner.identityStatus || null,
        runnerIdentity: identities.runner.runnerIdentity || null,
      } : null,
      evaluator: identities.evaluator ? {
        status: identities.evaluator.status || null,
        evaluator: identities.evaluator.evaluator || null,
      } : null,
    },
    sourceRefs: uniqueStrings(sourceRefs),
  }
}

function formatAstrologyFeatureEntries(entries, expectedStatus) {
  if (!Array.isArray(entries)) return []
  return entries
    .filter((entry) => entry?.status === expectedStatus)
    .map((entry) => ({
      feature: entry.feature,
      status: entry.status,
      ...(entry.reason ? { reason: entry.reason } : {}),
      sourceRefs: uniqueStrings(entry.sourceRefs),
    }))
}

function validateAndBuildAstrologyFacts(packet, provenance) {
  const errors = [...provenance.missing]
  if (!provenance.complete) return { valid: false, errors: uniqueStrings(errors) }

  const bodies = Array.isArray(packet.verifiedBodies) ? packet.verifiedBodies : []
  const angles = packet.verifiedAngles || {}
  const bodyById = new Map()
  const pointClaims = new Map()

  if (bodies.length !== ASTROLOGY_BODY_IDS.length) errors.push('verifiedBodies.count')
  for (const body of bodies) {
    if (!isObject(body) || typeof body.id !== 'string' || bodyById.has(body.id)) {
      errors.push('verifiedBodies.shape')
      continue
    }
    bodyById.set(body.id, body)
    if (!ASTROLOGY_BODY_IDS.includes(body.id)) errors.push(`verifiedBodies.${body.id}.unsupported`)
    if (body.longitudeDegrees?.claimType !== 'body.longitude' || body.longitudeDegrees?.epistemic !== 'observed_or_calculated' || !isFiniteNumber(body.longitudeDegrees?.value)) errors.push(`verifiedBodies.${body.id}.longitudeDegrees`)
    if (body.movingFrameSpeedDegreesPerDay?.claimType !== 'body.moving_frame_motion' || body.movingFrameSpeedDegreesPerDay?.epistemic !== 'observed_or_calculated' || !isFiniteNumber(body.movingFrameSpeedDegreesPerDay?.value)) errors.push(`verifiedBodies.${body.id}.movingFrameSpeedDegreesPerDay`)
    if (body.motion?.claimType !== 'body.moving_frame_motion' || body.motion?.epistemic !== 'deterministically_derived' || typeof body.motion?.value !== 'string') errors.push(`verifiedBodies.${body.id}.motion`)
    if (!body.longitudeDegrees?.sourceRefs?.includes(`rawChart.bodies.${body.id}.longitudeDegrees`)) errors.push(`verifiedBodies.${body.id}.longitudeSourceRef`)
    if (!body.movingFrameSpeedDegreesPerDay?.sourceRefs?.includes(`rawChart.bodies.${body.id}.longitudeSpeedDegreesPerDay`)) errors.push(`verifiedBodies.${body.id}.speedSourceRef`)
    if (!body.motion?.sourceRefs?.includes(`ruleChart.bodies.${body.id}.motionState`)) errors.push(`verifiedBodies.${body.id}.motionSourceRef`)
    pointClaims.set(body.id, {
      longitude: body.longitudeDegrees?.value,
      longitudeRefs: uniqueStrings(body.longitudeDegrees?.sourceRefs),
      sourceRefs: uniqueStrings([
        ...(body.longitudeDegrees?.sourceRefs || []),
        ...(body.movingFrameSpeedDegreesPerDay?.sourceRefs || []),
        ...(body.motion?.sourceRefs || []),
      ]),
    })
  }
  for (const bodyId of ASTROLOGY_BODY_IDS) {
    if (!bodyById.has(bodyId)) errors.push(`verifiedBodies.missing:${bodyId}`)
  }

  for (const pointId of ['ascendant', 'midheaven']) {
    const claim = angles[pointId]
    if (!isObject(claim) || claim.claimType !== 'angle.placement' || claim.epistemic !== 'deterministically_derived' || !isObject(claim.value)) {
      errors.push(`verifiedAngles.${pointId}`)
      continue
    }
    if (!claim.sourceRefs?.includes(`ruleChart.angles.${pointId}`)) errors.push(`verifiedAngles.${pointId}.sourceRef`)
    if (!claim.value.sourceRefs?.includes(`angles.${pointId}.longitudeDegrees`)) errors.push(`verifiedAngles.${pointId}.dependencyRef`)
    if (claim.value.availability !== 'available' || typeof claim.value.signId !== 'string' || !isFiniteNumber(claim.value.signIndex) || !isFiniteNumber(claim.value.longitudeDegrees)) errors.push(`verifiedAngles.${pointId}.value`)
    if (isFiniteNumber(claim.value.longitudeDegrees)) {
      const expectedSignIndex = signIndexFromLongitude(claim.value.longitudeDegrees)
      const expectedSignId = ASTROLOGY_SIGN_IDS[expectedSignIndex]
      if (claim.value.signIndex !== expectedSignIndex || claim.value.signId !== expectedSignId) errors.push(`verifiedAngles.${pointId}.signClassification`)
    }
    pointClaims.set(pointId, {
      longitude: claim.value.longitudeDegrees,
      longitudeRefs: uniqueStrings(claim.value.sourceRefs),
      sourceRefs: claimSourceRefs(claim),
    })
  }

  const pointValues = Object.fromEntries([...pointClaims.entries()].map(([id, claim]) => [id, claim.longitude]))
  const aspectClaims = Array.isArray(packet.majorAspects) ? packet.majorAspects : []
  if (aspectClaims.length !== 18) errors.push('majorAspects.count')
  const aspects = []
  const seenAspectIds = new Set()

  for (const claim of aspectClaims) {
    const value = claim?.value
    if (!isObject(claim) || claim.claimType !== 'aspect.major' || claim.epistemic !== 'deterministically_derived' || !isObject(value)) {
      errors.push('majorAspects.shape')
      continue
    }
    const pointA = value.pointA
    const pointB = value.pointB
    const aspectId = value.aspectId
    const definition = ASTROLOGY_ASPECT_DEFINITIONS.get(aspectId)
    const aspectRef = typeof pointA === 'string' && typeof pointB === 'string' ? `ruleChart.aspects.${pointA}.${pointB}` : null
    const pointAClaim = pointClaims.get(pointA)
    const pointBClaim = pointClaims.get(pointB)
    const dependencyRefs = uniqueStrings([
      ...(pointAClaim?.longitudeRefs || []),
      ...(pointBClaim?.longitudeRefs || []),
    ])

    if (seenAspectIds.has(value.id)) errors.push(`majorAspects.duplicate:${value.id}`)
    seenAspectIds.add(value.id)
    if (typeof value.id !== 'string' || (typeof pointA === 'string' && typeof pointB === 'string' && typeof aspectId === 'string' && value.id !== `${pointA}__${pointB}__${aspectId}`)) errors.push(`majorAspects.${value.id || 'unknown'}.id`)
    if (!ASTROLOGY_POINT_IDS.has(pointA) || !ASTROLOGY_POINT_IDS.has(pointB) || pointA === pointB) errors.push(`majorAspects.${value.id}.points`)
    if (!definition) errors.push(`majorAspects.${value.id}.aspectId`)
    if (value.epistemicStatus !== 'derived') errors.push(`majorAspects.${value.id}.epistemicStatus`)
    if (!aspectRef || !claim.sourceRefs?.includes(aspectRef)) errors.push(`majorAspects.${value.id}.sourceRef`)
    if (!isFiniteNumber(pointValues[pointA]) || !isFiniteNumber(pointValues[pointB])) errors.push(`majorAspects.${value.id}.dependencies`)

    if (definition && isFiniteNumber(pointValues[pointA]) && isFiniteNumber(pointValues[pointB])) {
      const expectedDistance = angularDistanceDegrees(pointValues[pointA], pointValues[pointB])
      const expectedOrb = Math.abs(expectedDistance - definition.exactAngleDegrees)
      const expectedBoundary = expectedOrb <= definition.maxOrbDegrees
      const expectedBoundaryInfo = expectedBoundary ? expectedOrbBoundaryStatus(definition.maxOrbDegrees, expectedOrb) : null
      const expectedDistanceToBoundary = expectedBoundaryInfo?.distanceToBoundaryDegrees ?? null
      const expectedStatus = expectedBoundaryInfo?.status ?? null
      if (!isFiniteNumber(value.angularDistanceDegrees) || Math.abs(value.angularDistanceDegrees - expectedDistance) > 1e-9) errors.push(`majorAspects.${value.id}.angularDistanceDegrees`)
      if (value.exactAngleDegrees !== definition.exactAngleDegrees || value.maxOrbDegrees !== definition.maxOrbDegrees || value.ruleId !== 'major_aspect_v0') errors.push(`majorAspects.${value.id}.ruleClassification`)
      if (!isFiniteNumber(value.orbDegrees) || !expectedBoundary || Math.abs(value.orbDegrees - expectedOrb) > 1e-9) errors.push(`majorAspects.${value.id}.orbDegrees`)
      if (value.orbBoundaryStatus !== expectedStatus || !isFiniteNumber(value.distanceToOrbBoundaryDegrees) || Math.abs(value.distanceToOrbBoundaryDegrees - expectedDistanceToBoundary) > 1e-9) errors.push(`majorAspects.${value.id}.orbBoundary`)
    }

    if (definition && pointAClaim && pointBClaim && aspectRef) {
      aspects.push({
        id: value.id,
        pointA,
        pointB,
        calculationPrimitive: {
          angularDistanceDegrees: angularDistanceDegrees(pointValues[pointA], pointValues[pointB]),
        },
        derivedClassification: {
          aspectId,
          exactAngleDegrees: definition.exactAngleDegrees,
          orbDegrees: Math.abs(angularDistanceDegrees(pointValues[pointA], pointValues[pointB]) - definition.exactAngleDegrees),
          maxOrbDegrees: definition.maxOrbDegrees,
          orbBoundaryStatus: expectedOrbBoundaryStatus(definition.maxOrbDegrees, Math.abs(angularDistanceDegrees(pointValues[pointA], pointValues[pointB]) - definition.exactAngleDegrees)).status,
          distanceToOrbBoundaryDegrees: expectedOrbBoundaryStatus(definition.maxOrbDegrees, Math.abs(angularDistanceDegrees(pointValues[pointA], pointValues[pointB]) - definition.exactAngleDegrees)).distanceToBoundaryDegrees,
          ruleId: 'major_aspect_v0',
          ruleSetVersion: ASTROLOGY_RULE_SET_VERSION,
        },
        epistemic: 'deterministically_derived',
        sourceRefs: uniqueStrings([aspectRef, ...dependencyRefs]),
        dependencyRefs,
      })
    }
  }

  const houseClaim = packet.wholeSignHouses
  const houseValue = houseClaim?.value
  const ascendantClaim = angles.ascendant
  const ascendantPoint = pointClaims.get('ascendant')
  let wholeSignHouses = null
  if (!isObject(houseClaim) || houseClaim.claimType !== 'house.whole_sign_placement' || houseClaim.epistemic !== 'deterministically_derived' || !isObject(houseValue)) {
    errors.push('wholeSignHouses.shape')
  } else {
    if (!houseClaim.sourceRefs?.includes('ruleChart.houses')) errors.push('wholeSignHouses.sourceRef')
    if (houseValue.availability !== 'available' || houseValue.houseSystem !== 'whole_sign' || houseValue.ruleId !== 'whole_sign_house_v0') errors.push('wholeSignHouses.ruleClassification')
    if (!isFiniteNumber(houseValue.ascendantSignIndex) || houseValue.ascendantSignId !== ascendantClaim?.value?.signId) errors.push('wholeSignHouses.ascendantDependency')
    if (houseValue.ascendantSignIndex !== ascendantClaim?.value?.signIndex) errors.push('wholeSignHouses.ascendantSignIndex')
    if (!Array.isArray(houseValue.placements) || houseValue.placements.length !== ASTROLOGY_BODY_IDS.length) errors.push('wholeSignHouses.placements')
    const placements = []
    const houseRefs = claimSourceRefs(houseClaim)
    const seenPlacementIds = new Set()
    for (const placement of houseValue.placements || []) {
      const body = bodyById.get(placement?.id)
      const expectedHouse = body && isFiniteNumber(body.longitudeDegrees?.value)
        ? calculateWholeSignHouse(signIndexFromLongitude(body.longitudeDegrees.value), houseValue.ascendantSignIndex)
        : null
      if (seenPlacementIds.has(placement?.id)) errors.push(`wholeSignHouses.duplicate:${placement?.id || 'unknown'}`)
      seenPlacementIds.add(placement?.id)
      if (!body || placement.availability !== 'available' || placement.houseSystem !== 'whole_sign' || placement.epistemicStatus !== 'derived' || placement.ruleId !== 'whole_sign_house_v0' || placement.house !== expectedHouse) errors.push(`wholeSignHouses.placement:${placement?.id || 'unknown'}`)
      const dependencyRefs = uniqueStrings([
        ...(ascendantPoint?.sourceRefs || []),
        ...(body?.longitudeDegrees?.sourceRefs || []),
      ])
      placements.push({
        id: placement?.id || null,
        house: expectedHouse,
        sourceRefs: uniqueStrings([...houseRefs, ...dependencyRefs]),
        dependencyRefs,
      })
    }
    for (const bodyId of ASTROLOGY_BODY_IDS) {
      if (!seenPlacementIds.has(bodyId)) errors.push(`wholeSignHouses.missing:${bodyId}`)
    }
    const houseDependencyRefs = uniqueStrings([
      ...(ascendantPoint?.sourceRefs || []),
      ...placements.flatMap((placement) => placement.dependencyRefs),
    ])
    wholeSignHouses = {
      calculationPrimitive: {
        ascendant: {
          signId: houseValue.ascendantSignId,
          signIndex: houseValue.ascendantSignIndex,
          sourceRefs: claimSourceRefs(ascendantClaim),
        },
        placements,
      },
      derivedClassification: {
        houseSystem: 'whole_sign',
        ruleId: houseValue.ruleId,
        ruleSetVersion: ASTROLOGY_RULE_SET_VERSION,
        epistemic: 'deterministically_derived',
        sourceRefs: uniqueStrings([...houseRefs, ...houseDependencyRefs]),
        dependencyRefs: houseDependencyRefs,
      },
    }
  }

  const distributionClaim = packet.distribution
  const distributionValue = distributionClaim?.value
  let distribution = null
  if (!isObject(distributionClaim) || distributionClaim.claimType !== 'distribution.elements_modalities_polarity' || distributionClaim.epistemic !== 'deterministically_derived' || !isObject(distributionValue)) {
    errors.push('distribution.shape')
  } else {
    const dimensions = [
      ['elements', ['fire', 'earth', 'air', 'water'], 'element'],
      ['modalities', ['cardinal', 'fixed', 'mutable'], 'modality'],
      ['polarities', ['masculine', 'feminine'], 'polarity'],
    ]
    const scopes = {
      overall: ASTROLOGY_BODY_IDS,
      personal: [...PERSONAL_DISTRIBUTION_BODIES],
    }
    const primitive = {}
    const tie = {}
    const distributionRefs = [...claimSourceRefs(distributionClaim)]
    for (const [scope, bodyIds] of Object.entries(scopes)) {
      const counts = {}
      const reportedScope = distributionValue[scope]
      for (const [dimension, keys, metadataKey] of dimensions) {
        counts[dimension] = Object.fromEntries(keys.map((key) => [key, 0]))
        for (const bodyId of bodyIds) {
          const body = bodyById.get(bodyId)
          const signId = body && isFiniteNumber(body.longitudeDegrees?.value) ? ASTROLOGY_SIGN_IDS[signIndexFromLongitude(body.longitudeDegrees.value)] : null
          const dimensionValue = signId ? SIGN_METADATA[signId]?.[metadataKey] : null
          if (dimensionValue && Object.hasOwn(counts[dimension], dimensionValue)) counts[dimension][dimensionValue] += 1
          distributionRefs.push(...(body?.longitudeDegrees?.sourceRefs || []))
        }
        const max = Math.max(...keys.map((key) => counts[dimension][key]))
        const expectedTie = keys.filter((key) => counts[dimension][key] === max).length > 1
        if (!reportedScope || reportedScope.totalBodiesCount !== bodyIds.length || reportedScope.ruleId !== 'distribution_from_body_signs_v0' || !keys.every((key) => reportedScope[dimension]?.counts?.[key] === counts[dimension][key]) || reportedScope[dimension]?.tie !== expectedTie) errors.push(`distribution.${scope}.${dimension}`)
        tie[scope] = { ...(tie[scope] || {}), [dimension]: expectedTie }
      }
      primitive[scope] = { bodyIds: [...bodyIds], counts }
    }
    if (distributionValue.epistemicStatus !== 'derived' || distributionValue.ruleId !== 'distribution_from_body_signs_v0') errors.push('distribution.ruleClassification')
    distribution = {
      calculationPrimitive: primitive,
      derivedClassification: {
        tie,
        ruleId: distributionValue.ruleId,
        ruleSetVersion: ASTROLOGY_RULE_SET_VERSION,
        epistemic: 'deterministically_derived',
        sourceRefs: uniqueStrings(distributionRefs),
        dependencyRefs: uniqueStrings(distributionRefs.filter((ref) => ref !== 'ruleChart.distribution')),
      },
    }
  }

  const chartRulerClaim = packet.chartRulers
  const chartRulerValue = chartRulerClaim?.value
  let chartRulers = null
  const ascendantMeta = SIGN_METADATA[ascendantClaim?.value?.signId]
  if (!isObject(chartRulerClaim) || chartRulerClaim.claimType !== 'chart_ruler' || chartRulerClaim.epistemic !== 'deterministically_derived' || !isObject(chartRulerValue)) {
    errors.push('chartRulers.shape')
  } else {
    if (!chartRulerClaim.sourceRefs?.includes('ruleChart.chartRulers')) errors.push('chartRulers.sourceRef')
    if (!ascendantMeta || chartRulerValue.availability !== 'available' || chartRulerValue.ascendantSignId !== ascendantClaim?.value?.signId || chartRulerValue.traditionalChartRuler !== ascendantMeta.traditionalRuler || chartRulerValue.modernChartRuler !== ascendantMeta.modernRuler || chartRulerValue.ruleId !== 'chart_ruler_from_ascendant_v0') errors.push('chartRulers.ruleClassification')
    const dependencyRefs = uniqueStrings(ascendantPoint?.sourceRefs || [])
    chartRulers = {
      calculationPrimitive: {
        ascendantSignId: chartRulerValue.ascendantSignId,
        sourceRefs: claimSourceRefs(ascendantClaim),
      },
      derivedClassification: {
        traditionalChartRuler: ascendantMeta.traditionalRuler,
        modernChartRuler: ascendantMeta.modernRuler,
        ruleId: 'chart_ruler_from_ascendant_v0',
        ruleSetVersion: ASTROLOGY_RULE_SET_VERSION,
        epistemic: 'deterministically_derived',
        sourceRefs: uniqueStrings([...claimSourceRefs(chartRulerClaim), ...dependencyRefs]),
        dependencyRefs,
      },
    }
  }

  if (errors.length > 0) return { valid: false, errors: uniqueStrings(errors) }

  const verifiedBodies = ASTROLOGY_BODY_IDS.map((bodyId) => {
    const body = bodyById.get(bodyId)
    return {
      id: body.id,
      longitudeDegrees: body.longitudeDegrees.value,
      movingFrameSpeed: body.movingFrameSpeedDegreesPerDay.value,
      motionState: body.motion.value,
      epistemic: body.longitudeDegrees.epistemic,
      sourceRefs: uniqueStrings([
        ...(body.longitudeDegrees.sourceRefs || []),
        ...(body.movingFrameSpeedDegreesPerDay.sourceRefs || []),
        ...(body.motion.sourceRefs || []),
      ]),
    }
  })
  const extractedAngles = {
    ascendant: {
      sign: angles.ascendant.value.signId,
      degreeInSign: angles.ascendant.value.degreeInSign,
      longitudeDegrees: angles.ascendant.value.longitudeDegrees,
      sourceRefs: claimSourceRefs(angles.ascendant),
    },
    midheaven: {
      sign: angles.midheaven.value.signId,
      degreeInSign: angles.midheaven.value.degreeInSign,
      longitudeDegrees: angles.midheaven.value.longitudeDegrees,
      sourceRefs: claimSourceRefs(angles.midheaven),
    },
  }
  const allClaimSourceRefs = uniqueStrings([
    ...verifiedBodies.flatMap((body) => body.sourceRefs),
    ...Object.values(extractedAngles).flatMap((angle) => angle.sourceRefs),
    ...aspects.flatMap((aspect) => aspect.sourceRefs),
    ...wholeSignHouses.derivedClassification.sourceRefs,
    ...distribution.derivedClassification.sourceRefs,
    ...chartRulers.derivedClassification.sourceRefs,
  ])
  return {
    valid: true,
    errors: [],
    verifiedBodies,
    angles: extractedAngles,
    aspects,
    wholeSignHouses,
    distribution,
    chartRulers,
    claimSourceRefs: allClaimSourceRefs,
  }
}

/**
 * Extract Western Astrology Deterministic Base
 *
 * Explicitly distinguishes inactive research results (isInactiveResearch: true)
 * and preserves activation.serviceEligibility: "blocked".
 */
export function extractAstrologyFoundation(astrologyInput = {}, options = {}) {
  const packet = [
    astrologyInput.packet,
    astrologyInput.schemaVersion === 'astrology-interpretation-packet-v1' ? astrologyInput : null,
    astrologyInput.bundle?.inputs?.packet,
    astrologyInput.bundle?.components?.packet,
  ].find(isAstrologyPacketCandidate) || null

  const isInactiveResearch = true
  const activation = {
    isActivated: false,
    status: 'blocked',
    serviceEligibility: 'blocked',
    usable: false,
    reason: packet?.activation?.reason || 'interpretation_packet_not_activated / simulation_blocked',
  }

  const researchNotice = '서양 점성학 자료는 오프라인에서 검증된 불변 연구 증적(Inactive Research Artifact) 또는 시뮬레이션 차단 상태로 보존됩니다. availableForInterpretation=false 및 serviceEligibility=blocked는 softie_project 내부 interpretation service/runtime integration이 아직 연결되지 않았다는 뜻이며, 일반 ChatGPT/Gemini downstream 대화 자체를 금지하지 않습니다. 사용자가 해석을 요청하면 계산 FACT/provenance와 해석을 구분해 밝힌 뒤 대화를 이어갈 수 있습니다. 계산된 천체 위치와 구조적 관계는 임의로 해석 의미나 사실 권위로 승격되지 않습니다.'

  // 1. INPUT (천문력 기준 좌표계)
  const input = {
    coordinateSystem: 'geocentric_ecliptic_j2000',
    targetEpoch: packet?.ephemerisBasis?.epoch || packet?.identities?.targetEpoch || '2000-01-01T12:00:00Z',
    ephemerisProvider: 'JPL DE405 SPK',
  }

  const provenance = createAstrologyProvenance(packet)
  const derived = packet
    ? validateAndBuildAstrologyFacts(packet, provenance)
    : { valid: false, errors: ['packet'], claimSourceRefs: [] }
  const verifiedBodies = derived.valid ? derived.verifiedBodies : []
  const angles = derived.valid ? derived.angles : null
  const aspects = derived.valid ? derived.aspects : []

  const facts = {
    hasVerifiedData: derived.valid && (verifiedBodies.length > 0 || Boolean(angles)),
    verifiedBodies,
    angles,
    aspects,
    wholeSignHouses: derived.valid ? derived.wholeSignHouses : null,
    distribution: derived.valid ? derived.distribution : null,
    chartRulers: derived.valid ? derived.chartRulers : null,
    simulationBlockedNote: !packet
      ? '검증된 천문력 Adapter가 런타임에 연결되지 않아 date seed 기반 simulation 값은 차단되었습니다.'
      : !derived.valid
        ? 'source provenance 또는 parent-side deterministic 검증이 완결되지 않아 계산 결과를 Base FACT로 전달하지 않았습니다.'
      : '오프라인 DE405 커널 기반 관측 수치가 연구 증적으로 고정 보존됨',
  }

  // 3. SOURCE (JPL 커널 및 규칙 프로토콜)
  const sourceIdentities = provenance.sourceIdentities
  const claimSourceRefs = derived.claimSourceRefs || []
  const source = {
    ephemerisKernel: derived.valid && sourceIdentities.kernel?.hash ? 'JPL DE405 SPK (Verified)' : 'verified_ephemeris_adapter_required',
    kernelCoverage: sourceIdentities.kernel?.coverage || null,
    protocolVersion: sourceIdentities.runner?.protocolVersion || 'de405-canonical-v2-protocol-v1',
    ruleCoreVersion: ASTROLOGY_RULE_SET_VERSION,
    ruleIdentity: {
      ruleSetVersion: ASTROLOGY_RULE_SET_VERSION,
      aspects: 'major_aspect_v0',
      wholeSignHouses: 'whole_sign_house_v0',
      distribution: 'distribution_from_body_signs_v0',
      chartRulers: 'chart_ruler_from_ascendant_v0',
    },
    provenanceLinks: {
      packetContentSha256: provenance.packetContentSha256,
      providerBundleSha256: sourceIdentities.providerBundleSha256,
      rawChartSha256: sourceIdentities.rawChartSha256,
      ruleChartSha256: sourceIdentities.ruleChartSha256,
      adapterSha256: sourceIdentities.adapterSha256,
      readinessSha256: sourceIdentities.readinessSha256,
      kernelSha256: sourceIdentities.kernel?.hash || null,
      runnerProtocolVersion: sourceIdentities.runner?.protocolVersion || null,
      runnerIdentity: sourceIdentities.runner?.runnerIdentity || null,
      evaluator: sourceIdentities.evaluator?.evaluator || null,
    },
    provenanceStatus: derived.valid ? 'complete' : packet ? 'incomplete' : 'missing',
    provenanceMissing: derived.valid ? [] : uniqueStrings(derived.errors),
    provenance: {
      ...provenance,
      sourceRefs: uniqueStrings([...provenance.sourceRefs, ...claimSourceRefs]),
      claimSourceRefs,
    },
  }

  // 4. UNKNOWN (비활성화, 비개입 경계, 사용자 경험 미제공)
  const unknown = {
    activationStatus: 'blocked',
    serviceEligibility: 'blocked',
    usable: false,
    systemBoundaries: {
      livedExperience: 'not_supplied',
      personalSignificance: 'not_established',
      consumerDelivery: 'blocked',
      runtimeSimulationShield: 'active',
    },
    interpretationBoundary: { ...ASTROLOGY_INTERPRETATION_BOUNDARY },
    warnings: [
      '서양 점성학 프로덕션 활성화 상태: blocked',
      '천문력 Adapter 미연결 상태 (runtime simulation unavailable)',
    ],
    unsupportedFeatures: formatAstrologyFeatureEntries(provenance.complete ? packet?.unsupportedFeatures : null, 'unsupported'),
    blockedFeatures: formatAstrologyFeatureEntries(provenance.complete ? packet?.blockedFeatures : null, 'blocked'),
  }

  return {
    domain: 'astrology',
    displayName: SYSTEM_DISPLAY_NAMES.astrology,
    isInactiveResearch,
    researchNotice,
    activation,
    verificationStatus: derived.valid ? 'verified_offline_research' : 'unsupported_for_interpretation',
    confidence: 'not_available',
    input,
    fact: facts,
    source,
    unknown,
  }
}

/**
 * Common Deterministic Base Builder
 *
 * Emits canonical JSON source of truth containing ONLY:
 * - input: normalized calculation inputs
 * - fact: deterministic calculation outputs
 * - source: ruleset / provenance metadata
 * - unknown: boundaries, unsupported scopes, blocked activation
 */
export function buildDeterministicBase(input = {}, options = {}) {
  const rootInput = input.result?.input?.normalized
    || input.result?.input
    || input.normalizedInput
    || input.input
    || {}
  const subjectName = input.subjectName || rootInput.subjectName || input.result?.input?.normalized?.subjectName || input.unifiedContext?.subjectName || '내담자'

  // Single-domain extraction
  if (options.domain === 'saju' || input.domain === 'saju') {
    const saju = extractSajuFoundation(input.data || input, { ...options, input: rootInput })
    return createDeterministicBasePackage({ subjectName, systems: { saju }, rootInput })
  }
  if (options.domain === 'ziwei' || input.domain === 'ziwei') {
    const ziwei = extractZiweiFoundation(input.data || input, options)
    return createDeterministicBasePackage({ subjectName, systems: { ziwei }, rootInput })
  }
  if (options.domain === 'astrology' || input.domain === 'astrology') {
    const astrology = extractAstrologyFoundation(input.data || input, options)
    return createDeterministicBasePackage({ subjectName, systems: { astrology }, rootInput })
  }

  // Multi-system / Tri-system extraction
  const systems = {}

  // Saju
  const sajuCandidate = input.systems?.saju || input.saju || input.unifiedContext?.systems?.saju || input.result?.systems?.saju || input.result
  if (sajuCandidate) {
    systems.saju = extractSajuFoundation(sajuCandidate, { ...options, input: rootInput })
  }

  // Ziwei
  const ziweiCandidate = input.systems?.ziwei || input.ziwei || input.unifiedContext?.systems?.ziwei
  if (ziweiCandidate) {
    systems.ziwei = extractZiweiFoundation(ziweiCandidate, options)
  }

  // Astrology
  const astrologyCandidate = input.astrologyArtifact || input.systems?.astrology || input.astrology || input.unifiedContext?.systems?.astrology
  if (astrologyCandidate) {
    systems.astrology = extractAstrologyFoundation(astrologyCandidate, options)
  } else {
    systems.astrology = extractAstrologyFoundation({}, options)
  }

  return createDeterministicBasePackage({
    subjectName,
    systems,
    rootInput,
    unifiedContext: input.unifiedContext || null,
  })
}

// Backward compatibility alias
export const buildConversationFoundation = buildDeterministicBase

/**
 * Package Constructor for Deterministic Base
 */
function createDeterministicBasePackage({ subjectName, systems, rootInput = {}, unifiedContext = null }) {
  const timestamp = new Date().toISOString()
  const sajuInput = systems.saju?.input || {}

  const normalizedInput = {
    subjectName: subjectName || rootInput.subjectName || sajuInput.subjectName || '내담자',
    birthDate: rootInput.birthDate || sajuInput.birthDate || null,
    birthTime: rootInput.birthTime || sajuInput.birthTime || null,
    calendar: rootInput.calendar || sajuInput.calendar || 'solar',
    isLeapMonth: Boolean(rootInput.isLeapMonth ?? sajuInput.isLeapMonth),
    timezone: rootInput.timezone || sajuInput.timezone || 'Asia/Seoul',
    latitude: (rootInput.latitude ?? sajuInput.latitude) != null ? String(rootInput.latitude ?? sajuInput.latitude) : null,
    longitude: (rootInput.longitude ?? sajuInput.longitude) != null ? String(rootInput.longitude ?? sajuInput.longitude) : null,
    timeAccuracy: rootInput.timeAccuracy || sajuInput.timeAccuracy || 'exact',
  }

  const basePackage = {
    schemaVersion: CANONICAL_SCHEMA_VERSION,
    foundationVersion: FOUNDATION_VERSION,
    generatedAt: timestamp,
    normalizedInput,
    systems,
    summary: {
      availableSystems: Object.keys(systems).filter((k) => systems[k].activation?.isActivated),
      inactiveResearchSystems: Object.keys(systems).filter((k) => systems[k].isInactiveResearch),
      purityStatus: 'deterministic_pure_base',
      synthesisIncluded: false,
    },
  }

  // Attach single-file markdown format
  basePackage.markdown = formatDeterministicBaseMarkdown(basePackage)
  // Backward compatibility alias for markdown
  basePackage.formattedMarkdown = basePackage.markdown

  return basePackage
}

/**
 * Format Deterministic Base into Clean, Neutral Markdown Manifest
 * Designed for single-file attachment in ChatGPT/Gemini
 */
export function formatDeterministicBaseMarkdown(basePackage) {
  const { normalizedInput, systems, generatedAt } = basePackage
  const lines = [
    `# DETERMINISTIC BASE MANIFEST · ${normalizedInput.subjectName || '내담자'}`,
    `- 생성 일시: ${generatedAt}`,
    `- 규격 버전: ${basePackage.schemaVersion || CANONICAL_SCHEMA_VERSION}`,
    `- 기준 성격: 계산 재현성 보증 (Computational Reproducibility Base · 동일 입력/규칙에 따른 계산 산출값·출처·엔진 상태만 기록하며 운명 결정론이나 다운스트림 대화 통제 지침을 포함하지 않음)`,
    '',
    '## 0. 정규화된 계산 입력 (Calculation Basis)',
    `| 항목 | 값 |`,
    `| :--- | :--- |`,
    `| 대상자명 | ${normalizedInput.subjectName || '미상'} |`,
    `| 생년월일시 | ${normalizedInput.birthDate || '미상'} ${normalizedInput.birthTime || '미상'} (${normalizedInput.calendar === 'lunar' ? '음력' : '양력'}${normalizedInput.isLeapMonth ? ', 윤달' : ''}) |`,
    `| 좌표/기준 | 위도 ${normalizedInput.latitude || '-'}, 경도 ${normalizedInput.longitude || '-'} (${normalizedInput.timezone}) |`,
    `| 시간 정확도 | ${normalizedInput.timeAccuracy} |`,
    '',
  ]

  for (const [key, sys] of Object.entries(systems)) {
    lines.push(`---`, `## [${sys.displayName}]`)

    if (sys.isInactiveResearch) {
      lines.push(
        '> [!NOTE]',
        `> **비활성 연구 아티팩트 (Inactive Research Artifact)**: 오프라인 검증 연구 증적으로 보존됨`,
        `> - 활성화 상태: ${sys.activation.status} (serviceEligibility: ${sys.activation.serviceEligibility}, usable: ${sys.activation.usable})`,
        `> - \`availableForInterpretation=false\` 범위: softie_project 내부 interpretation service/runtime integration 미연결`,
        '> - 일반 ChatGPT/Gemini downstream 대화: 금지하지 않음. 사용자가 해석을 요청하면 FACT/provenance와 해석을 구분해 밝힌 뒤 대화를 이어갈 수 있음',
        '',
      )
    }

    // 1. FACT
    lines.push('### 1. FACT (결정론적 계산/관측 사실)')
    if (key === 'saju') {
      lines.push(
        `- 사주 명식: ${sys.fact.pillarsFormatted}`,
        `- 일간(일주): ${sys.fact.dayMaster} (간여지동 여부: ${sys.fact.isGanyeojidong ? '해당' : '비해당'})`,
        `- 오행 분포: ${Object.entries(sys.fact.elementsDistribution).map(([k, v]) => `${k} ${v}`).join(' · ') || '없음'}`,
        `- 십성 표출: ${Object.entries(sys.fact.tenGodsVisible).map(([k, v]) => `${k} ${v}`).join(' · ') || '없음'}`,
        `- 지지 관계: ${sys.fact.branchRelations.map((r) => `${r.name}(${r.branches.join('')})`).join(', ') || '특이 관계 없음'}`,
        `- 대운/세운: ${sys.fact.timing.daYun ? `대운 ${sys.fact.timing.daYun.currentCycle?.stem || ''}${sys.fact.timing.daYun.currentCycle?.branch || ''}` : '대운 없음'} / 세운 ${sys.fact.timing.seUn?.name || '세운 없음'}`,
        `- 계산 정책 경계: ${sys.fact.policyBoundary}`,
      )
    } else if (key === 'ziwei') {
      lines.push(
        `- 음력 기준: ${sys.fact.lunarBasis.lunarYear}년 ${sys.fact.lunarBasis.lunarMonth}월 ${sys.fact.lunarBasis.lunarDay}일 ${sys.fact.stemsBranches.hourBranch}시 (${sys.fact.stemsBranches.birthYearStem}${sys.fact.stemsBranches.birthYearBranch}년)`,
        `- 명궁·신궁: 명궁 ${sys.fact.mingShenGong.mingGongBranch}宮 / 신궁 ${sys.fact.mingShenGong.shenGongBranch}宮 · 오행국: ${sys.fact.bureau.name} (${sys.fact.bureau.number}국)`,
        `- 14주성: ${sys.fact.majorStars.map((s) => `${s.name}(${s.palaceName})`).join(' · ') || '자료 없음'}`,
        `- 사화: ${sys.fact.transformations.map((t) => `${t.name}:${t.starId}`).join(' · ') || '자료 없음'}`,
        `- 보조 6길성: ${sys.fact.minorStars.map((s) => `${s.name}(${s.palaceName})`).join(' · ') || '없음'}`,
      )
    } else if (key === 'astrology') {
      if (sys.fact.hasVerifiedData) {
        lines.push(
          `- 관측 천체 위치 (DE405 SPK): ${sys.fact.verifiedBodies.map((b) => `${b.id}: ${b.longitudeDegrees?.toFixed(2)}° (${b.motionState})`).join(' · ')}`,
          sys.fact.angles ? `- 앵글 (Angles): Ascendant ${sys.fact.angles.ascendant?.sign} ${sys.fact.angles.ascendant?.degreeInSign?.toFixed(2)}° / MC ${sys.fact.angles.midheaven?.sign || '-'}` : '- 앵글: 자료 없음',
        )
        if (Array.isArray(sys.fact.aspects) && sys.fact.aspects.length > 0) {
          lines.push(
            '- Aspect angular separation (계산 primitive):',
            ...sys.fact.aspects.map((aspect) => `  - ${aspect.pointA}/${aspect.pointB}: ${aspect.calculationPrimitive.angularDistanceDegrees.toFixed(6)}° · refs=${aspect.dependencyRefs.join(',')}`),
            '- Aspect classification (RuleSet-derived):',
            ...sys.fact.aspects.map((aspect) => `  - ${aspect.pointA}/${aspect.pointB}: ${aspect.derivedClassification.aspectId} · exact=${aspect.derivedClassification.exactAngleDegrees}° · orb=${aspect.derivedClassification.orbDegrees.toFixed(6)}°/${aspect.derivedClassification.maxOrbDegrees}° · rule=${aspect.derivedClassification.ruleId} · refs=${aspect.sourceRefs.join(',')}`),
          )
        }
        if (sys.fact.wholeSignHouses) {
          const housePrimitive = sys.fact.wholeSignHouses.calculationPrimitive
          const houseClassification = sys.fact.wholeSignHouses.derivedClassification
          lines.push(
            `- Whole Sign house placement (계산 primitive): ASC ${housePrimitive.ascendant.signId}[${housePrimitive.ascendant.signIndex}] · ${housePrimitive.placements.map((placement) => `${placement.id}=${placement.house}H`).join(' · ')}`,
            `- Whole Sign classification (RuleSet-derived): houseSystem=${houseClassification.houseSystem} · rule=${houseClassification.ruleId} · refs=${houseClassification.sourceRefs.join(',')}`,
          )
        }
        if (sys.fact.distribution) {
          const distribution = sys.fact.distribution
          const formatCounts = (scope) => Object.entries(scope.counts).map(([dimension, counts]) => `${dimension}(${Object.entries(counts).map(([key, value]) => `${key}=${value}`).join(',')})`).join(' · ')
          lines.push(
            `- Distribution count (계산 primitive): overall[${distribution.calculationPrimitive.overall.bodyIds.join(',')}] ${formatCounts(distribution.calculationPrimitive.overall)} / personal[${distribution.calculationPrimitive.personal.bodyIds.join(',')}] ${formatCounts(distribution.calculationPrimitive.personal)}`,
            `- Distribution tie (RuleSet-derived): ${JSON.stringify(distribution.derivedClassification.tie)} · rule=${distribution.derivedClassification.ruleId} · refs=${distribution.derivedClassification.sourceRefs.join(',')}`,
          )
        }
        if (sys.fact.chartRulers) {
          const rulerPrimitive = sys.fact.chartRulers.calculationPrimitive
          const rulerClassification = sys.fact.chartRulers.derivedClassification
          lines.push(
            `- Chart ruler mapping (계산 primitive): ASC sign=${rulerPrimitive.ascendantSignId}`,
            `- Chart ruler mapping (RuleSet-derived): traditional=${rulerClassification.traditionalChartRuler} · modern=${rulerClassification.modernChartRuler} · rule=${rulerClassification.ruleId} · refs=${rulerClassification.sourceRefs.join(',')}`,
          )
        }
      } else {
        lines.push(`- 상태: ${sys.fact.simulationBlockedNote}`)
      }
    }
    lines.push('')

    // 2. SOURCE
    lines.push('### 2. SOURCE (문헌 전승·규칙 버전 및 출처 한계)')
    if (key === 'saju') {
      lines.push(
        '- 고서 5종 원전 문헌 서지 목록:',
        ...sys.source.lineageTexts.map((t) => `  - 《${t.title}》: ${t.focus}`),
        `- 구조적 분류 출처: ${sys.source.structuralReference?.citation || '자평명리 분류'}`,
        `- 전승 한계: unresolved_edition=${sys.source.historicalLimitations.unresolvedEdition}, authority=${sys.source.historicalLimitations.historicalAuthority}, fact=${sys.source.historicalLimitations.historicalFact}`,
      )
      if (Array.isArray(sys.source.factGroundings) && sys.source.factGroundings.length > 0) {
        lines.push(
          '- 계산 사실별 근거 유형 및 권위 구분 (Fact Provenance Groundings):',
          ...sys.source.factGroundings.map((g) => {
            const typeHeader = g.evidenceType === 'primary_textual_witness'
              ? '[고전 문헌 참조 · primary_textual_witness]'
              : g.evidenceType === 'modern_astronomical_method'
                ? '[현대 천문 계산법 · modern_astronomical_method]'
                : g.evidenceType === 'implementation_policy'
                  ? '[현대 구현 정책 · implementation_policy]'
                  : '[학파 대립 미합의 정책 · conflicting_lineage]'
            const basisParts = []
            if (g.classicalWitness) basisParts.push(`문헌 참조: ${g.classicalWitness}`)
            if (g.modernPolicy) basisParts.push(`현대 계산/정책: ${g.modernPolicy}`)
            const basisText = basisParts.join(' · ') || '근거 정보 없음'
            return `  - ${typeHeader} ${g.factLabel} → ${basisText} (authorityScope: ${g.authorityScope}; ${g.distinctionNote})`
          }),
        )
      }
    } else if (key === 'ziwei') {
      lines.push(
        `- RuleSet Profile: ${sys.source.ruleSetProfile}`,
        `- 파생 근거: ${sys.source.sourceDerivation}`,
      )
    } else if (key === 'astrology') {
      lines.push(
        `- 천문력 커널: ${sys.source.ephemerisKernel}`,
        `- 프로토콜: ${sys.source.protocolVersion}`,
        `- 룰 코어: ${sys.source.ruleCoreVersion}`,
        `- Rule identity: ${JSON.stringify(sys.source.ruleIdentity)}`,
        `- Provenance status: ${sys.source.provenanceStatus}`,
        `- Provenance links: ${JSON.stringify(sys.source.provenanceLinks)}`,
        `- Claim-level sourceRefs: ${sys.source.provenance?.claimSourceRefs?.length || 0}개 보존됨`,
      )
    }
    lines.push('')

    // 3. STATUS & SUPPORT SCOPE
    lines.push('### 3. STATUS & SUPPORT SCOPE (지원 범위 및 상태)')
    if (key === 'saju') {
      lines.push(
        `- 개인 유효성: personalValidity=${sys.unknown.personalValidity}`,
        `- 프로파일링 상태: status=${sys.unknown.experimentalProfiling.status} (실험적 규칙 기반 판정) · gyeokguk=${sys.unknown.experimentalProfiling.gyeokguk} · shinsal=${sys.unknown.experimentalProfiling.shinsal} · strength=${sys.unknown.experimentalProfiling.strength} · yongShin=${sys.unknown.experimentalProfiling.yongShin}`,
      )
    } else if (key === 'ziwei') {
      lines.push(
        `- 검증 상태: ${sys.unknown.verificationStatus}`,
        `- 미지원 범위: 시기(${sys.unknown.supportScope.timingStatus}) · 묘왕리함(${sys.unknown.supportScope.brightnessStatus}) · 확장성요(${sys.unknown.supportScope.extendedMinorStarsStatus})`,
        `- 지원 대상: ${sys.unknown.supportScope.supported?.join(', ') || '기본 주성/사화'}`,
      )
    } else if (key === 'astrology') {
      lines.push(
        `- 활성화 상태: ${sys.unknown.activationStatus} (serviceEligibility: ${sys.unknown.serviceEligibility}, usable: ${sys.unknown.usable})`,
        `- 시스템 경계: livedExperience=${sys.unknown.systemBoundaries?.livedExperience || 'not_supplied'}, personalSignificance=${sys.unknown.systemBoundaries?.personalSignificance || 'not_established'}`,
        `- Interpretation boundary: ${JSON.stringify(sys.unknown.interpretationBoundary || {})}`,
        `- unsupportedFeatures: ${sys.unknown.unsupportedFeatures?.map((feature) => `${feature.feature} (${feature.status})`).join(' · ') || '없음'}`,
        `- blockedFeatures: ${sys.unknown.blockedFeatures?.map((feature) => `${feature.feature} (${feature.status}${feature.reason ? `:${feature.reason}` : ''})`).join(' · ') || '없음'}`,
      )
    }
    lines.push('')
  }

  return lines.join('\n')
}

// Backward compatibility alias for markdown formatter
export const formatConversationFoundationMarkdown = formatDeterministicBaseMarkdown

/**
 * Export Deterministic Base as Canonical JSON String
 */
export function exportDeterministicBaseJson(basePackage, indent = 2) {
  return JSON.stringify(basePackage, null, indent)
}

/**
 * Isolated Optional Helper: Build Fresh-Chat Continuation Prompt
 * Wraps the deterministic base document with an attached file context for testing/canary
 */
export function createFreshChatContinuationPrompt(basePackage, optionsOrQuestion = '') {
  const question = typeof optionsOrQuestion === 'string'
    ? optionsOrQuestion
    : (optionsOrQuestion.userQuestion || '')

  const md = basePackage.markdown || formatDeterministicBaseMarkdown(basePackage)
  const astrologyContinuationBoundary = basePackage.systems?.astrology
    ? [
      '[INTERPRETATION BOUNDARY]',
      'availableForInterpretation=false는 softie_project 내부 interpretation service/runtime integration 미연결을 뜻하며, 일반 ChatGPT/Gemini downstream 대화를 금지하지 않는다.',
      '사용자가 해석을 요청하면 계산 FACT/provenance와 해석을 구분해 먼저 밝힌 뒤 대화를 이어간다.',
      '[END INTERPRETATION BOUNDARY]',
    ]
    : []

  return [
    `[ATTACHED FILE: deterministic_base.md]`,
    md,
    `[END ATTACHED FILE]`,
    '',
    ...astrologyContinuationBoundary,
    `[USER]: "${question.trim() || '첨부된 파일의 결정론적 계산 사실을 확인해줘.'}"`,
  ].join('\n')
}

/**
 * Helper to inspect and verify deterministic context without recalculation
 */
export function extractContinuationContext(basePackage) {
  const systems = basePackage.systems || {}
  const domains = Object.keys(systems)

  return {
    subjectName: basePackage.normalizedInput?.subjectName || '내담자',
    domains,
    isInactiveResearchMap: Object.fromEntries(domains.map((d) => [d, systems[d].isInactiveResearch])),
    activationStatusMap: Object.fromEntries(domains.map((d) => [d, systems[d].activation?.status])),
    factsPresentMap: Object.fromEntries(domains.map((d) => [d, Boolean(systems[d].fact)])),
    unknownsPresentMap: Object.fromEntries(domains.map((d) => [d, Boolean(systems[d].unknown)])),
    synthesisExcluded: basePackage.summary?.synthesisIncluded === false,
  }
}
