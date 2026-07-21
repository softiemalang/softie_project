import { getBaziYearAndMonth } from './solarTerms.js'
import { STEMS, BRANCHES } from './constants.js'

export const SAJU_ENGINE_VERSION = '2.3'

export const DEFAULT_SAJU_OPTIONS = {
  timezone: 'Asia/Seoul',
  useSolarTimeCorrection: true,
  solarTimeOffsetMinutes: 30,
  ziHourStart: '23:30',
  rollDayAtZiHour: true,
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
  let isRolledOverDay = false
  if (opts.rollDayAtZiHour && totalMins >= ziStartMins) {
    dayIndex = (dayIndex + 1) % 60
    isRolledOverDay = true
  }

  const dayStemIndex = dayIndex % 10
  const dayBranchIndex = dayIndex % 12
  const dayStem = STEMS[dayStemIndex]
  const dayBranch = BRANCHES[dayBranchIndex]

  // 4. Hour Pillar. The configured correction shifts civil time to local solar time.
  const offsetMins = opts.useSolarTimeCorrection ? opts.solarTimeOffsetMinutes : 0
  let hourBranchIndex = Math.floor((totalMins + 60 - offsetMins) / 120) % 12
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
      ziStartMins,
      ...solarTerm,
    },
  }
}
