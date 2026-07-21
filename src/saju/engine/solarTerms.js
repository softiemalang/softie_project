const DEG_TO_RAD = Math.PI / 180
const MINUTES_PER_SOLAR_DEGREE = 1440 / 0.98564736

export const SOLAR_LONGITUDE_METHOD = 'meeus-noaa-apparent-v1'
export const SOLAR_TERM_UNCERTAINTY_MINUTES = 20

const SAJU_MONTH_BOUNDARIES = Array.from({ length: 12 }, (_, index) => (315 + index * 30) % 360)

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360
}

function signedAngularDistance(value, target) {
  return ((value - target + 540) % 360) - 180
}

function utcMsToJulianDay(utcMs) {
  return (utcMs / 86400000) + 2440587.5
}

function formatKstDateTime(utcMs) {
  return new Date(utcMs + 9 * 60 * 60 * 1000).toISOString().slice(0, 16)
}

/**
 * Apparent geocentric solar longitude.
 *
 * This follows the compact Meeus equations used by NOAA's solar calculator.
 * Reference: https://gml.noaa.gov/grad/solcalc/calcdetails.html
 * The result is deterministic and materially more accurate near solar-term
 * boundaries than the previous single-anomaly approximation, while remaining
 * dependency-free for the browser bundle.
 */
export function getSolarLongitude(jd) {
  const julianCentury = (jd - 2451545.0) / 36525
  const meanLongitude = normalizeDegrees(
    280.46646 + julianCentury * (36000.76983 + julianCentury * 0.0003032),
  )
  const meanAnomaly = 357.52911 + julianCentury * (35999.05029 - 0.0001537 * julianCentury)
  const anomalyRadians = meanAnomaly * DEG_TO_RAD
  const equationOfCenter = (
    Math.sin(anomalyRadians) * (1.914602 - julianCentury * (0.004817 + 0.000014 * julianCentury))
    + Math.sin(2 * anomalyRadians) * (0.019993 - 0.000101 * julianCentury)
    + Math.sin(3 * anomalyRadians) * 0.000289
  )
  const ascendingNode = (125.04 - 1934.136 * julianCentury) * DEG_TO_RAD

  return normalizeDegrees(meanLongitude + equationOfCenter - 0.00569 - 0.00478 * Math.sin(ascendingNode))
}

function getNearestMonthBoundary(solarLongitude) {
  return SAJU_MONTH_BOUNDARIES.reduce((nearest, boundary) => {
    const distance = signedAngularDistance(solarLongitude, boundary)
    if (!nearest || Math.abs(distance) < Math.abs(nearest.distanceDegrees)) {
      return { longitude: boundary, distanceDegrees: distance }
    }
    return nearest
  }, null)
}

export function getBaziYearAndMonth(year, month, day, hour, min) {
  // This engine currently accepts Korea Standard Time only (UTC+9).
  const kstMs = Date.UTC(year, month - 1, day, hour - 9, min)
  const jd = (kstMs / 86400000) + 2440587.5
  const solarLongitude = getSolarLongitude(jd)
  const nearestBoundary = getNearestMonthBoundary(solarLongitude)
  const boundaryDistanceMinutes = nearestBoundary.distanceDegrees * MINUTES_PER_SOLAR_DEGREE

  let baziYear = year
  // Before Ipchun (315 degrees), January/February belongs to the prior Bazi year.
  if (month <= 2 && solarLongitude < 315 && solarLongitude > 270) {
    baziYear -= 1
  }

  let monthIndex
  if (solarLongitude >= 315 && solarLongitude < 345) monthIndex = 1
  else if (solarLongitude >= 345 || solarLongitude < 15) monthIndex = 2
  else if (solarLongitude >= 15 && solarLongitude < 45) monthIndex = 3
  else if (solarLongitude >= 45 && solarLongitude < 75) monthIndex = 4
  else if (solarLongitude >= 75 && solarLongitude < 105) monthIndex = 5
  else if (solarLongitude >= 105 && solarLongitude < 135) monthIndex = 6
  else if (solarLongitude >= 135 && solarLongitude < 165) monthIndex = 7
  else if (solarLongitude >= 165 && solarLongitude < 195) monthIndex = 8
  else if (solarLongitude >= 195 && solarLongitude < 225) monthIndex = 9
  else if (solarLongitude >= 225 && solarLongitude < 255) monthIndex = 10
  else if (solarLongitude >= 255 && solarLongitude < 285) monthIndex = 11
  else monthIndex = 12

  return {
    baziYear,
    monthIndex,
    solarLongitude,
    solarLongitudeMethod: SOLAR_LONGITUDE_METHOD,
    nearestBoundaryLongitude: nearestBoundary.longitude,
    boundaryDistanceMinutes,
    boundaryUncertaintyMinutes: SOLAR_TERM_UNCERTAINTY_MINUTES,
    isNearSolarTermBoundary: Math.abs(boundaryDistanceMinutes) <= SOLAR_TERM_UNCERTAINTY_MINUTES,
  }
}

export function getAdjacentBaziMonthBoundary(year, month, day, hour, min, direction) {
  if (!['forward', 'backward'].includes(direction)) {
    throw new Error('direction must be forward or backward.')
  }

  const birthUtcMs = Date.UTC(year, month - 1, day, hour - 9, min)
  const birthLongitude = getSolarLongitude(utcMsToJulianDay(birthUtcMs))
  const distances = SAJU_MONTH_BOUNDARIES.map((longitude) => ({
    longitude,
    distanceDegrees: direction === 'forward'
      ? normalizeDegrees(longitude - birthLongitude)
      : normalizeDegrees(birthLongitude - longitude),
  }))
  const nearest = distances.reduce((best, candidate) =>
    candidate.distanceDegrees < best.distanceDegrees ? candidate : best)
  const sign = direction === 'forward' ? 1 : -1
  let boundaryUtcMs = birthUtcMs + sign * nearest.distanceDegrees * MINUTES_PER_SOLAR_DEGREE * 60000

  for (let iteration = 0; iteration < 8; iteration += 1) {
    const longitude = getSolarLongitude(utcMsToJulianDay(boundaryUtcMs))
    const errorDegrees = signedAngularDistance(longitude, nearest.longitude)
    boundaryUtcMs -= errorDegrees * MINUTES_PER_SOLAR_DEGREE * 60000
  }

  return {
    direction,
    longitude: nearest.longitude,
    utcIso: new Date(boundaryUtcMs).toISOString(),
    kstDateTime: formatKstDateTime(boundaryUtcMs),
    distanceMinutes: Math.abs(boundaryUtcMs - birthUtcMs) / 60000,
    method: SOLAR_LONGITUDE_METHOD,
  }
}
