/**
 * Headless preparation pipeline for Chat handoff packages.
 *
 * This module intentionally has no React, DOM, clipboard, storage, or UI state
 * dependencies. It preserves each system's evidence and availability boundary.
 */

import { prepareInterpretationData } from './prepare.js'
import { DEFAULT_PROFILES } from './schema.js'
import { solar2lunar } from './lunarConverter.js'
import { createUnifiedInterpretationContext } from './unifiedInterpretationContext.js'
import { resolveZiweiChart } from '../ziwei/ziweiResolver.js'
import { resolve14MajorStars } from '../ziwei/starResolver.js'
import { resolveFourTransformations } from '../ziwei/transformationResolver.js'
import { resolveMinorStars } from '../ziwei/minorStarResolver.js'
import {
  DEFAULT_ZIWEI_RULE_SET,
  createZiweiCalculationContext,
  createZiweiInterpretationContext,
} from '../ziwei/ziweiContract.js'

const STEM_TO_HAN = Object.freeze({
  갑: '甲',
  을: '乙',
  병: '丙',
  정: '丁',
  무: '戊',
  기: '己',
  경: '庚',
  신: '辛',
  임: '壬',
  계: '癸',
})

const BRANCH_TO_HAN = Object.freeze({
  자: '子',
  축: '丑',
  인: '寅',
  묘: '卯',
  진: '辰',
  사: '巳',
  오: '午',
  미: '未',
  신: '申',
  유: '酉',
  술: '戌',
  해: '亥',
})

const ZIWEI_EXTERNAL_VERIFICATION_WARNING =
  '자미두수 결과는 저장소의 고정 RuleSet에 따른 회귀 검증 단계의 실험적 계산이며, 독립 외부 명반과의 대조 검증 전입니다.'

const ASTROLOGY_ADAPTER_WARNING =
  '검증된 천문력(Ephemeris) Adapter가 연결되지 않아 날짜 seed 기반 Simulation 값은 Chat 해석 자료에서 차단합니다.'

function buildSajuSystem(baseResult) {
  const calculationResult = baseResult.systems.saju
  const interpretationContext = baseResult.interpretationContext

  const verificationStatus =
    interpretationContext?.calculationConfidence?.stateContract?.verificationStatus
    ?? calculationResult?.stateContract?.verificationStatus
    ?? 'needs_verification'

  const status =
    verificationStatus === 'candidate_required'
      ? 'candidate_required'
      : verificationStatus === 'needs_verification'
        ? 'needs_verification'
        : 'available'

  const interpretationStatus =
    verificationStatus === 'candidate_required'
      ? 'candidate_only'
      : (interpretationContext?.calculationConfidence?.stateContract?.interpretationStatus
        ?? calculationResult?.stateContract?.interpretationStatus
        ?? 'ready')

  const confidence =
    interpretationContext?.calculationConfidence?.stateContract?.confidence
    ?? calculationResult?.stateContract?.confidence
    ?? 'medium'

  return {
    system: 'saju',
    status,
    verificationStatus,
    interpretationStatus,
    confidence,
    availableForChat: Boolean(calculationResult?.raw && interpretationContext),
    calculationResult,
    interpretationContext,
    warnings: [
      ...(calculationResult?.warnings || []),
      ...(interpretationContext?.interpretationWarnings || []),
    ],
  }
}

function buildUnavailableZiweiSystem(reason, verificationStatus = 'insufficient_data') {
  return {
    system: 'ziwei',
    status: verificationStatus === 'candidate_required' ? 'candidate_required' : 'experimental',
    verificationStatus,
    interpretationStatus: 'candidate_only',
    confidence: 'low',
    availableForChat: false,
    calculationResult: null,
    interpretationContext: null,
    supportScope: {
      timingStatus: 'unsupported',
      brightnessStatus: 'unsupported',
      extendedMinorStarsStatus: 'unsupported',
      supported: [],
    },
    warnings: [reason, ZIWEI_EXTERNAL_VERIFICATION_WARNING],
  }
}

function buildZiweiSystem(baseResult, profiles) {
  const normalized = baseResult.input.normalized
  const sajuRaw = baseResult.systems.saju?.raw

  if (
    normalized.timeAccuracy !== 'exact'
    || !normalized.birthTime
    || !sajuRaw?.pillars?.year
    || !sajuRaw?.pillars?.hour
  ) {
    return buildUnavailableZiweiSystem(
      '출생시각이 단일값으로 확정되지 않아 자미두수 명궁·신궁과 별 배치를 하나의 값으로 만들지 않습니다.',
      'candidate_required',
    )
  }

  const [solarYear, solarMonth, solarDay] = normalized.birthDate.split('-').map(Number)
  const lunar = solar2lunar(solarYear, solarMonth, solarDay)
  if (!lunar || lunar === -1) {
    return buildUnavailableZiweiSystem(
      '양력 입력을 음력 월·일로 변환하지 못해 자미두수 계산을 중단했습니다.',
    )
  }

  const birthYearStem = STEM_TO_HAN[sajuRaw.pillars.year.stem]
  const birthYearBranch = BRANCH_TO_HAN[sajuRaw.pillars.year.branch]
  const hourBranch = BRANCH_TO_HAN[sajuRaw.pillars.hour.branch]
  if (!birthYearStem || !birthYearBranch || !hourBranch) {
    return buildUnavailableZiweiSystem(
      '사주 계산 결과에서 자미두수 입력에 필요한 연간·연지·시지를 안전하게 파생하지 못했습니다.',
    )
  }

  const ruleSet = {
    ...DEFAULT_ZIWEI_RULE_SET,
    profileVersion: profiles.ziwei?.profileVersion || 'ziwei-fixed-ruleset-experimental-v1',
  }
  const baseChart = resolveZiweiChart({
    subjectName: normalized.subjectName,
    lunarMonth: lunar.lMonth,
    hourBranch,
    birthYearStem,
    birthYearBranch,
    isLeapMonth: lunar.isLeap,
    birthTime: normalized.birthTime,
    ruleSet,
  })
  const chart = { ...baseChart.chart }
  const bureauNumber = chart.fiveElementsBureau?.number
  if (!bureauNumber) {
    return buildUnavailableZiweiSystem(
      '자미두수 오행국 산출에 실패하여 명반 포국을 중단했습니다.',
    )
  }

  const majorResult = resolve14MajorStars({
    bureauNumber,
    lunarDay: lunar.lDay,
    palaces: chart.palaces,
  })
  const transformationResult = resolveFourTransformations(birthYearStem)
  const minorResult = resolveMinorStars({
    birthYearStem,
    lunarMonth: lunar.lMonth,
    hourBranch,
    palaces: chart.palaces,
  })

  if (
    majorResult.status === 'failed' ||
    transformationResult.status === 'failed' ||
    minorResult.status === 'failed'
  ) {
    return buildUnavailableZiweiSystem(
      '자미두수 주성·사화·보조성 산출에 실패하여 명반 포국을 중단했습니다.',
    )
  }

  chart.majorStars = majorResult.majorStars
  chart.transformations = transformationResult.transformations
  chart.minorStars = minorResult.minorStars

  const resolverWarnings = baseChart.calculationMeta?.warnings || []
  const hasBoundaryCandidate = resolverWarnings.length > 0 || lunar.isLeap
  const confidence = hasBoundaryCandidate ? 'low' : 'medium'
  const verificationStatus = hasBoundaryCandidate
    ? 'candidate_required'
    : 'needs_external_verification'
  const interpretationStatus = hasBoundaryCandidate ? 'candidate_only' : 'experimental'
  const warnings = [
    ...resolverWarnings,
    ZIWEI_EXTERNAL_VERIFICATION_WARNING,
    '출생 연간·연지와 시지는 현재 사주 엔진의 계산 기둥을 입력 근거로 사용했습니다.',
  ]

  const supportScope = {
    timingStatus: 'unsupported',
    brightnessStatus: 'unsupported',
    extendedMinorStarsStatus: 'unsupported',
    supported: ['명궁·신궁 지지', '오행국', '14주성', '4대 사화', '6길성'],
  }

  const calculationResult = createZiweiCalculationContext({
    input: {
      subjectName: normalized.subjectName,
      birthYearStem,
      birthYearBranch,
      lunarMonth: lunar.lMonth,
      hourBranch,
      gender: normalized.gender,
      calendarBasis: {
        lunarYear: lunar.lYear,
        lunarMonth: lunar.lMonth,
        lunarDay: lunar.lDay,
        isLeapMonth: lunar.isLeap,
        timeAccuracy: normalized.timeAccuracy,
        sourceSolarDate: normalized.birthDate,
        conversionVerificationStatus: 'needs_external_verification',
      },
      ruleSet,
    },
    chart,
    candidates: baseChart.candidates,
    calculationMeta: {
      confidence,
      verificationStatus,
      calculationStatus: 'calculated',
      inputStatus: 'valid',
      interpretationStatus,
      warnings,
      ruleSetVersions: {
        palace: ruleSet.profileVersion,
        majorStars: majorResult.starPlacementMeta.ruleSetVersion,
        transformations: transformationResult.transformationMeta.ruleSetVersion,
        minorStars: minorResult.minorStarMeta.ruleSetVersion,
      },
    },
    supportScope,
    ruleSet,
  })

  if (hasBoundaryCandidate) {
    return {
      system: 'ziwei',
      status: 'candidate_required',
      verificationStatus: 'candidate_required',
      interpretationStatus: 'candidate_only',
      confidence: 'low',
      availableForChat: false,
      calculationResult,
      interpretationContext: null,
      supportScope,
      warnings: [
        ...warnings,
        '복수의 명반 후보가 존재하는 입력 조건이나, 전체 명반 후보 듀얼 재계산 기능 미지원으로 Chat 해석 자료에서 차단합니다.',
      ],
      candidates: baseChart.candidates,
      sourceDerivation: {
        lunarConversion: {
          solarDate: normalized.birthDate,
          lunarYear: lunar.lYear,
          lunarMonth: lunar.lMonth,
          lunarDay: lunar.lDay,
          isLeapMonth: lunar.isLeap,
          verificationStatus: 'needs_external_verification',
        },
        birthYearStem,
        birthYearBranch,
        hourBranch,
      },
    }
  }

  const interpretationContext = createZiweiInterpretationContext(calculationResult)

  return {
    system: 'ziwei',
    status: 'experimental',
    verificationStatus: 'needs_external_verification',
    interpretationStatus: 'experimental',
    confidence: 'medium',
    availableForChat: true,
    calculationResult,
    interpretationContext,
    supportScope,
    warnings,
    candidates: baseChart.candidates,
    sourceDerivation: {
      lunarConversion: {
        solarDate: normalized.birthDate,
        lunarYear: lunar.lYear,
        lunarMonth: lunar.lMonth,
        lunarDay: lunar.lDay,
        isLeapMonth: lunar.isLeap,
        verificationStatus: 'needs_external_verification',
      },
      birthYearStem,
      birthYearBranch,
      hourBranch,
    },
  }
}

function buildAstrologySystem(profiles) {
  return {
    system: 'astrology',
    status: 'simulation_blocked',
    verificationStatus: 'unsupported_for_interpretation',
    confidence: 'not_available',
    availableForChat: false,
    calculationResult: null,
    interpretationContext: null,
    adapterContract: {
      profileVersion: profiles.astrology?.profileVersion || 'draft-profile-v1',
      requiredAdapter: 'verified_ephemeris_adapter',
      promotionRule: '검증된 천문력 Adapter 연결 후 동일 계약에서 availableForChat을 true로 승격',
    },
    warnings: [ASTROLOGY_ADAPTER_WARNING],
  }
}

export function prepareThreeSystemInterpretationData(input, profiles = DEFAULT_PROFILES) {
  const baseResult = prepareInterpretationData(input, profiles)
  const systems = {
    saju: buildSajuSystem(baseResult),
    ziwei: buildZiweiSystem(baseResult, profiles),
    astrology: buildAstrologySystem(profiles),
  }
  const unifiedContext = createUnifiedInterpretationContext(systems)

  return {
    pipelineVersion: 'three-system-prep-1.0.0',
    result: baseResult,
    systems,
    unifiedContext,
  }
}
