import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateFourPillars, DEFAULT_SAJU_OPTIONS, SAJU_ENGINE_VERSION } from './fourPillars.js'
import { getSolarLongitude, SOLAR_LONGITUDE_METHOD } from './solarTerms.js'
import { calculateEquationOfTimeMinutes, SOLAR_TIME_METHOD } from './solarTime.js'

// Published Hong Kong Observatory times. HKT is UTC+8.
// These are the 12 minor solar terms used as Four Pillars month boundaries.
// Source pattern: https://www.hko.gov.hk/en/gts/astron2013/Solar_Term_2013.htm
const HKO_MINOR_SOLAR_TERMS = [
  [2013, 285, 1, 5, 12, 34], [2013, 315, 2, 4, 0, 13], [2013, 345, 3, 5, 18, 15],
  [2013, 15, 4, 4, 23, 2], [2013, 45, 5, 5, 16, 18], [2013, 75, 6, 5, 20, 23],
  [2013, 105, 7, 7, 6, 35], [2013, 135, 8, 7, 16, 20], [2013, 165, 9, 7, 19, 16],
  [2013, 195, 10, 8, 10, 58], [2013, 225, 11, 7, 14, 14], [2013, 255, 12, 7, 7, 9],
  [2014, 285, 1, 5, 18, 24], [2014, 315, 2, 4, 6, 3], [2014, 345, 3, 6, 0, 2],
  [2014, 15, 4, 5, 4, 47], [2014, 45, 5, 5, 21, 59], [2014, 75, 6, 6, 2, 3],
  [2014, 105, 7, 7, 12, 15], [2014, 135, 8, 7, 22, 2], [2014, 165, 9, 8, 1, 1],
  [2014, 195, 10, 8, 16, 47], [2014, 225, 11, 7, 20, 7], [2014, 255, 12, 7, 13, 4],
  [2015, 285, 1, 6, 0, 21], [2015, 315, 2, 4, 11, 58], [2015, 345, 3, 6, 5, 56],
  [2015, 15, 4, 5, 10, 39], [2015, 45, 5, 6, 3, 53], [2015, 75, 6, 6, 7, 58],
  [2015, 105, 7, 7, 18, 12], [2015, 135, 8, 8, 4, 1], [2015, 165, 9, 8, 7, 0],
  [2015, 195, 10, 8, 22, 43], [2015, 225, 11, 8, 1, 59], [2015, 255, 12, 7, 18, 53],
  [2016, 285, 1, 6, 6, 8], [2016, 315, 2, 4, 17, 46], [2016, 345, 3, 5, 11, 44],
  [2016, 15, 4, 4, 16, 28], [2016, 45, 5, 5, 9, 42], [2016, 75, 6, 5, 13, 49],
  [2016, 105, 7, 7, 0, 3], [2016, 135, 8, 7, 9, 53], [2016, 165, 9, 7, 12, 51],
  [2016, 195, 10, 8, 4, 33], [2016, 225, 11, 7, 7, 48], [2016, 255, 12, 7, 0, 41],
]

function signedAngularDistance(value, target) {
  return ((value - target + 540) % 360) - 180
}

function findCalculatedBoundary(targetLongitude, publishedHktMs) {
  let low = publishedHktMs - 30 * 60 * 1000
  let high = publishedHktMs + 30 * 60 * 1000

  for (let index = 0; index < 60; index += 1) {
    const middle = (low + high) / 2
    const julianDay = middle / 86400000 + 2440587.5
    if (signedAngularDistance(getSolarLongitude(julianDay), targetLongitude) < 0) low = middle
    else high = middle
  }
  return (low + high) / 2
}

test('minor solar-term boundaries stay within 15 minutes of 48 HKO reference times', () => {
  let maximumErrorMinutes = 0

  HKO_MINOR_SOLAR_TERMS.forEach(([year, longitude, month, day, hour, minute]) => {
    const publishedUtcMs = Date.UTC(year, month - 1, day, hour - 8, minute)
    const calculatedUtcMs = findCalculatedBoundary(longitude, publishedUtcMs)
    const errorMinutes = Math.abs(calculatedUtcMs - publishedUtcMs) / 60000
    maximumErrorMinutes = Math.max(maximumErrorMinutes, errorMinutes)
    assert.ok(
      errorMinutes <= 15,
      `${year}-${String(month).padStart(2, '0')} longitude ${longitude}° differed by ${errorMinutes.toFixed(2)} minutes`,
    )
  })

  assert.ok(maximumErrorMinutes > 0)
})

test('day cycle matches the published HKO 2026-02-01 Byeong-O day', () => {
  const pillars = calculateFourPillars({ birthDate: '2026-02-01', birthTime: '12:00' })
  assert.equal(`${pillars.day.stem}${pillars.day.branch}`, '병오')
  assert.equal(pillars._meta.engineVersion, SAJU_ENGINE_VERSION)
  assert.equal(pillars._meta.solarLongitudeMethod, SOLAR_LONGITUDE_METHOD)
})

test('NOAA equation of time follows the published seasonal magnitude and sign', () => {
  const lateJuly = calculateEquationOfTimeMinutes({ year: 2026, month: 7, day: 31, hour: 12 })
  const earlyNovember = calculateEquationOfTimeMinutes({ year: 2026, month: 11, day: 3, hour: 12 })

  assert.ok(lateJuly > -8 && lateJuly < -5)
  assert.ok(earlyNovember > 15 && earlyNovember < 17)
})

test('apparent solar time can change the hour branch near a boundary', () => {
  const meanSolar = calculateFourPillars(
    { birthDate: '2026-11-03', birthTime: '01:20' },
    { ...DEFAULT_SAJU_OPTIONS, longitudeDegrees: 126.97, useEquationOfTimeCorrection: false },
  )
  const apparentSolar = calculateFourPillars(
    { birthDate: '2026-11-03', birthTime: '01:20' },
    { ...DEFAULT_SAJU_OPTIONS, longitudeDegrees: 126.97 },
  )

  assert.equal(meanSolar.hour.branch, '자')
  assert.equal(apparentSolar.hour.branch, '축')
  assert.equal(apparentSolar._meta.solarTimeMethod, SOLAR_TIME_METHOD)
  assert.ok(apparentSolar._meta.equationOfTimeMinutes > 15)
})

test('solar-midnight rule splits night Zi and early Zi at corrected solar midnight', () => {
  const nightZi = calculateFourPillars(
    { birthDate: '1997-04-22', birthTime: '00:20' },
    { ...DEFAULT_SAJU_OPTIONS, solarTimeOffsetMinutes: 32 },
  )
  const earlyZi = calculateFourPillars(
    { birthDate: '1997-04-22', birthTime: '00:40' },
    { ...DEFAULT_SAJU_OPTIONS, solarTimeOffsetMinutes: 32 },
  )

  assert.equal(`${nightZi.day.stem}${nightZi.day.branch}`, '계사')
  assert.equal(`${earlyZi.day.stem}${earlyZi.day.branch}`, '갑오')
  assert.equal(nightZi.hour.branch, '자')
  assert.equal(earlyZi.hour.branch, '자')
  assert.equal(nightZi._meta.ziPeriod, 'night_zi')
  assert.equal(earlyZi._meta.ziPeriod, 'early_zi')
  assert.equal(nightZi._meta.correctedSolarDateTime, '1997-04-21 23:49')
  assert.equal(earlyZi._meta.correctedSolarDateTime, '1997-04-22 00:09')
})

test('legacy configured Zi-hour rollover remains available only as an explicit profile', () => {
  const beforeConfiguredBoundary = calculateFourPillars(
    { birthDate: '1997-04-21', birthTime: '23:30' },
    { ...DEFAULT_SAJU_OPTIONS, dayBoundaryRule: 'zi-start', rollDayAtZiHour: true, ziHourStart: '23:45' },
  )
  const afterConfiguredBoundary = calculateFourPillars(
    { birthDate: '1997-04-21', birthTime: '23:30' },
    { ...DEFAULT_SAJU_OPTIONS, dayBoundaryRule: 'zi-start', rollDayAtZiHour: true, ziHourStart: '23:15' },
  )

  assert.equal(`${beforeConfiguredBoundary.day.stem}${beforeConfiguredBoundary.day.branch}`, '계사')
  assert.equal(beforeConfiguredBoundary._meta.isRolledOverDay, false)
  assert.equal(`${afterConfiguredBoundary.day.stem}${afterConfiguredBoundary.day.branch}`, '갑오')
  assert.equal(afterConfiguredBoundary._meta.isRolledOverDay, true)
})

test('unsupported timezone and malformed Zi-hour settings fail explicitly', () => {
  assert.throws(
    () => calculateFourPillars(
      { birthDate: '1997-04-21', birthTime: '14:40' },
      { ...DEFAULT_SAJU_OPTIONS, timezone: 'UTC' },
    ),
    /Asia\/Seoul/,
  )
  assert.throws(
    () => calculateFourPillars(
      { birthDate: '1997-04-21', birthTime: '14:40' },
      { ...DEFAULT_SAJU_OPTIONS, ziHourStart: '24:00' },
    ),
    /valid clock range/,
  )
  assert.throws(
    () => calculateFourPillars(
      { birthDate: '1997-04-21', birthTime: '14:40' },
      { ...DEFAULT_SAJU_OPTIONS, dayBoundaryRule: 'unsupported' },
    ),
    /dayBoundaryRule/,
  )
  assert.throws(
    () => calculateFourPillars(
      { birthDate: '1997-04-21', birthTime: '14:40' },
      { ...DEFAULT_SAJU_OPTIONS, longitudeDegrees: 181 },
    ),
    /longitudeDegrees/,
  )
})
