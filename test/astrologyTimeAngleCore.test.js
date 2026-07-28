/**
 * astrologyTimeAngleCore.test.js
 *
 * Mallang Time & Angle Core v0 단위 및 종합 검증 테스트
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { normalizeDegrees360 } from '../src/astrology/astrologyAngles.js'
import {
  computeJulianDateUtc,
  getDaysInMonth,
  isLeapYear,
  validateUtcInput
} from '../src/astrology/astrologyCalendarTime.js'
import { deriveAscendant, deriveMidheaven } from '../src/astrology/astrologyChartAngles.js'
import {
  deriveEarthRotationAngle,
  deriveGreenwichMeanSiderealTime,
  deriveLocalMeanSiderealTime,
  deriveMeanObliquity,
  fractionalPart
} from '../src/astrology/astrologyEarthOrientation.js'
import { deriveAstrologyTimeAngle } from '../src/astrology/astrologyTimeAngleCore.js'
import { deriveTimeScales } from '../src/astrology/astrologyTimeScales.js'

import {
  j2000InputFixture,
  sample1997InputFixture,
  syntheticGeographicPoleFixture,
  syntheticLongitudeWrapFixture,
  syntheticMissingDut1Fixture,
  syntheticMissingTtFixture,
  unixEpochInputFixture
} from './fixtures/astrologyTimeAngleFixtures.js'

const JD_TOLERANCE = 1e-9
const ANGLE_TOLERANCE = 1e-9

describe('Mallang Time & Angle Core v0', () => {

  describe('1. Gregorian 날짜 및 UTC 입력 검증', () => {
    it('윤년 판정 규칙을 정확하게 준수해야 한다', () => {
      assert.equal(isLeapYear(1900), false)
      assert.equal(isLeapYear(2000), true)
      assert.equal(isLeapYear(2100), false)
      assert.equal(isLeapYear(2024), true)
      assert.equal(isLeapYear(2025), false)
    })

    it('월별 말일 계산이 올바라야 한다', () => {
      assert.equal(getDaysInMonth(1900, 2), 28)
      assert.equal(getDaysInMonth(2000, 2), 29)
      assert.equal(getDaysInMonth(2024, 4), 30)
      assert.equal(getDaysInMonth(2024, 12), 31)
    })

    it('UTC 유효성 및 경계 조건을 엄격하게 검증한다', () => {
      // 1900-02-28 valid
      assert.equal(validateUtcInput({ year: 1900, month: 2, day: 28, hour: 0, minute: 0, second: 0 }).valid, true)
      // 1900-02-29 invalid
      assert.equal(validateUtcInput({ year: 1900, month: 2, day: 29, hour: 0, minute: 0, second: 0 }).valid, false)
      // 2000-02-29 valid
      assert.equal(validateUtcInput({ year: 2000, month: 2, day: 29, hour: 0, minute: 0, second: 0 }).valid, true)
      // 2100-02-29 invalid
      assert.equal(validateUtcInput({ year: 2100, month: 2, day: 29, hour: 0, minute: 0, second: 0 }).valid, false)
      // 2000-13-01 invalid
      assert.equal(validateUtcInput({ year: 2000, month: 13, day: 1, hour: 0, minute: 0, second: 0 }).valid, false)
      // 2000-04-31 invalid
      assert.equal(validateUtcInput({ year: 2000, month: 4, day: 31, hour: 0, minute: 0, second: 0 }).valid, false)
      // hour 24 invalid
      assert.equal(validateUtcInput({ year: 2000, month: 1, day: 1, hour: 24, minute: 0, second: 0 }).valid, false)
      // minute 60 invalid
      assert.equal(validateUtcInput({ year: 2000, month: 1, day: 1, hour: 0, minute: 60, second: 0 }).valid, false)
      // second 60 unsupported (leap second)
      const sec60Res = validateUtcInput({ year: 2000, month: 1, day: 1, hour: 0, minute: 0, second: 60 })
      assert.equal(sec60Res.valid, false)
      assert.equal(sec60Res.availability, 'unsupported')
      assert.equal(sec60Res.reason, 'leap_second_unsupported')

      // string numbers, null, NaN, Infinity invalid
      assert.equal(validateUtcInput({ year: '2000', month: 1, day: 1, hour: 0, minute: 0, second: 0 }).valid, false)
      assert.equal(validateUtcInput({ year: 2000, month: 1, day: 1, hour: NaN, minute: 0, second: 0 }).valid, false)
      assert.equal(validateUtcInput({ year: 2000, month: 1, day: 1, hour: 0, minute: Infinity, second: 0 }).valid, false)
      assert.equal(validateUtcInput(null).valid, false)
    })
  })

  describe('2. Julian Date UTC 계산', () => {
    it('기준 일자의 Julian Date UTC 수치를 수학적으로 검증한다', () => {
      // 2000-01-01 12:00:00 UTC -> 2451545.0
      const jdJ2000 = computeJulianDateUtc({ year: 2000, month: 1, day: 1, hour: 12, minute: 0, second: 0 })
      assert.ok(Math.abs(jdJ2000 - 2451545.0) < JD_TOLERANCE)

      // 1970-01-01 00:00:00 UTC -> 2440587.5
      const jdEpoch = computeJulianDateUtc({ year: 1970, month: 1, day: 1, hour: 0, minute: 0, second: 0 })
      assert.ok(Math.abs(jdEpoch - 2440587.5) < JD_TOLERANCE)

      // 1997-04-21 05:40:00 UTC -> 2450559.736111111...
      const jd1997 = computeJulianDateUtc({ year: 1997, month: 4, day: 21, hour: 5, minute: 40, second: 0 })
      assert.ok(Math.abs(jd1997 - 2450559.736111111) < JD_TOLERANCE)
    })

    it('시간 차이에 따른 상대적 일수 변화를 검증한다', () => {
      const base = { year: 2026, month: 5, day: 10, hour: 0, minute: 0, second: 0 }
      const nextDay = { year: 2026, month: 5, day: 11, hour: 0, minute: 0, second: 0 }
      const halfDay = { year: 2026, month: 5, day: 10, hour: 12, minute: 0, second: 0 }
      const secShift = { year: 2026, month: 5, day: 10, hour: 0, minute: 0, second: 43.2 }

      const jdBase = computeJulianDateUtc(base)
      const jdNext = computeJulianDateUtc(nextDay)
      const jdHalf = computeJulianDateUtc(halfDay)
      const jdSec = computeJulianDateUtc(secShift)

      assert.ok(Math.abs((jdNext - jdBase) - 1.0) < JD_TOLERANCE)
      assert.ok(Math.abs((jdHalf - jdBase) - 0.5) < JD_TOLERANCE)
      assert.ok(Math.abs((jdSec - jdBase) - (43.2 / 86400)) < JD_TOLERANCE)
    })

    it('입력 객체를 절대 수정하지 않는다', () => {
      const orig = { year: 2000, month: 1, day: 1, hour: 12, minute: 0, second: 0 }
      const copy = { ...orig }
      computeJulianDateUtc(orig)
      assert.deepEqual(orig, copy)
    })
  })

  describe('3. 시간척도 변환 (UT1, TT, ΔT)', () => {
    it('명시적 offset으로 UT1, TT, ΔT를 결정론적으로 계산한다', () => {
      const calendarResult = { availability: 'available', julianDateUtc: 2451545.0 }
      const offsets = { ut1MinusUtcSeconds: 86400, ttMinusUtcSeconds: 43200 }
      const res = deriveTimeScales(calendarResult, offsets)

      assert.equal(res.julianDateUt1.availability, 'available')
      assert.ok(Math.abs(res.julianDateUt1.value - 2451546.0) < JD_TOLERANCE)

      assert.equal(res.julianDateTt.availability, 'available')
      assert.ok(Math.abs(res.julianDateTt.value - 2451545.5) < JD_TOLERANCE)

      assert.equal(res.deltaTSeconds.availability, 'available')
      assert.ok(Math.abs(res.deltaTSeconds.value - (-43200)) < 1e-6)
    })

    it('offset 누락 시 암묵적 0을 적용하지 않고 blocked 처리한다', () => {
      const calendarResult = { availability: 'available', julianDateUtc: 2451545.0 }
      const res1 = deriveTimeScales(calendarResult, { ttMinusUtcSeconds: 64.184 })
      assert.equal(res1.julianDateUt1.availability, 'blocked')
      assert.equal(res1.julianDateUt1.reason, 'ut1_minus_utc_unavailable')
      assert.equal(res1.julianDateUt1.value, null)
      assert.equal(res1.julianDateTt.availability, 'available')

      const res2 = deriveTimeScales(calendarResult, { ut1MinusUtcSeconds: 0.1 })
      assert.equal(res2.julianDateTt.availability, 'blocked')
      assert.equal(res2.julianDateTt.reason, 'tt_minus_utc_unavailable')
      assert.equal(res2.julianDateTt.value, null)
      assert.equal(res2.julianDateUt1.availability, 'available')
    })
  })

  describe('4. Earth Rotation Angle (IAU 2000)', () => {
    it('J2000 기준 시각에서 ERA 계산 정확도를 검증한다', () => {
      const ut1Result = { availability: 'available', value: 2451545.0 }
      const era = deriveEarthRotationAngle(ut1Result)

      assert.equal(era.availability, 'available')
      assert.ok(Math.abs(era.degrees - 280.46061837504) < ANGLE_TOLERANCE)
    })

    it('음수 dUT1 환경에서도 fractionalPart가 [0, 1) 범위로 유지된다', () => {
      assert.equal(fractionalPart(-0.25), 0.75)
      assert.equal(fractionalPart(-1.1), 0.8999999999999999)

      const ut1ResultPast = { availability: 'available', value: 2400000.0 }
      const eraPast = deriveEarthRotationAngle(ut1ResultPast)
      assert.equal(eraPast.availability, 'available')
      assert.ok(eraPast.turns >= 0 && eraPast.turns < 1)
      assert.ok(eraPast.degrees >= 0 && eraPast.degrees < 360)
    })
  })

  describe('5. 평균 황도경사 (IAU 2006)', () => {
    it('J2000 기준 시각에서 평균 황도경사를 검증한다', () => {
      const ttResult = { availability: 'available', value: 2451545.0 }
      const obl = deriveMeanObliquity(ttResult)

      assert.equal(obl.availability, 'available')
      assert.ok(Math.abs(obl.arcseconds - 84381.406) < 1e-6)
      assert.ok(Math.abs(obl.degrees - 23.439279444444445) < ANGLE_TOLERANCE)
    })
  })

  describe('6. Greenwich Mean Sidereal Time (IAU 2006)', () => {
    it('J2000 기준 시각에서 GMST 계산 결과를 검증한다', () => {
      const ut1Result = { availability: 'available', value: 2451545.0 }
      const ttResult = { availability: 'available', value: 2451545.0 }
      const era = deriveEarthRotationAngle(ut1Result)
      const gmst = deriveGreenwichMeanSiderealTime(era, ttResult)

      assert.equal(gmst.availability, 'available')
      assert.ok(Math.abs(gmst.degrees - 280.4606224044844) < ANGLE_TOLERANCE)
    })
  })

  describe('7. Local Mean Sidereal Time (LMST)', () => {
    it('동경 양수/음수 및 180도 wrap 경계 조건을 검증한다', () => {
      const gmstResult = { availability: 'available', degrees: 350.0 }

      const lmst0 = deriveLocalMeanSiderealTime(gmstResult, { longitudeDegreesEast: 0.0 })
      assert.ok(Math.abs(lmst0.degrees - 350.0) < ANGLE_TOLERANCE)

      const lmstEast = deriveLocalMeanSiderealTime(gmstResult, { longitudeDegreesEast: 20.0 })
      assert.ok(Math.abs(lmstEast.degrees - 10.0) < ANGLE_TOLERANCE)

      const lmstWest = deriveLocalMeanSiderealTime({ availability: 'available', degrees: 10.0 }, { longitudeDegreesEast: -20.0 })
      assert.ok(Math.abs(lmstWest.degrees - 350.0) < ANGLE_TOLERANCE)

      const lmst180Pos = deriveLocalMeanSiderealTime(gmstResult, { longitudeDegreesEast: 180.0 })
      const lmst180Neg = deriveLocalMeanSiderealTime(gmstResult, { longitudeDegreesEast: -180.0 })
      assert.ok(Math.abs(lmst180Pos.degrees - lmst180Neg.degrees) < ANGLE_TOLERANCE)
    })
  })

  describe('8. 평균 MC 사분면 검증', () => {
    it('LMST 사분면(0°, 90°, 180°, 270°)에 따른 MC 반환값을 검증한다', () => {
      const oblResult = { availability: 'available', degrees: 23.439279444444445 }

      const mc0 = deriveMidheaven({ availability: 'available', degrees: 0 }, oblResult)
      assert.ok(Math.abs(mc0.longitudeDegrees - 0) < ANGLE_TOLERANCE)

      const mc90 = deriveMidheaven({ availability: 'available', degrees: 90 }, oblResult)
      assert.ok(Math.abs(mc90.longitudeDegrees - 90) < ANGLE_TOLERANCE)

      const mc180 = deriveMidheaven({ availability: 'available', degrees: 180 }, oblResult)
      assert.ok(Math.abs(mc180.longitudeDegrees - 180) < ANGLE_TOLERANCE)

      const mc270 = deriveMidheaven({ availability: 'available', degrees: 270 }, oblResult)
      assert.ok(Math.abs(mc270.longitudeDegrees - 270) < ANGLE_TOLERANCE)
    })
  })

  describe('9. 평균 ASC 방향 및 사분면 검증', () => {
    it('적도(위도 0°)에서 LMST 사분면에 따른 ASC 반환값을 검증한다', () => {
      const oblResult = { availability: 'available', degrees: 23.439279444444445 }
      const locEq = { geographicLatitudeDegrees: 0, longitudeDegreesEast: 0 }

      const asc0 = deriveAscendant({ availability: 'available', degrees: 0 }, oblResult, locEq)
      assert.ok(Math.abs(asc0.longitudeDegrees - 90) < ANGLE_TOLERANCE)

      const asc90 = deriveAscendant({ availability: 'available', degrees: 90 }, oblResult, locEq)
      assert.ok(Math.abs(asc90.longitudeDegrees - 180) < ANGLE_TOLERANCE)

      const asc180 = deriveAscendant({ availability: 'available', degrees: 180 }, oblResult, locEq)
      assert.ok(Math.abs(asc180.longitudeDegrees - 270) < ANGLE_TOLERANCE)

      const asc270 = deriveAscendant({ availability: 'available', degrees: 270 }, oblResult, locEq)
      assert.ok(Math.abs(asc270.longitudeDegrees - 0) < ANGLE_TOLERANCE)
    })

    it('지리적 북극과 남극(|lat| >= 90 - 1e-10)에서 ASC가 차단(blocked)되는지 검증한다', () => {
      const oblResult = { availability: 'available', degrees: 23.439279444444445 }
      const lmst = { availability: 'available', degrees: 45 }

      const poleNorth = deriveAscendant(lmst, oblResult, { geographicLatitudeDegrees: 90.0 })
      assert.equal(poleNorth.availability, 'blocked')
      assert.equal(poleNorth.reason, 'ascendant_undefined_at_geographic_pole')
      assert.equal(poleNorth.fallbackApplied, false)
      assert.equal(poleNorth.longitudeDegrees, null)

      const poleSouth = deriveAscendant(lmst, oblResult, { geographicLatitudeDegrees: -90.0 })
      assert.equal(poleSouth.availability, 'blocked')
      assert.equal(poleSouth.reason, 'ascendant_undefined_at_geographic_pole')
    })
  })

  describe('10. 기능별 availability 매트릭스', () => {
    it('입력 제공 조건에 따라 부분 성공 및 blocked 상태를 독립 처리한다', () => {
      // 1. UTC만 있음
      const resUtcOnly = deriveAstrologyTimeAngle(unixEpochInputFixture)
      assert.equal(resUtcOnly.calendar.availability, 'available')
      assert.equal(resUtcOnly.timeScales.julianDateUt1.availability, 'blocked')
      assert.equal(resUtcOnly.timeScales.julianDateTt.availability, 'blocked')
      assert.equal(resUtcOnly.earthOrientation.earthRotationAngleDegrees.availability, 'blocked')
      assert.equal(resUtcOnly.angles.midheaven.availability, 'blocked')

      // 2. DUT1만 있음
      const resDut1 = deriveAstrologyTimeAngle(syntheticMissingTtFixture)
      assert.equal(resDut1.calendar.availability, 'available')
      assert.equal(resDut1.timeScales.julianDateUt1.availability, 'available')
      assert.equal(resDut1.earthOrientation.earthRotationAngleDegrees.availability, 'available')
      assert.equal(resDut1.timeScales.julianDateTt.availability, 'blocked')
      assert.equal(resDut1.earthOrientation.meanObliquityDegrees.availability, 'blocked')

      // 3. TT-UTC만 있음
      const resTt = deriveAstrologyTimeAngle(syntheticMissingDut1Fixture)
      assert.equal(resTt.calendar.availability, 'available')
      assert.equal(resTt.timeScales.julianDateTt.availability, 'available')
      assert.equal(resTt.earthOrientation.meanObliquityDegrees.availability, 'available')
      assert.equal(resTt.timeScales.julianDateUt1.availability, 'blocked')
      assert.equal(resTt.earthOrientation.earthRotationAngleDegrees.availability, 'blocked')

      // 4. 극점 (North pole)
      const resPole = deriveAstrologyTimeAngle(syntheticGeographicPoleFixture)
      assert.equal(resPole.angles.midheaven.availability, 'available')
      assert.equal(resPole.angles.ascendant.availability, 'blocked')
      assert.equal(resPole.angles.ascendant.reason, 'ascendant_undefined_at_geographic_pole')
      assert.deepEqual(resPole.rawAngles, { midheaven: { longitudeDegrees: resPole.angles.midheaven.longitudeDegrees } })
    })
  })

  describe('11. 상태 및 근거(Evidence) 계약', () => {
    it('입력 상태 보존 및 메타데이터를 올바르게 구성한다', () => {
      const res = deriveAstrologyTimeAngle(sample1997InputFixture)
      assert.equal(res.schemaVersion, 'astrology-time-angle-result-v0')
      assert.equal(res.ruleSetVersion, 'mallang-time-angle-core-v0')
      assert.equal(res.modelId, 'iau2000-era__iau2006-gmst-mean-obliquity')
      assert.equal(res.candidateId, 'sample_1997')
      assert.equal(res.inputStatus, 'confirmed')
      assert.equal(res.verificationStatus, 'confirmed')
      assert.equal(res.timeScaleSourceStatus, 'fixture_supplied')
      assert.equal(res.availableForInterpretation, false)
      assert.equal(res.integrationStatus, 'not_connected')

      assert.equal(res.calendar.ruleId, 'julian_date_utc_proleptic_gregorian_v0')
      assert.ok(res.calendar.sourceRefs.includes('input.utc'))
    })
  })

  describe('12. 결정론과 입력 독립성', () => {
    it('동일한 입력을 여러 번 실행해도 깊은 동등성(deep equality)을 유지한다', () => {
      const res1 = deriveAstrologyTimeAngle(j2000InputFixture)
      const res2 = deriveAstrologyTimeAngle(j2000InputFixture)
      assert.deepEqual(res1, res2)
    })

    it('입력 객체의 Key 순서를 바꾸어도 결과가 일치해야 한다', () => {
      const reorderedInput = {
        location: j2000InputFixture.location,
        utc: j2000InputFixture.utc,
        timeScaleOffsets: j2000InputFixture.timeScaleOffsets,
        calendar: j2000InputFixture.calendar,
        schemaVersion: j2000InputFixture.schemaVersion,
        candidateId: j2000InputFixture.candidateId,
        inputStatus: j2000InputFixture.inputStatus,
        verificationStatus: j2000InputFixture.verificationStatus
      }
      const resStandard = deriveAstrologyTimeAngle(j2000InputFixture)
      const resReordered = deriveAstrologyTimeAngle(reorderedInput)
      assert.deepEqual(resStandard, resReordered)
    })
  })

  describe('13. 비대칭 수치 fixture 및 MC/ASC 방향 검증', () => {
    const obl = { availability: 'available', degrees: 23.439279444 }

    it('사례 1: LMST 37°, 황도경사 23.439279444°, 위도 +37.5°', () => {
      const lmst = { availability: 'available', degrees: 37.0 }
      const locNorth = { geographicLatitudeDegrees: 37.5, longitudeDegreesEast: 0.0 }
      const locSouth = { geographicLatitudeDegrees: -37.5, longitudeDegreesEast: 0.0 }

      const mc = deriveMidheaven(lmst, obl)
      const ascNorth = deriveAscendant(lmst, obl, locNorth)
      const ascSouth = deriveAscendant(lmst, obl, locSouth)

      // 1. finite 및 [0, 360) 범위 검증
      assert.ok(Number.isFinite(mc.longitudeDegrees) && mc.longitudeDegrees >= 0 && mc.longitudeDegrees < 360)
      assert.ok(Number.isFinite(ascNorth.longitudeDegrees) && ascNorth.longitudeDegrees >= 0 && ascNorth.longitudeDegrees < 360)

      // 2. MC와 ASC 붕괴(동일값) 방지
      assert.notEqual(mc.longitudeDegrees, ascNorth.longitudeDegrees)

      // 3. 위도 부호 변경이 ASC에는 영향을 주지만 MC에는 영향을 주지 않음
      const mcSouth = deriveMidheaven(lmst, obl)
      assert.equal(mc.longitudeDegrees, mcSouth.longitudeDegrees)
      assert.notEqual(ascNorth.longitudeDegrees, ascSouth.longitudeDegrees)

      // 4. LMST에 360°를 더해도 동일한 결과
      const lmstWrapped = { availability: 'available', degrees: 397.0 }
      const mcWrapped = deriveMidheaven(lmstWrapped, obl)
      const ascWrapped = deriveAscendant(lmstWrapped, obl, locNorth)
      assert.ok(Math.abs(mc.longitudeDegrees - mcWrapped.longitudeDegrees) < ANGLE_TOLERANCE)
      assert.ok(Math.abs(ascNorth.longitudeDegrees - ascWrapped.longitudeDegrees) < ANGLE_TOLERANCE)

      // 5. 위도를 0°로 변경 시 적도 계약(LMST 37°에서 ascEq) 연결
      const ascEq = deriveAscendant(lmst, obl, { geographicLatitudeDegrees: 0.0, longitudeDegreesEast: 0.0 })
      assert.ok(Number.isFinite(ascEq.longitudeDegrees) && ascEq.longitudeDegrees >= 0 && ascEq.longitudeDegrees < 360)
    })

    it('사례 2: LMST 123°, 황도경사 23.439279444°, 위도 -33.9°', () => {
      const lmst = { availability: 'available', degrees: 123.0 }
      const locSouth = { geographicLatitudeDegrees: -33.9, longitudeDegreesEast: 0.0 }

      const mc = deriveMidheaven(lmst, obl)
      const asc = deriveAscendant(lmst, obl, locSouth)

      assert.ok(Number.isFinite(mc.longitudeDegrees) && mc.longitudeDegrees >= 0 && mc.longitudeDegrees < 360)
      assert.ok(Number.isFinite(asc.longitudeDegrees) && asc.longitudeDegrees >= 0 && asc.longitudeDegrees < 360)
      assert.notEqual(mc.longitudeDegrees, asc.longitudeDegrees)
    })

    it('사례 3: LMST 281°, 황도경사 23.439279444°, 위도 +51.5°', () => {
      const lmst = { availability: 'available', degrees: 281.0 }
      const locNorth = { geographicLatitudeDegrees: 51.5, longitudeDegreesEast: 0.0 }

      const mc = deriveMidheaven(lmst, obl)
      const asc = deriveAscendant(lmst, obl, locNorth)

      assert.ok(Number.isFinite(mc.longitudeDegrees) && mc.longitudeDegrees >= 0 && mc.longitudeDegrees < 360)
      assert.ok(Number.isFinite(asc.longitudeDegrees) && asc.longitudeDegrees >= 0 && asc.longitudeDegrees < 360)
      assert.notEqual(mc.longitudeDegrees, asc.longitudeDegrees)
    })
  })
})
