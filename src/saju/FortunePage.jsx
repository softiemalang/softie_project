import { useState } from 'react'
import { navigate } from '../lib/router'

export default function FortunePage() {
  const [profile, setProfile] = useState({
    name: '',
    birthDate: '',
    birthTime: '',
    gender: 'male'
  })
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  function handleViewFortune() {
    setIsLoading(true)
    // 실제 엔진 연동 및 LLM 호출 로직은 추후 보강
    // 현재는 구조 확인을 위한 모크 데이터 사용
    setTimeout(() => {
      setReport({
        summary: '오늘은 새로운 시작을 하기에 좋은 날입니다.',
        scores: { work: 85, money: 70, relation: 90, health: 60, mind: 80 },
        categories: {
          work: '직장운이 상승하고 있어요. 중요한 결정을 내리기에 적합합니다.',
          money: '큰 지출을 피하고 내실을 다지는 것이 좋습니다.',
          relation: '주변 사람들과의 소통이 원활해지는 시기입니다.',
          health: '규칙적인 휴식이 필요한 하루입니다.',
          mind: '명상을 통해 마음의 평안을 얻으세요.'
        },
        tips: ['초록색 옷을 입어보세요.', '오전 회의에 집중하세요.']
      })
      setIsLoading(false)
    }, 1500)
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="eyebrow">사주 기반 오늘의 운세</p>
        <h1>나의 일간과 오늘의 흐름을 정교하게 분석한 맞춤 리포트</h1>
        <button type="button" className="soft-button" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
          홈으로 돌아가기
        </button>
      </header>

      <section className="card">
        <div className="card-header">
          <div>
            <p className="section-kicker">사용자 정보</p>
            <h2>나의 사주 프로필</h2>
          </div>
        </div>
        <div className="stack-form">
          <input 
            placeholder="이름" 
            value={profile.name} 
            onChange={e => setProfile({...profile, name: e.target.value})}
          />
          <div className="field-grid">
            <input 
              type="date" 
              value={profile.birthDate}
              onChange={e => setProfile({...profile, birthDate: e.target.value})}
            />
            <input 
              type="time" 
              value={profile.birthTime}
              onChange={e => setProfile({...profile, birthTime: e.target.value})}
            />
          </div>
          <select 
            value={profile.gender}
            onChange={e => setProfile({...profile, gender: e.target.value})}
          >
            <option value="male">남성</option>
            <option value="female">여성</option>
          </select>
          <button onClick={handleViewFortune} disabled={isLoading || !profile.birthDate}>
            {isLoading ? '운세 분석 중...' : '오늘의 운세 보기'}
          </button>
        </div>
      </section>

      {report && (
        <>
          <section className="card primary-home-card">
            <div className="card-header">
              <div>
                <p className="section-kicker">오늘의 요약</p>
                <h2>한 줄 총평</h2>
              </div>
            </div>
            <p className="summary-line" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1f6f5f' }}>
              "{report.summary}"
            </p>
          </section>

          <section className="card">
            <div className="card-header">
              <div>
                <p className="section-kicker">분야별 운세 점수</p>
                <h2>나의 운세 밸런스</h2>
              </div>
            </div>
            <div className="results">
              {Object.entries(report.scores).map(([key, score]) => (
                <div key={key} className="result-row">
                  <div>
                    <strong>{getCategoryLabel(key)}</strong>
                  </div>
                  <div className="result-count">{score}점</div>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="card-header">
              <div>
                <p className="section-kicker">상세 리포트</p>
                <h2>부문별 흐름</h2>
              </div>
            </div>
            <div className="stack-form">
              {Object.entries(report.categories).map(([key, text]) => (
                <div key={key} style={{ marginBottom: '1.5rem', padding: '1rem', background: '#fdfaf5', borderRadius: '14px' }}>
                  <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#115e59' }}>{getCategoryLabel(key)}</strong>
                  <p style={{ margin: 0, lineHeight: 1.6 }}>{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card secondary-card">
            <div className="card-header">
              <div>
                <p className="section-kicker">실천 팁</p>
                <h2>오늘의 행동 가이드</h2>
              </div>
            </div>
            <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
              {report.tips.map((tip, idx) => (
                <li key={idx} style={{ marginBottom: '0.5rem' }}>{tip}</li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}

function getCategoryLabel(key) {
  const labels = { work: '일 / 커리어', money: '금전운', relation: '인간관계', health: '건강', mind: '심리 상태' }
  return labels[key] || key
}
