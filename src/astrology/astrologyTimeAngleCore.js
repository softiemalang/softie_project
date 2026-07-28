/**
 * astrologyTimeAngleCore.js
 *
 * Mallang Time & Angle Core v0 진입점 모듈
 * 정규화된 UTC 시각, 관측지 위경도, 명시적 시간척도 offset을 받아
 * Julian Date, ERA, Mean Obliquity, GMST, LMST, Mean MC/ASC를 결정론적으로 계산합니다.
 *
 * Rule Set: mallang-time-angle-core-v0
 */

import { ANGLE_MODEL_ID, deriveCalendarTime, TIME_ANGLE_RULE_SET_VERSION } from './astrologyCalendarTime.js'

import { deriveAscendant, deriveMidheaven } from './astrologyChartAngles.js'
import {
  deriveEarthRotationAngle,
  deriveGreenwichMeanSiderealTime,
  deriveLocalMeanSiderealTime,
  deriveMeanObliquity
} from './astrologyEarthOrientation.js'
import { deriveTimeScales } from './astrologyTimeScales.js'

/**
 * 시간 및 지구 회전/각도 계산의 메인 코어 함수입니다.
 * 외부 천문 라이브러리, 원격 API, Date 파싱에 의존하지 않는 순수 결정론적 계산을 수행합니다.
 *
 * @param {object} input
 * @returns {object} astrology-time-angle-result-v0 계약에 따른 결과 객체
 */
export function deriveAstrologyTimeAngle(input) {
  const candidateId = input?.candidateId ?? null
  const inputStatus = input?.inputStatus ?? null
  const verificationStatus = input?.verificationStatus ?? null
  const timeScaleSourceStatus = input?.timeScaleOffsets?.sourceStatus ?? null

  const calendar = deriveCalendarTime(input)
  const timeScales = deriveTimeScales(calendar, input?.timeScaleOffsets)

  const era = deriveEarthRotationAngle(timeScales.julianDateUt1)
  const meanObliquity = deriveMeanObliquity(timeScales.julianDateTt)
  const gmst = deriveGreenwichMeanSiderealTime(era, timeScales.julianDateTt)
  const lmst = deriveLocalMeanSiderealTime(gmst, input?.location)

  const midheaven = deriveMidheaven(lmst, meanObliquity)
  const ascendant = deriveAscendant(lmst, meanObliquity, input?.location)

  // rawAngles 구성: 후속 Raw Chart Composer용 (blocked 항목은 0으로 채우지 않음)
  const rawAngles = {}
  if (ascendant.availability === 'available') {
    rawAngles.ascendant = { longitudeDegrees: ascendant.longitudeDegrees }
  }
  if (midheaven.availability === 'available') {
    rawAngles.midheaven = { longitudeDegrees: midheaven.longitudeDegrees }
  }

  // blocked/unsupported 기능 수집
  const blockedFeatures = []
  const unsupportedFeatures = []

  const checkFeature = (name, obj) => {
    if (!obj) return
    if (obj.availability === 'blocked') {
      blockedFeatures.push({ feature: name, reason: obj.reason || 'unavailable' })
    } else if (obj.availability === 'unsupported' || obj.availability === 'invalid') {
      unsupportedFeatures.push({ feature: name, reason: obj.reason || 'unsupported' })
    }
  }

  checkFeature('calendar.julianDateUtc', calendar)
  checkFeature('timeScales.julianDateUt1', timeScales.julianDateUt1)
  checkFeature('timeScales.julianDateTt', timeScales.julianDateTt)
  checkFeature('timeScales.deltaTSeconds', timeScales.deltaTSeconds)
  checkFeature('earthOrientation.earthRotationAngleDegrees', era)
  checkFeature('earthOrientation.meanObliquityDegrees', meanObliquity)
  checkFeature('earthOrientation.greenwichMeanSiderealTimeDegrees', gmst)
  checkFeature('earthOrientation.localMeanSiderealTimeDegrees', lmst)
  checkFeature('angles.midheaven', midheaven)
  checkFeature('angles.ascendant', ascendant)

  return {
    schemaVersion: 'astrology-time-angle-result-v0',
    ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
    modelId: ANGLE_MODEL_ID,
    calendarModel: 'proleptic-gregorian-v0',
    siderealTimeType: 'mean',
    obliquityType: 'mean',
    candidateId,
    inputStatus,
    verificationStatus,
    timeScaleSourceStatus,
    availableForInterpretation: false,
    integrationStatus: 'not_connected',
    calendar,
    timeScales,
    earthOrientation: {
      earthRotationAngleDegrees: era,
      meanObliquityDegrees: meanObliquity,
      greenwichMeanSiderealTimeDegrees: gmst,
      localMeanSiderealTimeDegrees: lmst
    },
    angles: {
      midheaven,
      ascendant
    },
    rawAngles,
    blockedFeatures,
    unsupportedFeatures
  }
}
