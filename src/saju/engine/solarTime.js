// NOAA General Solar Position Calculations:
// https://gml.noaa.gov/grad/solcalc/solareqns.PDF
export const SOLAR_TIME_METHOD = 'NOAA fractional-year equation of time'

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

function getDayOfYear(year, month, day) {
  const start = Date.UTC(year, 0, 1)
  const current = Date.UTC(year, month - 1, day)
  return Math.floor((current - start) / 86400000) + 1
}

export function calculateEquationOfTimeMinutes({ year, month, day, hour = 12, minute = 0 }) {
  const values = [year, month, day, hour, minute]
  if (!values.every(Number.isFinite)) {
    throw new Error('Equation-of-time inputs must be finite numbers.')
  }

  const daysInYear = isLeapYear(year) ? 366 : 365
  const dayOfYear = getDayOfYear(year, month, day)
  const fractionalHour = hour + minute / 60
  const gamma = (2 * Math.PI / daysInYear) * (dayOfYear - 1 + (fractionalHour - 12) / 24)

  return 229.18 * (
    0.000075
    + 0.001868 * Math.cos(gamma)
    - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma)
    - 0.040849 * Math.sin(2 * gamma)
  )
}
