import React, { useState, useEffect, useMemo, useRef } from 'react'
import { navigate } from '../lib/router'
import { getOrCreatePushDeviceId } from '../lib/device'
import { getCurrentSession, subscribeAuthChanges } from '../lib/auth'
import {
  connectGoogleCalendar,
  isGoogleConnected,
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  disconnectGoogleCalendar
} from '../scheduler/googleApi'
import {
  getRehearsalEvents,
  createRehearsalEvent,
  updateRehearsalEvent,
  deleteRehearsalEvent,
  triggerRehearsalDriveBackup,
  linkLocalRehearsalEventsToUser
} from '../rehearsals/api'
import '../rehearsals/rehearsals.css'

const COLORS = [
  { bg: '#fef3c7', text: '#92400e' }, // warm amber
  { bg: '#dcfce7', text: '#065f46' }, // soft green
  { bg: '#dbeafe', text: '#1e40af' }, // muted blue
  { bg: '#f3e8ff', text: '#5b21b6' }, // lavender
  { bg: '#ffe4e6', text: '#9f1239' }, // dusty rose
  { bg: '#ffedd5', text: '#9a3412' }  // soft brown
]

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1)

function getColorForText(text) {
  if (!text) return COLORS[0]
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}

function calcDepartureTime(startTimeStr, travelMinutes) {
  if (!startTimeStr || !travelMinutes) return startTimeStr.slice(0, 5)
  const [h, m] = startTimeStr.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  d.setMinutes(d.getMinutes() - travelMinutes)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function buildRehearsalDescription(form) {
  const travelMinutes = parseInt(form.travel_minutes, 10) || 0
  return [
    `장소: ${form.studio_name || '미정'}`,
    `시간: ${form.start_time}-${form.end_time}`,
    `이동 시간: ${travelMinutes > 0 ? `${travelMinutes}분` : '없음'}`,
    '',
    '메모:',
    form.description || ''
  ].join('\n')
}

function formatDateDisplay(value) {
  if (!value) return '날짜 선택'
  try {
    const [y, m, d] = value.split('-')
    if (!y || !m || !d) return value
    return `${y}. ${m}. ${d}.`
  } catch {
    return value
  }
}

function formatTimeDisplay(value) {
  if (!value) return '시간 선택'
  try {
    const [hStr, mStr] = value.split(':')
    const h = parseInt(hStr, 10)
    const suffix = h >= 12 ? '오후' : '오전'
    const displayH = h % 12 || 12
    return `${suffix} ${displayH}:${mStr}`
  } catch {
    return value
  }
}

function parseTimePickerValue(value) {
  const [hStr = '9'] = String(value || '09:00').split(':')
  const hour24 = Number.parseInt(hStr, 10)
  const safeHour = Number.isFinite(hour24) ? hour24 : 9
  return {
    period: safeHour >= 12 ? 'pm' : 'am',
    hour: safeHour % 12 || 12
  }
}

function buildHourValue(period, hour) {
  let hour24 = Number(hour)
  if (period === 'am') {
    hour24 = hour24 === 12 ? 0 : hour24
  } else {
    hour24 = hour24 === 12 ? 12 : hour24 + 12
  }
  return `${String(hour24).padStart(2, '0')}:00`
}

function getDaysInMonth(year, month) {
  const date = new Date(year, month, 1)
  const days = []
  
  // Pad beginning of month
  const startDay = date.getDay()
  for (let i = 0; i < startDay; i++) {
    days.push(null)
  }
  
  while (date.getMonth() === month) {
    days.push(new Date(date))
    date.setDate(date.getDate() + 1)
  }
  
  // Pad end of month
  const endDay = days[days.length - 1].getDay()
  if (endDay !== 6) {
    for (let i = endDay + 1; i <= 6; i++) {
      days.push(null)
    }
  }
  
  return days
}

export default function RehearsalCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [isGoogleReady, setIsGoogleReady] = useState(false)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [effectiveOwnerKey, setEffectiveOwnerKey] = useState(null)
  const localOwnerKeyRef = useRef(null)
  const ownerChangeSeqRef = useRef(0)

  useEffect(() => {
    let mounted = true

    function getLocalOwnerKey() {
      if (!localOwnerKeyRef.current) {
        localOwnerKeyRef.current = getOrCreatePushDeviceId()
      }
      return localOwnerKeyRef.current
    }

    async function applySessionOwner(session) {
      const seq = ownerChangeSeqRef.current + 1
      ownerChangeSeqRef.current = seq

      const localOwnerKey = getLocalOwnerKey()
      const userId = session?.user?.id
      
      if (userId) {
        await linkLocalRehearsalEventsToUser(localOwnerKey, userId)
        if (!mounted || ownerChangeSeqRef.current !== seq) return
        setEffectiveOwnerKey(userId)
      } else {
        if (!mounted || ownerChangeSeqRef.current !== seq) return
        setEffectiveOwnerKey(localOwnerKey)
      }
    }

    getCurrentSession().then(applySessionOwner)

    const subscription = subscribeAuthChanges((nextSession) => {
      applySessionOwner(nextSession)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    setIsGoogleReady(isGoogleConnected())
    if (effectiveOwnerKey) {
      loadEvents()
    }
  }, [currentDate, effectiveOwnerKey])

  async function loadEvents() {
    if (!effectiveOwnerKey) return
    setIsLoading(true)
    try {
      const data = await getRehearsalEvents(effectiveOwnerKey)
      setEvents(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  function handlePrevMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  function handleNextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  function handleToday() {
    setCurrentDate(new Date())
  }

  async function handleBackup() {
    if (!effectiveOwnerKey) return

    if (!isGoogleReady) {
      connectGoogleCalendar(effectiveOwnerKey, { returnPath: '/rehearsals' })
      return
    }
    
    setIsBackingUp(true)
    try {
      const yearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
      await triggerRehearsalDriveBackup(effectiveOwnerKey, yearMonth)
      alert('이번 달 합주 일정이 Google Drive에 안전하게 백업되었습니다.')
      loadEvents() // refresh to show updated backup status
    } catch (e) {
      console.error(e)
      const msg = e.message || ''
      if (
        msg.includes('not connected') || 
        msg.includes('Missing token') || 
        msg.includes('refresh token') || 
        msg.includes('reconnect') ||
        msg.includes('invalid_grant')
      ) {
        alert('Google 계정을 다시 연결해 주세요.')
        disconnectGoogleCalendar()
        setIsGoogleReady(false)
      } else {
        alert(`백업 실패: ${msg}`)
      }
    } finally {
      setIsBackingUp(false)
    }
  }

  const days = useMemo(() => getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()), [currentDate])
  
  const eventsByDate = useMemo(() => {
    const map = {}
    events.forEach(e => {
      if (!map[e.event_date]) map[e.event_date] = []
      map[e.event_date].push(e)
    })
    return map
  }, [events])

  const selectedEvents = selectedDate 
    ? eventsByDate[`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`] || []
    : []

  return (
    <div className="app-shell rehearsal-shell">
      <header className="rehearsal-header">
        <h1 className="rehearsal-title">합주 일정</h1>
        <div className="rehearsal-actions">
          <button type="button" className="soft-button small" onClick={handleBackup} disabled={isBackingUp || !effectiveOwnerKey}>
            {isBackingUp ? '백업 중...' : '이번 달 Drive 백업'}
          </button>
          {!isGoogleReady && (
            <button type="button" className="soft-button small" onClick={() => effectiveOwnerKey && connectGoogleCalendar(effectiveOwnerKey, { returnPath: '/rehearsals' })}>
              Google 연동
            </button>
          )}
        </div>
      </header>

      <div className="rehearsal-month-nav">
        <button onClick={handlePrevMonth}>‹</button>
        <span className="rehearsal-month-label" onClick={handleToday} style={{ cursor: 'pointer' }}>
          {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
        </span>
        <button onClick={handleNextMonth}>›</button>
      </div>

      <div className="rehearsal-calendar-grid">
        {['일', '월', '화', '수', '목', '금', '토'].map(d => (
          <div key={d} className="rehearsal-weekday">{d}</div>
        ))}
        {days.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} className="rehearsal-day empty" />
          
          const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
          const dayEvents = eventsByDate[dateStr] || []
          const isToday = new Date().toDateString() === date.toDateString()
          const isSelected = selectedDate?.toDateString() === date.toDateString()

          return (
            <div 
              key={dateStr} 
              className={`rehearsal-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedDate(date)}
            >
              <div className="rehearsal-date-num">{date.getDate()}</div>
              {dayEvents.slice(0, 2).map((ev, idx) => {
                const displayTitle = ev.title || ev.team_name || '합주'
                const color = getColorForText(displayTitle)
                return (
                  <div key={idx} className="rehearsal-pill" style={{ backgroundColor: color.bg, color: color.text }}>
                    {displayTitle}
                  </div>
                )
              })}
              {dayEvents.length > 2 && (
                <div className="rehearsal-more-pill">+{dayEvents.length - 2}</div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <button 
          className="soft-button rehearsal-add-button" 
          onClick={() => {
            setEditingEvent(null)
            setIsAddModalOpen(true)
          }}
        >
          + 새 일정 추가
        </button>
      </div>

      {selectedDate && (
        <>
          <div className="scheduler-sheet-backdrop" onClick={() => setSelectedDate(null)} />
          <div className="rehearsal-modal">
            <div className="rehearsal-sheet-header">
              <h3 className="rehearsal-sheet-title">
                {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 일정
              </h3>
              <button className="scheduler-modal-close" onClick={() => setSelectedDate(null)}>닫기</button>
            </div>
            <div className="rehearsal-sheet-content">
              {selectedEvents.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#8c7e6c', marginTop: '2rem' }}>예정된 일정이 없습니다.</p>
              ) : (
                selectedEvents.map(ev => (
                  <RehearsalCard 
                    key={ev.id} 
                    event={ev} 
                    onEdit={() => {
                      setEditingEvent(ev)
                      setIsAddModalOpen(true)
                    }}
                    onDelete={async () => {
                      if (confirm('이 일정을 삭제하시겠습니까?')) {
                        if (isGoogleReady && ev.google_calendar_event_id) {
                          try {
                            await deleteGoogleCalendarEvent(effectiveOwnerKey, ev.id)
                          } catch (calErr) {
                            console.error('Failed to sync google calendar deletion', calErr)
                            // We alert the user but continue with DB deletion for 404/already deleted scenarios 
                            // though the Edge Function already handles 404 as success.
                            // If it's a real error (like 401/403), we might want to warn.
                          }
                        }
                        await deleteRehearsalEvent(ev.id)
                        loadEvents()
                        // if last event on this date is deleted, close the sheet
                        if (selectedEvents.length === 1) {
                          setSelectedDate(null)
                        }
                      }
                    }} 
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}

      {isAddModalOpen && (
        <AddRehearsalModal 
          ownerKey={effectiveOwnerKey}
          isGoogleReady={isGoogleReady}
          initialEvent={editingEvent}
          onClose={() => {
            setIsAddModalOpen(false)
            setEditingEvent(null)
          }} 
          onSuccess={() => {
            setIsAddModalOpen(false)
            setEditingEvent(null)
            loadEvents()
          }} 
        />
      )}
    </div>
  )
}

function RehearsalCard({ event, onEdit, onDelete }) {
  const displayTitle = event.title || event.team_name || '합주'
  const start = event.start_time.slice(0, 5)
  const end = event.end_time.slice(0, 5)
  const depTime = calcDepartureTime(event.start_time, event.travel_minutes)
  
  return (
    <div className="rehearsal-card">
      <div className="rehearsal-card-head">
        <div>
          <h4 className="rehearsal-card-title">{displayTitle}</h4>
        </div>
      </div>
      <p className="rehearsal-card-time">{start} - {end}</p>
      
      <div className="rehearsal-card-details">
        <p><strong>장소:</strong> {event.studio_name || '미정'}</p>
        <p><strong>이동 시간:</strong> {event.travel_minutes ? `${event.travel_minutes}분` : '없음'}</p>
        {event.travel_minutes > 0 && (
          <p><strong>출발 권장:</strong> {depTime}</p>
        )}
        {event.description && (
          <p className="rehearsal-card-description"><strong>설명:</strong> {event.description}</p>
        )}
        
        <div className="rehearsal-status-group">
          {event.google_calendar_sync_status === 'synced' ? (
            <span className="rehearsal-status-badge success">캘린더 연동됨</span>
          ) : (
            <span className="rehearsal-status-badge muted">캘린더 미연동</span>
          )}
          
          {event.drive_backup_status === 'success' ? (
            <span className="rehearsal-status-badge success">Drive 백업됨</span>
          ) : (
            <span className="rehearsal-status-badge muted">Drive 미백업</span>
          )}
        </div>
      </div>

      <div className="rehearsal-card-actions">
        <button className="rehearsal-action-btn edit" onClick={onEdit}>편집</button>
        <button className="rehearsal-action-btn delete" onClick={onDelete}>삭제</button>
      </div>
    </div>
  )
}

function AddRehearsalModal({ ownerKey, isGoogleReady, initialEvent, onClose, onSuccess }) {
  const isEditing = !!initialEvent
  const [form, setForm] = useState({
    title: initialEvent?.title || initialEvent?.team_name || '',
    event_date: initialEvent?.event_date || '',
    start_time: initialEvent?.start_time || '',
    end_time: initialEvent?.end_time || '',
    studio_name: initialEvent?.studio_name || '',
    travel_minutes: initialEvent?.travel_minutes || '',
    description: initialEvent?.description || ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timePicker, setTimePicker] = useState(null)

  function openTimePicker(field) {
    const parsed = parseTimePickerValue(form[field])
    setTimePicker({
      field,
      period: parsed.period,
      hour: parsed.hour
    })
  }

  function updateTimePicker(patch) {
    setTimePicker(current => current ? { ...current, ...patch } : current)
  }

  function applyTimePicker() {
    if (!timePicker) return
    setForm(current => ({
      ...current,
      [timePicker.field]: buildHourValue(timePicker.period, timePicker.hour)
    }))
    setTimePicker(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!form.event_date || !form.start_time || !form.end_time || !form.title) {
      alert('필수 정보를 모두 입력해 주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        owner_key: ownerKey,
        title: form.title || '합주',
        team_name: isEditing ? (initialEvent?.team_name || null) : null,
        event_date: form.event_date,
        start_time: form.start_time,
        end_time: form.end_time,
        studio_name: form.studio_name,
        travel_minutes: parseInt(form.travel_minutes) || 0,
        description: form.description
      }

      let eventResult
      if (isEditing) {
        eventResult = await updateRehearsalEvent(initialEvent.id, payload)
      } else {
        eventResult = await createRehearsalEvent(payload)
      }

      if (isGoogleReady) {
        try {
          const summary = form.title
          const desc = buildRehearsalDescription(form)
          const syncPayload = {
            rehearsalId: eventResult.id,
            summary: summary,
            location: form.studio_name,
            description: desc,
            startAt: `${form.event_date}T${form.start_time}:00+09:00`,
            endAt: `${form.event_date}T${form.end_time}:00+09:00`
          }

          if (isEditing) {
            // Only update if it was already synced
            if (initialEvent.google_calendar_event_id) {
              await updateGoogleCalendarEvent(ownerKey, syncPayload)
            }
          } else {
            await createGoogleCalendarEvent(ownerKey, syncPayload)
          }
        } catch (calErr) {
          console.error('Failed to sync google calendar event', calErr)
          if (isEditing) {
            alert('합주 일정은 수정되었으나, Google Calendar 연동 업데이트에 실패했습니다.')
          }
        }
      }
      
      onSuccess()
    } catch (error) {
      console.error(error)
      alert('저장 실패: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="scheduler-sheet-backdrop" onClick={onClose} />
      <div className="rehearsal-modal rehearsal-add-modal-sheet">
        <div className="rehearsal-sheet-header">
          <h3 className="rehearsal-sheet-title">{isEditing ? '일정 수정' : '새 일정 추가'}</h3>
          <button className="scheduler-modal-close" onClick={onClose}>닫기</button>
        </div>
        <div className="rehearsal-sheet-content">
          <form className="rehearsal-form" onSubmit={handleSubmit}>
            <div>
              <label>합주명 *</label>
              <input type="text" required placeholder="예: LFO 5월 공연" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            </div>
            
            <div>
              <label>날짜 *</label>
              <div className="rehearsal-native-picker-shell">
                <div className={`rehearsal-picker-field ${!form.event_date ? 'is-empty' : ''}`}>
                  {formatDateDisplay(form.event_date)}
                </div>
                <input
                  className="rehearsal-native-picker-input"
                  type="date"
                  required
                  value={form.event_date}
                  onChange={e => setForm({...form, event_date: e.target.value})}
                />
              </div>
            </div>

            <div className="rehearsal-form-row">
              <div>
                <label>시작 시간 *</label>
                <button
                  type="button"
                  className={`rehearsal-picker-field ${!form.start_time ? 'is-empty' : ''}`}
                  onClick={() => openTimePicker('start_time')}
                >
                  {formatTimeDisplay(form.start_time)}
                </button>
              </div>
              <div>
                <label>종료 시간 *</label>
                <button
                  type="button"
                  className={`rehearsal-picker-field ${!form.end_time ? 'is-empty' : ''}`}
                  onClick={() => openTimePicker('end_time')}
                >
                  {formatTimeDisplay(form.end_time)}
                </button>
              </div>
            </div>

            <div>
              <label>장소 (선택)</label>
              <input type="text" placeholder="예: 이수 문화주실" value={form.studio_name} onChange={e => setForm({...form, studio_name: e.target.value})} />
            </div>

            <div>
              <label>이동 시간 (분)</label>
              <input type="number" placeholder="예: 40" value={form.travel_minutes} onChange={e => setForm({...form, travel_minutes: e.target.value})} />
            </div>

            <div>
              <label>설명 (선택)</label>
              <textarea
                rows={3}
                placeholder="예: 공연 전 최종 리허설 / 드럼 세팅 먼저"
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
              />
            </div>

            <button type="submit" className="rehearsal-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : (isEditing ? '수정 완료' : '일정 추가하기')}
            </button>
          </form>
        </div>

        {timePicker && (
          <TimePickerSheet
            title={timePicker.field === 'start_time' ? '시작 시간 선택' : '종료 시간 선택'}
            period={timePicker.period}
            hour={timePicker.hour}
            onChange={updateTimePicker}
            onApply={applyTimePicker}
            onClose={() => setTimePicker(null)}
          />
        )}
      </div>
    </>
  )
}

function TimePickerSheet({ title, period, hour, onChange, onApply, onClose }) {
  return (
    <div className="rehearsal-time-picker-backdrop" onClick={onClose}>
      <div className="rehearsal-time-picker-sheet" onClick={event => event.stopPropagation()}>
        <div className="rehearsal-sheet-header">
          <h3 className="rehearsal-sheet-title">{title}</h3>
          <button type="button" className="scheduler-modal-close" onClick={onClose}>닫기</button>
        </div>

        <div className="rehearsal-time-period-toggle" role="group" aria-label="오전 오후 선택">
          <button
            type="button"
            className={period === 'am' ? 'is-selected' : ''}
            onClick={() => onChange({ period: 'am' })}
          >
            오전
          </button>
          <button
            type="button"
            className={period === 'pm' ? 'is-selected' : ''}
            onClick={() => onChange({ period: 'pm' })}
          >
            오후
          </button>
        </div>

        <div className="rehearsal-time-hour-grid" aria-label="시간 선택">
          {HOUR_OPTIONS.map(option => (
            <button
              key={option}
              type="button"
              className={hour === option ? 'is-selected' : ''}
              onClick={() => onChange({ hour: option })}
            >
              {option}시
            </button>
          ))}
        </div>

        <div className="rehearsal-time-picker-actions">
          <button type="button" className="scheduler-modal-close" onClick={onClose}>취소</button>
          <button type="button" className="rehearsal-time-apply-btn" onClick={onApply}>적용</button>
        </div>
      </div>
    </div>
  )
}
