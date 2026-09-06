import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createSajuPolicyContract,
  createSajuPolicyContractFromOptions,
  normalizeSajuPolicyContractForConsumer,
  requireSajuPolicyContract,
  resolveSajuPolicyContract,
  SAJU_HISTORICAL_AUTHORITY_STATUS,
  SAJU_POLICY_DEFAULT_SELECTIONS,
  SAJU_POLICY_KEYS,
  validateSajuPolicyContract,
} from '../src/saju/engine/sajuPolicyContract.js'
import { calculateFourPillars, DEFAULT_SAJU_OPTIONS } from '../src/saju/engine/fourPillars.js'
import { derivePillars } from '../src/saju/engine/core.js'
import { calculateStartAge } from '../src/interpretationPrep/sajuTimingRules.js'
import { calculateSajuSystem } from '../src/interpretationPrep/sajuAdapter.js'
import { DEFAULT_PROFILES } from '../src/interpretationPrep/schema.js'
import { generateDailySnapshot, generateNatalSnapshot } from '../src/saju/interpreter/preprocessor.js'
import { getAdjacentBaziMonthBoundary, getBaziYearAndMonth } from '../src/saju/engine/solarTerms.js'
import { formatSajuPolicyBoundary, getSajuPolicyBoundaries } from '../src/saju/policyDisplay.js'

const INPUT = {
  subjectName: '정책계약테스트',
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

function selectedContract(overrides = {}) {
  return createSajuPolicyContract({
    ...SAJU_POLICY_DEFAULT_SELECTIONS,
    ...overrides,
  })
}

test('missing policy selections remain UNKNOWN and cannot be required', () => {
  const contract = createSajuPolicyContract()

  assert.equal(contract.status, 'UNKNOWN')
  assert.equal(createSajuPolicyContractFromOptions().status, 'UNKNOWN')
  assert.throws(() => resolveSajuPolicyContract({}), /SAJU_POLICY_UNKNOWN/)
  assert.equal(contract.readinessStatus, 'blocked')
  assert.equal(contract.activationStatus, 'not_activated')
  assert.deepEqual(Object.keys(contract.policies), SAJU_POLICY_KEYS)
  SAJU_POLICY_KEYS.forEach((key) => {
    assert.equal(contract.policies[key].status, 'UNKNOWN')
    assert.equal(contract.policies[key].historicalAuthority, SAJU_HISTORICAL_AUTHORITY_STATUS)
    assert.equal(contract.policies[key].historicalFact, false)
    assert.equal(contract.policies[key].implementationPolicy, true)
  })
  assert.equal(validateSajuPolicyContract(contract).valid, false)
  assert.throws(() => requireSajuPolicyContract(contract), /SAJU_POLICY_UNKNOWN/)
})

test('consumer normalization preserves UNKNOWN and never invents a selected policy', () => {
  const unknown = createSajuPolicyContract()
  const selected = createSajuPolicyContract(SAJU_POLICY_DEFAULT_SELECTIONS)

  assert.equal(normalizeSajuPolicyContractForConsumer(unknown), unknown)
  assert.equal(normalizeSajuPolicyContractForConsumer(selected), selected)
  assert.equal(normalizeSajuPolicyContractForConsumer({ status: 'SELECTED' }).status, 'UNKNOWN')
  assert.equal(normalizeSajuPolicyContractForConsumer(null).status, 'UNKNOWN')
})

test('UI policy display fails closed for legacy report content instead of borrowing a selected snapshot policy', () => {
  const selected = selectedContract()
  const snapshotOnly = getSajuPolicyBoundaries({ computed_data: { policyContract: selected } }, null)
  assert.equal(snapshotOnly.policyContract.status, 'SELECTED')

  const legacyReport = getSajuPolicyBoundaries(
    { computed_data: { policyContract: selected } },
    { report_content: { summary: 'legacy report without policy metadata' } },
  )
  assert.equal(legacyReport.policyContract.status, 'UNKNOWN')
  assert.equal(legacyReport.policyContract.historicalAuthority, SAJU_HISTORICAL_AUTHORITY_STATUS)
  assert.equal(legacyReport.policyContract.historicalFact, false)
  assert.equal(legacyReport.policyContract.readinessStatus, 'blocked')
  assert.match(formatSajuPolicyBoundary(legacyReport.policyContract), /selections=\[/)
})

test('default calculation exposes five selected implementation policies without changing the pillar surface', () => {
  const pillars = calculateFourPillars({ birthDate: INPUT.birthDate, birthTime: INPUT.birthTime })
  const contract = pillars._meta.policyContract

  assert.equal(contract.status, 'SELECTED')
  assert.equal(contract.historicalFact, false)
  assert.equal(contract.implementationPolicy, true)
  assert.equal(contract.readinessStatus, 'blocked')
  assert.equal(contract.activationStatus, 'not_activated')
  SAJU_POLICY_KEYS.forEach((key) => {
    assert.equal(contract.policies[key].status, 'SELECTED')
    assert.equal(contract.policies[key].historicalFact, false)
    assert.equal(contract.policies[key].implementationPolicy, true)
  })
  assert.equal(contract.policies.yearBoundaryPolicy.value, 'li-chun-apparent-solar-315')
  assert.equal(contract.policies.monthBoundaryPolicy.value, 'jie-solar-longitude-30-degree')
  assert.equal(contract.policies.dayBoundaryPolicy.value, 'solar-midnight-split-zi')
  assert.equal(contract.policies.hourTimeBasisPolicy.value, 'local-apparent-solar-kst')
  assert.equal(contract.policies.qiyunConversionPolicy.value, 'source-ratio-rounded-360-30-calendar')
})

test('legacy derivePillars compatibility boundary forwards the explicit policy contract', () => {
  const pillars = derivePillars(INPUT.birthDate, INPUT.birthTime)

  assert.equal(pillars._meta.policyContract.status, 'SELECTED')
  assert.equal(pillars._meta.policyContract.historicalFact, false)
  assert.equal(pillars._meta.policyContract.implementationPolicy, true)
})

test('legacy snapshot serializers retain the implementation policy contract', () => {
  const natal = generateNatalSnapshot({
    birth_date: INPUT.birthDate,
    birth_time: INPUT.birthTime,
    gender: INPUT.gender,
  })
  const daily = generateDailySnapshot(natal, INPUT.targetDate)

  assert.equal(natal.natal_data.policyContract.status, 'SELECTED')
  assert.equal(natal.natal_data.policyContract.historicalFact, false)
  assert.equal(daily.computed_data.policyContract.status, 'SELECTED')
  assert.equal(daily.computed_data.policyContract.implementationPolicy, true)
  assert.equal(daily.computed_data.natalPolicyContract.status, 'SELECTED')
  assert.equal(daily.computed_data.natalPolicyContract.historicalFact, false)

  const legacyDaily = generateDailySnapshot({
    ...natal,
    natal_data: { ...natal.natal_data, policyContract: undefined },
  }, INPUT.targetDate)
  assert.equal(legacyDaily.computed_data.policyContract.status, 'SELECTED')
  assert.equal(legacyDaily.computed_data.natalPolicyContract.status, 'UNKNOWN')
  assert.equal(legacyDaily.computed_data.natalPolicyContract.historicalAuthority, SAJU_HISTORICAL_AUTHORITY_STATUS)
  assert.equal(legacyDaily.computed_data.natalPolicyContract.historicalFact, false)
  assert.equal(legacyDaily.computed_data.natalPolicyContract.readinessStatus, 'blocked')
})

test('adapter and timing outputs carry the same blocked non-historical policy contract', () => {
  const result = calculateSajuSystem(INPUT, DEFAULT_PROFILES.saju)

  assert.deepEqual(result.policyContract, result.raw.policyContract)
  assert.deepEqual(result.raw.timing.policyContract, result.policyContract)
  assert.deepEqual(result.engine.options.policyContract, result.policyContract)
  assert.equal(result.policyContract.historicalFact, false)
  assert.equal(result.policyContract.implementationPolicy, true)
  assert.equal(result.policyContract.readinessStatus, 'blocked')
  assert.equal(result.policyContract.activationStatus, 'not_activated')
  assert.equal(result.raw.timing.daYun.startAge.conversion, '3일=1년 · 1일=4개월 · 2시간=10일')
})

test('canonical day and hour policy names map to the existing calculation options', () => {
  const legacyZiStart = calculateFourPillars(
    { birthDate: '1997-04-21', birthTime: '23:30' },
    { ...DEFAULT_SAJU_OPTIONS, dayBoundaryRule: 'zi-start', rollDayAtZiHour: true, ziHourStart: '23:15' },
  )
  const canonicalZiStart = calculateFourPillars(
    { birthDate: '1997-04-21', birthTime: '23:30' },
    { ...DEFAULT_SAJU_OPTIONS, dayBoundaryPolicy: 'zi-start', rollDayAtZiHour: true, ziHourStart: '23:15' },
  )
  assert.deepEqual(canonicalZiStart.day, legacyZiStart.day)
  assert.equal(canonicalZiStart._meta.policyContract.policies.dayBoundaryPolicy.value, 'zi-start')

  const legacyCivil = calculateFourPillars(
    { birthDate: INPUT.birthDate, birthTime: INPUT.birthTime },
    { ...DEFAULT_SAJU_OPTIONS, useSolarTimeCorrection: false },
  )
  const canonicalCivil = calculateFourPillars(
    { birthDate: INPUT.birthDate, birthTime: INPUT.birthTime },
    { ...DEFAULT_SAJU_OPTIONS, hourTimeBasisPolicy: 'civil-kst' },
  )
  assert.deepEqual(canonicalCivil.hour, legacyCivil.hour)
  assert.equal(canonicalCivil._meta.policyContract.policies.hourTimeBasisPolicy.value, 'civil-kst')
})

test('unsupported or mismatched policy selections fail closed before calculation', () => {
  const unsupported = {
    ...DEFAULT_SAJU_OPTIONS,
    monthBoundaryPolicy: 'unsupported-month-policy',
  }
  assert.throws(
    () => calculateFourPillars({ birthDate: INPUT.birthDate, birthTime: INPUT.birthTime }, unsupported),
    /SAJU_POLICY_UNKNOWN/,
  )

  const unknown = createSajuPolicyContract()
  assert.throws(
    () => calculateStartAge(120, unknown),
    /SAJU_POLICY_UNKNOWN/,
  )

  const mismatchedDay = selectedContract({ dayBoundaryPolicy: 'zi-start' })
  assert.throws(
    () => calculateSajuSystem(INPUT, DEFAULT_PROFILES.saju, mismatchedDay),
    /SAJU_POLICY_MISMATCH/,
  )
})

test('Bazi solar-term helpers cannot be used without the policy contract', () => {
  assert.throws(
    () => getBaziYearAndMonth(1997, 4, 21, 14, 40),
    /SAJU_POLICY_UNKNOWN/,
  )
  assert.throws(
    () => getAdjacentBaziMonthBoundary(1997, 4, 21, 14, 40, 'forward'),
    /SAJU_POLICY_UNKNOWN/,
  )
})
