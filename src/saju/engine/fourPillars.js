import { getBaziYearAndMonth } from './solarTerms.js';
import { STEMS, BRANCHES } from './constants.js';

export const DEFAULT_SAJU_OPTIONS = {
  timezone: 'Asia/Seoul',
  useSolarTimeCorrection: true,
  solarTimeOffsetMinutes: 30,
  ziHourStart: '23:30',
  rollDayAtZiHour: true
};

export function calculateFourPillars(params, options = DEFAULT_SAJU_OPTIONS) {
  const { birthDate, birthTime } = params;
  const opts = { ...DEFAULT_SAJU_OPTIONS, ...options };
  
  const [yearStr, monthStr, dayStr] = birthDate.split('-');
  const [hourStr, minStr] = birthTime ? birthTime.split(':') : ['12', '00'];
  
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  const hour = parseInt(hourStr, 10);
  const min = parseInt(minStr, 10);
  
  const { baziYear, monthIndex } = getBaziYearAndMonth(year, month, day, hour, min);
  
  // 1. Year Pillar
  const yearOffset = (baziYear - 1984) % 60;
  const yearIndex = yearOffset >= 0 ? yearOffset : 60 + yearOffset;
  const yearStem = STEMS[yearIndex % 10];
  const yearBranch = BRANCHES[yearIndex % 12];
  
  // 2. Month Pillar
  const monthBranchIndex = (monthIndex + 1) % 12;
  const monthBranch = BRANCHES[monthBranchIndex];
  
  const yearStemIndex = yearIndex % 10;
  const monthStemStartOffset = ((yearStemIndex % 5) * 2 + 2) % 10;
  const monthStemIndex = (monthStemStartOffset + monthIndex - 1) % 10;
  const monthStem = STEMS[monthStemIndex];
  
  // 3. Day Pillar
  const daysSinceEpoch = Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  // Baseline: 1970-01-01 is Sin-Sa (辛巳), index 17 in 60-cycle.
  let dayIndex = (daysSinceEpoch + 17) % 60;
  if (dayIndex < 0) dayIndex += 60;
  
  const totalMins = hour * 60 + min;
  const ziStartMins = opts.useSolarTimeCorrection ? (23 * 60 + opts.solarTimeOffsetMinutes) : 23 * 60; // 23:30 (1410) or 23:00 (1380)

  // Roll to next day if time is past Zi hour start and rollDayAtZiHour is true
  let isRolledOverDay = false;
  if (opts.rollDayAtZiHour && totalMins >= ziStartMins) {
    dayIndex = (dayIndex + 1) % 60;
    isRolledOverDay = true;
  }
  
  const dayStemIndex = dayIndex % 10;
  const dayBranchIndex = dayIndex % 12;
  const dayStem = STEMS[dayStemIndex];
  const dayBranch = BRANCHES[dayBranchIndex];
  
  // 4. Hour Pillar
  const offsetMins = opts.useSolarTimeCorrection ? opts.solarTimeOffsetMinutes : 0;
  let hourBranchIndex = Math.floor((totalMins + 60 - offsetMins) / 120) % 12;
  if (hourBranchIndex < 0) hourBranchIndex += 12;
  
  const hourBranch = BRANCHES[hourBranchIndex];
  
  // Determine hour stem.
  // Rule: Uses the Day Stem. If day was rolled over, we use the *rolled over* Day Stem.
  const referenceDayStemIndex = dayStemIndex;
  const hourStemStartOffset = (referenceDayStemIndex % 5) * 2;
  const hourStemIndex = (hourStemStartOffset + hourBranchIndex) % 10;
  const hourStem = STEMS[hourStemIndex];
  
  return {
    year: { stem: yearStem, branch: yearBranch },
    month: { stem: monthStem, branch: monthBranch },
    day: { stem: dayStem, branch: dayBranch },
    hour: { stem: hourStem, branch: hourBranch },
    _meta: { isRolledOverDay, ziStartMins }
  };
}
