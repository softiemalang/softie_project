export const SCHEDULER_TAGS = [
  { value: 'extra_headcount', shortLabel: '인원+', fullLabel: '추가 인원' },
  { value: 'in_ear', shortLabel: '인이어', fullLabel: '인이어' },
  { value: 'MTR', shortLabel: 'MTR', fullLabel: 'MTR' },
  { value: 'other', shortLabel: '기타', fullLabel: '기타' },
]

export const SCHEDULER_BRANCHES = ['신촌점', '연대점', '사당1호점', '사당2호점']

export const WORK_EVENT_META = {
  checkin: { label: '입실', tone: 'checkin' },
  warning: { label: '퇴실등', tone: 'warning' },
  checkout: { label: '퇴실', tone: 'checkout' },
}

export const EVENT_STATUS_META = {
  pending: { label: '대기' },
  done: { label: '완료' },
  skipped: { label: '건너뜀' },
}

export const DEFAULT_WARNING_OFFSET = 10
export const DEFAULT_DURATION_MINUTES = 120
export const TODAY_HOURS = { start: 8, end: 24 }
