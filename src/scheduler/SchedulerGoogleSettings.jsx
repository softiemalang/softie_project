import { useState } from 'react'
import { getCurrentSession } from '../lib/auth'
import {
  appendGoogleSheetsLog,
  connectGoogleCalendar,
  createGoogleCalendarEvent,
  triggerGoogleDriveBackup,
} from './googleApi'

function requiresGoogleReconnect(error) {
  const message = error instanceof Error ? error.message : ''
  return message.includes('not connected')
    || message.includes('refresh token')
    || message.includes('insufficient')
}

export function SchedulerGoogleSettings({
  googleConnected,
  googleConnectionState,
  onGoogleDisconnected,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState('')

  async function getAuthenticatedUserId() {
    const session = await getCurrentSession()
    const userId = session?.user?.id
    if (!userId) {
      setStatus('Google 연동은 로그인이 필요합니다.')
      return null
    }
    return userId
  }

  async function handleConnect() {
    const userId = await getAuthenticatedUserId()
    if (!userId) return
    await connectGoogleCalendar(userId, { returnPath: '/scheduler' })
  }

  async function handleTestEvent() {
    if (!googleConnected) {
      setStatus('Google 계정을 먼저 연결해 주세요.')
      return
    }

    try {
      setStatus('Google Calendar 일정 생성 중...')
      const userId = await getAuthenticatedUserId()
      if (!userId) return

      const now = new Date()
      const end = new Date(now.getTime() + 60 * 60 * 1000)
      await createGoogleCalendarEvent(userId, {
        summary: '테스트 일정',
        location: '서울 지점',
        description: 'Softie 스케줄러 연결 테스트 일정입니다.',
        startAt: now.toISOString(),
        endAt: end.toISOString(),
      })
      setStatus('일정을 생성했어요.')
    } catch (error) {
      setStatus(`오류: ${error.message}`)
      if (requiresGoogleReconnect(error)) onGoogleDisconnected()
    }
  }

  async function handleDriveBackup() {
    if (!googleConnected) {
      setStatus('Google 계정을 먼저 연결해 주세요.')
      return
    }

    try {
      setStatus('Google Drive에 백업 중...')
      const userId = await getAuthenticatedUserId()
      if (!userId) return

      const result = await triggerGoogleDriveBackup(userId, 'full')
      setStatus(`백업 완료: ${result.fileName}`)
      appendGoogleSheetsLog(userId, 'backup_logs', [
        new Date().toISOString(),
        'backup_completed',
        'full',
        result.fileName || '',
        result.fileId || '',
        'success',
        JSON.stringify(result.metadata?.counts || {}),
        '',
      ])
    } catch (error) {
      setStatus(`오류: ${error.message}`)
      if (requiresGoogleReconnect(error)) onGoogleDisconnected()
    }
  }

  const connectionLabel = googleConnectionState === 'checking'
    ? '확인 중'
    : googleConnectionState === 'error'
      ? '확인 실패'
      : googleConnected
        ? '연결됨'
        : '연결 필요'

  return (
    <>
      <button
        type="button"
        className="scheduler-panel scheduler-push-panel scheduler-setting-card"
        onClick={() => setIsOpen(true)}
      >
        <div className="scheduler-section-head">
          <p className="scheduler-section-label">Google 연동</p>
          <div className={`scheduler-count-pill ${googleConnected ? 'is-ready' : ''}`}>
            {connectionLabel}
          </div>
        </div>
        {!googleConnected && (
          <p className="scheduler-setting-subtitle">
            연결하면 일정 동기화와 백업을 사용할 수 있어요.
          </p>
        )}
      </button>

      {isOpen && (
        <div className="scheduler-sheet-backdrop scheduler-modal-backdrop" onClick={() => setIsOpen(false)}>
          <div
            className="scheduler-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Google 연동 설정"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="scheduler-section-head">
              <p className="scheduler-section-label">Google 연동</p>
              <button type="button" className="scheduler-modal-close" onClick={() => setIsOpen(false)}>닫기</button>
            </div>

            <div className="scheduler-modal-actions stack">
              <p className="subtle" style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '0.86rem' }}>
                Google 캘린더와 연동하면 일정이 자동으로 동기화되고, 안전한 데이터 백업이 가능합니다.
              </p>
              <button type="button" className="scheduler-modal-btn" onClick={handleConnect}>
                {googleConnected ? '계정 다시 연결하기' : 'Google 계정 연결하기'}
              </button>
              <button type="button" className="scheduler-modal-btn secondary" onClick={handleTestEvent}>
                테스트 일정 추가
              </button>
              <button type="button" className="scheduler-modal-btn secondary" onClick={handleDriveBackup}>
                수동 백업 (Drive)
              </button>
            </div>
            {status && (
              <p className={`scheduler-google-status ${status.includes('오류') ? 'error' : 'success'}`} style={{ marginTop: '1rem', marginBottom: 0 }}>
                {status}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
