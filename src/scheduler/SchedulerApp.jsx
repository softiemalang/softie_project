import { useEffect, useMemo, useRef, useState } from 'react'
import { navigate } from '../lib/router'
import { listTodayWorkEvents, getReservationById, saveReservation, deleteReservation, updateWorkEventStatus } from './api'
import { SCHEDULER_BRANCHES, SCHEDULER_TAGS, TODAY_HOURS } from './constants'
import { buildReservationPayload, createReservationDraft, getRoomStatus, getRoomsForBranch, getTagMeta, groupTodayEvents, mapReservationToFormValues, validateReservationForm } from './helpers'
import {
  formatWorkTimeHour,
  formatWorkTimeRange,
  getDefaultWorkTimeFilter,
  isSchedulerItemInWorkTimeRange,
  normalizeWorkTimeFilter,
} from './rules'
import {
  getOrCreatePushDeviceId,
  getSchedulerPushPreferences,
  getSchedulerPushState,
  sendSchedulerTestPush,
  subscribeSchedulerPush,
  updateSchedulerPushPreferences,
} from './push'
import {
  formatDateLabel,
  formatSchedulerDate,
  formatSchedulerTime,
  getMonday,
  getWeekRangeLabel,
  getWeekStartDate,
  getWeekTitle,
  isTimeRangeOverlapping,
  normalizeHourTime,
  toLocalDateInputValue,
} from './time'

import { connectGoogleCalendar, createGoogleCalendarEvent, isGoogleConnected, disconnectGoogleCalendar, triggerGoogleDriveBackup, appendGoogleSheetsLog } from './googleApi'

const GO_TO_TODAY_EVENT = 'scheduler:go-today'
const WORK_TIME_FILTER_STORAGE_KEY = 'scheduler:work-time-filter'
const WORK_LOGS_STORAGE_KEY = 'scheduler:work-logs'

const DEFAULT_PUSH_PREFERENCES = {
  notificationsEnabled: true,
  notificationTypes: ['checkin', 'warning', 'checkout'],
  ...getDefaultWorkTimeFilter(),
}

function loadWorkLogs() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(WORK_LOGS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveWorkLog(entry, idsToRemove = []) {
  if (typeof window === 'undefined') return
  const logs = loadWorkLogs()
  
  // 겹치는 항목이나 삭제 요청된 항목 제외
  let newLogs = logs.filter(log => !idsToRemove.includes(log.id))
  
  if (entry) {
    const logEntry = {
      ...entry,
      id: entry.id || `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      syncedAt: new Date().toISOString()
    }
    newLogs.push(logEntry)
  }
  
  window.localStorage.setItem(WORK_LOGS_STORAGE_KEY, JSON.stringify(newLogs))
}
const WORK_TIME_HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => hour)

function loadStoredWorkTimeFilter(selectedDate) {
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

function persistWorkTimeFilter(filter, selectedDate) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(WORK_TIME_FILTER_STORAGE_KEY, JSON.stringify({
    ...normalizeWorkTimeFilter(filter),
    selectedDate,
  }))
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

  const renderContent = () => {
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
        <section className="scheduler-panel">
          <button type="button" className="soft-button" onClick={() => navigate('/scheduler')}>
            오늘 화면으로 이동
          </button>
        </section>
      </div>
    )
  }

  // 예약 에디터(생성/수정) 페이지가 아닐 때만 FAB를 표시합니다.
  const showFab = route.name !== 'new' && route.name !== 'edit' && route.name !== 'not-found'

  return (
    <>
      {renderContent()}
      {showFab && (
        <button
          type="button"
          className="scheduler-fab-button"
          onClick={() => navigate('/scheduler/new')}
          aria-label="새 일정 추가"
        >
          + 일정 추가
        </button>
      )}
    </>
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
  const initialSelectedDate = toLocalDateInputValue()
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate)
  const [events, setEvents] = useState([])
  const [filters, setFilters] = useState(() => ({
    branch: 'all',
    room: 'all',
    ...loadStoredWorkTimeFilter(initialSelectedDate),
  }))
  const [draftFilters, setDraftFilters] = useState(() => ({
    date: initialSelectedDate,
    branch: 'all',
    room: 'all',
    ...loadStoredWorkTimeFilter(initialSelectedDate),
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
  const [googleStatus, setGoogleStatus] = useState('')
  const [isWebPushModalOpen, setIsWebPushModalOpen] = useState(false)
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false)
  const [isPushBusy, setIsPushBusy] = useState(false)
  const [pushPreferences, setPushPreferences] = useState(DEFAULT_PUSH_PREFERENCES)
  const [isPushPreferencesBusy, setIsPushPreferencesBusy] = useState(false)
  const rooms = filters.branch === 'all' ? [] : getRoomsForBranch(filters.branch)
  const draftRooms = draftFilters.branch === 'all' ? [] : getRoomsForBranch(draftFilters.branch)
  const normalizedFilters = normalizeWorkTimeFilter(filters)
  const normalizedDraftWorkTime = normalizeWorkTimeFilter(draftFilters)

  const [workLogs, setWorkLogs] = useState(() => loadWorkLogs())
  const [isWorkLogOpen, setIsWorkLogOpen] = useState(false)
  const [viewingWeekStart, setViewingWeekStart] = useState(() => getWeekStartDate(initialSelectedDate))
  const [copyFeedback, setCopyFeedback] = useState('')
  const [syncConfirmation, setSyncConfirmation] = useState(null)

  function handleSyncWorkLog() {
    if (!normalizedFilters.workTimeEnabled) return
    
    const candidate = {
      weekStartDate: getWeekStartDate(selectedDate),
      date: selectedDate,
      startTime: formatWorkTimeHour(normalizedFilters.workTimeStartHour),
      endTime: formatWorkTimeHour(normalizedFilters.workTimeEndHour),
      durationMinutes: (normalizedFilters.workTimeEndHour - normalizedFilters.workTimeStartHour) * 60,
      branch: filters.branch !== 'all' ? filters.branch : null,
      room: filters.room !== 'all' ? filters.room : null,
    }

    // 같은 날짜/지점/룸 내에서 겹치는 항목 찾기
    const overlapping = workLogs.filter(log => 
      log.date === candidate.date &&
      log.branch === candidate.branch &&
      log.room === candidate.room &&
      isTimeRangeOverlapping(
        candidate.startTime, candidate.endTime,
        log.startTime, log.endTime
      )
    )

    if (overlapping.length > 0) {
      setSyncConfirmation({ candidate, overlapping })
      return
    }
    
    saveWorkLog(candidate)
    const nextLogs = loadWorkLogs()
    setWorkLogs(nextLogs)
    setPushStatus('근무 기록을 동기화했어요.')
    setTimeout(() => setPushStatus(''), 2000)
  }

  function handleConfirmSync() {
    if (!syncConfirmation) return
    const { candidate, overlapping } = syncConfirmation
    
    saveWorkLog(candidate, overlapping.map(o => o.id))
    setWorkLogs(loadWorkLogs())
    setSyncConfirmation(null)
    setPushStatus('근무 기록을 변경 적용했어요.')
    setTimeout(() => setPushStatus(''), 2000)
  }

  function handleDeleteWorkLogEntry(id) {
    saveWorkLog(null, [id])
    setWorkLogs(loadWorkLogs())
  }

  function handleCopyWeekLog(weekStart) {
    const targetLogs = workLogs.filter(log => log.weekStartDate === weekStart)
    const sortedLogs = [...targetLogs].sort((a, b) => a.date.localeCompare(b.date))
    
    if (sortedLogs.length === 0) return

    const title = getWeekTitle(weekStart)
    const lines = [title, '']
    
    let totalMinutes = 0
    sortedLogs.forEach(log => {
      const dateObj = new Date(log.date)
      const dateLabel = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`
      const durationHours = log.durationMinutes / 60
      lines.push(`${dateLabel}\n${log.startTime}-${log.endTime} (${durationHours}h)`)
      totalMinutes += log.durationMinutes
    })
    
    lines.push('', `총 ${totalMinutes / 60}시간`)
    
    const text = lines.join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback('복사됨')
      setTimeout(() => setCopyFeedback(''), 2000)
    })
  }

  function handleNavigateWeek(direction) {
    setViewingWeekStart(current => {
      const date = new Date(current)
      date.setDate(date.getDate() + (direction === 'next' ? 7 : -7))
      return getWeekStartDate(date)
    })
  }

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
      return nextState
    } catch (error) {
      console.error('[push] loadPushState failed', error)
      return pushState
    }
  }

  useEffect(() => {
    loadEvents()
  }, [selectedDate])

  useEffect(() => {
    loadPushState()
  }, [])

  async function loadPushPreferences(stateOverride = null, deviceId = null) {
    const effectivePushState = stateOverride ?? pushState
    if (!effectivePushState.supported || !effectivePushState.subscribed) {
      setPushPreferences({
        ...DEFAULT_PUSH_PREFERENCES,
        ...normalizedFilters,
      })
      return
    }

    try {
      const deviceIdToUse = deviceId || getOrCreatePushDeviceId()
      const nextPreferences = await getSchedulerPushPreferences(deviceIdToUse)
      const nextNotificationPreferences = {
        notificationsEnabled: nextPreferences?.notificationsEnabled ?? true,
        notificationTypes: Array.isArray(nextPreferences?.notificationTypes)
          ? nextPreferences.notificationTypes
          : DEFAULT_PUSH_PREFERENCES.notificationTypes,
      }
      setPushPreferences({
        ...nextNotificationPreferences,
        workTimeEnabled: nextPreferences?.workTimeEnabled ?? normalizedFilters.workTimeEnabled,
        workTimeStartHour: nextPreferences?.workTimeStartHour ?? normalizedFilters.workTimeStartHour,
        workTimeEndHour: nextPreferences?.workTimeEndHour ?? normalizedFilters.workTimeEndHour,
      })
    } catch (error) {
      console.error('[push] loadPushPreferences failed', error)
    }
  }

  useEffect(() => {
    loadPushPreferences()
  }, [pushState.subscribed, normalizedFilters.workTimeEnabled, normalizedFilters.workTimeEndHour, normalizedFilters.workTimeStartHour, selectedDate])

  useEffect(() => {
    function handleGoToToday() {
      const today = toLocalDateInputValue()
      const storedWorkTimeFilter = loadStoredWorkTimeFilter(today)
      setSelectedDate(today)
      setFilters((current) => ({
        ...current,
        ...storedWorkTimeFilter,
      }))
    }

    window.addEventListener(GO_TO_TODAY_EVENT, handleGoToToday)
    return () => window.removeEventListener(GO_TO_TODAY_EVENT, handleGoToToday)
  }, [])

  function buildPushPreferencePayload(preferences, workTimeFilter, workTimeDate = selectedDate) {
    const normalizedWorkTime = normalizeWorkTimeFilter(workTimeFilter)
    return {
      notificationsEnabled: true,
      notificationTypes: preferences.notificationTypes,
      workTimeEnabled: normalizedWorkTime.workTimeEnabled,
      workTimeStartHour: normalizedWorkTime.workTimeEnabled ? normalizedWorkTime.workTimeStartHour : null,
      workTimeEndHour: normalizedWorkTime.workTimeEnabled ? normalizedWorkTime.workTimeEndHour : null,
      selectedDate: normalizedWorkTime.workTimeEnabled ? workTimeDate : null,
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
    const nextDate = draftFilters.date
    setSelectedDate(nextDate)
    setFilters({
      branch: draftFilters.branch,
      room: draftFilters.room,
      ...nextWorkTimeFilter,
    })
    persistWorkTimeFilter(nextWorkTimeFilter, nextDate)
    setIsFilterSheetOpen(false)

    // 구독 상태를 최신화하여 stale한 pushState.subscribed 방지
    const currentPushState = await getSchedulerPushState()
    setPushState(currentPushState)

    if (currentPushState.subscribed) {
      try {
        const deviceId = getOrCreatePushDeviceId()
        const success = await handleUpdatePushPreferences(
          buildPushPreferencePayload(
            pushPreferences,
            nextWorkTimeFilter,
            nextDate,
          ),
          { silent: false, deviceId },
        )

        if (success) {
          setPushStatus('알림 조건을 저장했어요.')
          await loadPushPreferences(currentPushState, deviceId)
        }
      } catch (error) {
        console.error('[push] applyFilterChanges failed:', error)
        setPushStatus('알림 설정 저장 중 오류가 발생했습니다.')
      }
    } else {
      console.warn('[push] skipping preference sync: not subscribed')
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
    setPushStatus('알림 연결 중...')

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('알림 연결 시간이 초과됐어요. 앱을 완전히 종료한 뒤 다시 열어 주세요.')), 15000)
    )

    try {
      const deviceId = getOrCreatePushDeviceId()

      await Promise.race([
        subscribeSchedulerPush(deviceId),
        timeoutPromise
      ])

      setPushStatus('구독 완료, 설정 저장 중...')

      await updateSchedulerPushPreferences(
        buildPushPreferencePayload(pushPreferences, normalizedFilters),
        deviceId,
      )
      setPushStatus('이 브라우저를 알림 대상으로 연결했어요.')

      const nextPushState = await loadPushState()
      await loadPushPreferences(nextPushState, deviceId)
    } catch (error) {
      const msg = error instanceof Error ? error.message : '웹 알림 연결에 실패했어요.'
      console.error('[push] handleEnablePush failed:', error)
      setPushStatus(msg)
    } finally {
      setIsPushBusy(false)
    }
  }

  async function handleUpdatePushPreferences(nextPreferences, options = {}) {
    const { silent = false, deviceId = null } = options
    setIsPushPreferencesBusy(true)
    if (!silent) {
      setPushStatus('')
    }
    try {
      const savedPreferences = await updateSchedulerPushPreferences(nextPreferences, deviceId)
      setPushPreferences({
        notificationsEnabled: savedPreferences?.notificationsEnabled ?? nextPreferences.notificationsEnabled,
        notificationTypes: Array.isArray(savedPreferences?.notificationTypes)
          ? savedPreferences.notificationTypes
          : nextPreferences.notificationTypes,
        workTimeEnabled: savedPreferences?.workTimeEnabled ?? nextPreferences.workTimeEnabled,
        workTimeStartHour: savedPreferences?.workTimeStartHour ?? nextPreferences.workTimeStartHour,
        workTimeEndHour: savedPreferences?.workTimeEndHour ?? nextPreferences.workTimeEndHour,
      })
      if (!silent) setPushStatus('웹 알림 조건을 저장했어요.')
      return true
    } catch (error) {
      if (!silent) {
        setPushStatus(error instanceof Error ? error.message : '웹 알림 설정 저장에 실패했어요.')
      } else {
        console.error('[push] silent preference save failed', error)
      }
      return false
    } finally {
      setIsPushPreferencesBusy(false)
    }
  }

  async function handleSendTestPush() {
    setIsPushBusy(true)
    try {
      const deviceId = getOrCreatePushDeviceId()
      await sendSchedulerTestPush(deviceId)
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

      <button
        type="button"
        className={`scheduler-panel scheduler-push-panel scheduler-setting-card ${isPushConnected ? 'is-connected' : 'is-setup'}`}
        onClick={() => setIsWebPushModalOpen(true)}
      >
        <div className="scheduler-section-head">
          <div>
            <p className="scheduler-section-label">웹 알림</p>
          </div>
          <div className={`scheduler-count-pill ${isPushConnected ? 'is-ready' : ''}`}>
            {pushStatusLabel}
          </div>
        </div>
        {!isPushConnected && (
          <p className="scheduler-setting-subtitle">
            알림을 받으려면 연결이 필요해요.
          </p>
        )}
      </button>

      {isWebPushModalOpen && (
        <div className="scheduler-sheet-backdrop scheduler-modal-backdrop" onClick={() => setIsWebPushModalOpen(false)}>
          <div className="scheduler-modal" onClick={e => e.stopPropagation()}>
            <div className="scheduler-section-head" style={{ marginBottom: '0.65rem' }}>
              <div>
                <p className="scheduler-section-label">
                  {normalizedFilters.workTimeEnabled ? '알림 On' : '알림 Off'}
                </p>
              </div>
              <button type="button" className="scheduler-modal-close" onClick={() => setIsWebPushModalOpen(false)}>닫기</button>
            </div>
            
            <p className="subtle" style={{ marginTop: 0, marginBottom: '1.25rem', fontSize: '0.86rem' }}>
              {normalizedFilters.workTimeEnabled
                ? '현재 브라우저 알림이 켜져 있어요.'
                : isPushConnected 
                  ? '알림 연결은 완료되어 있어요.\n근무 중 상태일 때만 알림이 전달됩니다.'
                  : '현재 브라우저 알림이 꺼져 있어요. 알림을 받으려면 연결을 확인해 주세요.'}
            </p>

            {isPushConnected ? (
              <div className="scheduler-modal-actions stack" aria-label="웹 알림 설정">
                <button
                  type="button"
                  className="scheduler-modal-btn secondary"
                  onClick={handleSendTestPush}
                  disabled={isPushBusy || !pushState.subscribed}
                >
                  테스트 알림 보내기
                </button>
                <button
                  type="button"
                  className="scheduler-modal-btn"
                  onClick={handleEnablePush}
                  disabled={isPushBusy}
                >
                  {normalizedFilters.workTimeEnabled ? '브라우저 다시 연결' : '브라우저 연결 확인'}
                </button>
              </div>
            ) : (
              <div className="scheduler-modal-actions stack">
                <button
                  type="button"
                  className="scheduler-modal-btn"
                  onClick={handleEnablePush}
                  disabled={isPushBusy || !pushState.supported || pushState.permission === 'denied'}
                >
                  알림 연결
                </button>
                <button
                  type="button"
                  className="scheduler-modal-btn secondary"
                  onClick={handleSendTestPush}
                  disabled={isPushBusy || !pushState.subscribed}
                >
                  테스트 알림 보내기
                </button>
              </div>
            )}

            <p className="subtle" style={{ marginTop: '1rem', marginBottom: 0, fontSize: '0.8rem', textAlign: 'center' }}>
              현재 알림 조건: 근무 중
            </p>
          </div>
        </div>
      )}


      <button
        type="button"
        className="scheduler-panel scheduler-push-panel scheduler-setting-card"
        onClick={() => setIsGoogleModalOpen(true)}
      >
        <div className="scheduler-section-head">
          <div>
            <p className="scheduler-section-label">Google 연동</p>
          </div>
          <div className={`scheduler-count-pill ${isGoogleConnected() ? 'is-ready' : ''}`}>
            {isGoogleConnected() ? '연결됨' : '연결 필요'}
          </div>
        </div>
        {!isGoogleConnected() && (
          <p className="scheduler-setting-subtitle">
            연결하면 일정 동기화와 백업을 사용할 수 있어요.
          </p>
        )}
      </button>

      {isGoogleModalOpen && (
        <div className="scheduler-sheet-backdrop scheduler-modal-backdrop" onClick={() => setIsGoogleModalOpen(false)}>
          <div className="scheduler-modal" onClick={e => e.stopPropagation()}>
            <div className="scheduler-section-head">
              <p className="scheduler-section-label">Google 연동</p>
              <button type="button" className="scheduler-modal-close" onClick={() => setIsGoogleModalOpen(false)}>닫기</button>
            </div>
            
            <div className="scheduler-modal-actions stack">
              <p className="subtle" style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '0.86rem' }}>
                Google 캘린더와 연동하면 일정이 자동으로 동기화되고, 안전한 데이터 백업이 가능합니다.
              </p>
              <button
                type="button"
                className="scheduler-modal-btn"
                onClick={() => connectGoogleCalendar(getOrCreatePushDeviceId())}
              >
                {isGoogleConnected() ? '계정 다시 연결하기' : 'Google 계정 연결하기'}
              </button>
              <button
                type="button"
                className="scheduler-modal-btn secondary"
                onClick={async () => {
                  if (!isGoogleConnected()) {
                    setGoogleStatus('Google 계정을 먼저 연결해 주세요.')
                    return
                  }
                  try {
                    setGoogleStatus('Google Calendar 일정 생성 중...')
                    const now = new Date()
                    const end = new Date(now.getTime() + 60 * 60 * 1000)
                    await createGoogleCalendarEvent(getOrCreatePushDeviceId(), {
                      summary: '테스트 일정',
                      location: '서울 지점',
                      description: 'Gemini CLI를 통한 테스트 일정입니다.',
                      startAt: now.toISOString(),
                      endAt: end.toISOString(),
                    })
                    setGoogleStatus('일정을 생성했어요.')
                  } catch (error) {
                    setGoogleStatus(`오류: ${error.message}`)
                    if (error.message?.includes('not connected') || error.message?.includes('refresh token') || error.message?.includes('insufficient')) {
                      disconnectGoogleCalendar()
                    }
                  }
                }}
              >
                테스트 일정 추가
              </button>
              <button
                type="button"
                className="scheduler-modal-btn secondary"
                onClick={async () => {
                  if (!isGoogleConnected()) {
                    setGoogleStatus('Google 계정을 먼저 연결해 주세요.')
                    return
                  }
                  try {
                    setGoogleStatus('Google Drive에 백업 중...')
                    const result = await triggerGoogleDriveBackup(getOrCreatePushDeviceId(), 'full')
                    setGoogleStatus(`백업 완료: ${result.fileName}`)
                    
                    // Log to Google Sheets
                    appendGoogleSheetsLog(getOrCreatePushDeviceId(), 'backup_logs', [
                      new Date().toISOString(),
                      'backup_completed',
                      'full',
                      result.fileName || '',
                      result.fileId || '',
                      'success',
                      JSON.stringify(result.metadata?.counts || {}),
                      ''
                    ])
                  } catch (error) {
                    setGoogleStatus(`오류: ${error.message}`)
                    if (error.message?.includes('not connected') || error.message?.includes('refresh token') || error.message?.includes('insufficient')) {
                      disconnectGoogleCalendar()
                    }
                  }
                }}
              >
                수동 백업 (Drive)
              </button>
            </div>
            {googleStatus && (
              <p className={`scheduler-google-status ${googleStatus.includes('오류') ? 'error' : 'success'}`} style={{ marginTop: '1rem', marginBottom: 0 }}>
                {googleStatus}
              </p>
            )}
          </div>
        </div>
      )}

      <section className="scheduler-panel scheduler-controls">
        <div className="scheduler-filter-summary-row">
          <div className="scheduler-filter-summary-copy">
            <p className="scheduler-section-label">운영 시간</p>
            <strong>{normalizedFilters.workTimeEnabled ? '근무 중' : `${TODAY_HOURS.start}:00 - ${TODAY_HOURS.end}:00`}</strong>
            <p className="subtle">{filterSummary}</p>
          </div>
          <div className="scheduler-summary-actions">
            <button
              type="button"
              className="soft-button scheduler-summary-button"
              onClick={handleSyncWorkLog}
              disabled={!normalizedFilters.workTimeEnabled}
            >
              동기화
            </button>
            <button type="button" className="soft-button scheduler-summary-button" onClick={openFilterSheet}>
              변경
            </button>
          </div>
        </div>
      </section>

      <WorkLogSummaryCard
        currentWeekStart={getWeekStartDate(selectedDate)}
        logs={workLogs}
        onOpen={() => {
          setViewingWeekStart(getWeekStartDate(selectedDate))
          setIsWorkLogOpen(true)
        }}
        onCopy={handleCopyWeekLog}
        copyFeedback={copyFeedback}
      />

      {isFilterSheetOpen ? (
        <div className="scheduler-sheet-backdrop scheduler-modal-backdrop" onClick={() => setIsFilterSheetOpen(false)}>
          <div
            className="scheduler-modal"
            role="dialog"
            aria-modal="true"
            aria-label="필터 변경"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="scheduler-section-head" style={{ marginBottom: '0.65rem' }}>
              <div>
                <p className="scheduler-section-label">보기 변경</p>
              </div>
              <button type="button" className="scheduler-modal-close" onClick={() => setIsFilterSheetOpen(false)}>닫기</button>
            </div>
            
            <p className="subtle" style={{ marginTop: 0, marginBottom: '1.25rem', fontSize: '0.86rem' }}>
              확인할 날짜와 표시 범위를 선택해요.
            </p>

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
            </div>

            <div className="scheduler-modal-actions stack" style={{ marginTop: '1.5rem' }}>
              <button type="button" className="scheduler-modal-btn primary" onClick={applyFilterChanges}>
                적용
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isWorkLogOpen ? (
        <WorkLogDetailView
          viewingWeekStart={viewingWeekStart}
          logs={workLogs}
          onClose={() => setIsWorkLogOpen(false)}
          onNavigate={handleNavigateWeek}
          onCopy={handleCopyWeekLog}
          onDelete={handleDeleteWorkLogEntry}
          copyFeedback={copyFeedback}
        />
      ) : null}

      {syncConfirmation ? (
        <SyncConfirmationModal
          confirmation={syncConfirmation}
          onCancel={() => setSyncConfirmation(null)}
          onConfirm={handleConfirmSync}
        />
      ) : null}

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
  const urgencyText = item.status === 'done'
    ? ''
    : item.isOverdue
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

      if (field === 'startTime') {
        return { ...current, startTime: normalizeHourTime(value) }
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
      
      // MVP: 구글 캘린더 연동이 되어있다면 일정 생성 시도
      if (isGoogleConnected()) {
        createGoogleCalendarEvent(getOrCreatePushDeviceId(), {
          reservationId: saved.id,
          summary: `[${saved.branch}] ${saved.customer_name}`,
          location: `${saved.branch} ${saved.room}`,
          description: saved.notes_text,
          startAt: saved.start_at,
          endAt: saved.end_at,
        }).catch(err => {
          console.error('Google Calendar Sync Error:', err)
          if (err.message?.includes('not connected') || err.message?.includes('refresh token') || err.message?.includes('insufficient')) {
            disconnectGoogleCalendar()
          }
        })

        // Log to Google Sheets (fire-and-forget)
        appendGoogleSheetsLog(getOrCreatePushDeviceId(), 'scheduler_logs', [
          new Date().toISOString(),
          mode === 'edit' ? 'reservation_updated' : 'reservation_created',
          saved.id,
          saved.reservation_date,
          saved.start_at,
          saved.end_at,
          saved.branch,
          saved.room,
          saved.customer_name,
          saved.google_event_id || '',
          saved.notes_text || ''
        ])
      }

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

      <section className="scheduler-panel">
        <div className="scheduler-section-head" style={{ justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
          <button type="button" className="scheduler-back-button" onClick={() => navigate('/scheduler')}>
            ← 돌아가기
          </button>
        </div>

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

function WorkLogSummaryCard({ currentWeekStart, logs, onOpen, onCopy, copyFeedback }) {
  const weekLogs = logs.filter(log => log.weekStartDate === currentWeekStart)
  const totalMinutes = weekLogs.reduce((acc, log) => acc + log.durationMinutes, 0)
  const totalHours = totalMinutes / 60

  return (
    <section className="scheduler-panel scheduler-work-log-card">
      <div className="scheduler-filter-summary-row">
        <div className="scheduler-filter-summary-copy">
          <p className="scheduler-section-label">근무 일지</p>
          <p className="subtle">
            {getWeekTitle(currentWeekStart)} · {getWeekRangeLabel(currentWeekStart)}
          </p>
        </div>
        <div className="scheduler-summary-actions">
          <button
            type="button"
            className="soft-button scheduler-summary-button"
            onClick={() => onCopy(currentWeekStart)}
            disabled={weekLogs.length === 0}
          >
            {copyFeedback || '복사'}
          </button>
          <button type="button" className="soft-button scheduler-summary-button" onClick={onOpen}>
            보기
          </button>
        </div>
      </div>
    </section>
  )
}

function WorkLogDetailView({ viewingWeekStart, logs, onClose, onNavigate, onCopy, onDelete, copyFeedback }) {
  const weekLogs = logs.filter(log => log.weekStartDate === viewingWeekStart)
  const sortedLogs = [...weekLogs].sort((a, b) => a.date.localeCompare(b.date))
  const totalMinutes = weekLogs.reduce((acc, log) => acc + log.durationMinutes, 0)
  const totalHours = totalMinutes / 60

  return (
    <div className="scheduler-sheet-backdrop scheduler-modal-backdrop" onClick={onClose}>
      <div
        className="scheduler-modal scheduler-work-log-modal"
        role="dialog"
        aria-modal="true"
        aria-label="근무 일지 상세"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="scheduler-section-head" style={{ marginBottom: '0.65rem' }}>
          <div>
            <p className="scheduler-section-label">근무 일지</p>
          </div>
          <button type="button" className="scheduler-modal-close" onClick={onClose}>닫기</button>
        </div>

        <div className="scheduler-work-log-nav">
          <button type="button" className="soft-button scheduler-work-log-nav-btn" onClick={() => onNavigate('prev')}>이전 주</button>
          <div className="scheduler-work-log-title">
            <strong>{getWeekTitle(viewingWeekStart)}</strong>
            <p className="subtle">{getWeekRangeLabel(viewingWeekStart)}</p>
          </div>
          <button type="button" className="soft-button scheduler-work-log-nav-btn" onClick={() => onNavigate('next')}>다음 주</button>
        </div>

        <div className="scheduler-work-log-content">
          {sortedLogs.length === 0 ? (
            <div className="scheduler-work-log-empty">
              <p className="subtle scheduler-empty-note">이번 주 근무 기록이 아직 없어요.</p>
            </div>
          ) : (
            <div className="scheduler-work-log-list">
              {sortedLogs.map((log) => {
                const dateObj = new Date(log.date)
                return (
                  <div key={log.id || log.syncKey} className="scheduler-work-log-item">
                    <div className="scheduler-work-log-item-info">
                      <strong>{dateObj.getMonth() + 1}/{dateObj.getDate()}</strong>
                      <p>{log.startTime}-{log.endTime} ({log.durationMinutes / 60}h)</p>
                    </div>
                    <button 
                      type="button" 
                      className="scheduler-log-delete-btn"
                      onClick={() => onDelete(log.id)}
                      aria-label="기록 삭제"
                    >
                      삭제
                    </button>
                  </div>
                )
              })}
            </div>
          )}
          
          <div className="scheduler-work-log-total">
            <span>주간 총계</span>
            <strong className={totalHours > 0 ? 'active' : 'empty'}>
              {totalHours}시간
            </strong>
          </div>
        </div>

        <div className="scheduler-modal-actions stack" style={{ marginTop: '1.2rem' }}>
          <button
            type="button"
            className="scheduler-modal-btn"
            onClick={() => onCopy(viewingWeekStart)}
            disabled={sortedLogs.length === 0}
          >
            {copyFeedback || '주간 기록 복사'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SyncConfirmationModal({ confirmation, onCancel, onConfirm }) {
  const { candidate, overlapping } = confirmation
  
  return (
    <div className="scheduler-sheet-backdrop scheduler-modal-backdrop" onClick={onCancel}>
      <div className="scheduler-modal" onClick={e => e.stopPropagation()}>
        <div className="scheduler-section-head">
          <p className="scheduler-section-label">기록 확인</p>
        </div>
        <p className="scheduler-modal-text">기존 근무 기록과 시간이 겹쳐요.</p>
        
        <div className="scheduler-sync-diff">
          <div className="scheduler-sync-diff-side">
            <span className="subtle">기존 기록</span>
            {overlapping.map(o => (
              <strong key={o.id}>{o.startTime}-{o.endTime}</strong>
            ))}
          </div>
          <div className="scheduler-sync-diff-arrow">→</div>
          <div className="scheduler-sync-diff-side">
            <span className="subtle">변경될 기록</span>
            <strong>{candidate.startTime}-{candidate.endTime}</strong>
          </div>
        </div>

        <p className="subtle scheduler-modal-hint">진행하면 기존 기록이 변경된 시간으로 적용됩니다.</p>

        <div className="scheduler-form-actions">
          <button type="button" className="soft-button" onClick={onCancel}>취소</button>
          <button type="button" className="primary" onClick={onConfirm}>진행</button>
        </div>
      </div>
    </div>
  )
}
