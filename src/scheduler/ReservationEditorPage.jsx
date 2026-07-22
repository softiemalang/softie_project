import { useEffect, useState } from 'react'
import { navigate } from '../lib/router'
import { getCurrentSession } from '../lib/auth'
import { deleteReservation, getReservationById, saveReservation } from './api'
import { SCHEDULER_BRANCHES, SCHEDULER_TAGS } from './constants'
import {
  buildReservationPayload,
  createReservationDraft,
  getRoomsForBranch,
  mapReservationToFormValues,
  validateReservationForm,
} from './helpers'
import {
  appendGoogleSheetsLog,
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  updateGoogleCalendarEvent,
} from './googleApi'
import { NativePickerField } from './NativePickerField'
import { formatSchedulerDate, formatSchedulerTime, normalizeHourTime } from './time'

export function ReservationEditorPage({
  mode,
  reservationId,
  effectiveOwnerKey,
  googleConnected,
  onGoogleDisconnected,
  initialReservationDate = null,
  backPath = '/scheduler',
}) {
  const [formValues, setFormValues] = useState(() => createReservationDraft(initialReservationDate))
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(mode === 'edit')
  const [isSaving, setIsSaving] = useState(false)
  const [loadedReservation, setLoadedReservation] = useState(null)

  useEffect(() => {
    if (mode !== 'edit' || !reservationId) return
    let cancelled = false

    async function loadReservation() {
      setIsLoading(true)
      try {
        const row = await getReservationById(reservationId, effectiveOwnerKey)
        if (cancelled) return
        if (!row) {
          setStatus('예약을 찾지 못했어요.')
          return
        }
        setLoadedReservation(row)
        setFormValues(mapReservationToFormValues(row))
        setStatus('')
      } catch (error) {
        if (!cancelled) setStatus(error.message)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadReservation()

    return () => {
      cancelled = true
    }
  }, [effectiveOwnerKey, mode, reservationId])

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
      const saved = await saveReservation(buildReservationPayload(formValues), reservationId, effectiveOwnerKey)

      let googleSyncError = false

      // MVP: 구글 캘린더 연동이 되어있다면 일정 생성/수정 시도
      if (googleConnected) {
        const session = await getCurrentSession()
        const targetId = session?.user?.id

        if (targetId) {
          const syncPayload = {
            reservationId: saved.id,
            summary: `[${saved.branch}] ${saved.customer_name}`,
            location: `${saved.branch} ${saved.room}`,
            description: saved.notes_text,
            startAt: saved.start_at,
            endAt: saved.end_at,
          }

          try {
            if (mode === 'edit' && saved.google_event_id) {
              await updateGoogleCalendarEvent(targetId, syncPayload)
            } else if (mode === 'create' || (mode === 'edit' && !saved.google_event_id)) {
              await createGoogleCalendarEvent(targetId, syncPayload)
            }
          } catch (err) {
            googleSyncError = true
            console.error('Google Calendar Sync Error:', err)
            if (err.message?.includes('not connected') || err.message?.includes('refresh token') || err.message?.includes('insufficient')) {
              onGoogleDisconnected()
            }
          }

          // Log to Google Sheets (fire-and-forget)
          appendGoogleSheetsLog(targetId, 'scheduler_logs', [
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
      }

      if (googleSyncError) {
        if (mode === 'create') {
          setFormValues(createReservationDraft(formValues.reservationDate))
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
        setStatus('예약은 저장되었으나, Google 캘린더 동기화에 실패했습니다.')
      } else {
        if (mode === 'edit') {
          navigate(`/scheduler/${saved.id}`)
        } else {
          setFormValues(createReservationDraft(formValues.reservationDate))
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
        setStatus('저장했어요.')
      }
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
      if (googleConnected && loadedReservation?.google_event_id) {
        const session = await getCurrentSession()
        const targetId = session?.user?.id
        if (targetId) {
          console.log('[handleDelete] Initiating Google Calendar deletion for event:', loadedReservation.google_event_id)
          await deleteGoogleCalendarEvent(targetId, reservationId, loadedReservation.google_event_id)
        } else {
          throw new Error('Google 계정 세션을 찾을 수 없습니다.')
        }
      }

      await deleteReservation(reservationId, effectiveOwnerKey)
      navigate(backPath)
    } catch (error) {
      console.error('[handleDelete] Delete flow failed:', error)
      setStatus(error.message || '예약 삭제 중 오류가 발생했습니다.')
      setIsSaving(false)
    }
  }

  return (
    <div className="scheduler-shell scheduler-editor-page">

      <section className="scheduler-panel scheduler-editor-card" style={{ paddingTop: '1rem' }}>
        <div className="scheduler-section-head" style={{ marginBottom: '0.4rem' }}>
          <div />
          <button type="button" className="scheduler-back-button" onClick={() => navigate(backPath)}>
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
              <div className="scheduler-primary-field">
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
                        data-text={branch}
                      >
                        {branch}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="scheduler-primary-field">
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
                            data-text={room}
                          >
                            {room}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
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
                  {[1, 2, 3, 4, 5, 6].map((hours) => {
                    const isActive = String(formValues.durationHours) === String(hours)
                    return (
                      <button
                        key={hours}
                        type="button"
                        className={`scheduler-chip ${isActive ? 'active' : ''}`}
                        onClick={() => updateField('durationHours', hours)}
                        aria-pressed={isActive}
                        data-text={`${hours}h`}
                      >
                        {hours}h
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="scheduler-warning-offset-field scheduler-form-section">
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
                      data-text={label}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="scheduler-form-section">
              <span className="scheduler-parent-label">특이 태그</span>
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
                      data-text={tag.shortLabel}
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
