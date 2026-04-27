import { navigate } from '../lib/router'

export default function HomePage() {
  const services = [
    {
      description: '밴드원들의 가능 시간을 모아 합주 타임을 찾아보세요.',
      path: '/band',
      icon: '🎸',
      label: 'BAND',
    },
    {
      description: '오늘의 흐름을 차분히 살펴보는 맞춤 리포트예요.',
      path: '/fortune',
      icon: '🍀',
      label: 'FORTUNE',
    },
    {
      description: '근무 일정과 알림을 가볍게 관리해요.',
      path: '/scheduler',
      icon: '⏰',
      label: 'SCHEDULER',
    },
  ]

  return (
    <div className="app-shell home-shell">
      <header className="hero">
        <div className="home-hero-content">
          <p className="eyebrow">말랑이의 작업실</p>
          <p className="subtle">
            일상의 작은 불편을 해결하기 위해 만든 개인용 도구와 서비스들을 모아둔 공간입니다.
            차분하고 따뜻한 마음으로 하나씩 채워가고 있어요.
          </p>
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
            <div className="service-action">
              <span className="arrow">→</span>
            </div>
          </article>
        ))}
      </section>

      <footer className="home-footer">
        <p className="subtle">천천히, 필요한 만큼만 채워가는 중이에요.</p>
      </footer>
    </div>
  )
}
