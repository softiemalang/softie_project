import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildReservationPayload,
  buildOwnedReservationPayload,
  decorateEvent,
  groupEventsByRoom,
  getRoomStatus,
  groupTodayEvents,
  validateReservationForm,
} from './helpers.js'
import {
  formatWorkTimeRange,
  normalizeWorkTimeFilter,
  sortSchedulerEvents,
} from './rules.js'
import {
  getWeekStartDate,
  isTimeRangeOverlapping,
  normalizeHourTime,
} from './time.js'
import {
  buildSchedulerViewPath,
  normalizeSchedulerViewState,
  parseSchedulerRoute,
} from './schedulerViewState.js'

const BASE_FORM = {
  reservationDate: '2026-07-16',
  branch: '신촌점',
  room: 'V',
  customerName: ' 홍길동 ',
  startTime: '14:30',
  durationHours: 2,
  warningOffsetMinutes: 10,
  tags: ['in_ear'],
  notesText: ' 메모 ',
}

function event({ id, minutes, type = 'checkin', status = 'pending', branch = '신촌점', room = 'V' }) {
  return {
    id,
    reservation_id: `reservation-${id}`,
    scheduled_at: new Date(Date.UTC(2026, 6, 16, 3, minutes)).toISOString(),
    event_type: type,
    status,
    reservation: { branch, room },
  }
}

test('work-time filters clamp invalid hours and keep an ordered range', () => {
  const normalized = normalizeWorkTimeFilter({
    workTimeEnabled: true,
    workTimeStartHour: -2,
    workTimeEndHour: 30,
  })

  assert.deepEqual(normalized, {
    workTimeEnabled: true,
    workTimeStartHour: 0,
    workTimeEndHour: 23,
  })
  assert.equal(formatWorkTimeRange({ workTimeEnabled: true, workTimeStartHour: 18, workTimeEndHour: 9 }), '18:00 - 18:00')
})

test('event sorting uses time, event type, branch, and room priority', () => {
  const sameTime = new Date(Date.UTC(2026, 6, 16, 3, 0)).toISOString()
  const items = [
    { ...event({ id: 'checkin', minutes: 0, type: 'checkin' }), scheduled_at: sameTime },
    { ...event({ id: 'warning', minutes: 0, type: 'warning' }), scheduled_at: sameTime },
    { ...event({ id: 'checkout-b', minutes: 0, type: 'checkout', room: 'B' }), scheduled_at: sameTime },
    { ...event({ id: 'checkout-a', minutes: 0, type: 'checkout', room: 'A' }), scheduled_at: sameTime },
  ]

  assert.deepEqual(sortSchedulerEvents(items).map((item) => item.id), [
    'checkout-a',
    'checkout-b',
    'warning',
    'checkin',
  ])
})

test('adjacent reservations do not overlap while intersecting ranges do', () => {
  assert.equal(isTimeRangeOverlapping('10:00', '12:00', '12:00', '14:00'), false)
  assert.equal(isTimeRangeOverlapping('10:00', '12:00', '11:00', '13:00'), true)
  assert.equal(isTimeRangeOverlapping(10, 12, 9, 11), true)
})

test('reservation validation rejects mismatched rooms and invalid warning offsets', () => {
  assert.equal(validateReservationForm(BASE_FORM), '')
  assert.equal(validateReservationForm({ ...BASE_FORM, room: 'R' }), '선택한 지점에 맞는 룸을 선택해 주세요.')
  assert.equal(validateReservationForm({ ...BASE_FORM, warningOffsetMinutes: 20 }), '퇴실등 시간은 10분 전 또는 15분 전만 선택할 수 있어요.')
  assert.equal(validateReservationForm({ ...BASE_FORM, durationHours: 0 }), '이용 시간은 1시간 이상으로 입력해 주세요.')
})

test('reservation payload normalizes hour input, trims text, and preserves duration', () => {
  const payload = buildReservationPayload(BASE_FORM)

  assert.equal(payload.branch, '신촌점')
  assert.equal(payload.customer_name, '홍길동')
  assert.equal(payload.notes_text, '메모')
  assert.equal(payload.duration_minutes, 120)
  assert.equal(new Date(payload.end_at).getTime() - new Date(payload.start_at).getTime(), 120 * 60 * 1000)
  assert.equal(normalizeHourTime(BASE_FORM.startTime), '14:00')
})

test('reservation ownership always uses the authenticated owner key', () => {
  const payload = buildOwnedReservationPayload({ customer_name: '테스트', owner_key: 'spoofed-user' }, 'signed-in-user')

  assert.equal(payload.owner_key, 'signed-in-user')
  assert.throws(() => buildOwnedReservationPayload({}, ''), /ownerKey is required/)
})

test('event decoration and grouping use the supplied clock deterministically', () => {
  const now = new Date(Date.UTC(2026, 6, 16, 3, 0))
  const overdue = event({ id: 'overdue', minutes: -5 })
  const action = event({ id: 'action', minutes: 10 })
  const upcoming = event({ id: 'upcoming', minutes: 30 })
  const later = event({ id: 'later', minutes: 90 })
  const completed = event({ id: 'completed', minutes: -10, status: 'done' })

  assert.equal(decorateEvent(overdue, now).isOverdue, true)
  const grouped = groupTodayEvents([later, completed, upcoming, action, overdue], now)
  assert.deepEqual(grouped.actionNow.map((item) => item.id), ['overdue', 'action'])
  assert.deepEqual(grouped.upcomingSoon.map((item) => item.id), ['upcoming'])
  assert.deepEqual(grouped.allToday.map((item) => item.id), ['completed', 'overdue', 'action', 'upcoming', 'later'])
})

test('historical scheduler dates do not show live urgency or overdue timing', () => {
  const now = new Date(Date.UTC(2026, 6, 21, 3, 0))
  const historical = event({ id: 'historical', minutes: -5 })
  historical.scheduled_at = new Date(Date.UTC(2026, 6, 16, 3, 0)).toISOString()

  const grouped = groupTodayEvents([historical], now, '2026-07-16')

  assert.equal(grouped.actionNow.length, 0)
  assert.equal(grouped.upcomingSoon.length, 0)
  assert.equal(grouped.allToday[0].relativeTimingEnabled, false)
  assert.equal(grouped.allToday[0].isOverdue, false)
})

test('room status prioritizes checkout action over active check-in', () => {
  const now = new Date(Date.UTC(2026, 6, 16, 3, 0))
  const status = getRoomStatus([
    event({ id: 'checkin', minutes: -30, type: 'checkin' }),
    event({ id: 'warning', minutes: 5, type: 'warning' }),
  ], now)

  assert.equal(status.tone, 'needs-checkout')
  assert.equal(status.focusEvent.id, 'warning')
})

test('room status is idle after the reservation checkout time has passed', () => {
  const now = new Date(Date.UTC(2026, 6, 16, 6, 0))
  const checkin = event({ id: 'finished-checkin', minutes: 0, type: 'checkin', status: 'done' })
  const checkout = event({ id: 'finished-checkout', minutes: 0, type: 'checkout', status: 'done' })
  checkin.reservation_id = 'finished-reservation'
  checkout.reservation_id = 'finished-reservation'
  checkin.scheduled_at = new Date(Date.UTC(2026, 6, 16, 3, 0)).toISOString()
  checkout.scheduled_at = new Date(Date.UTC(2026, 6, 16, 5, 0)).toISOString()

  const status = getRoomStatus([checkin, checkout], now)

  assert.equal(status.tone, 'idle')
  assert.equal(status.focusEvent, null)
})

test('room events stay separated by branch and room', () => {
  const grouped = groupEventsByRoom([
    event({ id: 'sinchon-a', minutes: 0, branch: '신촌점', room: 'A' }),
    event({ id: 'sinchon-a-2', minutes: 10, branch: '신촌점', room: 'A' }),
    event({ id: 'hapjeong-a', minutes: 20, branch: '합정점', room: 'A' }),
  ])

  assert.deepEqual(grouped.map((group) => [group.key, group.events.length]), [
    ['신촌점__A', 2],
    ['합정점__A', 1],
  ])
})

test('week starts on Monday including Sunday input', () => {
  assert.equal(getWeekStartDate(new Date(2026, 6, 19, 12, 0, 0)), '2026-07-13')
})

test('scheduler routes distinguish today, create, room, and reservation pages', () => {
  assert.deepEqual(parseSchedulerRoute('/scheduler'), { name: 'today' })
  assert.deepEqual(parseSchedulerRoute('/scheduler/new'), { name: 'new' })
  assert.deepEqual(parseSchedulerRoute('/scheduler/rooms'), { name: 'rooms' })
  assert.deepEqual(parseSchedulerRoute('/scheduler/reservation-1'), { name: 'edit', reservationId: 'reservation-1' })
})

test('scheduler view state rejects a room that does not belong to the branch', () => {
  const normalized = normalizeSchedulerViewState({
    date: '2026-07-16',
    filters: { branch: '신촌점', room: 'R', workTimeEnabled: true, workTimeStartHour: 9, workTimeEndHour: 18 },
  })

  assert.equal(normalized.date, '2026-07-16')
  assert.equal(normalized.filters.branch, '신촌점')
  assert.equal(normalized.filters.room, 'all')
})

test('scheduler view path preserves owner-visible filters', () => {
  assert.equal(
    buildSchedulerViewPath('2026-07-16', {
      branch: '신촌점',
      room: 'A',
      workTimeEnabled: true,
      workTimeStartHour: 9,
      workTimeEndHour: 18,
    }),
    '/scheduler?date=2026-07-16&scope=working&start=9&end=18&branch=%EC%8B%A0%EC%B4%8C%EC%A0%90&room=A',
  )
})
