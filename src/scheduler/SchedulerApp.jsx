import { useEffect, useMemo, useState } from 'react'
import { navigate } from '../lib/router'
import { getOrCreatePushDeviceId } from './push'
import { ReservationEditorPage } from './ReservationEditorPage'
import { RoomStatusPage } from './RoomStatusPage'
import {
  buildSchedulerViewPath,
  getReservationDateParam,
  getSchedulerViewStateFromUrl,
  parseSchedulerRoute,
} from './schedulerViewState'
import { TodaySchedulerPage } from './TodaySchedulerPage'
import { toLocalDateInputValue } from './time'

export function SchedulerApp({
  pathname,
  session,
  googleConnected = false,
  googleConnectionState = 'disconnected',
  onGoogleDisconnected = () => {},
}) {
  const route = useMemo(() => parseSchedulerRoute(pathname), [pathname])
  const [schedulerViewState, setSchedulerViewState] = useState(() => getSchedulerViewStateFromUrl())
  const [effectiveOwnerKey, setEffectiveOwnerKey] = useState(null)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    let mounted = true

    async function init() {
      const userId = session?.user?.id
      const ownerKey = userId || getOrCreatePushDeviceId()

      if (!mounted) return
      setEffectiveOwnerKey(ownerKey)
      setIsInitializing(false)
    }

    init()

    return () => {
      mounted = false
    }
  }, [session?.user?.id])

  if (isInitializing) {
    return (
      <div className="app-shell scheduler-shell">
        <p className="status" style={{ textAlign: 'center', marginTop: '4rem' }}>앱 설정 중...</p>
      </div>
    )
  }

  const renderContent = () => {
    if (route.name === 'today') {
      return (
        <TodaySchedulerPage
          effectiveOwnerKey={effectiveOwnerKey}
          googleConnected={googleConnected}
          googleConnectionState={googleConnectionState}
          initialViewState={schedulerViewState}
          onGoogleDisconnected={onGoogleDisconnected}
          onViewStateChange={setSchedulerViewState}
        />
      )
    }

    if (route.name === 'new') {
      return <ReservationEditorPage mode="create" effectiveOwnerKey={effectiveOwnerKey} googleConnected={googleConnected} onGoogleDisconnected={onGoogleDisconnected} initialReservationDate={getReservationDateParam()} backPath={buildSchedulerViewPath(schedulerViewState.date, schedulerViewState.filters)} />
    }

    if (route.name === 'edit') {
      return <ReservationEditorPage mode="edit" reservationId={route.reservationId} effectiveOwnerKey={effectiveOwnerKey} googleConnected={googleConnected} onGoogleDisconnected={onGoogleDisconnected} backPath={buildSchedulerViewPath(schedulerViewState.date, schedulerViewState.filters)} />
    }

    if (route.name === 'rooms') {
      return <RoomStatusPage effectiveOwnerKey={effectiveOwnerKey} />
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
          onClick={() => navigate(`/scheduler/new?date=${encodeURIComponent(schedulerViewState.date || toLocalDateInputValue())}`)}
          aria-label="새 일정 추가"
        >
          + 일정 추가
        </button>
      )}
    </>
  )
}
