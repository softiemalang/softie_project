/**
 * interpretationContext.js
 *
 * [역할 및 원칙]
 * - InterpretationContext는 계산이나 판단을 재수행하는 곳이 아니며,
 *   이미 산출된 raw 사주 결과, stateContract, candidateAnalysis, validationMetadata를
 *   AI/LLM 및 해석자가 안전하고 과장 없이 삼킬 수 있도록 가공하는 Pure Transformer 레이어입니다.
 */

import { INTERPRETATION_PREP_SCHEMA_VERSION, SAJU_ADAPTER_VERSION } from './schema.js'

export function buildInterpretationContext(rawResult, options = {}) {
  if (!rawResult || typeof rawResult !== 'object' || !rawResult.raw) {
    return null
  }

  const { raw, stateContract, engine } = rawResult
  const candidateAnalysis = raw.candidateAnalysis || {}
  const validationMetadata = raw.validationMetadata || {}

  // 1. Versioning & Metadata
  const contextHeader = {
    contextVersion: '1.0.0',
    generatedAt: options.generatedAt || 'deterministic_context_timestamp',
    sourceEngineVersion: engine?.sourceEngine || 'softie-saju-core-v1',
    adapterVersion: engine?.adapter || SAJU_ADAPTER_VERSION,
    schemaVersion: INTERPRETATION_PREP_SCHEMA_VERSION,
  }

  // 2. Candidate Set Consensus (후보 집합 내 공통 확인 정보)
  const factualPillars = candidateAnalysis.consensus?.factual?.pillars || raw.pillars || {}
  const getPillarVal = (p) => (typeof p === 'object' && p !== null ? (p.value || p.referenceValue || null) : p)

  const candidateSetConsensus = {
    factual: {
      yearPillar: getPillarVal(factualPillars.yearPillar || factualPillars.year),
      monthPillar: getPillarVal(factualPillars.monthPillar || factualPillars.month),
      dayPillar: getPillarVal(factualPillars.dayPillar || factualPillars.day),
      hourPillar: getPillarVal(factualPillars.hourPillar || factualPillars.hour),
      dayMaster: candidateAnalysis.consensus?.factual?.dayMaster || raw.dayMaster?.stem || raw.pillars?.day?.stem || null,
    },
    interpretiveAgreement: candidateAnalysis.consensus?.interpretiveAgreement || {},
  }

  // 3. Candidate Facts (후보별 분기 및 개별 계산 결과)
  const rawCandidates = raw.candidates || candidateAnalysis.candidates || []
  const candidateFacts = Array.isArray(rawCandidates)
    ? rawCandidates.map((cand) => ({
        candidateId: cand.candidateId || cand.id,
        label: cand.label || cand.inputAssumption,
        candidateOrigin: cand.candidateOrigin || 'unknown',
        ruleAssumption: cand.ruleAssumption || null,
        affectedFields: cand.affectedFields || [],
        pillars: cand.pillars || {},
        experimentalInterpretation: {
          strength: cand.experimentalInterpretation?.strength?.value || cand.experimental?.strength?.level || null,
          gyeokguk: cand.experimentalInterpretation?.gyeokguk?.name || cand.experimental?.gyeokguk?.primary || null,
          yongShin: cand.experimentalInterpretation?.yongShin?.recommended || cand.experimental?.yongShin?.yongShin || null,
        },
      }))
    : []

  // 4. Uncertain Factors (변동 요소 및 사유)
  const rawFields = candidateAnalysis.variances?.fields || []
  const uncertainFactors = Array.isArray(rawFields)
    ? rawFields.map((variance) => {
        if (typeof variance === 'string') {
          return {
            field: variance,
            reason: `후보 간 ${variance} 값 분기`,
          }
        }
        return {
          field: variance?.field || 'unknown',
          divergentValues: variance?.values || [],
          divergentCount: variance?.count || 0,
          reason: variance?.reason || '후보 조건에 따른 값 분기',
        }
      })
    : []

  // 5. Calculation Confidence & State Contract
  // stateContract는 calculateSajuSystem()이 항상 제공하는 5개 필드 계약입니다.
  // ?? null을 사용하여 undefined 필드를 명시적 null로 전달하며,
  // || 'verified' / || 'high' 같은 fallback이 needs_verification·candidate_required 상태를
  // 암묵적으로 상향 승격하는 경로를 차단합니다.
  const calculationConfidence = {
    stateContract: {
      inputStatus: stateContract?.inputStatus ?? null,
      calculationStatus: stateContract?.calculationStatus ?? null,
      verificationStatus: stateContract?.verificationStatus ?? null,
      interpretationStatus: stateContract?.interpretationStatus ?? null,
      confidence: stateContract?.confidence ?? null,
    },
    validationSummary: {
      lunarConversion: validationMetadata.lunarConversion || null,
      solarTermAccuracy: validationMetadata.solarTermAccuracy || null,
      boundarySensitivity: validationMetadata.boundarySensitivity || null,
    },
  }

  // 6. Interpretation Warnings (AI 프롬프트용 지침 안전장치)
  const interpretationWarnings = buildInterpretationWarnings({
    stateContract,
    candidateAnalysis,
    validationMetadata,
    rawCandidates,
  })

  return {
    ...contextHeader,
    subjectName: options.subjectName || rawResult.subjectName || '내담자',
    candidateSetConsensus,
    candidateFacts,
    uncertainFactors,
    calculationConfidence,
    interpretationWarnings,
  }
}

function buildInterpretationWarnings({ stateContract, candidateAnalysis, validationMetadata, rawCandidates }) {
  const warnings = []
  const candidates = candidateAnalysis.candidates || rawCandidates || []
  const hasCandidates = candidates.length > 1 || Boolean(candidateAnalysis.hasCandidates) || (candidateAnalysis.candidateCount > 1)

  const inputTimeAccuracy = candidateAnalysis.input?.timeAccuracy || candidates[0]?.input?.timeAccuracy
  const origins = candidates.map((c) => c.candidateOrigin)

  const isUnknownBirthTime = inputTimeAccuracy === 'unknown' || origins.includes('time_unknown') || origins.includes('unknown_birth_time') || candidates.length === 12
  const isSolarTermBoundary = origins.includes('solar_term_boundary')
  const isHistoricalDst = origins.includes('historical_dst')

  if (hasCandidates) {
    if (isUnknownBirthTime) {
      warnings.push('출생시각 모름 입력으로 인해 12개 시주 후보가 생성되었으므로 시주 기반 해석은 단정하지 말고 가정적 가능성으로 표현해야 합니다.')
    } else if (isSolarTermBoundary) {
      warnings.push('출생 시점이 절기 입절 시각 경계에 위치하여 연주/월주 해석 후보가 분기되므로 절기 적용 규칙에 따른 분기 해석을 유지해야 합니다.')
    } else if (isHistoricalDst) {
      warnings.push('서머타임 중복/경계 시간에 해당하여 동일 입력에 대한 표준시 환산 후보가 존재하므로 단일 명식 확정을 피하십시오.')
    } else {
      warnings.push('복수의 명식 해석 후보가 존재하므로 공통 합의 항목(candidateSetConsensus)과 변동 항목(uncertainFactors)을 구분하여 설명해야 합니다.')
    }
  }

  if (stateContract?.verificationStatus === 'needs_verification') {
    warnings.push('역사 표준시, 지역 보정 또는 음양력 검증이 필요한 구간이므로 산출 결과를 확정적 판정으로 기술하지 마십시오.')
  }

  if (validationMetadata?.boundarySensitivity?.boundarySensitive) {
    warnings.push('절기 또는 진태양시 자정 경계에 근접한 입력이므로 계산 유의성을 안내해야 합니다.')
  }

  if (warnings.length === 0) {
    warnings.push('본 계산 결과는 단일 확정 명식 기준이나 실험적 해석 항목에 대해서는 경향성 중심 안내를 권장합니다.')
  }

  return warnings
}
