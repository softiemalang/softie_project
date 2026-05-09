import { useEffect, useState } from 'react'
import { navigate } from '../lib/router'
import { getCurrentSession, signInWithGoogle, signOut, subscribeAuthChanges } from '../lib/auth'
import { connectGoogleCalendar, isGoogleConnected } from './googleApi'
import { SchedulerApp } from './SchedulerApp'

function SchedulerLoginPage({ isSigningIn, onSignIn }) {
  return (
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
  )
}

export function SchedulerAuthGate({ pathname }) {
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isGooglePanelOpen, setIsGooglePanelOpen] = useState(false)
  const googleConnected = isGoogleConnected()

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
    await signInWithGoogle(window.location.href)
  }

  async function handleSignOut() {
    await signOut()
    setSession(null)
  }

  async function handleGoogleConnect() {
    if (!session?.user?.id) return
    await connectGoogleCalendar(session.user.id, { returnPath: '/scheduler' })
  }

  if (isLoading) {
    return (
      <div className="app-shell scheduler-shell">
        <p className="status" style={{ textAlign: 'center', marginTop: '4rem' }}>로그인 상태 확인 중...</p>
      </div>
    )
  }

  if (!session) {
    return <SchedulerLoginPage isSigningIn={isSigningIn} onSignIn={handleSignIn} />
  }

  return (
    <div className="scheduler-auth-gated">
      <style>{`
        .scheduler-auth-gated > .scheduler-shell:first-of-type {
          padding-bottom: 0 !important;
        }

        .scheduler-auth-gated > .scheduler-shell + .scheduler-shell {
          padding-top: 0.35rem !important;
        }

        .scheduler-auth-gated .scheduler-auth-card {
          margin-bottom: 0.35rem;
        }

        .scheduler-auth-gated > .scheduler-shell + .scheduler-shell > button.scheduler-setting-card:nth-of-type(2) {
          display: none;
        }
      `}</style>
      <div className="scheduler-shell" style={{ paddingBottom: 0 }}>
        <section
          className="scheduler-panel scheduler-setting-card is-connected scheduler-auth-card"
          style={{ padding: '0.95rem 1.05rem' }}
        >
          <div className="scheduler-section-head" style={{ alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ minWidth: 0 }}>
              <p
                className="scheduler-section-label"
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {session.user.email || 'Google 계정'}
              </p>
            </div>
            <div
              style={{
                alignItems: 'center',
                display: 'flex',
                flexShrink: 0,
                gap: '0.45rem',
              }}
            >
              <button
                type="button"
                className="scheduler-count-pill"
                onClick={handleSignOut}
                style={{ border: 0, cursor: 'pointer' }}
              >
                로그아웃
              </button>
              <button
                type="button"
                className={`scheduler-count-pill ${googleConnected ? 'is-ready' : ''}`}
                onClick={() => setIsGooglePanelOpen(true)}
                style={{ border: 0, cursor: 'pointer' }}
              >
                {googleConnected ? 'Google 연동됨' : 'Google 연결'}
              </button>
            </div>
          </div>
        </section>
      </div>

      {isGooglePanelOpen && (
        <div className="scheduler-sheet-backdrop scheduler-modal-backdrop" onClick={() => setIsGooglePanelOpen(false)}>
          <div className="scheduler-modal" onClick={(event) => event.stopPropagation()}>
            <div className="scheduler-section-head" style={{ marginBottom: '0.65rem' }}>
              <p className="scheduler-section-label">Google 연동</p>
              <button type="button" className="scheduler-modal-close" onClick={() => setIsGooglePanelOpen(false)}>닫기</button>
            </div>
            <p className="subtle" style={{ marginTop: 0, marginBottom: '1.25rem', fontSize: '0.86rem' }}>
              캘린더 동기화와 Drive 백업에 사용하는 연결이에요.
            </p>
            <div className="scheduler-modal-actions stack">
              <button type="button" className="scheduler-modal-btn" onClick={handleGoogleConnect}>
                {googleConnected ? 'Google 다시 연결' : 'Google 연결'}
              </button>
            </div>
          </div>
        </div>
      )}

      <SchedulerApp pathname={pathname} />
    </div>
  )
}
