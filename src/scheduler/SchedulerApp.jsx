import { useEffect, useMemo, useRef, useState } from 'react'
import { navigate } from '../lib/router'
import { listTodayWorkEvents, getReservationById, saveReservation, deleteReservation, updateWorkEventStatus } from './api'
import { SCHEDULER_BRANCHES, SCHEDULER_TAGS, TODAY_HOURS, WORK_EVENT_META } from './constants'
import { buildReservationPayload, createReservationDraft, getRoomStatus, getRoomsForBranch, getTagMeta, groupTodayEvents, mapReservationToFormValues, validateReservationForm } from './helpers'
import {
  formatWorkTimeHour,
  formatWorkTimeRange,
  getDefaultWorkTimeFilter,
  isSchedulerItemInWorkTimeRange,
  normalizeWorkTimeFilter,
} from './rules'
import {
  getSchedulerPushPreferences,
  getSchedulerPushState,
  sendSchedulerTestPush,
  subscribeSchedulerPush,
  updateSchedulerPushPreferences,
} from './push'
import { formatDateLabel, formatSchedulerDate, formatSchedulerTime, toLocalDateInputValue } from './time'

const GO_TO_TODAY_EVENT = 'scheduler:go-today'
const WORK_TIME_FILTER_STORAGE_KEY = 'scheduler:work-time-filter'
const DEFAULT_PUSH_PREFERENCES = {
  notificationsEnabled: true,
  notificationTypes: ['checkin', 'warning', 'checkout'],
  ...getDefaultWorkTimeFilter(),
}
const PUSH_NOTIFICATION_OPTIONS = ['checkin', 'warning', 'checkout']
const WORK_TIME_HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => hour)

function loadStoredWorkTimeFilter() {
  if (typeof window === 'undefined') return getDefaultWorkTimeFilter()

  try {
    const rawValue = window.localStorage.getItem(WORK_TIME_FILTER_STORAGE_KEY)
    if (!rawValue) return getDefaultWorkTimeFilter()
    return normalizeWorkTimeFilter(JSON.parse(rawValue))
  } catch {
    return getDefaultWorkTimeFilter()
  }
}

function persistWorkTimeFilter(filter) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(WORK_TIME_FILTER_STORAGE_KEY, JSON.stringify(normalizeWorkTimeFilter(filter)))
}

function parseSchedulerRoute(pathname) {
  if (pathname === '/scheduler') return { name: 'today' }
  if (pathname === '/scheduler/new') return { name: 'new' }
  if (pathname === '/scheduler/rooms') return { name: 'rooms' }
  const match = pathname.match(/^\/scheduler\/([^/]+)$/)
  if (match) return { name: 'edit', reservationId: match[1] }
  return { name: 'not-found' }
}

export function SchedulerApp({ pathname }) {
  const route = useMemo(() => parseSchedulerRoute(pathname), [pathname])

  if (route.name === 'today') {
    return <TodaySchedulerPage />
  }

  if (route.name === 'new') {
    return <ReservationEditorPage mode="create" />
  }

  if (route.name === 'edit') {
    return <ReservationEditorPage mode="edit" reservationId={route.reservationId} />
  }

  if (route.name === 'rooms') {
    return <RoomStatusPage />
  }

  return (
    <div className="scheduler-shell">
      <SchedulerTopbar />
      <section className="scheduler-panel">
        <button type="button" className="soft-button" onClick={() => navigate('/scheduler')}>
          오늘 화면으로 이동
        </button>
      </section>
    </div>
  )
}

function SchedulerTopbar({ rightAction }) {
  return (
    <header className="scheduler-topbar">
      <div className="scheduler-topbar-actions">
        <NavButton path="/scheduler" label="Today" />
        <NavButton path="/scheduler/new" label="Add" isPrimary />
        {rightAction}
      </div>
    </header>
  )
}

function NavButton({ path, label, isPrimary = false }) {
  function handleClick() {
    if (path === '/scheduler' && window.location.pathname === '/scheduler') {
      window.dispatchEvent(new CustomEvent(GO_TO_TODAY_EVENT))
      return
    }

    navigate(path)
  }

  return (
    <button
      type="button"
      className={isPrimary ? 'scheduler-nav-button primary' : 'scheduler-nav-button'}
      onClick={handleClick}
    >
      {label}
    </button>
  )
}

function NativePickerField({
  className = '',
  label,
  type,
  value,
  placeholder,
  onChange,
  formatter,
  hideLabel = false,
}) {
  const inputRef = useRef(null)
  const labelId = `${type}-picker-label`
  const displayValue = formatter(value) || placeholder

  return (
    <label className={`scheduler-primary-field ${className}`.trim()}>
      <span id={labelId} className={`scheduler-parent-label${hideLabel ? ' visually-hidden' : ''}`}>
        {label}
      </span>
      <div className="scheduler-native-picker-shell">
        <div className={`scheduler-native-picker-display ${value ? '' : 'is-empty'}`} aria-hidden="true">
          {displayValue}
        </div>
        <input
          ref={inputRef}
          className="scheduler-native-picker-input"
          aria-labelledby={labelId}
          type={type}
          value={value}
          onChange={onChange}
        />
      </div>
    </label>
  )
}

function TodaySchedulerPage() {
  const [selectedDate, setSelectedDate] = useState(toLocalDateInputValue())
  const [events, setEvents] = useState([])
  const [filters, setFilters] = useState(() => ({
    branch: 'all',
    room: 'all',
    ...loadStoredWorkTimeFilter(),
  }))
  const [draftFilters, setDraftFilters] = useState(() => ({
    date: toLocalDateInputValue(),
    branch: 'all',
    room: 'all',
    ...loadStoredWorkTimeFilter(),
  }))
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [pendingStatusId, setPendingStatusId] = useState('')
  const [pushState, setPushState] = useState({
    supported: false,
    platform: '',
    standalone: false,
    permission: 'default',
    subscribed: false,
    supportMessage: '',
  })
  const [pushStatus, setPushStatus] = useState('')
  const [isPushBusy, setIsPushBusy] = useState(false)
  const [pushPreferences, setPushPreferences] = useState(DEFAULT_PUSH_PREFERENCES)
  const [isPushPreferencesBusy, setIsPushPreferencesBusy] = useState(false)
  const rooms = filters.branch === 'all' ? [] : getRoomsForBranch(filters.branch)
  const draftRooms = draftFilters.branch === 'all' ? [] : getRoomsForBranch(draftFilters.branch)
  const normalizedFilters = normalizeWorkTimeFilter(filters)
  const normalizedDraftWorkTime = normalizeWorkTimeFilter(draftFilters)

  async function loadEvents() {
    setIsLoading(true)
    try {
      const rows = await listTodayWorkEvents(selectedDate)
      setEvents(rows)
      setStatus('')
    } catch (error) {
      setStatus(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function loadPushState() {
    try {
      const nextState = await getSchedulerPushState()
      setPushState(nextState)
    } catch (error) {
      setPushStatus(error instanceof Error ? error.message : '웹 알림 상태를 확인하지 못했어요.')
    }
  }

  useEffect(() => {
    loadEvents()
  }, [selectedDate])

  useEffect(() => {
    loadPushState()
  }, [])

  useEffect(() => {
    async function loadPushPreferences() {
      if (!pushState.subscribed) {
        setPushPreferences({
          ...DEFAULT_PUSH_PREFERENCES,
          ...normalizedFilters,
        })
        return
      }

      try {
        const nextPreferences = await getSchedulerPushPreferences()
        setPushPreferences({
          notificationsEnabled: nextPreferences?.notificationsEnabled ?? true,
          notificationTypes: Array.isArray(nextPreferences?.notificationTypes)
            ? nextPreferences.notificationTypes
            : DEFAULT_PUSH_PREFERENCES.notificationTypes,
          workTimeEnabled: nextPreferences?.workTimeEnabled ?? normalizedFilters.workTimeEnabled,
          workTimeStartHour: nextPreferences?.workTimeStartHour ?? normalizedFilters.workTimeStartHour,
          workTimeEndHour: nextPreferences?.workTimeEndHour ?? normalizedFilters.workTimeEndHour,
        })
      } catch (error) {
        setPushStatus(error instanceof Error ? error.message : '웹 알림 설정을 불러오지 못했어요.')
      }
    }

    loadPushPreferences()
  }, [pushState.subscribed, normalizedFilters.workTimeEnabled, normalizedFilters.workTimeEndHour, normalizedFilters.workTimeStartHour])

  useEffect(() => {
    function handleGoToToday() {
      setSelectedDate(toLocalDateInputValue())
    }

    window.addEventListener(GO_TO_TODAY_EVENT, handleGoToToday)
    return () => window.removeEventListener(GO_TO_TODAY_EVENT, handleGoToToday)
  }, [])

  function buildPushPreferencePayload(preferences, workTimeFilter) {
    const normalizedWorkTime = normalizeWorkTimeFilter(workTimeFilter)
    return {
      notificationsEnabled: preferences.notificationsEnabled,
      notificationTypes: preferences.notificationTypes,
      workTimeEnabled: normalizedWorkTime.workTimeEnabled,
      workTimeStartHour: normalizedWorkTime.workTimeEnabled ? normalizedWorkTime.workTimeStartHour : null,
      workTimeEndHour: normalizedWorkTime.workTimeEnabled ? normalizedWorkTime.workTimeEndHour : null,
    }
  }

  const filteredEvents = events.filter((item) => {
    if (filters.branch !== 'all' && item.reservation?.branch !== filters.branch) return false
    if (filters.room !== 'all' && item.reservation?.room !== filters.room) return false
    if (!isSchedulerItemInWorkTimeRange(item, normalizedFilters)) return false
    return true
  })

  const grouped = groupTodayEvents(filteredEvents)

  async function handleToggleDone(eventRow) {
    const nextStatus = eventRow.status === 'done' ? 'pending' : 'done'
    setPendingStatusId(eventRow.id)
    try {
      await updateWorkEventStatus(eventRow.id, nextStatus)
      setEvents((current) =>
        current.map((item) => (item.id === eventRow.id ? { ...item, status: nextStatus } : item)),
      )
    } catch (error) {
      setStatus(error.message)
    } finally {
      setPendingStatusId('')
    }
  }

  function openFilterSheet() {
    setDraftFilters({
      date: selectedDate,
      branch: filters.branch,
      room: filters.room,
      ...normalizedFilters,
    })
    setIsFilterSheetOpen(true)
  }

  async function applyFilterChanges() {
    const nextWorkTimeFilter = normalizeWorkTimeFilter(draftFilters)
    setSelectedDate(draftFilters.date)
    setFilters({
      branch: draftFilters.branch,
      room: draftFilters.room,
      ...nextWorkTimeFilter,
    })
    persistWorkTimeFilter(nextWorkTimeFilter)
    setIsFilterSheetOpen(false)

    if (pushState.subscribed) {
      await handleUpdatePushPreferences(buildPushPreferencePayload(pushPreferences, nextWorkTimeFilter), { silent: true })
    }
  }

  function updateDraftFilter(field, value) {
    setDraftFilters((current) => {
      if (field === 'branch') {
        const nextRooms = value === 'all' ? [] : getRoomsForBranch(value)
        return {
          ...current,
          branch: value,
          room: nextRooms.includes(current.room) ? current.room : 'all',
        }
      }

      if (field === 'workTimeEnabled') {
        return {
          ...current,
          workTimeEnabled: value,
        }
      }

      if (field === 'workTimeStartHour') {
        const nextStartHour = Number(value)
        return {
          ...current,
          workTimeStartHour: nextStartHour,
          workTimeEndHour: Math.max(nextStartHour, Number(current.workTimeEndHour)),
        }
      }

      if (field === 'workTimeEndHour') {
        const nextEndHour = Number(value)
        return {
          ...current,
          workTimeEndHour: nextEndHour,
          workTimeStartHour: Math.min(Number(current.workTimeStartHour), nextEndHour),
        }
      }

      return { ...current, [field]: value }
    })
  }

  const filterSummaryParts = [
    formatDateLabel(selectedDate),
    filters.branch === 'all' ? '전체 지점' : filters.branch,
    filters.room === 'all' ? '전체 룸' : filters.room,
  ]
  if (normalizedFilters.workTimeEnabled) {
    filterSummaryParts.unshift(formatWorkTimeRange(normalizedFilters))
  }
  const filterSummary = filterSummaryParts.join(' · ')

  const pushSummary = (() => {
    if (!pushState.supported) {
      return pushState.supportMessage || '이 기기에서는 웹 알림을 사용할 수 없어요.'
    }

    if (pushState.permission === 'denied') {
      return '알림 권한이 차단되어 있어요. 브라우저 설정에서 허용해 주세요.'
    }

    if (pushState.subscribed) {
      if (pushState.platform === 'ios' && pushState.standalone) {
        return '이 iPhone 홈 화면 앱은 웹 푸시를 받을 준비가 되어 있어요.'
      }
      return '이 브라우저는 웹 푸시를 받을 준비가 되어 있어요.'
    }

    if (pushState.permission === 'granted') {
      if (pushState.platform === 'ios' && pushState.standalone) {
        return '알림 권한은 허용됐지만 아직 이 홈 화면 앱을 푸시 대상으로 연결하지 않았어요.'
      }
      return '알림 권한은 허용됐지만 아직 이 브라우저를 연결하지 않았어요.'
    }

    if (pushState.platform === 'ios' && pushState.standalone) {
      return '이 홈 화면 앱을 연결하면 테스트 알림과 일정 알림을 받을 수 있어요.'
    }

    return '이 브라우저를 연결하면 테스트 알림과 일정 알림을 받을 수 있어요.'
  })()

  const isPushConnected = pushState.supported && pushState.subscribed
  const isPushDenied = pushState.permission === 'denied'
  const requiresIosStandalone = pushState.platform === 'ios' && !pushState.standalone
  const pushStatusLabel = (() => {
    if (isPushConnected) return '연결됨'
    if (requiresIosStandalone) return '홈 화면 필요'
    if (!pushState.supported) return '지원 안 됨'
    if (isPushDenied) return '권한 차단'
    return '설정 전'
  })()
  const pushStatusMeta = (() => {
    if (!pushStatus) return null

    const normalized = pushStatus.trim()
    const lower = normalized.toLowerCase()

    if (
      lower.includes('failed to send a request to the edge function') ||
      lower.includes('edge function returned a non-2xx status code') ||
      lower.includes('unknown error')
    ) {
      return {
        tone: 'error',
        text: '알림 처리 중 문제가 있었어요. 잠시 후 다시 시도해 주세요.',
      }
    }

    if (normalized.includes('보냈어요') || normalized.includes('연결했어요') || normalized.includes('저장했어요')) {
      return {
        tone: 'success',
        text: normalized,
      }
    }

    if (normalized.includes('권한') || normalized.includes('실패') || lower.includes('error')) {
      return {
        tone: 'error',
        text: normalized,
      }
    }

    return {
      tone: 'info',
      text: normalized,
    }
  })()

  async function handleEnablePush() {
    setIsPushBusy(true)
    try {
      await subscribeSchedulerPush()
      const syncedPreferences = await updateSchedulerPushPreferences(
        buildPushPreferencePayload(pushPreferences, normalizedFilters),
      )
      setPushPreferences({
        notificationsEnabled: syncedPreferences?.notificationsEnabled ?? pushPreferences.notificationsEnabled,
        notificationTypes: Array.isArray(syncedPreferences?.notificationTypes)
          ? syncedPreferences.notificationTypes
          : pushPreferences.notificationTypes,
        workTimeEnabled: syncedPreferences?.workTimeEnabled ?? normalizedFilters.workTimeEnabled,
        workTimeStartHour: syncedPreferences?.workTimeStartHour ?? normalizedFilters.workTimeStartHour,
        workTimeEndHour: syncedPreferences?.workTimeEndHour ?? normalizedFilters.workTimeEndHour,
      })
      setPushStatus('이 브라우저를 알림 대상으로 연결했어요.')
      await loadPushState()
    } catch (error) {
      setPushStatus(error instanceof Error ? error.message : '웹 알림 연결에 실패했어요.')
    } finally {
      setIsPushBusy(false)
    }
  }

  async function handleUpdatePushPreferences(nextPreferences, options = {}) {
    const { silent = false } = options
    setIsPushPreferencesBusy(true)
    try {
      const savedPreferences = await updateSchedulerPushPreferences(nextPreferences)
      setPushPreferences({
        notificationsEnabled: savedPreferences?.notificationsEnabled ?? nextPreferences.notificationsEnabled,
        notificationTypes: Array.isArray(savedPreferences?.notificationTypes)
          ? savedPreferences.notificationTypes
          : nextPreferences.notificationTypes,
        workTimeEnabled: savedPreferences?.workTimeEnabled ?? nextPreferences.workTimeEnabled,
        workTimeStartHour: savedPreferences?.workTimeStartHour ?? nextPreferences.workTimeStartHour,
        workTimeEndHour: savedPreferences?.workTimeEndHour ?? nextPreferences.workTimeEndHour,
      })
      if (!silent) {
        setPushStatus('자동 일정 알림 설정을 저장했어요.')
      }
    } catch (error) {
      setPushStatus(error instanceof Error ? error.message : '웹 알림 설정 저장에 실패했어요.')
    } finally {
      setIsPushPreferencesBusy(false)
    }
  }

  function handleToggleNotificationsEnabled() {
    handleUpdatePushPreferences(
      buildPushPreferencePayload(
        {
          ...pushPreferences,
          notificationsEnabled: !pushPreferences.notificationsEnabled,
        },
        normalizedFilters,
      ),
    )
  }

  function handleToggleNotificationType(type) {
    const exists = pushPreferences.notificationTypes.includes(type)
    const nextTypes = exists
      ? pushPreferences.notificationTypes.filter((value) => value !== type)
      : [...pushPreferences.notificationTypes, type]

    handleUpdatePushPreferences(
      buildPushPreferencePayload(
        {
          ...pushPreferences,
          notificationTypes: nextTypes,
        },
        normalizedFilters,
      ),
    )
  }

  async function handleSendTestPush() {
    setIsPushBusy(true)
    try {
      await sendSchedulerTestPush()
      setPushStatus('테스트 알림을 보냈어요. 기기에서 알림을 확인해 주세요.')
      await loadPushState()
    } catch (error) {
      setPushStatus(error instanceof Error ? error.message : '테스트 알림 전송에 실패했어요.')
    } finally {
      setIsPushBusy(false)
    }
  }

  return (
    <div className="scheduler-shell">
      <SchedulerTopbar />

      <section className={`scheduler-panel scheduler-push-panel ${isPushConnected ? 'is-connected' : 'is-setup'}`}>
        <div className="scheduler-section-head">
          <div>
            <p className="scheduler-section-label">웹 알림</p>
          </div>
          <div className={`scheduler-count-pill ${isPushConnected ? 'is-ready' : ''}`}>
            {pushStatusLabel}
          </div>
        </div>
        {isPushConnected ? (
          <div className="scheduler-push-connected">
            <p className="subtle scheduler-push-summary">{pushSummary}</p>
            <div className="scheduler-push-secondary">
              <div className="scheduler-push-preferences" aria-label="웹 알림 설정">
                <button
                  type="button"
                  className={`scheduler-chip ${pushPreferences.notificationsEnabled ? 'active' : ''}`}
                  onClick={handleToggleNotificationsEnabled}
                  disabled={isPushPreferencesBusy}
                  aria-pressed={pushPreferences.notificationsEnabled}
                >
                  전체 알림
                </button>
                <div className="scheduler-chip-row scheduler-push-type-row" role="group" aria-label="알림 종류 설정">
                  {PUSH_NOTIFICATION_OPTIONS.map((type) => {
                    const isActive = pushPreferences.notificationTypes.includes(type)
                    return (
                      <button
                        key={type}
                        type="button"
                        className={`scheduler-chip ${isActive && pushPreferences.notificationsEnabled ? 'active' : ''}`}
                        onClick={() => handleToggleNotificationType(type)}
                        disabled={isPushPreferencesBusy || !pushPreferences.notificationsEnabled}
                        aria-pressed={isActive && pushPreferences.notificationsEnabled}
                      >
                        {WORK_EVENT_META[type].label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="scheduler-push-actions compact">
                <button
                  type="button"
                  className="soft-button scheduler-push-test-button"
                  onClick={handleSendTestPush}
                  disabled={isPushBusy || !pushState.subscribed}
                >
                  테스트 알림
                </button>
                <button type="button" className="scheduler-text-button" onClick={handleEnablePush} disabled={isPushBusy}>
                  다시 연결
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="scheduler-push-setup">
            <div className="scheduler-push-actions">
              <button
                type="button"
                className="scheduler-push-mini-button"
                onClick={handleEnablePush}
                disabled={isPushBusy || !pushState.supported || pushState.permission === 'denied'}
              >
                알림 연결
              </button>
              <button
                type="button"
                className="scheduler-push-mini-button secondary"
                onClick={handleSendTestPush}
                disabled={isPushBusy || !pushState.subscribed}
              >
                테스트 알림
              </button>
            </div>
          </div>
        )}
        {pushStatusMeta ? (
          <p className={`subtle scheduler-push-status scheduler-push-status-note is-${pushStatusMeta.tone}`}>
            {pushStatusMeta.text}
          </p>
        ) : null}
      </section>

      <section className="scheduler-panel scheduler-controls">
        <div className="scheduler-filter-summary-row">
          <div className="scheduler-filter-summary-copy">
            <p className="scheduler-section-label">운영 시간</p>
            <strong>{normalizedFilters.workTimeEnabled ? '근무 중' : `${TODAY_HOURS.start}:00 - ${TODAY_HOURS.end}:00`}</strong>
            <p className="subtle">{filterSummary}</p>
          </div>
          <button type="button" className="soft-button scheduler-summary-button" onClick={openFilterSheet}>
            변경
          </button>
        </div>
      </section>

      {isFilterSheetOpen ? (
        <div className="scheduler-sheet-backdrop" onClick={() => setIsFilterSheetOpen(false)}>
          <section
            className="scheduler-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="필터 변경"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="scheduler-section-head scheduler-filter-sheet-head">
              <div>
                <p className="scheduler-section-label">보기 변경</p>
              </div>
            </div>

            <div className="scheduler-form scheduler-filter-form">
              <NativePickerField
                className="scheduler-filter-field"
                label="날짜"
                type="date"
                value={draftFilters.date}
                placeholder="날짜 선택"
                formatter={formatSchedulerDate}
                onChange={(event) => updateDraftFilter('date', event.target.value)}
                hideLabel
              />

              <div className="scheduler-filter-field">
                <div className="scheduler-chip-row scheduler-filter-mode-row" role="radiogroup" aria-label="보기 범위">
                  <button
                    type="button"
                    className={`scheduler-chip ${!draftFilters.workTimeEnabled ? 'active' : ''}`}
                    onClick={() => updateDraftFilter('workTimeEnabled', false)}
                    aria-pressed={!draftFilters.workTimeEnabled}
                  >
                    전체 보기
                  </button>
                  <button
                    type="button"
                    className={`scheduler-chip ${draftFilters.workTimeEnabled ? 'active' : ''}`}
                    onClick={() => updateDraftFilter('workTimeEnabled', true)}
                    aria-pressed={draftFilters.workTimeEnabled}
                  >
                    근무 중
                  </button>
                </div>
              </div>

              {draftFilters.workTimeEnabled ? (
                <div className="scheduler-two-up scheduler-filter-time-row">
                  <label className="scheduler-filter-field">
                    <span className="scheduler-parent-label">시작</span>
                    <select
                      value={normalizedDraftWorkTime.workTimeStartHour}
                      onChange={(event) => updateDraftFilter('workTimeStartHour', event.target.value)}
                    >
                      {WORK_TIME_HOUR_OPTIONS.map((hour) => (
                        <option key={`start-${hour}`} value={hour}>
                          {formatWorkTimeHour(hour)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="scheduler-filter-field">
                    <span className="scheduler-parent-label">종료</span>
                    <select
                      value={normalizedDraftWorkTime.workTimeEndHour}
                      onChange={(event) => updateDraftFilter('workTimeEndHour', event.target.value)}
                    >
                      {WORK_TIME_HOUR_OPTIONS.map((hour) => (
                        <option key={`end-${hour}`} value={hour}>
                          {formatWorkTimeHour(hour)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}

              <div className="scheduler-filter-field">
                <div className="scheduler-branch-option-row scheduler-filter-branch-row" role="radiogroup" aria-label="지점 필터">
                  <button
                    type="button"
                    className={`scheduler-chip ${draftFilters.branch === 'all' ? 'active' : ''}`}
                    onClick={() => updateDraftFilter('branch', 'all')}
                    aria-pressed={draftFilters.branch === 'all'}
                  >
                    전체 지점
                  </button>
                  {SCHEDULER_BRANCHES.map((branch) => {
                    const isActive = draftFilters.branch === branch
                    return (
                      <button
                        key={branch}
                        type="button"
                        className={`scheduler-chip ${isActive ? 'active' : ''}`}
                        onClick={() => updateDraftFilter('branch', branch)}
                        aria-pressed={isActive}
                      >
                        {branch}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="scheduler-filter-field">
                <div className="scheduler-room-picker">
                  <div className="scheduler-room-option-row scheduler-filter-room-row" role="radiogroup" aria-label="룸 필터">
                    <button
                      type="button"
                      className={`scheduler-room-option ${draftFilters.room === 'all' ? 'active' : ''}`}
                      onClick={() => updateDraftFilter('room', 'all')}
                      aria-pressed={draftFilters.room === 'all'}
                    >
                      전체 룸
                    </button>
                    {draftRooms.map((room) => {
                      const isActive = draftFilters.room === room
                      return (
                        <button
                          key={room}
                          type="button"
                          className={`scheduler-room-option ${isActive ? 'active' : ''}`}
                          onClick={() => updateDraftFilter('room', room)}
                          aria-pressed={isActive}
                        >
                          {room}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="scheduler-form-actions scheduler-filter-actions">
              <button type="button" className="soft-button" onClick={() => setIsFilterSheetOpen(false)}>
                닫기
              </button>
              <button type="button" onClick={applyFilterChanges}>
                적용
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {status && <p className="status">{status}</p>}

      <TodayEventSection
        title="지금 처리할 일"
        items={grouped.actionNow}
        emptyText={isLoading ? '불러오는 중...' : '없음'}
        pendingStatusId={pendingStatusId}
        onToggleDone={handleToggleDone}
      />

      <TodayEventSection
        title="곧 다가오는 일정"
        items={grouped.upcomingSoon}
        emptyText={isLoading ? '불러오는 중...' : '없음'}
        pendingStatusId={pendingStatusId}
        onToggleDone={handleToggleDone}
      />

      <TodayEventSection
        title="오늘 전체"
        items={grouped.allToday}
        emptyText={isLoading ? '불러오는 중...' : '없음'}
        pendingStatusId={pendingStatusId}
        onToggleDone={handleToggleDone}
      />
    </div>
  )
}

function TodayEventSection({ title, items, emptyText, onToggleDone, pendingStatusId }) {
  const normalizedEmptyText = (() => {
    if (emptyText === '불러오는 중...') return emptyText
    if (title === '지금 처리할 일') return '처리할 작업 없음'
    if (title === '곧 다가오는 일정') return '다가오는 일정 없음'
    return emptyText
  })()

  return (
    <section className={`scheduler-panel ${items.length === 0 ? 'scheduler-panel-empty' : ''}`}>
      <div className="scheduler-section-head">
        <div>
          <p className="scheduler-section-label">{title}</p>
        </div>
        <div className="scheduler-count-pill">{items.length}건</div>
      </div>

      {items.length === 0 ? (
        <p className="subtle scheduler-empty-note">{normalizedEmptyText}</p>
      ) : (
        <div className="scheduler-event-list">
          {items.map((item) => (
            <EventCard
              key={item.id}
              item={item}
              isSaving={pendingStatusId === item.id}
              onToggleDone={onToggleDone}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function EventCard({ item, onToggleDone, isSaving }) {
  const reservation = item.reservation || {}
  const urgencyText = item.isOverdue
    ? `${Math.abs(item.minutesAway)}분 지남`
    : item.minutesAway <= 60
      ? `${item.minutesAway}분 후`
      : ''
  const cardClassName = [
    'scheduler-event-card',
    `event-${item.event_type}`,
    item.memo_snapshot ? 'has-note' : '',
    item.status === 'done' ? 'done' : '',
    item.isOverdue ? 'overdue' : '',
    item.isUpcomingSoon ? 'upcoming' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article className={cardClassName}>
      <div className="scheduler-event-summary">
        <div className="scheduler-event-time-block">
          <strong>{item.timeLabel}</strong>
        </div>
        <span className={`scheduler-event-type ${item.meta?.tone || ''}`}>{item.meta?.label}</span>
        <strong className="scheduler-event-location">{reservation.branch} · {reservation.room}</strong>
        <p className="scheduler-event-customer">{reservation.customer_name}</p>
        {urgencyText ? <span className="scheduler-event-urgency scheduler-event-urgency-inline">{urgencyText}</span> : null}
      </div>

      {item.memo_snapshot ? <p className="scheduler-event-note">{item.memo_snapshot}</p> : null}

      <div className="scheduler-event-actions">
        <div className="scheduler-event-meta">
          <span className={`scheduler-status-badge status-${item.status}`}>{item.statusMeta?.label}</span>
          {(item.tags_snapshot || []).map((tag) => (
            <span key={tag} className="scheduler-tag-badge">
              {getTagMeta(tag).shortLabel}
            </span>
          ))}
        </div>
        <div className="scheduler-event-action-buttons">
          <button
            type="button"
            className={item.status === 'done' ? 'scheduler-action-button secondary' : 'scheduler-action-button'}
            disabled={isSaving}
            onClick={() => onToggleDone(item)}
          >
            {item.status === 'done' ? '완료 취소' : '완료'}
          </button>
          <button
            type="button"
            className="scheduler-action-button secondary"
            onClick={() => navigate(`/scheduler/${item.reservation_id}`)}
          >
            예약 수정
          </button>
        </div>
      </div>
    </article>
  )
}

function ReservationEditorPage({ mode, reservationId }) {
  const [formValues, setFormValues] = useState(createReservationDraft())
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(mode === 'edit')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (mode !== 'edit' || !reservationId) return

    async function loadReservation() {
      setIsLoading(true)
      try {
        const row = await getReservationById(reservationId)
        if (!row) {
          setStatus('예약을 찾지 못했어요.')
          return
        }
        setFormValues(mapReservationToFormValues(row))
        setStatus('')
      } catch (error) {
        setStatus(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadReservation()
  }, [mode, reservationId])

  function updateField(field, value) {
    setFormValues((current) => {
      if (field === 'branch') {
        const nextRooms = getRoomsForBranch(value)
        return {
          ...current,
          branch: value,
          room: nextRooms.includes(current.room) ? current.room : '',
        }
      }

      return { ...current, [field]: value }
    })
  }

  const availableRooms = getRoomsForBranch(formValues.branch)

  async function handleSubmit(event) {
    event.preventDefault()
    const validationMessage = validateReservationForm(formValues)
    if (validationMessage) {
      setStatus(validationMessage)
      return
    }

    setIsSaving(true)
    try {
      const saved = await saveReservation(buildReservationPayload(formValues), reservationId)
      if (mode === 'edit') {
        navigate(`/scheduler/${saved.id}`)
      } else {
        setFormValues(createReservationDraft())
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      setStatus('저장했어요.')
    } catch (error) {
      setStatus(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!reservationId) return
    const shouldDelete = window.confirm('이 예약과 연결된 작업 3개를 함께 삭제할까요?')
    if (!shouldDelete) return

    setIsSaving(true)
    try {
      await deleteReservation(reservationId)
      navigate('/scheduler')
    } catch (error) {
      setStatus(error.message)
      setIsSaving(false)
    }
  }

  return (
    <div className="scheduler-shell">
      <SchedulerTopbar />

      <section className="scheduler-panel">
        {status && <p className="status">{status}</p>}

        {isLoading ? (
          <p className="subtle">불러오는 중...</p>
        ) : (
          <form className="scheduler-form" onSubmit={handleSubmit}>
            <NativePickerField
              label="예약 날짜"
              type="date"
              value={formValues.reservationDate}
              placeholder="날짜 선택"
              formatter={formatSchedulerDate}
              onChange={(event) => updateField('reservationDate', event.target.value)}
            />

            <div className="scheduler-two-up scheduler-primary-field-row">
              <label className="scheduler-primary-field">
                <span className="scheduler-parent-label">지점</span>
                <div className="scheduler-branch-option-row" role="radiogroup" aria-label="지점 선택">
                  {SCHEDULER_BRANCHES.map((branch) => {
                    const isActive = formValues.branch === branch
                    return (
                      <button
                        key={branch}
                        type="button"
                        className={`scheduler-chip ${isActive ? 'active' : ''}`}
                        onClick={() => updateField('branch', branch)}
                        aria-pressed={isActive}
                      >
                        {branch}
                      </button>
                    )
                  })}
                </div>
              </label>

              <label className="scheduler-primary-field">
                <span className="scheduler-parent-label">룸</span>
                <div className="scheduler-room-picker" aria-disabled={!formValues.branch}>
                  {!formValues.branch ? (
                    <div className="scheduler-room-picker-empty">지점을 먼저 선택</div>
                  ) : (
                    <div className="scheduler-room-option-row" role="radiogroup" aria-label="룸 선택">
                      {availableRooms.map((room) => {
                        const isActive = formValues.room === room
                        return (
                          <button
                            key={room}
                            type="button"
                            className={`scheduler-room-option ${isActive ? 'active' : ''}`}
                            onClick={() => updateField('room', room)}
                            aria-pressed={isActive}
                          >
                            {room}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </label>
            </div>

            <label className="scheduler-primary-field">
              <span className="scheduler-parent-label">예약자 이름</span>
              <input
                value={formValues.customerName}
                onChange={(event) => updateField('customerName', event.target.value)}
                placeholder="예약자 또는 팀명"
              />
            </label>

            <div className="scheduler-two-up scheduler-primary-field-row">
              <NativePickerField
                label="시작 시간"
                type="time"
                value={formValues.startTime}
                placeholder="시간 선택"
                formatter={formatSchedulerTime}
                onChange={(event) => updateField('startTime', event.target.value)}
              />

              <div className="scheduler-duration-field">
                <label className="scheduler-primary-field">
                  <span className="scheduler-parent-label">이용 시간(시간)</span>
                  <input
                    className="scheduler-compact-input"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={formValues.durationHours}
                    onChange={(event) => updateField('durationHours', event.target.value)}
                  />
                </label>

                <div className="scheduler-preset-row scheduler-supporting-row">
                  {[1, 2, 3, 4, 5, 6].map((hours) => (
                    <button key={hours} type="button" className="soft-button" onClick={() => updateField('durationHours', hours)}>
                      {hours}h
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <label className="scheduler-warning-offset-field scheduler-form-section">
              <span className="scheduler-parent-label">퇴실등 시점</span>
              <div className="scheduler-warning-offset-row" role="radiogroup" aria-label="퇴실등 시점 선택">
                {[
                  ['10', '10분 전'],
                  ['15', '15분 전'],
                ].map(([value, label]) => {
                  const isActive = String(formValues.warningOffsetMinutes) === value
                  return (
                    <button
                      key={value}
                      type="button"
                      className={`scheduler-chip ${isActive ? 'active' : ''}`}
                      onClick={() => updateField('warningOffsetMinutes', value)}
                      aria-pressed={isActive}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </label>

            <div className="scheduler-form-section">
              <span className="scheduler-field-label scheduler-parent-label">특이 태그</span>
              <div className="scheduler-chip-row">
                {SCHEDULER_TAGS.map((tag) => {
                  const isActive = formValues.tags.includes(tag.value)
                  return (
                    <button
                      key={tag.value}
                      type="button"
                      className={`scheduler-chip ${isActive ? 'active' : ''}`}
                      onClick={() =>
                        updateField(
                          'tags',
                          isActive
                            ? formValues.tags.filter((item) => item !== tag.value)
                            : [...formValues.tags, tag.value],
                        )
                      }
                    >
                      {tag.shortLabel}
                    </button>
                  )
                })}
              </div>
            </div>

            <label className="scheduler-form-section">
              <span className="scheduler-parent-label">메모</span>
              <textarea
                rows="4"
                value={formValues.notesText}
                onChange={(event) => updateField('notesText', event.target.value)}
                placeholder="예: 6명 / 인이어 2세트 / MTR 요청"
              />
            </label>

            <div className="scheduler-form-actions">
              <button type="submit" disabled={isSaving}>
                {isSaving ? '저장 중...' : mode === 'edit' ? '수정 저장' : '예약 만들기'}
              </button>
              {mode === 'edit' ? (
                <button type="button" className="danger-button" onClick={handleDelete} disabled={isSaving}>
                  삭제
                </button>
              ) : null}
            </div>
          </form>
        )}
      </section>
    </div>
  )
}

function RoomStatusPage() {
  const [selectedDate, setSelectedDate] = useState(toLocalDateInputValue())
  const [events, setEvents] = useState([])
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadEvents() {
      setIsLoading(true)
      try {
        const rows = await listTodayWorkEvents(selectedDate)
        setEvents(rows)
        setStatus('')
      } catch (error) {
        setStatus(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadEvents()
  }, [selectedDate])

  const groupedRooms = Object.values(
    events.reduce((accumulator, item) => {
      const reservation = item.reservation || {}
      const key = `${reservation.branch}__${reservation.room}`
      if (!accumulator[key]) {
        accumulator[key] = {
          key,
          branch: reservation.branch,
          room: reservation.room,
          events: [],
        }
      }
      accumulator[key].events.push(item)
      return accumulator
    }, {}),
  )

  return (
    <div className="scheduler-shell">
      <SchedulerTopbar />

      <section className="scheduler-panel scheduler-controls">
        <div className="scheduler-date-row">
          <div>
            <p className="scheduler-section-label">기준 날짜</p>
            <strong>{formatDateLabel(selectedDate)}</strong>
          </div>
          <input
            className="scheduler-compact-input"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </div>
      </section>

      {status && <p className="status">{status}</p>}

      <section className="scheduler-room-grid">
        {groupedRooms.length === 0 ? (
          <div className="scheduler-panel">
            <p className="subtle">{isLoading ? '불러오는 중...' : '오늘 표시할 룸 상태가 없어요.'}</p>
          </div>
        ) : (
          groupedRooms.map((roomGroup) => {
            const roomStatus = getRoomStatus(roomGroup.events)
            const focusReservation = roomStatus.focusEvent?.reservation
            return (
              <article key={roomGroup.key} className={`scheduler-panel scheduler-room-card ${roomStatus.tone}`}>
                <div className="scheduler-section-head">
                  <div>
                    <p className="scheduler-section-label">{roomGroup.branch}</p>
                    <h2>{roomGroup.room}</h2>
                  </div>
                  <span className="scheduler-status-badge">{roomStatus.title}</span>
                </div>

                <p className="scheduler-room-subtitle">{roomStatus.subtitle}</p>

                {focusReservation ? (
                  <>
                    <strong>{focusReservation.customer_name}</strong>
                    <div className="scheduler-chip-row">
                      {(roomStatus.focusEvent.tags_snapshot || []).map((tag) => (
                        <span key={tag} className="scheduler-tag-badge">
                          {getTagMeta(tag).shortLabel}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="scheduler-link-button"
                      onClick={() => navigate(`/scheduler/${focusReservation.id}`)}
                    >
                      예약 열기
                    </button>
                  </>
                ) : (
                  <p className="subtle">현재 확인할 예약이 없어요.</p>
                )}
              </article>
            )
          })
        )}
      </section>
    </div>
  )
}
