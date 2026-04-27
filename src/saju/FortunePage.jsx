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
import { getOrGenerateReport } from './interpreter/reportGenerator'
import { getKstDateString, getOrCreateLocalKey } from './utils'

export default function FortunePage() {
  const [profile, setProfile] = useState({
    name: '',
    birthDate: '',
    birthTime: '',
    gender: 'male'
  })
  const [activeProfile, setActiveProfile] = useState(null)
  const [dailySnapshot, setDailySnapshot] = useState(null)
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState('')

  const todayStr = getKstDateString()

  useEffect(() => {
    loadInitialData()
  }, [])

  async function loadInitialData() {
    setIsLoading(true)
    try {
      const localKey = getOrCreateLocalKey()
      const existingProfile = await getSajuProfile(localKey)
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
      let snapshot = await getDailySnapshot(targetProfile.id, todayStr)
      
      if (!snapshot) {
        setStatus('오늘의 기운을 분석 중입니다...')
        let natal = await getNatalSnapshot(targetProfile.id)
        if (!natal) {
          const newNatal = generateNatalSnapshot(targetProfile)
          natal = await createNatalSnapshot({ ...newNatal, profile_id: targetProfile.id })
        }

        const newDaily = generateDailySnapshot(natal, todayStr)
        snapshot = await createDailySnapshot({ ...newDaily, profile_id: targetProfile.id })
      }
      
      setDailySnapshot(snapshot)
      
      // 최종 리포트 (LLM 해석) 가져오기 또는 생성
      setStatus('심층 운세 리포트를 작성하는 중입니다...')
      const finalReport = await getOrGenerateReport(targetProfile.id, snapshot)
      setReport(finalReport)
      setStatus('')
    } catch (error) {
      console.error('Failed to generate daily fortune:', error)
      setStatus('운세 분석 중 오류가 발생했습니다.')
    }
  }

  async function handleSaveProfile() {
    setIsLoading(true)
    setReport(null)
    setDailySnapshot(null)
    setStatus('프로필을 저장하고 운세를 분석하는 중...')
    try {
      const localKey = getOrCreateLocalKey()
      const saved = await upsertSajuProfile({
        local_key: localKey,
        name: profile.name,
        birth_date: profile.birthDate,
        birth_time: profile.birthTime || null,
        gender: profile.gender,
        updated_at: new Date().toISOString()
      })
      setActiveProfile(saved)
      await loadDailyFortune(saved)
    } catch (error) {
      console.error('Save profile failed details:', error)
      const errorMsg = error?.message || (typeof error === 'string' ? error : '알 수 없는 오류')
      setStatus(`프로필 저장에 실패했습니다: ${errorMsg}`)
    } finally {
      setIsLoading(false)
    }
  }

  const reportData = report?.report_content

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

      {dailySnapshot && reportData && (
        <div style={{ marginTop: '2rem' }}>
          <section className="card primary-home-card">
            <div className="card-header">
              <div>
                <p className="section-kicker">오늘의 총평</p>
                <h2>{reportData.headline}</h2>
              </div>
              {report.is_cached && <span className="scheduler-count-pill" style={{ fontSize: '0.65rem' }}>저장된 리포트</span>}
            </div>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#1f6f5f', fontWeight: '500' }}>
              {reportData.summary}
            </p>
          </section>

          <section className="card">
            <div className="card-header">
              <div>
                <p className="section-kicker">분야별 운세</p>
                <h2>부문별 흐름</h2>
              </div>
            </div>
            <div className="stack-form">
              {Object.entries(reportData.sections).map(([key, text]) => (
                <div key={key} style={{ marginBottom: '1.2rem', padding: '1rem', background: '#fdfaf5', borderRadius: '14px', border: '1px solid #efe6d8' }}>
                  <strong style={{ display: 'block', marginBottom: '0.4rem', color: '#115e59', fontSize: '0.9rem' }}>
                    {getCategoryLabel(key)}
                  </strong>
                  <p style={{ margin: 0, lineHeight: 1.6, fontSize: '0.94rem' }}>{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card secondary-card">
            <div className="card-header">
              <div>
                <p className="section-kicker">오늘의 주의점</p>
                <h2>체크포인트</h2>
              </div>
            </div>
            <ul style={{ paddingLeft: '1.2rem', margin: 0, lineHeight: 1.6 }}>
              {reportData.cautions.map((caution, idx) => (
                <li key={idx} style={{ marginBottom: '0.4rem' }}>{caution}</li>
              ))}
            </ul>
          </section>

          <section className="card" style={{ background: '#f0f9f6', borderColor: '#cde8e2' }}>
            <div className="card-header">
              <div>
                <p className="section-kicker">실천 팁</p>
                <h2>오늘의 행동 가이드</h2>
              </div>
            </div>
            <p style={{ margin: 0, fontWeight: '600', color: '#1f6f5f' }}>
              🍀 {reportData.action_tip}
            </p>
          </section>
        </div>
      )}
    </div>
  )
}

function getCategoryLabel(key) {
  const labels = { work: '일 / 커리어', money: '금전운', relationships: '인간관계', health: '건강', mind: '심리 상태' }
  return labels[key] || key
}
