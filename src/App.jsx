import { navigate, usePathname } from './lib/router'
import { SchedulerApp } from './scheduler/SchedulerApp'
import FortunePage from './saju/FortunePage'
import ProjectBrainPage from './pages/ProjectBrainPage'
import HomePage from './pages/HomePage'
import BandPage from './pages/BandPage'
import RehearsalCalendarPage from './pages/RehearsalCalendarPage'

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

export default function App() {
  const pathname = usePathname()

  if (pathname === '/') {
    return <HomePage />
  }

  if (pathname.startsWith('/band')) {
    return <BandPage />
  }

  if (pathname.startsWith('/rehearsals')) {
    return <RehearsalCalendarPage />
  }

  if (pathname.startsWith('/scheduler')) {
    return <SchedulerApp pathname={pathname} />
  }

  if (pathname.startsWith('/fortune')) {
    return <FortunePage />
  }

  if (pathname.startsWith('/brain')) {
    return <ProjectBrainPage />
  }

  return <NotFoundPage />
}
