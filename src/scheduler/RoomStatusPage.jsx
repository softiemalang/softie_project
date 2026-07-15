import { useEffect, useState } from 'react'
import { navigate } from '../lib/router'
import { listTodayWorkEvents } from './api'
import { getRoomStatus, getTagMeta, groupEventsByRoom } from './helpers'
import { formatDateLabel, toLocalDateInputValue } from './time'

export function RoomStatusPage({ effectiveOwnerKey }) {
  const [selectedDate, setSelectedDate] = useState(toLocalDateInputValue())
  const [events, setEvents] = useState([])
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadEvents() {
      setIsLoading(true)
      try {
        const rows = await listTodayWorkEvents(selectedDate, effectiveOwnerKey)
        if (cancelled) return
        setEvents(rows)
        setStatus('')
      } catch (error) {
        if (!cancelled) setStatus(error.message)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadEvents()

    return () => {
      cancelled = true
    }
  }, [effectiveOwnerKey, selectedDate])

  const groupedRooms = groupEventsByRoom(events)

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
