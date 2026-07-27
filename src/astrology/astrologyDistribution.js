/**
 * astrologyDistribution.js
 *
 * 천체 별자리 속성 기반 원소(element), 양식(modality), 극성(polarity) 분포 집계 모듈
 * Rule Set: mallang-astrology-rule-core-v0
 */

import { SIGN_METADATA } from './astrologyRulers.js'

export const SUPPORTED_DISTRIBUTION_BODIES = [
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

export const PERSONAL_DISTRIBUTION_BODIES = ['sun', 'moon', 'mercury', 'venus', 'mars']

/**
 * 카운트 객체에서 최대값을 갖는 리더 키 항목들과 동률(tie) 여부를 판단합니다.
 *
 * @param {Record<string, number>} counts
 * @param {Array<string>} keysOrder 리더 정렬용 고정 키 순서
 * @returns {{ leaders: string[], tie: boolean }}
 */
function findLeadersAndTie(counts, keysOrder) {
  let maxVal = -1
  for (const k of keysOrder) {
    const val = counts[k] || 0
    if (val > maxVal) {
      maxVal = val
    }
  }

  if (maxVal <= 0) {
    return { leaders: [], tie: false }
  }

  const leaders = keysOrder.filter((k) => (counts[k] || 0) === maxVal)
  return {
    leaders,
    tie: leaders.length > 1,
  }
}

/**
 * 주어진 천체 배치 목록에서 특정 천체 ID 세트의 원소/양식/극성 분포를 집계합니다.
 *
 * @param {Array<object>} bodyPlacements [{ id, signId }]
 * @param {Array<string>} targetBodyIds 대상 천체 ID 목록
 * @returns {object} 집계 결과
 */
function aggregateDistributionForBodies(bodyPlacements, targetBodyIds) {
  const mapByPointId = new Map()
  for (const b of bodyPlacements) {
    if (b && b.id && b.signId) {
      mapByPointId.set(b.id, b)
    }
  }

  const elementCounts = { fire: 0, earth: 0, air: 0, water: 0 }
  const modalityCounts = { cardinal: 0, fixed: 0, mutable: 0 }
  const polarityCounts = { masculine: 0, feminine: 0 }

  let aggregatedCount = 0

  for (const bodyId of targetBodyIds) {
    const placement = mapByPointId.get(bodyId)
    if (!placement) continue

    const meta = SIGN_METADATA[placement.signId]
    if (!meta) continue

    elementCounts[meta.element] = (elementCounts[meta.element] || 0) + 1
    modalityCounts[meta.modality] = (modalityCounts[meta.modality] || 0) + 1
    polarityCounts[meta.polarity] = (polarityCounts[meta.polarity] || 0) + 1
    aggregatedCount++
  }

  const elementLeaders = findLeadersAndTie(elementCounts, ['fire', 'earth', 'air', 'water'])
  const modalityLeaders = findLeadersAndTie(modalityCounts, ['cardinal', 'fixed', 'mutable'])
  const polarityLeaders = findLeadersAndTie(polarityCounts, ['masculine', 'feminine'])

  return {
    totalBodiesCount: aggregatedCount,
    elements: {
      counts: elementCounts,
      ...elementLeaders,
    },
    modalities: {
      counts: modalityCounts,
      ...modalityLeaders,
    },
    polarities: {
      counts: polarityCounts,
      ...polarityLeaders,
    },
    ruleId: 'distribution_from_body_signs_v0',
  }
}

/**
 * 전체 10개 지원 천체 및 5개 개인 천체의 분포를 각각 도출합니다.
 *
 * @param {Array<object>} bodyPlacements
 * @returns {object} 전체 분포 도출 결과
 */
export function deriveDistribution(bodyPlacements = []) {
  const overall = aggregateDistributionForBodies(bodyPlacements, SUPPORTED_DISTRIBUTION_BODIES)
  const personal = aggregateDistributionForBodies(bodyPlacements, PERSONAL_DISTRIBUTION_BODIES)

  return {
    overall,
    personal,
    epistemicStatus: 'derived',
    ruleId: 'distribution_from_body_signs_v0',
  }
}
