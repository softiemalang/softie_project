/**
 * sajuHourUtils.js
 * 12개 시지(자, 축, 인, 묘, 진, 사, 오, 미, 신, 유, 술, 해) 시간 범위 및 대표 시각 매핑 도우미
 */

export const HOUR_ZI_TABLE = [
  { id: 'hour-zi', hourBranch: '자', label: '자시 후보', assumedTimeRange: '23:00-01:00', representativeTime: '00:00', startMinutes: 23 * 60, endMinutes: 1 * 60 },
  { id: 'hour-chuk', hourBranch: '축', label: '축시 후보', assumedTimeRange: '01:00-03:00', representativeTime: '02:00', startMinutes: 1 * 60, endMinutes: 3 * 60 },
  { id: 'hour-in', hourBranch: '인', label: '인시 후보', assumedTimeRange: '03:00-05:00', representativeTime: '04:00', startMinutes: 3 * 60, endMinutes: 5 * 60 },
  { id: 'hour-myo', hourBranch: '묘', label: '묘시 후보', assumedTimeRange: '05:00-07:00', representativeTime: '06:00', startMinutes: 5 * 60, endMinutes: 7 * 60 },
  { id: 'hour-jin', hourBranch: '진', label: '진시 후보', assumedTimeRange: '07:00-09:00', representativeTime: '08:00', startMinutes: 7 * 60, endMinutes: 9 * 60 },
  { id: 'hour-sa', hourBranch: '사', label: '사시 후보', assumedTimeRange: '09:00-11:00', representativeTime: '10:00', startMinutes: 9 * 60, endMinutes: 11 * 60 },
  { id: 'hour-oh', hourBranch: '오', label: '오시 후보', assumedTimeRange: '11:00-13:00', representativeTime: '12:00', startMinutes: 11 * 60, endMinutes: 13 * 60 },
  { id: 'hour-mi', hourBranch: '미', label: '미시 후보', assumedTimeRange: '13:00-15:00', representativeTime: '14:00', startMinutes: 13 * 60, endMinutes: 15 * 60 },
  { id: 'hour-shin', hourBranch: '신', label: '신시 후보', assumedTimeRange: '15:00-17:00', representativeTime: '16:00', startMinutes: 15 * 60, endMinutes: 17 * 60 },
  { id: 'hour-yoo', hourBranch: '유', label: '유시 후보', assumedTimeRange: '17:00-19:00', representativeTime: '18:00', startMinutes: 17 * 60, endMinutes: 19 * 60 },
  { id: 'hour-sul', hourBranch: '술', label: '술시 후보', assumedTimeRange: '19:00-21:00', representativeTime: '20:00', startMinutes: 19 * 60, endMinutes: 21 * 60 },
  { id: 'hour-hae', hourBranch: '해', label: '해시 후보', assumedTimeRange: '21:00-23:00', representativeTime: '22:00', startMinutes: 21 * 60, endMinutes: 23 * 60 },
]

export function timeStringToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0
  const [h, m] = timeStr.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

/**
 * candidatePriority (후보 신뢰 출처 순위):
 * 1 = 사용자 직접 지정 / 범위 입력 기반 (user specificity high)
 * 2 = 시간대/DST/절기/지역 경계 후보 (boundary candidate)
 * 3 = 출생시각 미상전체 확장 추론 후보 (full structural expansion)
 */

/**
 * timeAccuracy === 'unknown'일 때 12개 시지 후보 사양을 반환
 */
export function getHourCandidatesForUnknown() {
  return HOUR_ZI_TABLE.map((item) => ({
    ...item,
    candidateOrigin: 'time_unknown',
    candidatePriority: 3, // 3: 출생시각 미상전체 확장 추론
    assumption: `${item.hourBranch}시 범위 (${item.assumedTimeRange}) 대표값 ${item.representativeTime} 사용`,
  }))
}

/**
 * timeAccuracy === 'range'일 때 시작시~종료시 입력 범위에 걸치는 시지 후보 사양을 반환
 */
export function getHourCandidatesForRange(startStr, endStr) {
  let startMins = timeStringToMinutes(startStr)
  let endMins = timeStringToMinutes(endStr)

  if (endMins < startMins) {
    endMins += 24 * 60
  }

  const sourceRange = { start: startStr || '00:00', end: endStr || '23:59' }

  const matched = HOUR_ZI_TABLE.filter((zi) => {
    let ziStart = zi.startMinutes
    let ziEnd = zi.endMinutes

    if (zi.id === 'hour-zi') {
      const overlapsFirstHalf = (startMins < 60) || (endMins > 23 * 60)
      const overlapsSecondHalf = (startMins <= 60 && endMins >= 0)
      if (overlapsFirstHalf || overlapsSecondHalf) return true
    }

    return Math.max(startMins, ziStart) < Math.min(endMins, ziEnd)
  })

  const candidates = matched.length > 0 ? matched : [HOUR_ZI_TABLE[0]]

  return candidates.map((item) => ({
    ...item,
    candidateOrigin: 'time_range',
    candidatePriority: 1, // 사용자 입력 범위 기반 후보
    sourceRange,
    matchedHourRange: { start: item.assumedTimeRange.split('-')[0], end: item.assumedTimeRange.split('-')[1] },
    assumption: `입력 범위 (${startStr}~${endStr}) 중 ${item.hourBranch}시 (${item.assumedTimeRange}) 구간 대표값 ${item.representativeTime} 사용`,
  }))
}
