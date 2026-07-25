/**
 * astrologyContract.js
 *
 * 서양 점성학(Western Astrology) 데이터 계약 및 InterpretationContext 규격 모듈
 */

export const ASTROLOGY_CHART_SYSTEM_DEFAULTS = {
  zodiac: 'tropical',
  houseSystem: 'placidus',
  coordinateSystem: 'geocentric',
  ayanamsa: null,
  ephemerisSource: 'pending',
  ruleSetVersion: 'western_tropical_placidus_v1',
}

export function createAstrologyCalculationContext({
  input = {},
  chart = {},
  calculationMeta = {},
} = {}) {
  const chartSystem = {
    ...ASTROLOGY_CHART_SYSTEM_DEFAULTS,
    ...(chart.chartSystem || {}),
  }

  const confidence = calculationMeta.confidence || (input.birthTime ? 'high' : 'low')
  const verificationStatus =
    calculationMeta.verificationStatus || (confidence === 'high' ? 'verified' : 'needs_verification')

  const stateContract = {
    confidence,
    verificationStatus,
    calculationStatus: confidence === 'high' ? 'completed' : 'candidate_required',
    requiresUserAction: confidence === 'low',
    dataGaps: confidence === 'low' ? ['birth_time_or_location_missing'] : [],
  }

  return {
    systemType: 'astrology',
    input: {
      subjectName: input.subjectName || '내담자',
      birthYear: input.birthYear,
      birthMonth: input.birthMonth,
      birthDay: input.birthDay,
      birthTime: input.birthTime || null,
      latitude: input.latitude || null,
      longitude: input.longitude || null,
    },
    chartSystem,
    planets: chart.planets || [],
    angles: chart.angles || { ascendant: null, mc: null },
    houses: chart.houses || [],
    aspects: chart.aspects || [],
    elementsAndModalities: chart.elementsAndModalities || {
      elements: { fire: 0, earth: 0, air: 0, water: 0 },
      modalities: { cardinal: 0, fixed: 0, mutable: 0 },
    },
    calculationConfidence: {
      stateContract,
    },
  }
}

export function createAstrologyInterpretationContext(calcCtx = {}) {
  const input = calcCtx.input || {}
  const chartSystem = calcCtx.chartSystem || ASTROLOGY_CHART_SYSTEM_DEFAULTS
  const stateContract = calcCtx.calculationConfidence?.stateContract || { confidence: 'high' }

  const sunPlanet = (calcCtx.planets || []).find((p) => p.planet === 'sun') || {}
  const moonPlanet = (calcCtx.planets || []).find((p) => p.planet === 'moon') || {}

  const uncertainFactors = []
  if (!input.birthTime) {
    uncertainFactors.push({
      field: 'ascendant_and_houses',
      reason: 'birth time unavailable',
      impact: 'houses_and_angles_uncertain',
    })
  }

  return {
    systemType: 'astrology',
    subjectName: input.subjectName || '내담자',
    chartSystem,

    candidateSetConsensus: {
      factual: {
        sunSign: sunPlanet.sign || 'unknown',
        moonSign: moonPlanet.sign || 'unknown',
        ascendant: calcCtx.angles?.ascendant?.sign || 'unknown',
        mc: calcCtx.angles?.mc?.sign || 'unknown',
      },

      interpretiveAgreement: {
        dominantElements: calcCtx.elementsAndModalities?.elements || {},
        dominantModalities: calcCtx.elementsAndModalities?.modalities || {},
        majorPatterns: [],
      },
    },

    candidateFacts: [],
    uncertainFactors,

    calculationConfidence: {
      stateContract,
    },

    interpretationWarnings:
      stateContract.confidence === 'low'
        ? ['출생시각/장소 미상으로 하우스 및 Ascendant에 불확실성이 존재합니다.']
        : [],
  }
}
