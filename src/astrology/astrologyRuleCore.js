/**
 * astrologyRuleCore.js
 *
 * Mallang Astrology Rule Core v0 메인 엔트리포인트 및 구조화 Export 엔진
 * Rule Set: mallang-astrology-rule-core-v0
 */

import { isValidDegreeNumber } from './astrologyAngles.js'
import { deriveSignPlacement } from './astrologySigns.js'
import { deriveMotionState } from './astrologyMotion.js'
import { deriveWholeSignHouses } from './astrologyHouses.js'
import { deriveMajorAspects } from './astrologyAspects.js'
import { deriveChartRulers } from './astrologyRulers.js'
import { deriveDistribution, SUPPORTED_DISTRIBUTION_BODIES } from './astrologyDistribution.js'

export const RULE_SET_VERSION = 'mallang-astrology-rule-core-v0'

export const SUPPORTED_BODIES = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
]

export const UNSUPPORTED_BODIES = [
  'true_node',
  'mean_node',
  'chiron',
  'lilith',
  'asteroids',
  'fixed_stars',
  'arabic_parts',
  'vertex',
]

/**
 * 단일 천문 원시 차트 후보(rawCandidate)를 입력받아 결정론적으로 별자리, 운동 상태, 하우스,
 * 주요 Aspect, 룰러, 분포 및 상태/근거 계약을 계산하는 순수 함수입니다.
 *
 * @param {object} rawCandidate
 * @returns {object} 결정론적 구조화 점성학 차트 결과
 */
export function deriveAstrologyRuleChart(rawCandidate = {}) {
  const schemaVersion = rawCandidate.schemaVersion || 'astrology-raw-chart-v0'
  const zodiac = rawCandidate.zodiac || 'tropical'
  const referenceFrame = rawCandidate.referenceFrame || 'geocentric'
  const coordinateBasis = rawCandidate.coordinateBasis || 'ecliptic-of-date'
  const candidateId = rawCandidate.candidateId || 'unknown'
  const inputStatus = rawCandidate.inputStatus || 'needs_verification'
  const verificationStatus = rawCandidate.verificationStatus || 'needs_verification'

  const rawBodies = Array.isArray(rawCandidate.bodies) ? rawCandidate.bodies : []
  const rawAngles = rawCandidate.angles || {}

  // 1. Process Bodies
  const bodyPlacements = []
  const unsupportedBodies = []

  for (const b of rawBodies) {
    if (!b || !b.id) continue

    if (!SUPPORTED_BODIES.includes(b.id)) {
      unsupportedBodies.push({
        id: b.id,
        availability: 'unsupported',
        reason: 'unsupported_body',
      })
      continue
    }

    if (!isValidDegreeNumber(b.longitudeDegrees)) {
      bodyPlacements.push({
        id: b.id,
        availability: 'unavailable',
        reason: 'longitude_unavailable',
        sourceRefs: [`bodies.${b.id}.longitudeDegrees`],
      })
      continue
    }

    const signRes = deriveSignPlacement(b.longitudeDegrees)
    const motionRes = deriveMotionState(b.longitudeSpeedDegreesPerDay)

    const sourceRefs = [`bodies.${b.id}.longitudeDegrees`]
    if (isValidDegreeNumber(b.longitudeSpeedDegreesPerDay)) {
      sourceRefs.push(`bodies.${b.id}.longitudeSpeedDegreesPerDay`)
    }

    bodyPlacements.push({
      id: b.id,
      longitudeDegrees: signRes.normalizedLongitudeDegrees,
      longitudeSpeedDegreesPerDay: isValidDegreeNumber(b.longitudeSpeedDegreesPerDay)
        ? b.longitudeSpeedDegreesPerDay
        : null,
      signId: signRes.signId,
      signIndex: signRes.signIndex,
      degreeInSign: signRes.degreeInSign,
      boundaryStatus: signRes.boundaryStatus,
      distanceToNearestBoundaryDegrees: signRes.distanceToNearestBoundaryDegrees,
      thresholdDegrees: signRes.thresholdDegrees,
      motionState: motionRes.motionState,
      retrograde: motionRes.retrograde,
      availability: 'available',
      epistemicStatus: 'derived',
      ruleId: 'sign_from_ecliptic_longitude_v0',
      ruleSetVersion: RULE_SET_VERSION,
      sourceRefs,
    })
  }

  // 2. Process Angles (ascendant, midheaven)
  let ascendantPlacement = null
  if (rawAngles.ascendant && isValidDegreeNumber(rawAngles.ascendant.longitudeDegrees)) {
    const signRes = deriveSignPlacement(rawAngles.ascendant.longitudeDegrees)
    ascendantPlacement = {
      id: 'ascendant',
      longitudeDegrees: signRes.normalizedLongitudeDegrees,
      signId: signRes.signId,
      signIndex: signRes.signIndex,
      degreeInSign: signRes.degreeInSign,
      boundaryStatus: signRes.boundaryStatus,
      distanceToNearestBoundaryDegrees: signRes.distanceToNearestBoundaryDegrees,
      thresholdDegrees: signRes.thresholdDegrees,
      availability: 'available',
      epistemicStatus: 'derived',
      ruleId: 'sign_from_ecliptic_longitude_v0',
      ruleSetVersion: RULE_SET_VERSION,
      sourceRefs: ['angles.ascendant.longitudeDegrees'],
    }
  } else {
    ascendantPlacement = {
      id: 'ascendant',
      availability: 'unavailable',
      reason: 'ascendant_longitude_missing',
      sourceRefs: ['angles.ascendant.longitudeDegrees'],
    }
  }

  let midheavenPlacement = null
  if (rawAngles.midheaven && isValidDegreeNumber(rawAngles.midheaven.longitudeDegrees)) {
    const signRes = deriveSignPlacement(rawAngles.midheaven.longitudeDegrees)
    midheavenPlacement = {
      id: 'midheaven',
      longitudeDegrees: signRes.normalizedLongitudeDegrees,
      signId: signRes.signId,
      signIndex: signRes.signIndex,
      degreeInSign: signRes.degreeInSign,
      boundaryStatus: signRes.boundaryStatus,
      distanceToNearestBoundaryDegrees: signRes.distanceToNearestBoundaryDegrees,
      thresholdDegrees: signRes.thresholdDegrees,
      availability: 'available',
      epistemicStatus: 'derived',
      ruleId: 'sign_from_ecliptic_longitude_v0',
      ruleSetVersion: RULE_SET_VERSION,
      sourceRefs: ['angles.midheaven.longitudeDegrees'],
    }
  } else {
    midheavenPlacement = {
      id: 'midheaven',
      availability: 'unavailable',
      reason: 'midheaven_longitude_missing',
      sourceRefs: ['angles.midheaven.longitudeDegrees'],
    }
  }

  // 3. Process Whole Sign Houses
  const houseResult = deriveWholeSignHouses({
    ascendantPlacement: ascendantPlacement.availability === 'available' ? ascendantPlacement : null,
    bodyPlacements,
  })

  // 4. Process Chart Rulers
  const rulerResult = deriveChartRulers(
    ascendantPlacement.availability === 'available' ? ascendantPlacement : null
  )

  // 5. Process Aspects & Aspect Phases
  const pointPlacementsForAspects = []
  for (const b of bodyPlacements) {
    if (b.availability === 'available') {
      pointPlacementsForAspects.push({
        id: b.id,
        longitudeDegrees: b.longitudeDegrees,
        speedDegreesPerDay: b.longitudeSpeedDegreesPerDay,
      })
    }
  }
  if (ascendantPlacement.availability === 'available') {
    pointPlacementsForAspects.push({
      id: 'ascendant',
      longitudeDegrees: ascendantPlacement.longitudeDegrees,
      speedDegreesPerDay: null,
    })
  }
  if (midheavenPlacement.availability === 'available') {
    pointPlacementsForAspects.push({
      id: 'midheaven',
      longitudeDegrees: midheavenPlacement.longitudeDegrees,
      speedDegreesPerDay: null,
    })
  }

  const aspectsResult = deriveMajorAspects(pointPlacementsForAspects)

  // 6. Process Element / Modality / Polarity Distribution
  const availableBodies = bodyPlacements.filter((b) => b.availability === 'available')
  const distributionResult = deriveDistribution(availableBodies)

  // 7. Assemble Structured Core Chart Export
  return {
    schemaVersion: 'astrology-rule-chart-v0',
    ruleSetVersion: RULE_SET_VERSION,
    candidateId,
    inputStatus,
    verificationStatus,
    epistemicStatus: 'derived',

    metadata: {
      zodiac,
      referenceFrame,
      coordinateBasis,
      houseSystem: 'whole_sign',
    },

    supportScope: {
      supportedBodies: SUPPORTED_BODIES,
      supportedHouseSystem: 'whole_sign',
      supportedAspects: ['conjunction', 'sextile', 'square', 'trine', 'opposition'],
    },

    bodies: bodyPlacements,
    angles: {
      ascendant: ascendantPlacement,
      midheaven: midheavenPlacement,
    },

    unsupportedBodies,

    houses: houseResult,
    chartRulers: rulerResult,
    aspects: aspectsResult,
    distribution: distributionResult,
  }
}
