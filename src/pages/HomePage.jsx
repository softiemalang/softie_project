import { useEffect, useState } from 'react'
import { navigate } from '../lib/router'
import { getCurrentSession, signInWithGoogle, signOut, subscribeAuthChanges } from '../lib/auth'

export default function HomePage() {
  const [session, setSession] = useState(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

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
      description: '밴드원들의 가능 시간을 모아서 최적의 합주 타임을 찾아보세요.',
      path: '/band',
      icon: '🎸',
      label: 'BAND',
    },
    {
      description: '개인 합주 일정을 월 캘린더로 관리하고 구글 캘린더와 백업을 연결해요.',
      path: '/rehearsals',
      icon: '📅',
      label: 'REHEARSALS',
    },
    {
      description: '나의 일간과 오늘의 흐름을 분석한 맞춤형 AI 리포트를 확인하세요.',
      path: '/fortune',
      icon: '🍀',
      label: 'FORTUNE',
    },
    {
      description: '근무 일정 관리와 실시간 푸시 알림으로 꼼꼼하게 관리하세요.',
      path: '/scheduler',
      icon: '⏰',
      label: 'SCHEDULER',
    },
  ]

  return (
    <div className="app-shell home-shell">
      <header className="hero home-hero">
        <div className="home-hero-content">
          <p className="eyebrow">말랑이의 작업실</p>
          <p className="subtle">
            일상의 작은 불편을 해결하기 위해 만든 개인용 도구와 서비스들을 모아둔 공간입니다.
            차분하고 따뜻한 마음으로 하나씩 채워가고 있어요.
          </p>
        </div>
        <div className="home-auth-area">
          {isLoadingAuth ? (
            <span className="home-auth-status">확인 중...</span>
          ) : session ? (
            <div className="home-auth-signed-in">
              <p className="home-auth-email">{session.user.email}</p>
              <button className="soft-button home-auth-button" onClick={() => signOut()}>
                로그아웃
              </button>
            </div>
          ) : (
            <button className="soft-button home-auth-button" onClick={() => signInWithGoogle()}>
              Google로 로그인
            </button>
          )}
        </div>
      </header>

      <section className="service-grid">
        {services.map((service) => (
          <article
            key={service.path}
            className="card service-card"
            onClick={() => navigate(service.path)}
          >
            <div className="service-icon">{service.icon}</div>
            <div className="service-info">
              <p className="section-kicker">{service.label}</p>
              <p className="subtle">{service.description}</p>
            </div>
          </article>
        ))}
      </section>

      <footer className="home-footer">
        <p className="subtle">© 2026 Softie Project. Built with care.</p>
      </footer>
    </div>
  )
}
