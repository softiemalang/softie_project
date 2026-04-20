import {
  DEFAULT_DURATION_MINUTES,
  DEFAULT_WARNING_OFFSET,
  EVENT_STATUS_META,
  SCHEDULER_TAGS,
  TODAY_HOURS,
  WORK_EVENT_META,
} from './constants'
import { addMinutes, combineLocalDateTime, formatTime, toIsoFromLocal, toLocalDateInputValue, toLocalTimeInputValue } from './time'

export function getTagMeta(tag) {
  return SCHEDULER_TAGS.find((item) => item.value === tag) || { value: tag, shortLabel: tag, fullLabel: tag }
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
    durationMinutes: DEFAULT_DURATION_MINUTES,
    warningOffsetMinutes: DEFAULT_WARNING_OFFSET,
    tags: [],
    notesText: '',
  }
}

export function mapReservationToFormValues(reservation) {
  return {
    reservationDate: reservation.reservation_date,
    branch: reservation.branch || '',
    room: reservation.room || '',
    customerName: reservation.customer_name || '',
    startTime: toLocalTimeInputValue(reservation.start_at),
    durationMinutes: reservation.duration_minutes || DEFAULT_DURATION_MINUTES,
    warningOffsetMinutes: reservation.warning_offset_minutes || DEFAULT_WARNING_OFFSET,
    tags: reservation.tags || [],
    notesText: reservation.notes_text || '',
  }
}

export function buildReservationPayload(formValues) {
  const startAt = combineLocalDateTime(formValues.reservationDate, formValues.startTime)
  const durationMinutes = Number(formValues.durationMinutes) || DEFAULT_DURATION_MINUTES
  const warningOffsetMinutes = Number(formValues.warningOffsetMinutes) || DEFAULT_WARNING_OFFSET
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
  if (!formValues.customerName.trim()) return '예약자 이름을 입력해 주세요.'
  if (!formValues.startTime) return '시작 시간을 입력해 주세요.'

  const durationMinutes = Number(formValues.durationMinutes)
  if (!durationMinutes || durationMinutes < 30) return '이용 시간은 30분 이상으로 입력해 주세요.'

  const warningOffsetMinutes = Number(formValues.warningOffsetMinutes)
  if (warningOffsetMinutes < 0) return '퇴실등 시간은 0분 이상이어야 해요.'
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
  const decorated = sortEventsByTime(items)
    .map((item) => decorateEvent(item))
    .filter((item) => {
      const hour = new Date(item.scheduled_at).getHours()
      return hour >= TODAY_HOURS.start && hour < TODAY_HOURS.end
    })

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
