import { getBaziYearAndMonth } from './solarTerms.js'
import { STEMS, BRANCHES } from './constants.js'
import { calculateEquationOfTimeMinutes, SOLAR_TIME_METHOD } from './solarTime.js'

export const SAJU_ENGINE_VERSION = '2.5'

export const DEFAULT_SAJU_OPTIONS = {
  timezone: 'Asia/Seoul',
  useSolarTimeCorrection: true,
  useEquationOfTimeCorrection: true,
  longitudeDegrees: null,
  standardMeridianDegrees: 135,
  solarTimeOffsetMinutes: 30,
  dayBoundaryRule: 'solar-midnight-split-zi',
  ziHourStart: '23:00',
  rollDayAtZiHour: false,
}

function parseClockMinutes(value, optionName) {
  const match = /^(\d{2}):(\d{2})$/.exec(value || '')
  if (!match) throw new Error(`${optionName} must use HH:MM format.`)

  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour > 23 || minute > 59) throw new Error(`${optionName} is outside the valid clock range.`)
  return hour * 60 + minute
}

export function calculateFourPillars(params, options = DEFAULT_SAJU_OPTIONS) {
  const { birthDate, birthTime } = params
  const opts = { ...DEFAULT_SAJU_OPTIONS, ...options }
  if (opts.timezone !== 'Asia/Seoul') {
    throw new Error('The four-pillars engine currently supports Asia/Seoul only.')
  }
  if (!Number.isFinite(opts.solarTimeOffsetMinutes)) {
    throw new Error('solarTimeOffsetMinutes must be a finite number.')
  }
  if (opts.longitudeDegrees != null && (!Number.isFinite(opts.longitudeDegrees) || Math.abs(opts.longitudeDegrees) > 180)) {
    throw new Error('longitudeDegrees must be between -180 and 180.')
  }
  if (!Number.isFinite(opts.standardMeridianDegrees) || Math.abs(opts.standardMeridianDegrees) > 180) {
    throw new Error('standardMeridianDegrees must be between -180 and 180.')
  }
  const [yearStr, monthStr, dayStr] = birthDate.split('-')
  const [hourStr, minStr] = birthTime ? birthTime.split(':') : ['12', '00']
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  const day = parseInt(dayStr, 10)
  const hour = parseInt(hourStr, 10)
  const min = parseInt(minStr, 10)

  const solarTerm = getBaziYearAndMonth(year, month, day, hour, min)
  const { baziYear, monthIndex } = solarTerm

  // 1. Year Pillar: 1984 is Gap-Ja (甲子), index 0 in the 60-cycle.
  const yearOffset = (baziYear - 1984) % 60
  const yearIndex = yearOffset >= 0 ? yearOffset : 60 + yearOffset
  const yearStem = STEMS[yearIndex % 10]
  const yearBranch = BRANCHES[yearIndex % 12]

  // 2. Month Pillar
  const monthBranchIndex = (monthIndex + 1) % 12
  const monthBranch = BRANCHES[monthBranchIndex]
  const yearStemIndex = yearIndex % 10
  const monthStemStartOffset = ((yearStemIndex % 5) * 2 + 2) % 10
  const monthStemIndex = (monthStemStartOffset + monthIndex - 1) % 10
  const monthStem = STEMS[monthStemIndex]

  // 3. Day Pillar: 1970-01-01 is Sin-Sa (辛巳), index 17.
  const daysSinceEpoch = Math.floor(Date.UTC(year, month - 1, day) / 86400000)
  let dayIndex = (daysSinceEpoch + 17) % 60
  if (dayIndex < 0) dayIndex += 60

  const totalMins = hour * 60 + min
  const ziStartMins = parseClockMinutes(opts.ziHourStart, 'ziHourStart')
  if (!['solar-midnight-split-zi', 'zi-start'].includes(opts.dayBoundaryRule)) {
    throw new Error('dayBoundaryRule must be solar-midnight-split-zi or zi-start.')
  }

  const longitudeOffsetMinutes = opts.longitudeDegrees == null
    ? opts.solarTimeOffsetMinutes
    : (opts.standardMeridianDegrees - opts.longitudeDegrees) * 4
  const meanSolarCorrectionMinutes = opts.useSolarTimeCorrection ? -longitudeOffsetMinutes : 0
  const equationOfTimeMinutes = opts.useSolarTimeCorrection && opts.useEquationOfTimeCorrection
    ? calculateEquationOfTimeMinutes({ year, month, day, hour, minute: min })
    : 0
  const apparentSolarCorrectionMinutes = meanSolarCorrectionMinutes + equationOfTimeMinutes
  const correctedSolarDate = new Date(
    Date.UTC(year, month - 1, day, hour, min) + apparentSolarCorrectionMinutes * 60000,
  )
  const correctedYear = correctedSolarDate.getUTCFullYear()
  const correctedMonth = correctedSolarDate.getUTCMonth() + 1
  const correctedDay = correctedSolarDate.getUTCDate()
  const correctedHour = correctedSolarDate.getUTCHours()
  const correctedMinute = correctedSolarDate.getUTCMinutes()
  const correctedSecond = correctedSolarDate.getUTCSeconds()
  const correctedTotalMins = correctedHour * 60 + correctedMinute + correctedSecond / 60
  const civilDayMs = Date.UTC(year, month - 1, day)
  const correctedDayMs = Date.UTC(correctedYear, correctedMonth - 1, correctedDay)
  const solarDayShift = Math.round((correctedDayMs - civilDayMs) / 86400000)

  let isRolledOverDay = false
  if (opts.dayBoundaryRule === 'solar-midnight-split-zi') {
    dayIndex = (dayIndex + solarDayShift + 60) % 60
    isRolledOverDay = solarDayShift !== 0
  } else if (opts.rollDayAtZiHour && totalMins >= ziStartMins) {
    dayIndex = (dayIndex + 1) % 60
    isRolledOverDay = true
  }

  const dayStemIndex = dayIndex % 10
  const dayBranchIndex = dayIndex % 12
  const dayStem = STEMS[dayStemIndex]
  const dayBranch = BRANCHES[dayBranchIndex]

  // 4. Hour Pillar. The configured correction shifts civil time to local solar time.
  let hourBranchIndex = Math.floor((correctedTotalMins + 60) / 120) % 12
  if (hourBranchIndex < 0) hourBranchIndex += 12
  const hourBranch = BRANCHES[hourBranchIndex]
  const hourStemStartOffset = (dayStemIndex % 5) * 2
  const hourStemIndex = (hourStemStartOffset + hourBranchIndex) % 10
  const hourStem = STEMS[hourStemIndex]

  return {
    year: { stem: yearStem, branch: yearBranch },
    month: { stem: monthStem, branch: monthBranch },
    day: { stem: dayStem, branch: dayBranch },
    hour: { stem: hourStem, branch: hourBranch },
    _meta: {
      engineVersion: SAJU_ENGINE_VERSION,
      isRolledOverDay,
      dayBoundaryRule: opts.dayBoundaryRule,
      solarTimeMethod: opts.useEquationOfTimeCorrection ? SOLAR_TIME_METHOD : 'mean solar time only',
      longitudeDegrees: opts.longitudeDegrees,
      standardMeridianDegrees: opts.standardMeridianDegrees,
      meanSolarCorrectionMinutes,
      equationOfTimeMinutes,
      apparentSolarCorrectionMinutes,
      solarDayShift,
      correctedSolarDateTime: `${String(correctedYear).padStart(4, '0')}-${String(correctedMonth).padStart(2, '0')}-${String(correctedDay).padStart(2, '0')} ${String(correctedHour).padStart(2, '0')}:${String(correctedMinute).padStart(2, '0')}`,
      ziPeriod: hourBranchIndex === 0
        ? correctedTotalMins >= 23 * 60 ? 'night_zi' : 'early_zi'
        : null,
      ziStartMins,
      ...solarTerm,
    },
  }
}
