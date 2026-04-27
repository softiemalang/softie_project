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

const EMPTY_PROFILE = {
  name: '',
  birthDate: '',
  birthTime: '',
  gender: 'male'
}

function formatBirthDateInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 4) return digits
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`
}

function formatBirthTimeInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

function isCompleteBirthDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function isCompleteBirthTime(value) {
  return !value || /^\d{2}:\d{2}$/.test(value)
}

export default function FortunePage() {
  const [profile, setProfile] = useState(EMPTY_PROFILE)
  const [activeProfile, setActiveProfile] = useState(null)
  const [dailySnapshot, setDailySnapshot] = useState(null)
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState('')

  const todayStr = getKstDateString()
  const canSubmitProfile = isCompleteBirthDate(profile.birthDate) && isCompleteBirthTime(profile.birthTime)

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
      const errorMessage = error?.message || ''
      setStatus(
        errorMessage.includes('saju_profiles') || errorMessage.includes('schema cache')
          ? '사주 데이터 저장소가 아직 준비되지 않았어요. Supabase 테이블 적용이 필요해요.'
          : '데이터를 불러오지 못했어요.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function loadDailyFortune(targetProfile) {
    try {
      let snapshot = await getDailySnapshot(targetProfile.id, todayStr)
      if (snapshot && snapshot.computed_data?.engine_version !== '1.1') {
        snapshot = null // Force recalculation for old engine data
      }
      
      if (!snapshot) {
        setStatus('오늘의 기운을 분석 중입니다...')
        let natal = await getNatalSnapshot(targetProfile.id)
        if (natal && natal.natal_data?.engine_version !== '1.1') {
          natal = null // Force recalculation for old engine data
        }

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

  function resetProfileForm() {
    setProfile({ ...EMPTY_PROFILE })
    setActiveProfile(null)
    setDailySnapshot(null)
    setReport(null)
    setStatus('')
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
    <div className="app-shell fortune-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">사주 기반 오늘의 운세</p>
          <h1>나의 일간과 오늘의 흐름을 정교하게 분석한 맞춤 리포트</h1>
        </div>
        <button type="button" className="soft-button" onClick={resetProfileForm}>
          reset
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
              type="text"
              inputMode="numeric"
              autoComplete="bday"
              placeholder="생년월일 YYYY-MM-DD"
              value={profile.birthDate}
              onChange={e => setProfile({...profile, birthDate: formatBirthDateInput(e.target.value)})}
            />
            <input 
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="태어난 시간 24시간제 HH:MM"
              value={profile.birthTime}
              onChange={e => setProfile({...profile, birthTime: formatBirthTimeInput(e.target.value)})}
            />
          </div>
          <div className="fortune-gender-options" role="group" aria-label="성별 선택">
            <button
              type="button"
              className={`fortune-gender-button ${profile.gender === 'male' ? 'active' : ''}`}
              aria-pressed={profile.gender === 'male'}
              onClick={() => setProfile({...profile, gender: 'male'})}
            >
              남성
            </button>
            <button
              type="button"
              className={`fortune-gender-button ${profile.gender === 'female' ? 'active' : ''}`}
              aria-pressed={profile.gender === 'female'}
              onClick={() => setProfile({...profile, gender: 'female'})}
            >
              여성
            </button>
          </div>
          <button onClick={handleSaveProfile} disabled={isLoading || !canSubmitProfile}>
            {isLoading ? '분석 중...' : activeProfile ? '정보 수정 및 다시 분석' : '오늘의 운세 보기'}
          </button>
        </div>
      </section>

      {status && <p className="status" style={{ textAlign: 'center', color: '#8b5e1a' }}>{status}</p>}

      {dailySnapshot && reportData && (
        <div className="fortune-result-container">
          <section className="card primary-home-card">
            <div className="card-header">
              <div>
                <p className="section-kicker">오늘의 총평</p>
              </div>
              {report.is_cached && <span className="scheduler-count-pill">저장된 리포트</span>}
            </div>
            <div className="fortune-summary-content">
              <p className="fortune-summary-text">{reportData.summary}</p>
            </div>
          </section>

          <section className="card">
            <div className="card-header">
              <p className="section-kicker">분야별 운세</p>
            </div>
            <div className="stack-form">
              {Object.entries(reportData.sections).map(([key, text]) => (
                <div key={key} className="fortune-category-item">
                  <strong className="fortune-category-label">
                    {getCategoryLabel(key)}
                  </strong>
                  <p className="fortune-category-text">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card secondary-card">
            <div className="card-header">
              <p className="section-kicker">오늘의 주의점</p>
            </div>
            <ul className="fortune-list">
              {reportData.cautions.map((caution, idx) => (
                <li key={idx}>{caution}</li>
              ))}
            </ul>
          </section>

          <section className="card fortune-action-card">
            <div className="card-header">
              <p className="section-kicker">실천 팁</p>
            </div>
            <p className="fortune-action-tip">
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
