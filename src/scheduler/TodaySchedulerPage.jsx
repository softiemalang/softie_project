import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { shareKakaoText } from '../lib/kakaoShare'
import {
  deleteSchedulerWorkLogs,
  listSchedulerWorkLogs,
  listTodayWorkEvents,
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
import { createSchedulerAsyncContentEnterState, settleSchedulerAsyncContentEnter } from './schedulerAsyncContentEnter'
import {
  buildWeekWorkLogShareText,
  buildWeekWorkLogText,
  loadStoredWorkTimeFilter,
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
  accountStatusLabel,
  accountStatusReady,
  initialViewState,
  onOpenAccountPanel,
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
  const [pendingStatusIds, setPendingStatusIds] = useState(() => new Set())
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
  const [workLogStatus, setWorkLogStatus] = useState(null)
  const [pendingWorkLogDeleteIds, setPendingWorkLogDeleteIds] = useState(() => new Set())
  const [isWorkLogOpen, setIsWorkLogOpen] = useState(false)
  const [viewingWeekStart, setViewingWeekStart] = useState(() => getWeekStartDate(initialSelectedDate))
  const [copyFeedback, setCopyFeedback] = useState('')
  const [syncConfirmation, setSyncConfirmation] = useState(null)
  const [syncToast, setSyncToast] = useState('')
  const [isWorkLogSyncBusy, setIsWorkLogSyncBusy] = useState(false)
  const eventsRequestSequenceRef = useRef(0)
  const initialEventsLoadFinishedRef = useRef(false)
  const pendingInitialSuccessRef = useRef(false)
  const pendingStatusIdsRef = useRef(new Set())
  const syncToastTimerRef = useRef(null)
  const workLogSyncLockRef = useRef(false)
  const pendingWorkLogDeleteIdsRef = useRef(new Set())
  const pushActionLockRef = useRef(false)
  const pushPreferencesLockRef = useRef(false)

  useEffect(() => () => {
    if (syncToastTimerRef.current) {
      window.clearTimeout(syncToastTimerRef.current)
    }
  }, [])

  function showSyncToast(message = '동기화가 완료되었습니다') {
    setSyncToast(message)
    if (syncToastTimerRef.current) {
      window.clearTimeout(syncToastTimerRef.current)
    }
    syncToastTimerRef.current = window.setTimeout(() => {
      setSyncToast('')
      syncToastTimerRef.current = null
    }, 1800)
  }

  useEffect(() => {
    if (!effectiveOwnerKey) return

    async function loadLogs() {
      try {
        // Legacy scheduler:work-logs has no authenticated owner binding. Keep
        // it untouched for recovery, but never upload it automatically to a
        // newly signed-in account.
        const logs = await listSchedulerWorkLogs(effectiveOwnerKey)
        setWorkLogs(logs)
      } catch (err) {
        console.error('[scheduler] Failed to load work logs:', err)
      }
    }
    loadLogs()
  }, [effectiveOwnerKey])

  async function handleSyncWorkLog() {
    if (!normalizedFilters.workTimeEnabled || workLogSyncLockRef.current) return

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

    workLogSyncLockRef.current = true
    setIsWorkLogSyncBusy(true)
    setWorkLogStatus(null)
    try {
      const saved = await upsertSchedulerWorkLog(effectiveOwnerKey, candidate)
      setWorkLogs(prev => [...prev, saved])
      setWorkLogStatus({ tone: 'success', text: '근무 기록을 동기화했어요.' })
      showSyncToast()
    } catch (err) {
      setWorkLogStatus({ tone: 'error', text: '기록 저장 중 오류가 발생했습니다.' })
      console.error(err)
    } finally {
      workLogSyncLockRef.current = false
      setIsWorkLogSyncBusy(false)
    }
  }

  async function handleConfirmSync() {
    if (!syncConfirmation || workLogSyncLockRef.current) return
    const { candidate, overlapping } = syncConfirmation

    workLogSyncLockRef.current = true
    setIsWorkLogSyncBusy(true)
    setWorkLogStatus(null)
    try {
      const idsToRemove = overlapping.map(o => o.id)
      const saved = await replaceSchedulerWorkLogs(effectiveOwnerKey, idsToRemove, candidate)

      setWorkLogs(prev => [
        ...prev.filter(log => !idsToRemove.includes(log.id)),
        saved
      ])

      setSyncConfirmation(null)
      setWorkLogStatus({ tone: 'success', text: '근무 기록을 변경 적용했어요.' })
      showSyncToast()
    } catch (err) {
      setWorkLogStatus({ tone: 'error', text: '기록 변경 중 오류가 발생했습니다.' })
      console.error(err)
    } finally {
      workLogSyncLockRef.current = false
      setIsWorkLogSyncBusy(false)
    }
  }

  async function handleDeleteWorkLogEntry(log) {
    if (!log?.id || pendingWorkLogDeleteIdsRef.current.has(log.id)) return
    const shouldDelete = window.confirm(`${log.date} ${log.startTime}-${log.endTime} 근무 기록을 삭제할까요?`)
    if (!shouldDelete) return

    const nextPendingIds = new Set(pendingWorkLogDeleteIdsRef.current)
    nextPendingIds.add(log.id)
    pendingWorkLogDeleteIdsRef.current = nextPendingIds
    setPendingWorkLogDeleteIds(nextPendingIds)
    setWorkLogStatus(null)
    try {
      await deleteSchedulerWorkLogs(effectiveOwnerKey, [log.id])
      setWorkLogs(prev => prev.filter(item => item.id !== log.id))
      setWorkLogStatus({ tone: 'success', text: '근무 기록을 삭제했어요.' })
    } catch (err) {
      console.error('[scheduler] Failed to delete work log:', err)
      setWorkLogStatus({ tone: 'error', text: '기록 삭제 중 오류가 발생했습니다.' })
    } finally {
      const remainingPendingIds = new Set(pendingWorkLogDeleteIdsRef.current)
      remainingPendingIds.delete(log.id)
      pendingWorkLogDeleteIdsRef.current = remainingPendingIds
      setPendingWorkLogDeleteIds(remainingPendingIds)
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
    setStatus('')
    setIsLoading(true)
    try {
      const rows = await listTodayWorkEvents(selectedDate, effectiveOwnerKey)
      if (eventsRequestSequenceRef.current !== requestSequence) return
      setEvents(rows)
      pendingInitialSuccessRef.current = true
      setStatus('')
    } catch (error) {
      if (eventsRequestSequenceRef.current !== requestSequence) return
      setEvents([])
      setStatus(error instanceof Error ? error.message : '오늘 일정을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      if (eventsRequestSequenceRef.current === requestSequence) {
        initialEventsLoadFinishedRef.current = true
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

  const initialAsyncContentEnterStateRef = useRef(createSchedulerAsyncContentEnterState())
  const [shouldAnimateInitialContent, setShouldAnimateInitialContent] = useState(false)
  const initialArrivalAnimationEndCountRef = useRef(0)

  function settleInitialAsyncContentEnter(hasContent) {
    // An empty success still settles the initial fetch; it only has no content to enter.
    const nextInitialAsyncContentEnterState = settleSchedulerAsyncContentEnter(
      initialAsyncContentEnterStateRef.current,
      { status: 'success', hasContent },
    )
    if (nextInitialAsyncContentEnterState !== initialAsyncContentEnterStateRef.current) {
      initialAsyncContentEnterStateRef.current = nextInitialAsyncContentEnterState
      initialArrivalAnimationEndCountRef.current = 0
      setShouldAnimateInitialContent(nextInitialAsyncContentEnterState.shouldAnimateInitialContent)
    }
  }

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
  const eventEmptyText = events.length > 0 && filteredEvents.length === 0
    ? '현재 조건에 맞는 일정이 없어요.'
    : '오늘 일정이 없어요.'
  const shouldReserveInitialLoadingFloor =
    isLoading &&
    events.length === 0 &&
    !status &&
    !initialEventsLoadFinishedRef.current &&
    eventsRequestSequenceRef.current === 1

  useLayoutEffect(() => {
    if (!pendingInitialSuccessRef.current) return

    pendingInitialSuccessRef.current = false
    settleInitialAsyncContentEnter(grouped.allToday.length > 0)
  }, [events, grouped.allToday.length])

  function handleInitialCardArrivalAnimationEnd(event) {
    if (!['scheduler-card-arrival-settle', 'scheduler-card-arrival-reduced'].includes(event.animationName)) return

    initialArrivalAnimationEndCountRef.current += 1
    if (initialArrivalAnimationEndCountRef.current >= grouped.allToday.length) {
      setShouldAnimateInitialContent(false)
    }
  }

  async function handleToggleDone(eventRow) {
    if (pendingStatusIdsRef.current.has(eventRow.id)) return

    const nextStatus = eventRow.status === 'done' ? 'pending' : 'done'
    const nextPendingStatusIds = new Set(pendingStatusIdsRef.current)
    nextPendingStatusIds.add(eventRow.id)
    pendingStatusIdsRef.current = nextPendingStatusIds
    setPendingStatusIds(nextPendingStatusIds)
    setStatus('')
    try {
      await updateWorkEventStatus(eventRow.id, nextStatus, effectiveOwnerKey)
      setEvents((current) =>
        current.map((item) => (item.id === eventRow.id ? { ...item, status: nextStatus } : item)),
      )
    } catch (error) {
      setStatus(error.message)
    } finally {
      const remainingPendingStatusIds = new Set(pendingStatusIdsRef.current)
      remainingPendingStatusIds.delete(eventRow.id)
      pendingStatusIdsRef.current = remainingPendingStatusIds
      setPendingStatusIds(remainingPendingStatusIds)
    }
  }

  function openFilterSheet() {
    setWorkLogStatus(null)
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
    filters.branch === 'all' ? null : filters.branch,
    filters.room === 'all' ? null : filters.room,
  ].filter(Boolean)
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
    if (pushActionLockRef.current || pushPreferencesLockRef.current) return

    const { forceRefresh = false } = options
    pushActionLockRef.current = true
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
      pushActionLockRef.current = false
      setIsPushBusy(false)
    }
  }

  async function handleUpdatePushPreferences(nextPreferences, options = {}) {
    if (pushPreferencesLockRef.current || pushActionLockRef.current) return false

    const { silent = false, deviceId = null } = options
    pushPreferencesLockRef.current = true
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
      pushPreferencesLockRef.current = false
      setIsPushPreferencesBusy(false)
    }
  }

  async function handleSendTestPush() {
    if (pushActionLockRef.current || pushPreferencesLockRef.current) return

    pushActionLockRef.current = true
    setIsPushBusy(true)
    setPushStatus('테스트 알림을 보내는 중...')
    try {
      const deviceId = getOrCreatePushDeviceId()
      await sendSchedulerTestPush(deviceId)
      setPushStatus('테스트 알림을 보냈어요. 기기에서 알림을 확인해 주세요.')
      await loadPushState()
    } catch (error) {
      setPushStatus(error instanceof Error ? error.message : '테스트 알림 전송에 실패했어요.')
    } finally {
      pushActionLockRef.current = false
      setIsPushBusy(false)
    }
  }

  function openWebPushModal() {
    setPushStatus('')
    setIsWebPushModalOpen(true)
  }

  function closeWebPushModal() {
    if (pushActionLockRef.current || pushPreferencesLockRef.current) return
    setIsWebPushModalOpen(false)
    setPushStatus('')
  }

  function closeWorkLog() {
    if (pendingWorkLogDeleteIdsRef.current.size > 0) return
    setIsWorkLogOpen(false)
    setWorkLogStatus(null)
  }

  return (
    <div className="scheduler-shell scheduler-today-page">

      {syncToast ? (
        <div className="scheduler-sync-toast" role="status" aria-live="polite">
          {syncToast}
        </div>
      ) : null}

      <section className="scheduler-status-dock" aria-label="계정과 알림 연결 상태">
        <button
          type="button"
          className={`scheduler-status-item ${accountStatusReady ? 'is-ready' : 'needs-attention'}`}
          onClick={onOpenAccountPanel}
          aria-label={`계정 ${accountStatusLabel}. 세부 설정 열기`}
        >
          <span className="scheduler-status-item-label">계정</span>
          <span className="scheduler-status-item-value">{accountStatusLabel}</span>
        </button>
        <button
          type="button"
          className={`scheduler-status-item ${isPushConnected ? 'is-ready' : 'needs-attention'}`}
          onClick={openWebPushModal}
          aria-label={`알림 ${pushStatusLabel}. 세부 설정 열기`}
          aria-busy={isPushBusy || isPushPreferencesBusy}
        >
          <span className="scheduler-status-item-label">알림</span>
          <span className="scheduler-status-item-value">{pushStatusLabel}</span>
        </button>
      </section>

      {isWebPushModalOpen && (
        <div className="scheduler-sheet-backdrop scheduler-modal-backdrop" onClick={closeWebPushModal}>
          <div className="scheduler-modal" role="dialog" aria-label="웹 알림 설정" onClick={e => e.stopPropagation()}>
            <div className="scheduler-section-head" style={{ marginBottom: '0.65rem' }}>
              <div>
                <p className="scheduler-section-label">
                  {normalizedFilters.workTimeEnabled ? '알림 On' : '알림 Off'}
                </p>
              </div>
              <button
                type="button"
                className="scheduler-modal-close"
                onClick={closeWebPushModal}
                disabled={isPushBusy || isPushPreferencesBusy}
              >
                닫기
              </button>
            </div>

            <p className="subtle scheduler-modal-description" style={{ marginTop: 0, marginBottom: '1.25rem' }}>
              {normalizedFilters.workTimeEnabled
                ? '현재 브라우저 알림이 켜져 있어요.'
                : isPushConnected
                  ? '알림 연결은 완료되어 있어요.\n근무 중 상태일 때만 알림이 전달됩니다.'
                  : '현재 브라우저 알림이 꺼져 있어요. 알림을 받으려면 연결을 확인해 주세요.'}
            </p>

            <p className="scheduler-push-summary">{pushSummary}</p>

            {pushStatusMeta ? (
              <p
                className={`scheduler-push-status-note is-${pushStatusMeta.tone}`}
                role={pushStatusMeta.tone === 'error' ? 'alert' : 'status'}
                aria-live={pushStatusMeta.tone === 'error' ? 'assertive' : 'polite'}
                aria-atomic="true"
              >
                {pushStatusMeta.text}
              </p>
            ) : null}

            {isPushConnected ? (
              <div className="scheduler-modal-actions stack" aria-label="웹 알림 설정">
                <button
                  type="button"
                  className="scheduler-modal-btn secondary"
                  onClick={handleSendTestPush}
                  disabled={isPushBusy || isPushPreferencesBusy || !pushState.subscribed}
                  aria-busy={isPushBusy || isPushPreferencesBusy}
                >
                  테스트 알림 보내기
                </button>
                <button
                  type="button"
                  className="scheduler-modal-btn"
                  onClick={() => handleEnablePush({ forceRefresh: true })}
                  disabled={isPushBusy || isPushPreferencesBusy}
                  aria-busy={isPushBusy || isPushPreferencesBusy}
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
                  disabled={isPushBusy || isPushPreferencesBusy || !pushState.supported || pushState.permission === 'denied'}
                  aria-busy={isPushBusy || isPushPreferencesBusy}
                >
                  알림 연결
                </button>
                <button
                  type="button"
                  className="scheduler-modal-btn secondary"
                  onClick={handleSendTestPush}
                  disabled={isPushBusy || isPushPreferencesBusy || !pushState.subscribed}
                  aria-busy={isPushBusy || isPushPreferencesBusy}
                >
                  테스트 알림 보내기
                </button>
              </div>
            )}

            <p className="subtle scheduler-modal-footnote" style={{ marginTop: '1rem', marginBottom: 0 }}>
              현재 알림 조건: 근무 중
            </p>
          </div>
        </div>
      )}

      <section className="scheduler-panel scheduler-controls softie-liquid-glass">
        <div className="scheduler-filter-summary-row">
          <div className="scheduler-filter-summary-copy">
            <strong className={normalizedFilters.workTimeEnabled ? 'scheduler-work-status-title' : undefined}>
              {normalizedFilters.workTimeEnabled ? '근무 중' : `${TODAY_HOURS.start}:00 - ${TODAY_HOURS.end}:00`}
            </strong>
            <p className="subtle" role="status" aria-live="polite" aria-atomic="true">
              {filterSummary}
            </p>
          </div>
          <div className="scheduler-summary-actions">
            <button
              type="button"
              className="soft-button scheduler-summary-button scheduler-compact-control"
              onClick={handleSyncWorkLog}
              disabled={!normalizedFilters.workTimeEnabled || isWorkLogSyncBusy}
              aria-busy={isWorkLogSyncBusy}
            >
              <span className="scheduler-compact-control-visual">{isWorkLogSyncBusy ? '동기화 중' : '동기화'}</span>
            </button>
            <button type="button" className="soft-button scheduler-summary-button scheduler-compact-control" onClick={openFilterSheet}>
              <span className="scheduler-compact-control-visual">변경</span>
            </button>
          </div>
        </div>
      </section>

      {!isWorkLogOpen && workLogStatus ? (
        <p
          className={`scheduler-push-status-note is-${workLogStatus.tone}`}
          role={workLogStatus.tone === 'error' ? 'alert' : 'status'}
          aria-live={workLogStatus.tone === 'error' ? 'assertive' : 'polite'}
          aria-atomic="true"
        >
          {workLogStatus.text}
        </p>
      ) : null}

      <WorkLogSummaryCard
        currentWeekStart={getWeekStartDate(selectedDate)}
        onOpen={() => {
          setWorkLogStatus(null)
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

            <p className="subtle scheduler-modal-description" style={{ marginTop: 0, marginBottom: '1.25rem' }}>
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
                <div className="scheduler-chip-row scheduler-filter-mode-row" role="group" aria-label="보기 설정">
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
          onClose={closeWorkLog}
          onNavigate={handleNavigateWeek}
          onCopy={handleCopyWeekLog}
          onDelete={handleDeleteWorkLogEntry}
          copyFeedback={copyFeedback}
          pendingDeleteIds={pendingWorkLogDeleteIds}
          status={workLogStatus}
        />
      ) : null}

      {syncConfirmation ? (
        <SyncConfirmationModal
          confirmation={syncConfirmation}
          onCancel={() => {
            if (!workLogSyncLockRef.current) setSyncConfirmation(null)
          }}
          onConfirm={handleConfirmSync}
          isBusy={isWorkLogSyncBusy}
        />
      ) : null}

      {status ? <p className="status scheduler-load-status" role="alert">{status}</p> : null}

      <div
        className="scheduler-async-content"
        aria-busy={isLoading}
      >
        <SchedulerEventSection
          title="지금 처리할 일"
          items={grouped.actionNow}
          emptyText={eventEmptyText}
          hideEmptyText
          pendingStatusIds={pendingStatusIds}
          onToggleDone={handleToggleDone}
        />

        <SchedulerEventSection
          title="곧 다가오는 일정"
          items={grouped.upcomingSoon}
          emptyText={eventEmptyText}
          hideEmptyText
          pendingStatusIds={pendingStatusIds}
          onToggleDone={handleToggleDone}
        />

        <SchedulerEventSection
          title="오늘 전체"
          items={grouped.allToday}
          emptyText={eventEmptyText}
          hideEmptyText={isLoading || Boolean(status)}
          initialLoadingLayout={shouldReserveInitialLoadingFloor}
          initialLoadingMessage={shouldReserveInitialLoadingFloor ? '일정 준비 중…' : null}
          pendingStatusIds={pendingStatusIds}
          onToggleDone={handleToggleDone}
          initialArrival={shouldAnimateInitialContent}
          onInitialArrivalAnimationEnd={handleInitialCardArrivalAnimationEnd}
        />
      </div>

      <footer className="home-footer scheduler-footer">
        <div className="home-footer-heading">
          <p className="home-footer-label">SOFTIE PROJECT</p>
          <span aria-hidden="true">·</span>
          <p className="home-footer-mark">말랑이의 작업실</p>
        </div>
        <div className="home-footer-intro">
          <p>
            일상의 작은 불편을 덜기 위해 만든{' '}
            <span className="home-footer-mobile-break" aria-hidden="true" />
            개인용 도구와 서비스를 모아둔 공간입니다.
          </p>
          <p>차분하고 따뜻한 마음으로 하나씩 채워가고 있어요.</p>
        </div>
        <p className="subtle">© 2026 Softie Project. Built with care.</p>
      </footer>
    </div>
  )
}
