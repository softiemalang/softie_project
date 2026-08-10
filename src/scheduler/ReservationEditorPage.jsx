import { useEffect, useRef, useState } from 'react'
import { navigate } from '../lib/router'
import { getCurrentSession } from '../lib/auth'
import {
  deleteReservation,
  getReservationById,
  listActiveRegulars,
  listSamePhoneReservations,
  saveReservation,
  saveReservationWithRegular,
} from './api'
import { SCHEDULER_BRANCHES, SCHEDULER_TAGS } from './constants'
import {
  buildReservationPayload,
  createReservationDraft,
  getRoomsForBranch,
  mapReservationToFormValues,
  validateReservationForm,
} from './helpers'
import {
  normalizeRegularPhoneLast4,
  reconcileRegularSelection,
  REGULAR_TAG_VALUE,
  toggleRegularTag,
} from './regularMatching'
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
  const [statusTone, setStatusTone] = useState('info')
  const [isLoading, setIsLoading] = useState(mode === 'edit')
  const [busyAction, setBusyAction] = useState(null)
  const [loadedReservation, setLoadedReservation] = useState(null)
  const [activeRegulars, setActiveRegulars] = useState(null)
  const [regularLookupStatus, setRegularLookupStatus] = useState('idle')
  const [samePhoneReservations, setSamePhoneReservations] = useState([])
  const [rebookingLookupStatus, setRebookingLookupStatus] = useState('idle')
  const editorEntryKey = mode === 'edit' ? `edit:${reservationId || ''}` : 'create'
  const lastScrolledEntryKeyRef = useRef(null)
  const identityChangedRef = useRef(false)
  const manualRegularOverrideRef = useRef(false)
  const rebookingLookupGenerationRef = useRef(0)
  const actionLockRef = useRef(null)

  const isBusy = busyAction !== null

  function setEditorStatus(message, tone = 'info') {
    setStatus(message)
    setStatusTone(tone)
  }

  function beginAction(action) {
    if (actionLockRef.current) return false
    actionLockRef.current = action
    setBusyAction(action)
    return true
  }

  function endAction() {
    actionLockRef.current = null
    setBusyAction(null)
  }

  function handleBack() {
    if (actionLockRef.current) return
    navigate(backPath, { viewTransition: true })
  }

  useEffect(() => {
    if (lastScrolledEntryKeyRef.current === editorEntryKey) return
    lastScrolledEntryKeyRef.current = editorEntryKey
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [editorEntryKey])

  useEffect(() => {
    identityChangedRef.current = false
    manualRegularOverrideRef.current = false
    setEditorStatus('')
    setActiveRegulars(null)
    setRegularLookupStatus('loading')
    setSamePhoneReservations([])
    setRebookingLookupStatus('ready')
    let cancelled = false

    Promise.resolve()
      .then(() => listActiveRegulars(effectiveOwnerKey))
      .then((rows) => {
        if (cancelled) return
        setActiveRegulars(rows)
        setRegularLookupStatus('ready')
      })
      .catch((error) => {
        if (cancelled) return
        // Regular lookup is an optional enhancement. Reservation editing and
        // saving remain available, and existing tags are left untouched.
        console.warn('단골 명단을 불러오지 못했어요:', error)
        setActiveRegulars(null)
        setRegularLookupStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [editorEntryKey, effectiveOwnerKey])

  useEffect(() => {
    if (!identityChangedRef.current) return

    const normalizedPhone = formValues.phoneLast4
    if (!/^[0-9]{4}$/.test(normalizedPhone)) {
      rebookingLookupGenerationRef.current += 1
      setSamePhoneReservations([])
      setRebookingLookupStatus('ready')
      return
    }

    const generation = rebookingLookupGenerationRef.current + 1
    rebookingLookupGenerationRef.current = generation
    let cancelled = false
    setRebookingLookupStatus('loading')

    listSamePhoneReservations(effectiveOwnerKey, normalizedPhone, reservationId)
      .then((rows) => {
        if (cancelled || rebookingLookupGenerationRef.current !== generation) return
        setSamePhoneReservations(rows)
        setRebookingLookupStatus('ready')
      })
      .catch((error) => {
        if (cancelled || rebookingLookupGenerationRef.current !== generation) return
        console.warn('재예약 단서를 불러오지 못했어요:', error)
        setSamePhoneReservations([])
        setRebookingLookupStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [effectiveOwnerKey, formValues.phoneLast4, reservationId])

  useEffect(() => {
    if (regularLookupStatus !== 'ready' || !activeRegulars || rebookingLookupStatus !== 'ready' || !identityChangedRef.current) return
    if (manualRegularOverrideRef.current) return

    setFormValues((current) => reconcileRegularSelection(current, {
      activeRegulars,
      savedReservations: samePhoneReservations,
      currentReservationId: reservationId,
      lookupStatus: regularLookupStatus,
      identityChanged: true,
      manualOverride: false,
    }))
  }, [activeRegulars, regularLookupStatus, rebookingLookupStatus, samePhoneReservations, reservationId])

  useEffect(() => {
    if (mode !== 'edit' || !reservationId) return
    let cancelled = false

    async function loadReservation() {
      setIsLoading(true)
      try {
        const row = await getReservationById(reservationId, effectiveOwnerKey)
        if (cancelled) return
        if (!row) {
          setEditorStatus('예약을 찾지 못했어요. 목록으로 돌아가 다시 확인해 주세요.', 'error')
          return
        }
        setLoadedReservation(row)
        // A legacy/manual `other` tag without a link is an explicit saved
        // choice. Preserve it while the user fills in a number so the next
        // save can promote and link it atomically.
        manualRegularOverrideRef.current = row.tags?.includes(REGULAR_TAG_VALUE) && !row.regular_id
        setFormValues(mapReservationToFormValues(row))
        setEditorStatus('')
      } catch (error) {
        if (!cancelled) {
          setEditorStatus(error?.message || '예약을 불러오지 못했어요. 목록으로 돌아가 다시 시도해 주세요.', 'error')
        }
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

      if (field === 'phoneLast4') {
        const normalized = normalizeRegularPhoneLast4(value)
        if (current.phoneLast4 === normalized) return current
        identityChangedRef.current = true
        const next = { ...current, phoneLast4: normalized }
        return reconcileRegularSelection(next, {
          activeRegulars,
          savedReservations: samePhoneReservations,
          currentReservationId: reservationId,
          lookupStatus: regularLookupStatus === 'ready' && rebookingLookupStatus === 'ready' ? 'ready' : regularLookupStatus,
          identityChanged: true,
          manualOverride: manualRegularOverrideRef.current,
        })
      }

      if (field === 'customerName') {
        if (current.customerName === value) return current
        identityChangedRef.current = true
        const next = { ...current, customerName: value }
        return reconcileRegularSelection(next, {
          activeRegulars,
          savedReservations: samePhoneReservations,
          currentReservationId: reservationId,
          lookupStatus: regularLookupStatus === 'ready' && rebookingLookupStatus === 'ready' ? 'ready' : regularLookupStatus,
          identityChanged: true,
          manualOverride: manualRegularOverrideRef.current,
        })
      }

      return { ...current, [field]: value }
    })
  }

  function handleTagToggle(tagValue) {
    if (tagValue === REGULAR_TAG_VALUE) {
      manualRegularOverrideRef.current = true
      setFormValues((current) => toggleRegularTag(current))
      return
    }

    setFormValues((current) => {
      const isActive = current.tags.includes(tagValue)
      return {
        ...current,
        tags: isActive
          ? current.tags.filter((item) => item !== tagValue)
          : [...current.tags, tagValue],
      }
    })
  }

  const availableRooms = getRoomsForBranch(formValues.branch)

  async function handleSubmit(event) {
    event.preventDefault()
    const validationMessage = validateReservationForm(formValues)
    if (validationMessage) {
      setEditorStatus(validationMessage, 'error')
      return
    }

    if (!beginAction('saving')) return
    setEditorStatus('')
    try {
      const payload = buildReservationPayload(formValues)
      const hasCompleteRegularSelection = payload.tags.includes(REGULAR_TAG_VALUE)
        && /^[0-9]{4}$/.test(payload.regular_phone_last4 || '')
      const canEnsureRegular = manualRegularOverrideRef.current
        || (regularLookupStatus === 'ready' && rebookingLookupStatus === 'ready')
      const saved = hasCompleteRegularSelection && canEnsureRegular
        ? await saveReservationWithRegular(payload, reservationId)
        : await saveReservation(payload, reservationId, effectiveOwnerKey)

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
          identityChangedRef.current = false
          manualRegularOverrideRef.current = false
          setFormValues(createReservationDraft(formValues.reservationDate))
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
        setEditorStatus('예약은 저장되었으나, Google 캘린더 동기화에 실패했습니다. Google 연결을 확인해 주세요.', 'warning')
      } else {
        if (mode === 'edit') {
          navigate(`/scheduler/${saved.id}`)
        } else {
          identityChangedRef.current = false
          manualRegularOverrideRef.current = false
          setFormValues(createReservationDraft(formValues.reservationDate))
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
        setEditorStatus('저장했어요.', 'success')
      }
    } catch (error) {
      setEditorStatus(error?.message || '저장하지 못했어요. 입력을 확인한 뒤 다시 시도해 주세요.', 'error')
    } finally {
      endAction()
    }
  }

  async function handleDelete() {
    if (!reservationId || actionLockRef.current) return
    const shouldDelete = window.confirm('이 예약과 연결된 작업 3개를 함께 삭제할까요?')
    if (!shouldDelete) return

    if (!beginAction('deleting')) return
    setEditorStatus('')

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
      setEditorStatus(error?.message || '예약을 삭제하지 못했어요. 다시 시도해 주세요.', 'error')
    } finally {
      endAction()
    }
  }

  return (
    <div className="scheduler-shell scheduler-editor-page">

      <section className="scheduler-panel scheduler-editor-card">
        <div className="scheduler-editor-header">
          <div className="scheduler-editor-heading">
            <p className="scheduler-section-label">{mode === 'edit' ? '예약 편집' : '새 예약'}</p>
            <h1 className="scheduler-editor-title">{mode === 'edit' ? '예약 수정' : '예약 만들기'}</h1>
          </div>
          <button type="button" className="scheduler-back-button" onClick={handleBack} disabled={isBusy}>
            ← 돌아가기
          </button>
        </div>

        {status && (
          <p
            className={`status scheduler-editor-status is-${statusTone}`}
            role={statusTone === 'error' ? 'alert' : 'status'}
            aria-live={statusTone === 'error' ? 'assertive' : 'polite'}
            aria-atomic="true"
          >
            {status}
          </p>
        )}

        {isBusy ? (
          <span className="visually-hidden" role="status" aria-live="polite">
            {busyAction === 'deleting' ? '예약 삭제 중입니다.' : '예약 저장 중입니다.'}
          </span>
        ) : null}

        {isLoading ? (
          <p className="subtle scheduler-editor-loading" role="status" aria-live="polite">예약 불러오는 중...</p>
        ) : (
          <form className="scheduler-form" onSubmit={handleSubmit} aria-busy={isBusy}>
            <fieldset className="scheduler-editor-fieldset" disabled={isBusy}>
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
                <div className="scheduler-branch-option-row" role="group" aria-label="지점 선택">
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
                    <div className="scheduler-room-option-row" role="group" aria-label="룸 선택">
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
                enterKeyHint="next"
              />
            </label>

            <label className="scheduler-primary-field">
              <span className="scheduler-parent-label">번호</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={formValues.phoneLast4}
                onChange={(event) => updateField('phoneLast4', event.target.value)}
                placeholder="뒤 4자리"
                enterKeyHint="next"
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
                    enterKeyHint="next"
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
              <div className="scheduler-warning-offset-row" role="group" aria-label="퇴실등 시점 선택">
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
                      onClick={() => handleTagToggle(tag.value)}
                      aria-pressed={isActive}
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
                enterKeyHint="done"
              />
            </label>

            <div className="scheduler-form-actions">
              <button
                type="submit"
                className="scheduler-editor-save-button"
                disabled={isBusy}
                aria-busy={busyAction === 'saving'}
              >
                {busyAction === 'saving' ? '저장 중...' : mode === 'edit' ? '수정 저장' : '예약 만들기'}
              </button>
              {mode === 'edit' ? (
                <button
                  type="button"
                  className="danger-button scheduler-editor-delete-button"
                  onClick={handleDelete}
                  disabled={isBusy}
                  aria-busy={busyAction === 'deleting'}
                >
                  {busyAction === 'deleting' ? '삭제 중...' : '예약 삭제'}
                </button>
              ) : null}
            </div>
            </fieldset>
          </form>
        )}
      </section>
    </div>
  )
}
