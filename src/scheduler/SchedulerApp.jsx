import { useEffect, useMemo, useState } from 'react'
import { navigate } from '../lib/router'
import { listTodayWorkEvents, getReservationById, saveReservation, deleteReservation, updateWorkEventStatus } from './api'
import { SCHEDULER_BRANCHES, SCHEDULER_TAGS, TODAY_HOURS } from './constants'
import { buildReservationPayload, createReservationDraft, getRoomStatus, getRoomsForBranch, getTagMeta, groupTodayEvents, mapReservationToFormValues, validateReservationForm } from './helpers'
import { formatDateLabel, toLocalDateInputValue } from './time'

const GO_TO_TODAY_EVENT = 'scheduler:go-today'

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
      <p className="scheduler-eyebrow">Internal Scheduler</p>
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

function TodaySchedulerPage() {
  const [selectedDate, setSelectedDate] = useState(toLocalDateInputValue())
  const [events, setEvents] = useState([])
  const [filters, setFilters] = useState({ branch: 'all', room: 'all' })
  const [draftFilters, setDraftFilters] = useState({
    date: toLocalDateInputValue(),
    branch: 'all',
    room: 'all',
  })
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [pendingStatusId, setPendingStatusId] = useState('')

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

  useEffect(() => {
    loadEvents()
  }, [selectedDate])

  useEffect(() => {
    function handleGoToToday() {
      setSelectedDate(toLocalDateInputValue())
    }

    window.addEventListener(GO_TO_TODAY_EVENT, handleGoToToday)
    return () => window.removeEventListener(GO_TO_TODAY_EVENT, handleGoToToday)
  }, [])

  const rooms = filters.branch === 'all' ? [] : getRoomsForBranch(filters.branch)
  const draftRooms = draftFilters.branch === 'all' ? [] : getRoomsForBranch(draftFilters.branch)

  const filteredEvents = events.filter((item) => {
    if (filters.branch !== 'all' && item.reservation?.branch !== filters.branch) return false
    if (filters.room !== 'all' && item.reservation?.room !== filters.room) return false
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
    })
    setIsFilterSheetOpen(true)
  }

  function applyFilterChanges() {
    setSelectedDate(draftFilters.date)
    setFilters({
      branch: draftFilters.branch,
      room: draftFilters.room,
    })
    setIsFilterSheetOpen(false)
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

      return { ...current, [field]: value }
    })
  }

  const filterSummary = [
    formatDateLabel(selectedDate),
    filters.branch === 'all' ? '전체 지점' : filters.branch,
    filters.room === 'all' ? '전체 룸' : filters.room,
  ].join(' · ')

  return (
    <div className="scheduler-shell">
      <SchedulerTopbar title="오늘 운영 보드" />

      <section className="scheduler-panel scheduler-controls">
        <div className="scheduler-filter-summary-row">
          <div className="scheduler-filter-summary-copy">
            <p className="scheduler-section-label">운영 시간</p>
            <strong>{TODAY_HOURS.start}:00 - {TODAY_HOURS.end}:00</strong>
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
            <div className="scheduler-section-head">
              <div>
                <p className="scheduler-section-label">보기 변경</p>
                <h2>날짜와 필터</h2>
              </div>
            </div>

            <div className="scheduler-form">
              <label>
                날짜
                <input
                  className="scheduler-compact-input"
                  type="date"
                  value={draftFilters.date}
                  onChange={(event) => updateDraftFilter('date', event.target.value)}
                />
              </label>

              <label>
                지점
                <select
                  value={draftFilters.branch}
                  onChange={(event) => updateDraftFilter('branch', event.target.value)}
                >
                  <option value="all">전체 지점</option>
                  {SCHEDULER_BRANCHES.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                룸
                <select
                  value={draftFilters.room}
                  onChange={(event) => updateDraftFilter('room', event.target.value)}
                  disabled={draftFilters.branch === 'all'}
                >
                  <option value="all">{draftFilters.branch === 'all' ? '전체 룸' : '전체 룸'}</option>
                  {draftRooms.map((room) => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="scheduler-form-actions">
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
      navigate(`/scheduler/${saved.id}`)
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
            <label>
              예약 날짜
              <input
                className="scheduler-compact-input"
                type="date"
                value={formValues.reservationDate}
                onChange={(event) => updateField('reservationDate', event.target.value)}
              />
            </label>

            <div className="scheduler-two-up">
              <label>
                지점
                <select
                  value={formValues.branch}
                  onChange={(event) => updateField('branch', event.target.value)}
                >
                  <option value="">지점 선택</option>
                  {SCHEDULER_BRANCHES.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                룸
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

            <label>
              예약자 이름
              <input
                value={formValues.customerName}
                onChange={(event) => updateField('customerName', event.target.value)}
                placeholder="예약자 또는 팀명"
              />
            </label>

            <div className="scheduler-two-up">
              <label>
                시작 시간
                <input
                  className="scheduler-compact-input"
                  type="time"
                  value={formValues.startTime}
                  onChange={(event) => updateField('startTime', event.target.value)}
                />
              </label>

              <label>
                이용 시간(시간)
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
            </div>

            <div className="scheduler-preset-row">
              {[1, 2, 3, 4, 5, 6].map((hours) => (
                <button key={hours} type="button" className="soft-button" onClick={() => updateField('durationHours', hours)}>
                  {hours}h
                </button>
              ))}
            </div>

            <label>
              퇴실등 시점
              <select
                className="scheduler-compact-input"
                value={formValues.warningOffsetMinutes}
                onChange={(event) => updateField('warningOffsetMinutes', event.target.value)}
              >
                <option value="10">10분 전</option>
                <option value="15">15분 전</option>
              </select>
            </label>

            <div>
              <span className="scheduler-field-label">특이 태그</span>
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

            <label>
              메모
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
      <SchedulerTopbar title="룸 상태" />

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
