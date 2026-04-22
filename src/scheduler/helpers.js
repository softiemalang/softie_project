import {
  DEFAULT_DURATION_MINUTES,
  DEFAULT_WARNING_OFFSET,
  EVENT_STATUS_META,
  SCHEDULER_BRANCHES,
  SCHEDULER_BRANCH_ROOMS,
  SCHEDULER_TAGS,
  WORK_EVENT_META,
} from './constants'
import { addMinutes, combineLocalDateTime, formatTime, toIsoFromLocal, toLocalDateInputValue, toLocalTimeInputValue } from './time'

export function getTagMeta(tag) {
  return SCHEDULER_TAGS.find((item) => item.value === tag) || { value: tag, shortLabel: tag, fullLabel: tag }
}

export function getRoomsForBranch(branch) {
  return SCHEDULER_BRANCH_ROOMS[branch] || []
}

export function createReservationDraft() {
  const now = new Date()
  const roundedMinutes = now.getMinutes() < 30 ? '00' : '30'
  const roundedHour = now.getMinutes() < 30 ? now.getHours() : now.getHours() + 1
  const startTime = `${String(Math.min(roundedHour, 23)).padStart(2, '0')}:${roundedMinutes}`

  return {
    reservationDate: toLocalDateInputValue(now),
    branch: '',
    room: '',
    customerName: '',
    startTime,
    durationHours: DEFAULT_DURATION_MINUTES / 60,
    warningOffsetMinutes: DEFAULT_WARNING_OFFSET,
    tags: [],
    notesText: '',
  }
}

export function mapReservationToFormValues(reservation) {
  const branch = SCHEDULER_BRANCHES.includes(reservation.branch) ? reservation.branch : ''
  const room = getRoomsForBranch(branch).includes(reservation.room) ? reservation.room : ''

  return {
    reservationDate: reservation.reservation_date,
    branch,
    room,
    customerName: reservation.customer_name || '',
    startTime: toLocalTimeInputValue(reservation.start_at),
    durationHours: Math.max(1, Math.round((reservation.duration_minutes || DEFAULT_DURATION_MINUTES) / 60)),
    warningOffsetMinutes:
      reservation.warning_offset_minutes === 15
        ? 15
        : DEFAULT_WARNING_OFFSET,
    tags: reservation.tags || [],
    notesText: reservation.notes_text || '',
  }
}

export function buildReservationPayload(formValues) {
  const startAt = combineLocalDateTime(formValues.reservationDate, formValues.startTime)
  const durationHours = Number(formValues.durationHours) || DEFAULT_DURATION_MINUTES / 60
  const durationMinutes = durationHours * 60
  const warningOffsetMinutes = Number(formValues.warningOffsetMinutes) === 15 ? 15 : DEFAULT_WARNING_OFFSET
  const endAt = addMinutes(startAt, durationMinutes)

  return {
    reservation_date: formValues.reservationDate,
    branch: formValues.branch.trim(),
    room: formValues.room.trim(),
    customer_name: formValues.customerName.trim(),
    start_at: toIsoFromLocal(formValues.reservationDate, formValues.startTime),
    duration_minutes: durationMinutes,
    end_at: endAt.toISOString(),
    warning_offset_minutes: Math.min(durationMinutes, Math.max(0, warningOffsetMinutes)),
    tags: formValues.tags,
    notes_text: formValues.notesText.trim(),
  }
}

export function validateReservationForm(formValues) {
  if (!formValues.reservationDate) return '예약 날짜를 입력해 주세요.'
  if (!formValues.branch.trim()) return '지점을 입력해 주세요.'
  if (!formValues.room.trim()) return '룸 이름을 입력해 주세요.'
  if (!getRoomsForBranch(formValues.branch).includes(formValues.room)) return '선택한 지점에 맞는 룸을 선택해 주세요.'
  if (!formValues.customerName.trim()) return '예약자 이름을 입력해 주세요.'
  if (!formValues.startTime) return '시작 시간을 입력해 주세요.'

  const durationHours = Number(formValues.durationHours)
  if (!durationHours || durationHours < 1) return '이용 시간은 1시간 이상으로 입력해 주세요.'

  const durationMinutes = durationHours * 60
  const warningOffsetMinutes = Number(formValues.warningOffsetMinutes)
  if (![10, 15].includes(warningOffsetMinutes)) return '퇴실등 시간은 10분 전 또는 15분 전만 선택할 수 있어요.'
  if (warningOffsetMinutes > durationMinutes) return '퇴실등 시간은 이용 시간보다 길 수 없어요.'

  return ''
}

export function sortEventsByTime(items) {
  return [...items].sort((left, right) => {
    const timeDiff = new Date(left.scheduled_at).getTime() - new Date(right.scheduled_at).getTime()
    if (timeDiff !== 0) return timeDiff
    return left.event_type.localeCompare(right.event_type)
  })
}

export function decorateEvent(item, now = new Date()) {
  const scheduledAt = new Date(item.scheduled_at)
  const minutesAway = Math.round((scheduledAt.getTime() - now.getTime()) / (60 * 1000))
  const isPending = item.status === 'pending'
  const isOverdue = isPending && minutesAway < 0
  const isActionNow = isPending && minutesAway <= 10
  const isUpcomingSoon = isPending && minutesAway > 10 && minutesAway <= 60

  return {
    ...item,
    meta: WORK_EVENT_META[item.event_type],
    statusMeta: EVENT_STATUS_META[item.status],
    minutesAway,
    isPending,
    isOverdue,
    isActionNow,
    isUpcomingSoon,
    timeLabel: formatTime(item.scheduled_at),
  }
}

export function groupTodayEvents(items) {
  const decorated = sortEventsByTime(items).map((item) => decorateEvent(item))

  return {
    actionNow: decorated.filter((item) => item.isActionNow || item.isOverdue),
    upcomingSoon: decorated.filter((item) => item.isUpcomingSoon),
    allToday: decorated,
  }
}

export function getRoomStatus(events, now = new Date()) {
  const decorated = sortEventsByTime(events).map((item) => decorateEvent(item, now))
  const checkoutNeeded = decorated.find(
    (item) => item.isPending && (item.event_type === 'warning' || item.event_type === 'checkout') && item.minutesAway <= 10,
  )
  const activeCheckin = decorated.find(
    (item) => item.event_type === 'checkin' && new Date(item.scheduled_at).getTime() <= now.getTime(),
  )
  const nextPending = decorated.find((item) => item.status === 'pending' && item.minutesAway >= 0)

  if (checkoutNeeded) {
    return {
      tone: 'needs-checkout',
      title: '퇴실 대응 필요',
      subtitle: `${checkoutNeeded.meta.label} ${checkoutNeeded.timeLabel}`,
      focusEvent: checkoutNeeded,
    }
  }

  if (activeCheckin) {
    return {
      tone: 'in-use',
      title: '사용 중',
      subtitle: `입실 ${activeCheckin.timeLabel}`,
      focusEvent: activeCheckin,
    }
  }

  if (nextPending) {
    return {
      tone: 'upcoming',
      title: '다가오는 일정',
      subtitle: `${nextPending.meta.label} ${nextPending.timeLabel}`,
      focusEvent: nextPending,
    }
  }

  return {
    tone: 'idle',
    title: '오늘 일정 없음',
    subtitle: `${TODAY_HOURS.start}:00 - ${TODAY_HOURS.end}:00`,
    focusEvent: null,
  }
}
