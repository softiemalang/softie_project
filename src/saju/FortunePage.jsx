import { useEffect, useState } from 'react'
import { navigate } from '../lib/router'
import {
  getSajuProfile,
  upsertSajuProfile,
  getNatalSnapshot,
  createNatalSnapshot,
  getDailySnapshot,
  createDailySnapshot
} from './api'
import { generateNatalSnapshot, generateDailySnapshot } from './interpreter/preprocessor'

export default function FortunePage() {
  const [profile, setProfile] = useState({
    name: '',
    birthDate: '',
    birthTime: '',
    gender: 'male'
  })
  const [activeProfile, setActiveProfile] = useState(null)
  const [dailySnapshot, setDailySnapshot] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState('')

  const todayStr = new Date().toISOString().split('T')[0]

  useEffect(() => {
    loadInitialData()
  }, [])

  async function loadInitialData() {
    setIsLoading(true)
    try {
      // MVP 단계에서는 단순화를 위해 첫 번째 프로필을 사용하거나 새로 생성 유도
      // 실제 서비스에서는 userId 기반 조회 필요
      const existingProfile = await getSajuProfile('anonymous-temp-user') // 예시용
      if (existingProfile) {
        setActiveProfile(existingProfile)
        setProfile({
          name: existingProfile.name,
          birthDate: existingProfile.birth_date,
          birthTime: existingProfile.birth_time || '',
          gender: existingProfile.gender
        })
        await loadDailyFortune(existingProfile)
      }
    } catch (error) {
      console.error('Failed to load saju data:', error)
      setStatus('데이터를 불러오지 못했어요.')
    } finally {
      setIsLoading(false)
    }
  }

  async function loadDailyFortune(targetProfile) {
    try {
      // 1. 오늘의 스냅샷이 이미 있는지 확인
      let snapshot = await getDailySnapshot(targetProfile.id, todayStr)
      
      if (!snapshot) {
        setStatus('오늘의 기운을 분석 중입니다...')
        // 2. 없으면 원국 스냅샷 조회
        let natal = await getNatalSnapshot(targetProfile.id)
        if (!natal) {
          // 원국 스냅샷도 없으면 생성
          const newNatal = generateNatalSnapshot(targetProfile)
          natal = await createNatalSnapshot({ ...newNatal, profile_id: targetProfile.id })
        }

        // 3. 일일 스냅샷 생성 및 저장
        const newDaily = generateDailySnapshot(natal, todayStr)
        snapshot = await createDailySnapshot({ ...newDaily, profile_id: targetProfile.id })
      }
      
      setDailySnapshot(snapshot)
      setStatus('')
    } catch (error) {
      console.error('Failed to generate daily fortune:', error)
      setStatus('운세 분석 중 오류가 발생했습니다.')
    }
  }

  async function handleSaveProfile() {
    setIsLoading(true)
    setStatus('프로필을 저장하고 운세를 분석하는 중...')
    try {
      const saved = await upsertSajuProfile({
        user_id: 'anonymous-temp-user', // MVP 임시 ID
        name: profile.name,
        birth_date: profile.birthDate,
        birth_time: profile.birthTime || null,
        gender: profile.gender,
        updated_at: new Date().toISOString()
      })
      setActiveProfile(saved)
      await loadDailyFortune(saved)
    } catch (error) {
      setStatus('프로필 저장에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
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
          <button onClick={handleSaveProfile} disabled={isLoading || !profile.birthDate}>
            {isLoading ? '분석 중...' : activeProfile ? '정보 수정 및 다시 분석' : '오늘의 운세 보기'}
          </button>
        </div>
      </section>

      {status && <p className="status" style={{ textAlign: 'center', color: '#8b5e1a' }}>{status}</p>}

      {dailySnapshot && (
        <div style={{ marginTop: '2rem' }}>
          <section className="card primary-home-card">
            <div className="card-header">
              <div>
                <p className="section-kicker">오늘의 기운 (Deterministic)</p>
                <h2>{dailySnapshot.daily_stem}{dailySnapshot.daily_branch} 일진</h2>
              </div>
            </div>
            <div style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
              <p>오늘은 <strong>{dailySnapshot.computed_data.summary_hint}</strong>입니다.</p>
              <p className="subtle">이 데이터는 엔진에 의해 계산된 결과이며, 곧 인공지능의 심층 해석이 추가될 예정입니다.</p>
            </div>
          </section>

          <section className="card">
            <div className="card-header">
              <div>
                <p className="section-kicker">에너지 밸런스</p>
                <h2>분야별 기초 점수</h2>
              </div>
            </div>
            <div className="results">
              {Object.entries(dailySnapshot.computed_data.baseScores).map(([key, score]) => (
                <div key={key} className="result-row">
                  <div>
                    <strong>{getCategoryLabel(key)}</strong>
                  </div>
                  <div className="result-count">{score}점</div>
                </div>
              ))}
            </div>
          </section>

          <section className="card secondary-card">
            <div className="card-header">
              <div>
                <p className="section-kicker">오늘의 신호</p>
                <h2>주요 체크포인트</h2>
              </div>
            </div>
            <div className="member-list" style={{ marginTop: '1rem' }}>
              {dailySnapshot.computed_data.signals.map((signal, idx) => (
                <div key={idx} className="member-pill">
                  {signal.tenGod} ({signal.element})
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

function getCategoryLabel(key) {
  const labels = { work: '일 / 커리어', money: '금전운', relation: '인간관계', health: '건강', mind: '심리 상태' }
  return labels[key] || key
}
