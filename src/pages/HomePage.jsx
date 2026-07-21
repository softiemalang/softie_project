import { useEffect, useState } from 'react'
import { navigate } from '../lib/router'
import { getCurrentSession, signInWithGoogle, signOut, subscribeAuthChanges } from '../lib/auth'
import { isKakaoMemoConnected, sendKakaoMemoText, startKakaoMemoLogin } from '../lib/kakaoMessage'

export default function HomePage() {
  const [session, setSession] = useState(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [isMemoOpen, setIsMemoOpen] = useState(false)
  const [memoText, setMemoText] = useState('')
  const [memoStatus, setMemoStatus] = useState('')
  const [memoError, setMemoError] = useState('')
  const [isSendingMemo, setIsSendingMemo] = useState(false)
  const [isKakaoMemoReady, setIsKakaoMemoReady] = useState(() => isKakaoMemoConnected())

  useEffect(() => {
    getCurrentSession().then(s => {
      setSession(s)
      setIsLoadingAuth(false)
    })

    const sub = subscribeAuthChanges((s) => {
      setSession(s)
    })

    return () => {
      sub.unsubscribe()
    }
  }, [])

  const services = [
    {
      description: '근무 일정 관리와 실시간 푸시 알림으로 꼼꼼하게 관리하세요.',
      path: '/scheduler',
      label: 'SCHEDULER',
    },
    {
      description: '저장된 나의 사주 프로필을 바탕으로 오늘의 흐름을 더 조용하고 깊게 살펴요.',
      path: '/softie-fortune',
      label: 'SOFTIE FORTUNE',
    },
    {
      description: '세 가지 명리 체계의 계산 근거와 불확실성을 해석 전에 구조화해요.',
      path: '/interpretation-prep',
      label: 'INTERPRETATION PREP',
    },
    {
      description: '떠오른 생각을 잊기 전에 카카오톡 나에게 보내기로 빠르게 남겨요.',
      action: 'memo',
      label: 'SOFTIE MEMO',
    },
    {
      description: 'Spotify Connect 기기를 예쁜 리모컨처럼 조작하고 현재 재생 중인 음악을 확인해요.',
      path: '/music',
      label: 'SOFTIE MUSIC',
    },
    {
      description: '개인 합주 일정을 월 캘린더로 관리하고 구글 캘린더와 백업을 연결해요.',
      path: '/rehearsals',
      label: 'REHEARSALS',
    },
    {
      description: '밴드원들의 가능 시간을 모아서 최적의 합주 타임을 찾아보세요.',
      path: '/band',
      label: 'BAND',
    },
    {
      description: '공연 중 가사와 코드를 모바일 화면에서 한 페이지씩 편하게 확인해요.',
      path: '/lead-sheet',
      label: 'LEAD SHEET',
    },
  ]

  function openMemoModal() {
    setMemoStatus('')
    setMemoError('')
    setIsMemoOpen(true)
  }

  function closeMemoModal() {
    if (isSendingMemo) return
    setIsMemoOpen(false)
    setMemoStatus('')
    setMemoError('')
  }

  async function handleSendMemo() {
    const text = memoText.trim()
    if (!text || isSendingMemo) return

    if (!session) {
      setMemoStatus('')
      setMemoError('Google 로그인 후 카카오 연결을 진행해 주세요.')
      return
    }

    setIsSendingMemo(true)
    setMemoStatus('')
    setMemoError('')

    try {
      const result = await sendKakaoMemoText({
        text,
        url: `${window.location.origin}/`,
      })

      if (result.ok) {
        setIsKakaoMemoReady(true)
        setMemoStatus('카카오톡으로 보냈어')
        setMemoText('')
        return
      }

      const errorStatus = result.error?.status
      const errorCode = result.error?.payload?.error || ''
      const needsReconnect = result.reason === 'needs_login' ||
        errorStatus === 401 ||
        errorStatus === 403 ||
        errorCode.includes('needs_kakao_login') ||
        errorCode.includes('kakao_token')

      if (needsReconnect) {
        const reconnectMessage = errorStatus === 403
          ? '카카오 권한을 다시 받아야 해요.'
          : '카카오 재연결이 필요해요.'
        const shouldReconnect = window.confirm(`${reconnectMessage}\n카카오 인증 화면으로 이동할까요?`)

        if (shouldReconnect) {
          const started = startKakaoMemoLogin({
            returnPath: '/',
            pendingMemo: { text, url: `${window.location.origin}/` },
          })
          if (started.ok) return
          setMemoError('카카오 연결 설정이 아직 준비되지 않았어요. 메모를 복사해 둘 수 있어요.')
        } else {
          setMemoError(`${reconnectMessage} 메모를 복사해 둘 수 있어요.`)
        }
      } else {
        setMemoError('카카오톡 전송에 실패했어요. 메모를 복사해 둘 수 있어요.')
      }
    } catch (error) {
      console.error('[HomePage] Failed to send softie memo.', error)
      setMemoError('카카오톡 전송에 실패했어요. 메모를 복사해 둘 수 있어요.')
    } finally {
      setIsSendingMemo(false)
    }
  }

  async function handleCopyMemo() {
    const text = memoText.trim()
    if (!text || !navigator.clipboard) return

    try {
      await navigator.clipboard.writeText(text)
      setMemoStatus('메모를 복사했어')
      setMemoError('')
    } catch (error) {
      console.error('[HomePage] Failed to copy softie memo.', error)
      setMemoError('복사에 실패했어요. 메모 내용을 직접 선택해서 복사해 주세요.')
    }
  }

  return (
    <div className="app-shell ag-shell home-shell" data-design-theme="atmospheric">
      <main className="ag-layout home-layout">
        <header className="ag-glass home-hero">
          <div className="home-hero-topline">
            <p className="ag-kicker">SOFTIE PROJECT</p>
            <span className="home-topline-divider" aria-hidden="true">·</span>
            <span className="home-tool-count">8 TOOLS</span>
            <div className="home-auth-area">
              {isLoadingAuth ? (
                <span className="home-auth-status">계정 확인 중</span>
              ) : session ? (
                <div className="home-auth-signed-in home-account-bar">
                  <p className="home-auth-email">{session.user.email}</p>
                  <button className="ag-secondary-action home-auth-button" onClick={() => signOut()}>
                    로그아웃
                  </button>
                </div>
              ) : (
                <button className="ag-secondary-action home-auth-button" onClick={() => signInWithGoogle()}>
                  Google로 로그인
                </button>
              )}
            </div>
          </div>
        </header>

        <section className="home-services" aria-label="도구 목록">
          <div className="home-section-heading">
            <p className="ag-kicker">TOOLS</p>
          </div>

          <div className="service-grid">
            {services.map((service, index) => (
              <button
                type="button"
                key={service.path || service.label}
                className="ag-glass service-card"
                onClick={() => service.action === 'memo' ? openMemoModal() : navigate(service.path)}
              >
                <span className="service-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="service-info">
                  <span className="service-label">{service.label}</span>
                  <span className="service-description">{service.description}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <footer className="home-footer">
          <div className="home-footer-heading">
            <p className="home-footer-label">SOFTIE PROJECT</p>
            <span aria-hidden="true">·</span>
            <p className="home-footer-mark">말랑이의 작업실</p>
          </div>
          <div className="home-footer-intro">
            <p>일상의 작은 불편을 덜기 위해 만든 개인용 도구와 서비스를 모아둔 공간입니다.</p>
            <p>차분하고 따뜻한 마음으로 하나씩 채워가고 있어요.</p>
          </div>
          <p className="subtle">© 2026 Softie Project. Built with care.</p>
        </footer>
      </main>

      {isMemoOpen && (
        <div className="home-memo-backdrop" onClick={closeMemoModal}>
          <section className="home-memo-sheet" role="dialog" aria-modal="true" aria-label="SOFTIE MEMO" onClick={(event) => event.stopPropagation()}>
            <div className="home-memo-header">
              <span className={`home-memo-kakao-badge ${isKakaoMemoReady ? 'success' : 'muted'}`}>
                {isKakaoMemoReady ? '카카오 연결됨' : '카카오 재연결 필요'}
              </span>
              <button type="button" className="home-memo-close" onClick={closeMemoModal}>닫기</button>
            </div>
            <textarea
              className="home-memo-textarea"
              value={memoText}
              onChange={(event) => {
                setMemoText(event.target.value)
                setMemoStatus('')
                setMemoError('')
              }}
              placeholder="잊기 전에 남길 메모를 적어줘"
              rows={5}
            />
            {memoStatus && <p className="home-memo-status success">{memoStatus}</p>}
            {memoError && (
              <div className="home-memo-error-row">
                <p className="home-memo-status error">{memoError}</p>
                {memoText.trim() && (
                  <button type="button" className="home-memo-secondary home-memo-copy" onClick={handleCopyMemo}>
                    복사
                  </button>
                )}
              </div>
            )}
            <div className="home-memo-actions">
              <button type="button" className="home-memo-primary" onClick={handleSendMemo} disabled={isSendingMemo || !memoText.trim()}>
                {isSendingMemo ? '보내는 중...' : '나에게 보내기'}
              </button>
            </div>
          </section>
        </div>
      )}

    </div>
  )
}
