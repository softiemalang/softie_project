import { navigate, usePathname } from './lib/router'
import { SchedulerApp } from './scheduler/SchedulerApp'
import SoftieFortunePage from './saju/SoftieFortunePage'
import ProjectBrainPage from './pages/ProjectBrainPage'
import HomePage from './pages/HomePage'
import BandGoogleCompactPage from './pages/BandGoogleCompactPage'
import RehearsalCalendarPage from './pages/RehearsalCalendarPage'
import SpotifyMusicPage from './pages/SpotifyMusicPage'

function NotFoundPage() {
  return (
    <div className="app-shell">
      <header className="hero">
        <p className="eyebrow">404</p>
        <h1>페이지를 찾을 수 없어요.</h1>
        <div style={{ marginTop: '1.2rem' }}>
          <button type="button" className="soft-button" onClick={() => navigate('/')}>
            홈으로 돌아가기
          </button>
        </div>
      </header>
    </div>
  )
}

function DisabledEntryPage({ eyebrow, title, description, buttonLabel, buttonPath }) {
  return (
    <div className="app-shell">
      <header className="hero">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="subtle">{description}</p>
        <div style={{ marginTop: '1.2rem' }}>
          <button type="button" className="soft-button" onClick={() => navigate(buttonPath)}>
            {buttonLabel}
          </button>
        </div>
      </header>
    </div>
  )
}

export default function App() {
  const pathname = usePathname()

  if (pathname === '/') {
    return <HomePage />
  }

  if (pathname.startsWith('/band')) {
    return <BandGoogleCompactPage />
  }

  if (pathname.startsWith('/rehearsals')) {
    return <RehearsalCalendarPage />
  }

  if (pathname.startsWith('/scheduler')) {
    return <SchedulerApp pathname={pathname} />
  }

  if (pathname.startsWith('/music')) {
    return <SpotifyMusicPage />
  }

  if (pathname.startsWith('/softie-fortune')) {
    return <SoftieFortunePage />
  }

  if (pathname.startsWith('/fortune')) {
    return (
      <DisabledEntryPage
        eyebrow="FORTUNE"
        title="이전 운세 페이지는 현재 사용하지 않아요."
        description="Softie Fortune에서 오늘의 리포트를 확인해 주세요."
        buttonLabel="Softie Fortune으로 이동"
        buttonPath="/softie-fortune"
      />
    )
  }

  if (pathname.startsWith('/saju-evaluations')) {
    return (
      <DisabledEntryPage
        eyebrow="SAJU QA"
        title="사주 QA/평가 화면은 현재 비활성화되어 있어요."
        description="현재 운세 진입점은 Softie Fortune 하나로 정리해두었습니다."
        buttonLabel="Softie Fortune으로 이동"
        buttonPath="/softie-fortune"
      />
    )
  }

  if (pathname.startsWith('/brain')) {
    return <ProjectBrainPage />
  }

  return <NotFoundPage />
}
