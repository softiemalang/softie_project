import { SCHEDULER_BRANCHES } from './constants.js'
import { getRoomsForBranch } from './helpers.js'
import { getDefaultWorkTimeFilter, normalizeWorkTimeFilter } from './rules.js'
import { getWeekRangeLabel, getWeekTitle, toLocalDateInputValue } from './time.js'

const WORK_TIME_FILTER_STORAGE_KEY = 'scheduler:work-time-filter'
const SCHEDULER_MAIN_VIEW_STORAGE_KEY = 'scheduler:main-view-state'
const WORK_LOGS_STORAGE_KEY = 'scheduler:work-logs'

export function loadWorkLogs() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(WORK_LOGS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function loadStoredWorkTimeFilter(selectedDate) {
  if (typeof window === 'undefined') return getDefaultWorkTimeFilter()

  try {
    const rawValue = window.localStorage.getItem(WORK_TIME_FILTER_STORAGE_KEY)
    if (!rawValue) return getDefaultWorkTimeFilter()
    const parsedValue = JSON.parse(rawValue)
    if (parsedValue?.selectedDate !== selectedDate) return getDefaultWorkTimeFilter()
    return normalizeWorkTimeFilter(parsedValue)
  } catch {
    return getDefaultWorkTimeFilter()
  }
}

export function persistWorkTimeFilter(filter, selectedDate) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(WORK_TIME_FILTER_STORAGE_KEY, JSON.stringify({
    ...normalizeWorkTimeFilter(filter),
    selectedDate,
  }))
}

export function buildWeekWorkLogText(weekStart, logs) {
  const targetLogs = logs.filter(log => log.weekStartDate === weekStart)
  const sortedLogs = [...targetLogs].sort((a, b) => a.date.localeCompare(b.date))

  if (sortedLogs.length === 0) return null

  const lines = [getWeekTitle(weekStart), '']
  let totalMinutes = 0

  sortedLogs.forEach(log => {
    const dateObj = new Date(log.date)
    const dateLabel = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`
    const durationHours = log.durationMinutes / 60
    lines.push(`${dateLabel}\n${log.startTime}-${log.endTime} (${durationHours}h)`)
    totalMinutes += log.durationMinutes
  })

  lines.push('', `총 ${totalMinutes / 60}시간`)
  return lines.join('\n')
}

export function buildWeekWorkLogShareText(weekStart, logs, url) {
  const copiedText = buildWeekWorkLogText(weekStart, logs)
  if (copiedText) return [copiedText, '', `자세히 보기: ${url}`].join('\n')

  return [
    '근무 일지',
    `${getWeekTitle(weekStart)} · ${getWeekRangeLabel(weekStart)}`,
    '',
    '주간 총계: 0시간',
    '이번 주 근무 기록이 아직 없어요.',
    '',
    `자세히 보기: ${url}`,
  ].join('\n')
}

export function parseSchedulerRoute(pathname) {
  if (pathname === '/scheduler') return { name: 'today' }
  if (pathname === '/scheduler/new') return { name: 'new' }
  if (pathname === '/scheduler/rooms') return { name: 'rooms' }
  const match = pathname.match(/^\/scheduler\/([^/]+)$/)
  if (match) return { name: 'edit', reservationId: match[1] }
  return { name: 'not-found' }
}

export function getReservationDateParam() {
  if (typeof window === 'undefined') return null

  const value = new URLSearchParams(window.location.search).get('date')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null

  const parsed = new Date(`${value}T00:00:00`)
  return toLocalDateInputValue(parsed) === value ? value : null
}

export function getValidSchedulerDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null

  const parsed = new Date(`${value}T00:00:00`)
  return toLocalDateInputValue(parsed) === value ? value : null
}

export function getDefaultSchedulerViewState() {
  return {
    date: toLocalDateInputValue(),
    filters: {
      branch: 'all',
      room: 'all',
      ...getDefaultWorkTimeFilter(),
    },
  }
}

export function normalizeSchedulerViewState(candidate) {
  const fallback = getDefaultSchedulerViewState()
  const date = getValidSchedulerDate(candidate?.date) || fallback.date
  const branchParam = candidate?.filters?.branch
  const branch = SCHEDULER_BRANCHES.includes(branchParam) ? branchParam : 'all'
  const roomParam = candidate?.filters?.room
  const room = branch !== 'all' && getRoomsForBranch(branch).includes(roomParam) ? roomParam : 'all'
  const normalizedWorkTimeFilter = normalizeWorkTimeFilter(candidate?.filters || {})

  return {
    date,
    filters: {
      branch,
      room,
      ...normalizedWorkTimeFilter,
    },
  }
}

export function getSchedulerViewStateFromSearch(search) {
  const params = new URLSearchParams(search)
  const defaultWorkTimeFilter = getDefaultWorkTimeFilter()

  return normalizeSchedulerViewState({
    date: params.get('date'),
    filters: {
      branch: params.get('branch'),
      room: params.get('room'),
      ...defaultWorkTimeFilter,
      workTimeEnabled: params.get('scope') === 'working',
      workTimeStartHour: params.has('start') ? Number(params.get('start')) : defaultWorkTimeFilter.workTimeStartHour,
      workTimeEndHour: params.has('end') ? Number(params.get('end')) : defaultWorkTimeFilter.workTimeEndHour,
    },
  })
}

export function loadStoredSchedulerViewState() {
  if (typeof window === 'undefined') return getDefaultSchedulerViewState()

  try {
    const rawValue = window.localStorage.getItem(SCHEDULER_MAIN_VIEW_STORAGE_KEY)
    if (!rawValue) return getDefaultSchedulerViewState()
    return normalizeSchedulerViewState(JSON.parse(rawValue))
  } catch {
    return getDefaultSchedulerViewState()
  }
}

export function persistSchedulerViewState(date, filters) {
  if (typeof window === 'undefined') return

  const viewState = normalizeSchedulerViewState({ date, filters })
  window.localStorage.setItem(SCHEDULER_MAIN_VIEW_STORAGE_KEY, JSON.stringify(viewState))
}

export function getSchedulerViewStateFromUrl() {
  if (typeof window === 'undefined') return getDefaultSchedulerViewState()
  if (!window.location.search) return loadStoredSchedulerViewState()
  return getSchedulerViewStateFromSearch(window.location.search)
}

export function buildSchedulerViewPath(date, filters) {
  const normalizedFilters = normalizeWorkTimeFilter(filters)
  const params = new URLSearchParams()
  params.set('date', getValidSchedulerDate(date) || toLocalDateInputValue())

  if (normalizedFilters.workTimeEnabled) {
    params.set('scope', 'working')
    params.set('start', String(normalizedFilters.workTimeStartHour))
    params.set('end', String(normalizedFilters.workTimeEndHour))
  }

  if (filters.branch && filters.branch !== 'all') params.set('branch', filters.branch)
  if (filters.room && filters.room !== 'all') params.set('room', filters.room)

  return `/scheduler?${params.toString()}`
}

export function replaceSchedulerViewUrl(date, filters) {
  if (typeof window === 'undefined') return

  const path = buildSchedulerViewPath(date, filters)
  if (`${window.location.pathname}${window.location.search}` === path) return
  window.history.replaceState({}, '', path)
}
