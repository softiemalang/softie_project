import { useEffect, useState } from 'react'
import { navigate } from '../lib/router'
import { getCurrentSession, signInWithGoogle, signOut, subscribeAuthChanges } from '../lib/auth'
import { connectGoogleCalendar, triggerGoogleDriveBackup } from './googleApi'
import { getGoogleConnectionMessage, inferGoogleDisconnectReason } from './googleConnectionState'
import { SchedulerApp } from './SchedulerApp'
import { useGoogleConnection } from './useGoogleConnection'

function SchedulerLoginPage({ isSigningIn, onSignIn, status }) {
  return (
    <div className="scheduler-theme-shell ag-shell" data-design-theme="atmospheric">
      <div className="scheduler-shell">
        <section className="scheduler-panel scheduler-setting-card is-setup">
        <div className="scheduler-section-head">
          <p className="scheduler-section-label">계정 로그인</p>
          <div className="scheduler-count-pill">로그인 필요</div>
        </div>
        <p className="scheduler-setting-subtitle">
          내 예약과 근무 기록을 불러오려면 Google 로그인이 필요해요.
        </p>
        <div className="scheduler-modal-actions stack" style={{ marginTop: '1rem' }}>
          <button
            type="button"
            className="scheduler-modal-btn"
            onClick={onSignIn}
            disabled={isSigningIn}
          >
            {isSigningIn ? '로그인 이동 중...' : 'Google로 로그인'}
          </button>
          <button
            type="button"
            className="scheduler-modal-btn secondary"
            onClick={() => navigate('/')}
          >
            Softie Project 홈으로 이동
          </button>
        </div>
        {status ? <p className="status">{status}</p> : null}
        </section>

        <section className="scheduler-panel scheduler-setting-card">
        <div className="scheduler-section-head">
          <p className="scheduler-section-label">Google 연동 안내</p>
          <div className="scheduler-count-pill">백업용</div>
        </div>
        <p className="scheduler-setting-subtitle">
          로그인은 내 데이터를 불러오는 용도이고, Google 연동은 캘린더 동기화와 Drive 백업에 사용하는 별도 연결이에요.
        </p>
        </section>
      </div>
    </div>
  )
}

export function SchedulerAuthGate({ pathname }) {
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [authStatus, setAuthStatus] = useState('')
  const [isGooglePanelOpen, setIsGooglePanelOpen] = useState(false)
  const [isDriveBackupBusy, setIsDriveBackupBusy] = useState(false)
  const [driveBackupStatus, setDriveBackupStatus] = useState('')
  const {
    googleConnected,
    googleConnectionReason,
    googleConnectionState,
    markGoogleDisconnected,
  } = useGoogleConnection(session?.user?.id)

  useEffect(() => {
    let mounted = true

    getCurrentSession().then((currentSession) => {
      if (!mounted) return
      setSession(currentSession)
      setIsLoading(false)
    })

    const subscription = subscribeAuthChanges((nextSession) => {
      setSession(nextSession)
      setIsLoading(false)
      setIsSigningIn(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleSignIn() {
    setIsSigningIn(true)
    setAuthStatus('')
    try {
      await signInWithGoogle(window.location.href)
    } catch (error) {
      console.error('[scheduler] Sign in failed:', error)
      setAuthStatus(error instanceof Error ? error.message : '로그인을 시작하지 못했어요.')
      setIsSigningIn(false)
    }
  }

  async function handleSignOut() {
    if (!window.confirm('로그아웃하시겠습니까?')) return

    setIsSigningOut(true)
    setAuthStatus('')
    try {
      await signOut()
      markGoogleDisconnected()
      setSession(null)
    } catch (error) {
      console.error('[scheduler] Sign out failed:', error)
      setAuthStatus(error instanceof Error ? error.message : '로그아웃하지 못했어요.')
    } finally {
      setIsSigningOut(false)
    }
  }

  function handleGoogleDisconnected(reason) {
    markGoogleDisconnected(reason)
  }

  async function handleGoogleConnect() {
    if (!session?.user?.id) return
    await connectGoogleCalendar(session.user.id, { returnPath: '/scheduler' })
  }

  async function handleDriveBackup() {
    if (!session?.user?.id) return

    setIsDriveBackupBusy(true)
    setDriveBackupStatus('백업 중...')

    try {
      await triggerGoogleDriveBackup(session.user.id, 'full')
      setDriveBackupStatus('Drive 백업을 완료했어요.')
    } catch (error) {
      console.error('[scheduler] Drive backup failed:', error)
      setDriveBackupStatus(error instanceof Error ? error.message : 'Drive 백업에 실패했어요.')
      const disconnectReason = inferGoogleDisconnectReason(error)
      if (disconnectReason) markGoogleDisconnected(disconnectReason)
    } finally {
      setIsDriveBackupBusy(false)
    }
  }

  if (isLoading) {
    return (
      <div className="scheduler-theme-shell ag-shell" data-design-theme="atmospheric">
        <div className="app-shell scheduler-shell">
          <p className="status" style={{ textAlign: 'center', marginTop: '4rem' }}>로그인 상태 확인 중...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <SchedulerLoginPage isSigningIn={isSigningIn} onSignIn={handleSignIn} status={authStatus} />
  }

  const accountStatusLabel = googleConnectionState === 'checking'
    ? '확인 중'
    : googleConnectionState === 'error'
      ? '확인 필요'
      : googleConnected
        ? '연동됨'
        : '연결 필요'

  return (
    <div className="scheduler-auth-gated scheduler-theme-shell ag-shell" data-design-theme="atmospheric">
      {isGooglePanelOpen && (
        <div className="scheduler-sheet-backdrop scheduler-modal-backdrop" onClick={() => setIsGooglePanelOpen(false)}>
          <div
            className="scheduler-modal scheduler-google-modal"
            role="dialog"
            aria-modal="true"
            aria-label="계정 및 Google 연동 설정"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="scheduler-section-head" style={{ marginBottom: '0.65rem' }}>
              <p className="scheduler-section-label">계정 및 연동</p>
              <button type="button" className="scheduler-modal-close" onClick={() => setIsGooglePanelOpen(false)}>닫기</button>
            </div>

            <div className="scheduler-account-detail-list">
              <div className="scheduler-account-detail-row">
                <span>로그인 계정</span>
                <strong>{session.user.email || 'Google 계정'}</strong>
              </div>
              <div className="scheduler-account-detail-row">
                <span>Google 연동</span>
                <strong className={googleConnected ? 'is-ready' : ''}>{accountStatusLabel}</strong>
              </div>
            </div>

            <p className="subtle scheduler-account-detail-note">
              {googleConnected
                ? '캘린더 동기화와 Drive 백업을 사용할 수 있어요.'
                : getGoogleConnectionMessage(googleConnectionReason)}
            </p>
            <div className="scheduler-modal-actions stack">
              <button
                type="button"
                className="scheduler-modal-btn"
                onClick={handleDriveBackup}
                disabled={isDriveBackupBusy || !googleConnected}
              >
                {isDriveBackupBusy ? 'Drive 백업 중...' : 'Drive 백업 실행'}
              </button>
              <button type="button" className="scheduler-modal-btn secondary" onClick={handleGoogleConnect}>
                {googleConnected ? 'Google 다시 연결' : 'Google 연결'}
              </button>
              <button
                type="button"
                className="scheduler-modal-btn secondary scheduler-sign-out-button"
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? '로그아웃 중...' : '로그아웃'}
              </button>
            </div>
            {driveBackupStatus && (
              <p className="subtle scheduler-modal-footnote" style={{ marginTop: '0.9rem', marginBottom: 0 }}>
                {driveBackupStatus}
              </p>
            )}
            {authStatus ? <p className="status scheduler-account-status">{authStatus}</p> : null}
          </div>
        </div>
      )}

      <SchedulerApp
        pathname={pathname}
        session={session}
        googleConnected={googleConnected}
        googleConnectionReason={googleConnectionReason}
        googleConnectionState={googleConnectionState}
        accountStatusLabel={accountStatusLabel}
        accountStatusReady={googleConnected}
        onOpenAccountPanel={() => setIsGooglePanelOpen(true)}
        onGoogleDisconnected={handleGoogleDisconnected}
      />
    </div>
  )
}
