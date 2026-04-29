import React, { useState, useEffect, useMemo } from 'react'
import { navigate } from '../lib/router'
import { getOrCreatePushDeviceId } from '../lib/device'
import { connectGoogleCalendar, isGoogleConnected, createGoogleCalendarEvent } from '../scheduler/googleApi'
import {
  getRehearsalEvents,
  createRehearsalEvent,
  deleteRehearsalEvent,
  triggerRehearsalDriveBackup
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
  const [isGoogleReady, setIsGoogleReady] = useState(false)
  const [isBackingUp, setIsBackingUp] = useState(false)

  const ownerKey = useMemo(() => getOrCreatePushDeviceId(), [])

  useEffect(() => {
    setIsGoogleReady(isGoogleConnected())
    loadEvents()
  }, [currentDate])

  async function loadEvents() {
    setIsLoading(true)
    try {
      const data = await getRehearsalEvents(ownerKey)
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
    if (!isGoogleReady) {
      connectGoogleCalendar(ownerKey, { returnPath: '/rehearsals' })
      return
    }
    
    setIsBackingUp(true)
    try {
      const yearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
      await triggerRehearsalDriveBackup(ownerKey, yearMonth)
      alert('이번 달 합주 일정이 Google Drive에 안전하게 백업되었습니다.')
      loadEvents() // refresh to show updated backup status
    } catch (e) {
      console.error(e)
      alert(`백업 실패: ${e.message}`)
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
          <button type="button" className="soft-button small" onClick={handleBackup} disabled={isBackingUp}>
            {isBackingUp ? '백업 중...' : '이번 달 Drive 백업'}
          </button>
          {!isGoogleReady && (
            <button type="button" className="soft-button small" onClick={() => connectGoogleCalendar(ownerKey, { returnPath: '/rehearsals' })}>
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
                const displayTitle = ev.team_name || ev.title
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
          onClick={() => setIsAddModalOpen(true)}
        >
          + 새 일정 추가
        </button>
      </div>

      {selectedDate && (
        <>
          <div className="scheduler-sheet-backdrop" onClick={() => setSelectedDate(null)} />
          <div className="rehearsal-bottom-sheet">
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
                    onDelete={async () => {
                      if (confirm('이 일정을 삭제하시겠습니까?')) {
                        await deleteRehearsalEvent(ev.id)
                        setSelectedDate(null)
                        loadEvents()
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
          ownerKey={ownerKey}
          isGoogleReady={isGoogleReady}
          onClose={() => setIsAddModalOpen(false)} 
          onSuccess={() => {
            setIsAddModalOpen(false)
            loadEvents()
          }} 
        />
      )}
    </div>
  )
}

function RehearsalCard({ event, onDelete }) {
  const displayTitle = event.title
  const teamLabel = event.team_name ? `[${event.team_name}] ` : ''
  const start = event.start_time.slice(0, 5)
  const end = event.end_time.slice(0, 5)
  const depTime = calcDepartureTime(event.start_time, event.travel_minutes)
  
  return (
    <div className="rehearsal-card">
      <div className="rehearsal-card-head">
        <div>
          {event.team_name && <div className="rehearsal-card-team">{event.team_name}</div>}
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
        <p style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#8c7e6c' }}>
          캘린더 연동: {event.google_calendar_sync_status === 'synced' ? '✅' : '❌'} | 
          Drive 백업: {event.drive_backup_status === 'success' ? '✅' : '❌'}
        </p>
      </div>

      <div className="rehearsal-card-actions">
        <button className="rehearsal-delete-btn" onClick={onDelete}>삭제</button>
      </div>
    </div>
  )
}

function AddRehearsalModal({ ownerKey, isGoogleReady, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '',
    team_name: '',
    event_date: '',
    start_time: '',
    end_time: '',
    studio_name: '',
    travel_minutes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const newEvent = await createRehearsalEvent({
        owner_key: ownerKey,
        title: form.title || '합주',
        team_name: form.team_name,
        event_date: form.event_date,
        start_time: form.start_time,
        end_time: form.end_time,
        studio_name: form.studio_name,
        travel_minutes: parseInt(form.travel_minutes) || 0
      })

      if (isGoogleReady) {
        try {
          const summary = form.team_name ? `[${form.team_name}] ${form.title}` : form.title
          const desc = `이동시간 ${form.travel_minutes || 0}분 / 출발 권장 ${calcDepartureTime(form.start_time, form.travel_minutes)}`
          
          await createGoogleCalendarEvent(ownerKey, {
            rehearsalId: newEvent.id,
            summary: summary,
            location: form.studio_name,
            description: desc,
            startAt: `${form.event_date}T${form.start_time}:00+09:00`,
            endAt: `${form.event_date}T${form.end_time}:00+09:00`
          })
        } catch (calErr) {
          console.error('Failed to create google calendar event', calErr)
          // We don't block the UI, status is handled by edge function or remains 'not_synced'
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
      <div className="rehearsal-bottom-sheet" style={{ height: '85vh' }}>
        <div className="rehearsal-sheet-header">
          <h3 className="rehearsal-sheet-title">새 일정 추가</h3>
          <button className="scheduler-modal-close" onClick={onClose}>닫기</button>
        </div>
        <div className="rehearsal-sheet-content">
          <form className="rehearsal-form" onSubmit={handleSubmit}>
            <div className="rehearsal-form-row">
              <div>
                <label>팀명 (선택)</label>
                <input type="text" placeholder="예: 말랑밴드" value={form.team_name} onChange={e => setForm({...form, team_name: e.target.value})} />
              </div>
              <div>
                <label>합주명 *</label>
                <input type="text" required placeholder="예: 정기 합주" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
            </div>
            
            <div>
              <label>날짜 *</label>
              <input type="date" required value={form.event_date} onChange={e => setForm({...form, event_date: e.target.value})} />
            </div>

            <div className="rehearsal-form-row">
              <div>
                <label>시작 시간 *</label>
                <input type="time" required value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} />
              </div>
              <div>
                <label>종료 시간 *</label>
                <input type="time" required value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} />
              </div>
            </div>

            <div>
              <label>장소 (선택)</label>
              <input type="text" placeholder="예: 사당역 합주실 A룸" value={form.studio_name} onChange={e => setForm({...form, studio_name: e.target.value})} />
            </div>

            <div>
              <label>이동 시간 (분)</label>
              <input type="number" placeholder="예: 40" value={form.travel_minutes} onChange={e => setForm({...form, travel_minutes: e.target.value})} />
            </div>

            <button type="submit" className="rehearsal-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : '일정 추가하기'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
