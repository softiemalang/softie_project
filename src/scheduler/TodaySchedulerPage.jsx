import { useEffect, useMemo, useRef, useState } from 'react'
import { shareKakaoText } from '../lib/kakaoShare'
import {
  deleteSchedulerWorkLogs,
  listSchedulerWorkLogs,
  listTodayWorkEvents,
  migrateLocalWorkLogsToSupabase,
  replaceSchedulerWorkLogs,
  updateWorkEventStatus,
  upsertSchedulerWorkLog,
} from './api'
import { TODAY_HOURS } from './constants'
import { getRoomsForBranch, groupTodayEvents } from './helpers'
import { NativePickerField } from './NativePickerField'
import {
  getOrCreatePushDeviceId,
  getSchedulerPushPreferences,
  getSchedulerPushState,
  sendSchedulerTestPush,
  subscribeSchedulerPush,
  updateSchedulerPushPreferences,
} from './push'
import {
  formatWorkTimeHour,
  formatWorkTimeRange,
  getDefaultWorkTimeFilter,
  isSchedulerItemInWorkTimeRange,
  normalizeWorkTimeFilter,
} from './rules'
import { SchedulerEventSection } from './SchedulerEventSection'
import { SchedulerGoogleSettings } from './SchedulerGoogleSettings'
import {
  buildWeekWorkLogShareText,
  buildWeekWorkLogText,
  loadStoredWorkTimeFilter,
  loadWorkLogs,
  persistSchedulerViewState,
  persistWorkTimeFilter,
  replaceSchedulerViewUrl,
} from './schedulerViewState'
import { SyncConfirmationModal } from './SyncConfirmationModal'
import {
  formatDateLabel,
  formatSchedulerDate,
  getMonday,
  getWeekStartDate,
  isTimeRangeOverlapping,
  toLocalDateInputValue,
} from './time'
import { WorkLogDetailView } from './WorkLogDetailView'
import { WorkLogSummaryCard } from './WorkLogSummaryCard'

const GO_TO_TODAY_EVENT = 'scheduler:go-today'
const WORK_TIME_HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => hour)
const DEFAULT_PUSH_PREFERENCES = {
  notificationsEnabled: true,
  notificationTypes: ['checkin', 'warning', 'checkout'],
  ...getDefaultWorkTimeFilter(),
}

export function TodaySchedulerPage({
  effectiveOwnerKey,
  googleConnected,
  googleConnectionReason,
  googleConnectionState,
  initialViewState,
  onGoogleDisconnected,
  onViewStateChange,
}) {
  const initialSelectedDate = initialViewState?.date || toLocalDateInputValue()
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate)
  const [events, setEvents] = useState([])
  const [filters, setFilters] = useState(() => initialViewState?.filters || {
    branch: 'all',
    room: 'all',
    ...getDefaultWorkTimeFilter(),
  })
  const [draftFilters, setDraftFilters] = useState(() => ({
    date: initialSelectedDate,
    ...(initialViewState?.filters || {
      branch: 'all',
      room: 'all',
      ...getDefaultWorkTimeFilter(),
    }),
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
  const [isWebPushModalOpen, setIsWebPushModalOpen] = useState(false)
  const [isPushBusy, setIsPushBusy] = useState(false)
  const [pushPreferences, setPushPreferences] = useState(DEFAULT_PUSH_PREFERENCES)
  const [isPushPreferencesBusy, setIsPushPreferencesBusy] = useState(false)
  const rooms = filters.branch === 'all' ? [] : getRoomsForBranch(filters.branch)
  const draftRooms = draftFilters.branch === 'all' ? [] : getRoomsForBranch(draftFilters.branch)
  const normalizedFilters = normalizeWorkTimeFilter(filters)
  const normalizedDraftWorkTime = normalizeWorkTimeFilter(draftFilters)

  const [workLogs, setWorkLogs] = useState([])
  const [isWorkLogOpen, setIsWorkLogOpen] = useState(false)
  const [viewingWeekStart, setViewingWeekStart] = useState(() => getWeekStartDate(initialSelectedDate))
  const [copyFeedback, setCopyFeedback] = useState('')
  const [syncConfirmation, setSyncConfirmation] = useState(null)
  const eventsRequestSequenceRef = useRef(0)

  useEffect(() => {
    if (!effectiveOwnerKey) return

    async function loadLogs() {
      try {
        const logs = await listSchedulerWorkLogs(effectiveOwnerKey)
        setWorkLogs(logs)

        // One-time migration from localStorage
        const MIGRATION_KEY = `scheduler:migration-work-logs:${effectiveOwnerKey}`
        if (!window.localStorage.getItem(MIGRATION_KEY)) {
          const localLogs = loadWorkLogs()
          if (localLogs.length > 0) {
            console.log(`[scheduler] Migrating ${localLogs.length} work logs to Supabase...`)
            await migrateLocalWorkLogsToSupabase(effectiveOwnerKey, localLogs)
            const syncedLogs = await listSchedulerWorkLogs(effectiveOwnerKey)
            setWorkLogs(syncedLogs)
          }
          window.localStorage.setItem(MIGRATION_KEY, 'done')
        }
      } catch (err) {
        console.error('[scheduler] Failed to load or migrate work logs:', err)
      }
    }
    loadLogs()
  }, [effectiveOwnerKey])

  async function handleSyncWorkLog() {
    if (!normalizedFilters.workTimeEnabled) return

    const candidate = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
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

    try {
      const saved = await upsertSchedulerWorkLog(effectiveOwnerKey, candidate)
      setWorkLogs(prev => [...prev, saved])
      setPushStatus('근무 기록을 동기화했어요.')
      setTimeout(() => setPushStatus(''), 2000)
    } catch (err) {
      setPushStatus('기록 저장 중 오류가 발생했습니다.')
      console.error(err)
    }
  }

  async function handleConfirmSync() {
    if (!syncConfirmation) return
    const { candidate, overlapping } = syncConfirmation

    try {
      const idsToRemove = overlapping.map(o => o.id)
      const saved = await replaceSchedulerWorkLogs(effectiveOwnerKey, idsToRemove, candidate)

      setWorkLogs(prev => [
        ...prev.filter(log => !idsToRemove.includes(log.id)),
        saved
      ])

      setSyncConfirmation(null)
      setPushStatus('근무 기록을 변경 적용했어요.')
      setTimeout(() => setPushStatus(''), 2000)
    } catch (err) {
      setPushStatus('기록 변경 중 오류가 발생했습니다.')
      console.error(err)
    }
  }

  async function handleDeleteWorkLogEntry(id) {
    try {
      await deleteSchedulerWorkLogs(effectiveOwnerKey, [id])
      setWorkLogs(prev => prev.filter(log => log.id !== id))
    } catch (err) {
      console.error('[scheduler] Failed to delete work log:', err)
      alert('기록 삭제 중 오류가 발생했습니다.')
    }
  }

  function handleCopyWeekLog(weekStart) {
    const text = buildWeekWorkLogText(weekStart, workLogs)
    if (!text) return

    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback('복사됨')
      setTimeout(() => setCopyFeedback(''), 2000)
    })
  }

  function handleShareWeekLog(weekStart) {
    const url = window.location.href
    const text = buildWeekWorkLogShareText(weekStart, workLogs, url)
    const shared = shareKakaoText({
      text,
      url,
    })

    if (!shared) {
      alert('카카오 공유 설정이 아직 없어요.')
    }
  }

  function handleNavigateWeek(direction) {
    setViewingWeekStart(current => {
      const date = new Date(current)
      date.setDate(date.getDate() + (direction === 'next' ? 7 : -7))
      return getWeekStartDate(date)
    })
  }

  async function loadEvents() {
    const requestSequence = eventsRequestSequenceRef.current + 1
    eventsRequestSequenceRef.current = requestSequence
    setIsLoading(true)
    try {
      const rows = await listTodayWorkEvents(selectedDate, effectiveOwnerKey)
      if (eventsRequestSequenceRef.current !== requestSequence) return
      setEvents(rows)
      setStatus('')
    } catch (error) {
      if (eventsRequestSequenceRef.current !== requestSequence) return
      setStatus(error.message)
    } finally {
      if (eventsRequestSequenceRef.current === requestSequence) {
        setIsLoading(false)
      }
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
  }, [selectedDate, effectiveOwnerKey])

  useEffect(() => {
    onViewStateChange?.({ date: selectedDate, filters })
    persistSchedulerViewState(selectedDate, filters)
    replaceSchedulerViewUrl(selectedDate, filters)
  }, [selectedDate, filters, onViewStateChange])

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
      setSelectedDate(today)
      setFilters({
        branch: 'all',
        room: 'all',
        ...getDefaultWorkTimeFilter(),
      })
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

  const grouped = groupTodayEvents(filteredEvents, new Date(), selectedDate)

  async function handleToggleDone(eventRow) {
    const nextStatus = eventRow.status === 'done' ? 'pending' : 'done'
    setPendingStatusId(eventRow.id)
    try {
      await updateWorkEventStatus(eventRow.id, nextStatus, effectiveOwnerKey)
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
    const nextDate = draftFilters.date || toLocalDateInputValue()
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

  function handleDraftDateInput(event) {
    const nextDate = event.currentTarget.value || toLocalDateInputValue()
    if (!event.currentTarget.value) {
      event.currentTarget.value = nextDate
    }
    updateDraftFilter('date', nextDate)
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

  async function handleEnablePush(options = {}) {
    const { forceRefresh = false } = options
    setIsPushBusy(true)
    setPushStatus(forceRefresh ? '브라우저 알림을 다시 연결하는 중...' : '알림 연결 중...')

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('알림 연결 시간이 초과됐어요. 앱을 완전히 종료한 뒤 다시 열어 주세요.')), 15000)
    )

    try {
      const deviceId = getOrCreatePushDeviceId()

      await Promise.race([
        subscribeSchedulerPush(deviceId, { forceRefresh }),
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
          <p className="scheduler-section-label">웹 알림</p>
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
                  onClick={() => handleEnablePush({ forceRefresh: true })}
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
                  onClick={() => handleEnablePush()}
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


      <SchedulerGoogleSettings
        googleConnected={googleConnected}
        googleConnectionReason={googleConnectionReason}
        googleConnectionState={googleConnectionState}
        onGoogleDisconnected={onGoogleDisconnected}
      />

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
        onOpen={() => {
          setViewingWeekStart(getWeekStartDate(selectedDate))
          setIsWorkLogOpen(true)
        }}
        onShare={handleShareWeekLog}
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
                onInput={handleDraftDateInput}
                onChange={handleDraftDateInput}
                hideLabel
              />

              <div className="scheduler-filter-field">
                <div className="scheduler-chip-row scheduler-filter-mode-row" aria-label="보기 설정">
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
                  <button
                    type="button"
                    className={`scheduler-chip ${draftFilters.date === toLocalDateInputValue() ? 'active' : ''}`}
                    onClick={() => updateDraftFilter('date', toLocalDateInputValue())}
                    aria-pressed={draftFilters.date === toLocalDateInputValue()}
                  >
                    오늘
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

      <SchedulerEventSection
        title="지금 처리할 일"
        items={grouped.actionNow}
        emptyText={isLoading ? '불러오는 중...' : '없음'}
        pendingStatusId={pendingStatusId}
        onToggleDone={handleToggleDone}
      />

      <SchedulerEventSection
        title="곧 다가오는 일정"
        items={grouped.upcomingSoon}
        emptyText={isLoading ? '불러오는 중...' : '없음'}
        pendingStatusId={pendingStatusId}
        onToggleDone={handleToggleDone}
      />

      <SchedulerEventSection
        title="오늘 전체"
        items={grouped.allToday}
        emptyText={isLoading ? '불러오는 중...' : '없음'}
        pendingStatusId={pendingStatusId}
        onToggleDone={handleToggleDone}
      />
    </div>
  )
}
