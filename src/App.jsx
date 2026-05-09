import { useEffect } from 'react'
import { navigate, usePathname } from './lib/router'
import { SchedulerApp } from './scheduler/SchedulerApp'
import SoftieFortunePage from './saju/SoftieFortunePage'
import ProjectBrainPage from './pages/ProjectBrainPage'
import HomePage from './pages/HomePage'
import BandGoogleCompactPage from './pages/BandGoogleCompactPage'
import RehearsalCalendarPage from './pages/RehearsalCalendarPage'
import SpotifyMusicPage from './pages/SpotifyMusicPage'

const DEFAULT_APP_NAME = 'Softie Project'

function upsertMetaContent(selector, createAttributes, content) {
  if (typeof document === 'undefined') return

  let meta = document.head.querySelector(selector)
  if (!meta) {
    meta = document.createElement('meta')
    Object.entries(createAttributes).forEach(([key, value]) => {
      meta.setAttribute(key, value)
    })
    document.head.appendChild(meta)
  }

  meta.setAttribute('content', content)
}

function getRouteMetadata(pathname) {
  if (pathname.startsWith('/scheduler')) {
    return {
      title: 'Work Scheduler | Softie Project',
      appTitle: 'Work Scheduler',
      ogTitle: 'Work Scheduler | Softie Project',
    }
  }

  if (pathname.startsWith('/band')) {
    return {
      title: 'Band Rehearsal Scheduler | Softie Project',
      appTitle: 'Band Scheduler',
      ogTitle: 'Band Rehearsal Scheduler | Softie Project',
    }
  }

  if (pathname.startsWith('/rehearsals')) {
    return {
      title: 'Rehearsals | Softie Project',
      appTitle: 'Rehearsals',
      ogTitle: 'Rehearsals | Softie Project',
    }
  }

  if (pathname.startsWith('/music')) {
    return {
      title: 'Softie Music | Softie Project',
      appTitle: 'Softie Music',
      ogTitle: 'Softie Music | Softie Project',
    }
  }

  if (pathname.startsWith('/softie-fortune') || pathname.startsWith('/fortune')) {
    return {
      title: 'Softie Fortune | Softie Project',
      appTitle: 'Softie Fortune',
      ogTitle: 'Softie Fortune | Softie Project',
    }
  }

  if (pathname.startsWith('/brain')) {
    return {
      title: 'Project Brain | Softie Project',
      appTitle: 'Project Brain',
      ogTitle: 'Project Brain | Softie Project',
    }
  }

  if (pathname.startsWith('/saju-evaluations')) {
    return {
      title: 'Saju QA | Softie Project',
      appTitle: 'Saju QA',
      ogTitle: 'Saju QA | Softie Project',
    }
  }

  if (pathname === '/') {
    return {
      title: DEFAULT_APP_NAME,
      appTitle: DEFAULT_APP_NAME,
      ogTitle: DEFAULT_APP_NAME,
    }
  }

  return {
    title: `404 | ${DEFAULT_APP_NAME}`,
    appTitle: DEFAULT_APP_NAME,
    ogTitle: DEFAULT_APP_NAME,
  }
}

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

  useEffect(() => {
    const metadata = getRouteMetadata(pathname)

    document.title = metadata.title
    upsertMetaContent('meta[name="application-name"]', { name: 'application-name' }, metadata.appTitle)
    upsertMetaContent(
      'meta[name="apple-mobile-web-app-title"]',
      { name: 'apple-mobile-web-app-title' },
      metadata.appTitle,
    )
    upsertMetaContent('meta[property="og:title"]', { property: 'og:title' }, metadata.ogTitle)
    upsertMetaContent('meta[property="og:site_name"]', { property: 'og:site_name' }, DEFAULT_APP_NAME)
  }, [pathname])

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
