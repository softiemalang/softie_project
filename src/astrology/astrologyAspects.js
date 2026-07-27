/**
 * astrologyAspects.js
 *
 * 주요 Aspect(conjunction, sextile, square, trine, opposition) 및 Aspect Phase 도출 모듈
 * Rule Set: mallang-astrology-rule-core-v0
 */

import {
  angularDistanceDegrees,
  normalizeSignedDegrees180,
  isValidDegreeNumber,
} from './astrologyAngles.js'
import { MOTION_EPSILON_DEGREES_PER_DAY } from './astrologyMotion.js'

export const MAJOR_ASPECTS = [
  {
    id: 'conjunction',
    exactAngleDegrees: 0,
    maxOrbDegrees: 8,
  },
  {
    id: 'sextile',
    exactAngleDegrees: 60,
    maxOrbDegrees: 5,
  },
  {
    id: 'square',
    exactAngleDegrees: 90,
    maxOrbDegrees: 7,
  },
  {
    id: 'trine',
    exactAngleDegrees: 120,
    maxOrbDegrees: 7,
  },
  {
    id: 'opposition',
    exactAngleDegrees: 180,
    maxOrbDegrees: 8,
  },
]

export const POINT_ORDER = [
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
  'ascendant',
  'midheaven',
]

export const ORB_BOUNDARY_THRESHOLD_DEGREES = 1 / 60 // 1 arcminute

/**
 * 두 천체의 relative speed와 signed offset으로 Aspect Phase(applying, separating, exact, indeterminate)를 도출합니다.
 *
 * @param {object} params
 * @param {string} params.pointA
 * @param {string} params.pointB
 * @param {string} params.aspectId
 * @param {number} params.lonA
 * @param {number} params.lonB
 * @param {number|null} params.speedA
 * @param {number|null} params.speedB
 * @returns {object} Phase 도출 결과
 */
export function deriveAspectPhase({ pointA, pointB, aspectId, lonA, lonB, speedA, speedB }) {
  const isAngleA = pointA === 'ascendant' || pointA === 'midheaven'
  const isAngleB = pointB === 'ascendant' || pointB === 'midheaven'

  if (isAngleA || isAngleB) {
    return {
      phase: 'unavailable',
      phaseReason: 'angle_phase_not_supported_v0',
      signedOffsetDegrees: null,
      relativeSpeedDegreesPerDay: null,
      phaseRuleId: 'aspect_phase_from_relative_speed_v0',
    }
  }

  if (!isValidDegreeNumber(speedA) || !isValidDegreeNumber(speedB)) {
    return {
      phase: 'unavailable',
      phaseReason: 'speed_unavailable',
      signedOffsetDegrees: null,
      relativeSpeedDegreesPerDay: null,
      phaseRuleId: 'aspect_phase_from_relative_speed_v0',
    }
  }

  const delta = normalizeSignedDegrees180(lonB - lonA)

  let targets = [0]
  if (aspectId === 'sextile') targets = [-60, 60]
  else if (aspectId === 'square') targets = [-90, 90]
  else if (aspectId === 'trine') targets = [-120, 120]
  else if (aspectId === 'opposition') targets = [-180, 180]

  let bestTarget = targets[0]
  let minDiff = Math.abs(normalizeSignedDegrees180(delta - targets[0]))

  for (let i = 1; i < targets.length; i++) {
    const diff = Math.abs(normalizeSignedDegrees180(delta - targets[i]))
    if (diff < minDiff) {
      minDiff = diff
      bestTarget = targets[i]
    }
  }

  const signedOffsetDegrees = normalizeSignedDegrees180(delta - bestTarget)
  const relativeSpeedDegreesPerDay = speedB - speedA

  if (Math.abs(signedOffsetDegrees) <= MOTION_EPSILON_DEGREES_PER_DAY) {
    return {
      phase: 'exact',
      signedOffsetDegrees,
      relativeSpeedDegreesPerDay,
      phaseRuleId: 'aspect_phase_from_relative_speed_v0',
    }
  }

  if (Math.abs(relativeSpeedDegreesPerDay) <= MOTION_EPSILON_DEGREES_PER_DAY) {
    return {
      phase: 'indeterminate',
      signedOffsetDegrees,
      relativeSpeedDegreesPerDay,
      phaseRuleId: 'aspect_phase_from_relative_speed_v0',
    }
  }

  const prod = signedOffsetDegrees * relativeSpeedDegreesPerDay
  const phase = prod < 0 ? 'applying' : 'separating'

  return {
    phase,
    signedOffsetDegrees,
    relativeSpeedDegreesPerDay,
    phaseRuleId: 'aspect_phase_from_relative_speed_v0',
  }
}

/**
 * 포인트 배치들의 조합에서 v0 major aspects를 도출합니다.
 *
 * @param {Array<object>} pointPlacements [{ id, longitudeDegrees, speedDegreesPerDay }]
 * @returns {Array<object>} 도출된 Aspect 목록
 */
export function deriveMajorAspects(pointPlacements = []) {
  const mapByPointId = new Map()
  for (const p of pointPlacements) {
    if (p && p.id && isValidDegreeNumber(p.longitudeDegrees)) {
      mapByPointId.set(p.id, p)
    }
  }

  const aspects = []

  for (let i = 0; i < POINT_ORDER.length; i++) {
    const idA = POINT_ORDER[i]
    const pA = mapByPointId.get(idA)
    if (!pA) continue

    for (let j = i + 1; j < POINT_ORDER.length; j++) {
      const idB = POINT_ORDER[j]
      const pB = mapByPointId.get(idB)
      if (!pB) continue

      // Exclude angle <-> angle (ascendant <-> midheaven)
      const isAngleA = idA === 'ascendant' || idA === 'midheaven'
      const isAngleB = idB === 'ascendant' || idB === 'midheaven'
      if (isAngleA && isAngleB) continue

      const angularDistance = angularDistanceDegrees(pA.longitudeDegrees, pB.longitudeDegrees)

      const matches = []
      for (const aspectDef of MAJOR_ASPECTS) {
        const orb = Math.abs(angularDistance - aspectDef.exactAngleDegrees)
        if (orb <= aspectDef.maxOrbDegrees) {
          matches.push({
            aspectDef,
            orbDegrees: orb,
          })
        }
      }

      if (matches.length === 0) continue

      // Sort matches: smallest orb first, then declaration order
      matches.sort((a, b) => {
        if (Math.abs(a.orbDegrees - b.orbDegrees) > 1e-12) {
          return a.orbDegrees - b.orbDegrees
        }
        const idxA = MAJOR_ASPECTS.findIndex((x) => x.id === a.aspectDef.id)
        const idxB = MAJOR_ASPECTS.findIndex((x) => x.id === b.aspectDef.id)
        return idxA - idxB
      })

      const best = matches[0]
      const aspectDef = best.aspectDef
      const orbDegrees = best.orbDegrees

      const distanceToOrbBoundaryDegrees = Math.abs(aspectDef.maxOrbDegrees - orbDegrees)
      const isNearOrbBoundary = distanceToOrbBoundaryDegrees <= ORB_BOUNDARY_THRESHOLD_DEGREES

      const phaseResult = deriveAspectPhase({
        pointA: idA,
        pointB: idB,
        aspectId: aspectDef.id,
        lonA: pA.longitudeDegrees,
        lonB: pB.longitudeDegrees,
        speedA: pA.speedDegreesPerDay,
        speedB: pB.speedDegreesPerDay,
      })

      const aspectRecord = {
        id: `${idA}__${idB}__${aspectDef.id}`,
        pointA: idA,
        pointB: idB,
        aspectId: aspectDef.id,
        exactAngleDegrees: aspectDef.exactAngleDegrees,
        angularDistanceDegrees: angularDistance,
        orbDegrees,
        maxOrbDegrees: aspectDef.maxOrbDegrees,
        orbBoundaryStatus: isNearOrbBoundary ? 'near_orb_boundary' : 'normal',
        distanceToOrbBoundaryDegrees,
        ...phaseResult,
        epistemicStatus: 'derived',
        ruleId: 'major_aspect_v0',
      }

      aspects.push(aspectRecord)
    }
  }

  return aspects
}
