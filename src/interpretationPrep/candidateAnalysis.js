/**
 * candidateAnalysis.js
 * 
 * N개 사주 명식 후보군(candidate set)을 관통하는 
 * 1) 계산적/해석적 공통성 (consensus)
 * 2) 변동 요소 및 수량 분포 (variances & distributions)
 * 3) 상태 및 신뢰도 통계 (statistics)
 * 4) 2개 후보간 1:1 차이점 (pairwiseDiff)
 * 를 종합 분석하는 전용 모듈
 */

const PILLAR_KEYS = ['year', 'month', 'day', 'hour']
const PILLAR_LABELS = {
  year: '연주',
  month: '월주',
  day: '일주',
  hour: '시주',
}

/**
 * N개 후보 리스트를 분석하여 consensus, variances, statistics, pairwiseDiff 구조를 반환
 */
export function analyzeCandidateSet(candidates) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return {
      candidateCount: 0,
      consensus: {
        factual: { pillars: {}, dayMaster: null },
        interpretiveAgreement: { strength: null, gyeokguk: null, yongShin: null },
      },
      variances: { fields: [], distributions: {} },
      statistics: {
        candidateCount: 0,
        confidenceSpread: {},
        interpretationStatusSpread: {},
        candidateOriginSpread: {},
      },
      pairwiseDiff: null,
    }
  }

  const candidateCount = candidates.length

  // --- 1. Statistics (통계) ---
  const confidenceSpread = {}
  const interpretationStatusSpread = {}
  const candidateOriginSpread = {}

  candidates.forEach((cand) => {
    const conf = cand.stateContract?.confidence || cand.confidence || 'unknown'
    const interp = cand.stateContract?.interpretationStatus || cand.interpretationStatus || 'unknown'
    const origin = cand.candidateOrigin || (cand.sourceCandidates?.[0]?.candidateOrigin) || 'primary'

    confidenceSpread[conf] = (confidenceSpread[conf] || 0) + 1
    interpretationStatusSpread[interp] = (interpretationStatusSpread[interp] || 0) + 1
    candidateOriginSpread[origin] = (candidateOriginSpread[origin] || 0) + 1
  })

  // --- 2. Factual Consensus (계산적 공통점) ---
  const factualPillars = {}
  PILLAR_KEYS.forEach((key) => {
    const values = candidates.map((c) => c.pillars?.[key]?.value || '')
    const firstVal = values[0]
    if (firstVal && values.every((v) => v === firstVal)) {
      factualPillars[key] = firstVal
    }
  })

  const getDayMaster = (c) => c.dayMaster || c.pillars?.day?.stem || (c.pillars?.day?.value ? c.pillars.day.value[0] : null) || ''
  const dayMasters = candidates.map(getDayMaster)
  const firstDayMaster = dayMasters[0]
  const factualDayMaster = (firstDayMaster && dayMasters.every((d) => d === firstDayMaster)) ? firstDayMaster : null

  // --- 3. Interpretive Agreement (해석적 공통점 - 실험적 휴리스틱의 후보 내 일치 여부) ---
  const strengthLevels = candidates.map((c) => c.experimental?.strength?.level || null)
  const firstStrength = strengthLevels[0]
  const interpretiveStrength = (firstStrength && strengthLevels.every((s) => s === firstStrength)) ? firstStrength : null

  const gyeokguks = candidates.map((c) => c.experimental?.gyeokguk?.name || null)
  const firstGyeok = gyeokguks[0]
  const interpretiveGyeokguk = (firstGyeok && gyeokguks.every((g) => g === firstGyeok)) ? firstGyeok : null

  const yongShins = candidates.map((c) => c.experimental?.yongShin?.yongShin || null)
  const firstYong = yongShins[0]
  const interpretiveYongShin = (firstYong && yongShins.every((y) => y === firstYong)) ? firstYong : null

  // --- 4. Variances & Distributions (변동 항목 및 수량 분포) ---
  const varianceFields = []
  const distributions = {}

  // 시주 분포
  const hourBranchValues = candidates.map((c) => c.hourBranch || c.pillars?.hour?.branch || '').filter(Boolean)

  if (hourBranchValues.length > 0) {
    const hourDist = {}
    hourBranchValues.forEach((hb) => {
      hourDist[hb] = (hourDist[hb] || 0) + 1
    })
    const uniqueHours = Object.keys(hourDist)
    if (uniqueHours.length > 1) {
      varianceFields.push('pillars.hour')
    }
    distributions.hourBranch = {
      values: uniqueHours,
      distribution: hourDist,
    }
  }

  // 강약 분포
  const strengthDist = {}
  strengthLevels.filter(Boolean).forEach((sl) => {
    strengthDist[sl] = (strengthDist[sl] || 0) + 1
  })
  const uniqueStrengths = Object.keys(strengthDist)
  if (uniqueStrengths.length > 1) {
    varianceFields.push('experimental.strength')
  }
  distributions.strengthLevel = {
    values: uniqueStrengths,
    distribution: strengthDist,
  }

  // 대운수 분포
  const daYunNumbers = candidates.map((c) => c.timing?.daYun?.number).filter((n) => typeof n === 'number')
  if (daYunNumbers.length > 0) {
    const minDaYun = Math.min(...daYunNumbers)
    const maxDaYun = Math.max(...daYunNumbers)
    if (minDaYun !== maxDaYun) {
      varianceFields.push('timing.daYun.number')
    }
    const daYunDist = {}
    daYunNumbers.forEach((num) => {
      daYunDist[num] = (daYunDist[num] || 0) + 1
    })
    distributions.daYunStartAge = {
      min: minDaYun,
      max: maxDaYun,
      values: Object.keys(daYunDist).map(Number),
      distribution: daYunDist,
    }
  }

  // --- 5. Pairwise Diff (1:1 비교 - 2개 후보 이상일 때) ---
  let pairwiseDiff = null
  if (candidateCount >= 2) {
    const cA = candidates[0]
    const cB = candidates[1]
    const equivalentFields = []
    const differences = []
    let pillarsEqual = true

    PILLAR_KEYS.forEach((key) => {
      const valA = cA.pillars?.[key]?.value || ''
      const valB = cB.pillars?.[key]?.value || ''
      const label = PILLAR_LABELS[key]

      if (valA === valB) {
        equivalentFields.push({ field: `pillars.${key}`, path: `pillars.${key}`, label, value: valA })
      } else {
        pillarsEqual = false
        differences.push({ field: `pillars.${key}`, path: `pillars.${key}`, label, candidateA: valA, candidateB: valB })
      }
    })

    if (cA.utcDateTime && cB.utcDateTime) {
      if (cA.utcDateTime === cB.utcDateTime) {
        equivalentFields.push({ field: 'utcDateTime', path: 'utcDateTime', label: 'UTC 시각', value: cA.utcDateTime })
      } else {
        differences.push({ field: 'utcDateTime', path: 'utcDateTime', label: 'UTC 시각', candidateA: cA.utcDateTime, candidateB: cB.utcDateTime })
      }
    }

    const levelA = cA.experimental?.strength?.level || '불명'
    const levelB = cB.experimental?.strength?.level || '불명'
    if (levelA === levelB) {
      equivalentFields.push({ field: 'strength.level', path: 'strength.level', label: '일간 강약', value: levelA })
    } else {
      differences.push({ field: 'strength.level', path: 'strength.level', label: '일간 강약', candidateA: levelA, candidateB: levelB })
    }

    pairwiseDiff = {
      status: differences.length === 0 ? 'identical' : pillarsEqual ? 'equivalent_pillars' : 'different',
      equivalentFields,
      differences,
    }
  }

  return {
    candidateCount,
    consensus: {
      factual: {
        pillars: factualPillars,
        dayMaster: factualDayMaster,
      },
      interpretiveAgreement: {
        strength: {
          value: interpretiveStrength,
          agreement: Boolean(interpretiveStrength),
          note: interpretiveStrength ? '모든 후보에서 일간 강약 일치' : '후보별 일간 강약 차이 존재',
        },
        gyeokguk: {
          value: interpretiveGyeokguk,
          agreement: Boolean(interpretiveGyeokguk),
          note: interpretiveGyeokguk ? '모든 후보에서 격국 일치' : '후보별 격국 차이 존재',
        },
        yongShin: {
          value: interpretiveYongShin,
          agreement: Boolean(interpretiveYongShin),
          note: interpretiveYongShin ? '모든 후보에서 용신 일치' : '후보별 용신 차이 존재',
        },
      },
    },
    variances: {
      fields: varianceFields,
      distributions,
    },
    statistics: {
      candidateCount,
      confidenceSpread,
      interpretationStatusSpread,
      candidateOriginSpread,
    },
    pairwiseDiff,
  }
}
