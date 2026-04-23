import { TODAY_HOURS } from './constants'

const SAME_TIME_EVENT_PRIORITY = {
  checkout: 0,
  warning: 1,
  checkin: 2,
}

const BRANCH_PRIORITY = {
  신촌점: 0,
  연대점: 1,
  사당1호점: 2,
  사당2호점: 3,
}

const ROOM_PRIORITY_BY_GROUP = {
  yeondae: {
    V: 0,
    A: 1,
    B: 2,
    C: 3,
    R: 4,
    Q: 5,
    F: 6,
  },
  sadang: {
    V: 0,
    S: 1,
    Q: 2,
    C: 3,
    D: 4,
    1: 5,
    2: 6,
    3: 7,
    4: 8,
  },
}

function toSafeNumber(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function getEventTypePriority(eventType) {
  return SAME_TIME_EVENT_PRIORITY[eventType] ?? 99
}

export function getBranchPriority(branch) {
  return BRANCH_PRIORITY[branch] ?? 99
}

export function getRoomPriority(branch, room) {
  const roomGroup = branch === '신촌점' || branch === '연대점' ? ROOM_PRIORITY_BY_GROUP.yeondae : ROOM_PRIORITY_BY_GROUP.sadang
  return roomGroup?.[room] ?? 99
}

export function compareSchedulerEvents(left, right) {
  const timeDiff = new Date(left.scheduled_at).getTime() - new Date(right.scheduled_at).getTime()
  if (timeDiff !== 0) return timeDiff

  const eventTypeDiff = getEventTypePriority(left.event_type) - getEventTypePriority(right.event_type)
  if (eventTypeDiff !== 0) return eventTypeDiff

  const leftBranch = left.reservation?.branch ?? left.branch ?? ''
  const rightBranch = right.reservation?.branch ?? right.branch ?? ''
  const branchDiff = getBranchPriority(leftBranch) - getBranchPriority(rightBranch)
  if (branchDiff !== 0) return branchDiff

  const leftRoom = left.reservation?.room ?? left.room ?? ''
  const rightRoom = right.reservation?.room ?? right.room ?? ''
  const roomDiff = getRoomPriority(leftBranch, leftRoom) - getRoomPriority(rightBranch, rightRoom)
  if (roomDiff !== 0) return roomDiff

  const reservationDiff = String(left.reservation_id ?? '').localeCompare(String(right.reservation_id ?? ''))
  if (reservationDiff !== 0) return reservationDiff

  return String(left.id ?? '').localeCompare(String(right.id ?? ''))
}

export function sortSchedulerEvents(items) {
  return [...items].sort(compareSchedulerEvents)
}

export function getDefaultWorkTimeFilter() {
  return {
    workTimeEnabled: false,
    workTimeStartHour: TODAY_HOURS.start,
    workTimeEndHour: TODAY_HOURS.end - 1,
  }
}

export function normalizeWorkTimeFilter(input = {}) {
  const defaults = getDefaultWorkTimeFilter()
  const workTimeEnabled = Boolean(input.workTimeEnabled)
  const startHour = Math.max(0, Math.min(23, toSafeNumber(input.workTimeStartHour, defaults.workTimeStartHour)))
  const endHour = Math.max(startHour, Math.min(23, toSafeNumber(input.workTimeEndHour, defaults.workTimeEndHour)))

  return {
    workTimeEnabled,
    workTimeStartHour: startHour,
    workTimeEndHour: endHour,
  }
}

export function isHourInWorkTimeRange(hour, filterInput) {
  const filter = normalizeWorkTimeFilter(filterInput)
  if (!filter.workTimeEnabled) return true
  return hour >= filter.workTimeStartHour && hour <= filter.workTimeEndHour
}

export function getScheduledHour(input) {
  return new Date(input).getHours()
}

export function isSchedulerItemInWorkTimeRange(item, filterInput) {
  return isHourInWorkTimeRange(getScheduledHour(item.scheduled_at), filterInput)
}

export function isReminderEventEligibleForWorkTime(eventScheduledAt, filterInput) {
  return isHourInWorkTimeRange(getScheduledHour(eventScheduledAt), filterInput)
}

export function formatWorkTimeHour(hour) {
  return `${String(hour).padStart(2, '0')}:00`
}

export function formatWorkTimeRange(filterInput) {
  const filter = normalizeWorkTimeFilter(filterInput)
  return `${String(filter.workTimeStartHour).padStart(2, '0')}:00 - ${String(filter.workTimeEndHour).padStart(2, '0')}:00`
}
