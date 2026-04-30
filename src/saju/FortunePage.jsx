import { useEffect, useState } from 'react'
import { navigate } from '../lib/router'
import {
  getSajuProfile,
  upsertSajuProfile,
  getNatalSnapshot,
  createNatalSnapshot,
  getDailySnapshot,
  createDailySnapshot,
  getFortuneHistory,
  getFortuneReportById
} from './api'
import { generateNatalSnapshot, generateDailySnapshot } from './interpreter/preprocessor'
import { getOrGenerateReport } from './interpreter/reportGenerator'
import { getKstDateString, getOrCreateLocalKey } from './utils'
import { getOrCreatePushDeviceId } from '../lib/device'
import { appendGoogleSheetsLog } from '../lib/googleApi'
import { connectGoogleCalendar, isGoogleConnected } from '../scheduler/googleApi'
import { getCurrentSession } from '../lib/auth'

const EMPTY_PROFILE = {
  name: '',
  birthDate: '',
  birthTime: '',
  gender: 'male'
}

function profileFromSaved(savedProfile) {
  if (!savedProfile) return { ...EMPTY_PROFILE }
  return {
    name: savedProfile.name || '',
    birthDate: savedProfile.birth_date || '',
    birthTime: formatBirthTimeForDisplay(savedProfile.birth_time),
    gender: savedProfile.gender || 'male'
  }
}

function getGenderLabel(gender) {
  return gender === 'female' ? '여성' : '남성'
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

function formatBirthTimeForDisplay(value) {
  if (!value) return ''
  const [hour = '', minute = ''] = String(value).split(':')
  if (!hour || !minute) return ''
  return `${hour.padStart(2, '0').slice(-2)}:${minute.padStart(2, '0').slice(0, 2)}`
}

function isCompleteBirthDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function isCompleteBirthTime(value) {
  return !value || /^\d{2}:\d{2}$/.test(value)
}

function formatReportDateForDisplay(value) {
  if (!value) return ''
  return String(value).replace(/-/g, '.')
}

export default function FortunePage() {
  const [profile, setProfile] = useState(EMPTY_PROFILE)
  const [profileDraft, setProfileDraft] = useState(EMPTY_PROFILE)
  const [activeProfile, setActiveProfile] = useState(null)
  const [dailySnapshot, setDailySnapshot] = useState(null)
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isBackedUp, setIsBackedUp] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [historyList, setHistoryList] = useState([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [selectedHistoryReport, setSelectedHistoryReport] = useState(null)
  const [isHistoryDetailLoading, setIsHistoryDetailLoading] = useState(false)
  const [isGoogleReady, setIsGoogleReady] = useState(false)

  const canSubmitProfile = isCompleteBirthDate(profile.birthDate) && isCompleteBirthTime(profile.birthTime)
  const canSubmitProfileDraft = isCompleteBirthDate(profileDraft.birthDate) && isCompleteBirthTime(profileDraft.birthTime)

  useEffect(() => {
    loadInitialData()
    setIsGoogleReady(isGoogleConnected())
  }, [])

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible' && activeProfile && dailySnapshot) {
        const currentToday = getKstDateString()
        if (dailySnapshot.target_date && dailySnapshot.target_date !== currentToday) {
          setDailySnapshot(null)
          setReport(null)
          setIsBackedUp(false)
          loadDailyFortune(activeProfile)
        }
      }
    }

    const intervalId = setInterval(() => {
      if (activeProfile && dailySnapshot) {
        const currentToday = getKstDateString()
        if (dailySnapshot.target_date && dailySnapshot.target_date !== currentToday) {
          setDailySnapshot(null)
          setReport(null)
          setIsBackedUp(false)
          loadDailyFortune(activeProfile)
        }
      }
    }, 60000) // Check every minute

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleVisibility)
    
    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleVisibility)
    }
  }, [activeProfile, dailySnapshot])

  async function loadInitialData() {
    setIsLoading(true)
    try {
      const localKey = getOrCreateLocalKey()
      const session = await getCurrentSession()
      const userId = session?.user?.id

      if (userId && localKey) {
        const { linkLocalSajuProfileToUser } = await import('./api')
        await linkLocalSajuProfileToUser({ localKey, userId })
      }

      const existingProfile = await getSajuProfile({ userId, localKey })
      if (existingProfile) {
        const existingFormProfile = profileFromSaved(existingProfile)
        setActiveProfile(existingProfile)
        setProfile(existingFormProfile)
        setProfileDraft(existingFormProfile)
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
    const currentTodayStr = getKstDateString()
    try {
      let snapshot = await getDailySnapshot(targetProfile.id, currentTodayStr)
      
      const computed = snapshot?.computed_data;
      const isValidSnapshot = computed?.engine_version === '1.2' && 
                              computed?.love && 
                              computed?.interpretationProfile?.fieldNarratives?.love;

      if (snapshot && !isValidSnapshot) {
        snapshot = null // Force recalculation for old engine data
      }
      
      if (!snapshot) {
        setStatus('오늘의 기운을 분석 중입니다...')
        let natal = await getNatalSnapshot(targetProfile.id)
        if (natal && natal.natal_data?.engine_version !== '1.2') {
          natal = null // Force recalculation for old engine data
        }

        if (!natal) {
          const newNatal = generateNatalSnapshot(targetProfile)
          natal = await createNatalSnapshot({ ...newNatal, profile_id: targetProfile.id })
        }

        const newDaily = generateDailySnapshot(natal, currentTodayStr)
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
    setProfileDraft({ ...EMPTY_PROFILE })
    setActiveProfile(null)
    setDailySnapshot(null)
    setReport(null)
    setStatus('')
    setIsBackedUp(false)
    setIsProfileModalOpen(false)
  }

  async function handleSaveProfile(nextProfile = profile, shouldCloseProfileModal = false) {
    setIsLoading(true)
    setReport(null)
    setDailySnapshot(null)
    setIsBackedUp(false)
    setStatus('프로필을 저장하고 운세를 분석하는 중...')
    try {
      const localKey = getOrCreateLocalKey()
      const session = await getCurrentSession()
      const userId = session?.user?.id

      const saved = await upsertSajuProfile({
        name: nextProfile.name,
        birth_date: nextProfile.birthDate,
        birth_time: nextProfile.birthTime || null,
        gender: nextProfile.gender,
        updated_at: new Date().toISOString()
      }, { userId, localKey })
      const savedFormProfile = profileFromSaved(saved)
      setActiveProfile(saved)
      setProfile(savedFormProfile)
      setProfileDraft(savedFormProfile)
      await loadDailyFortune(saved)
      if (shouldCloseProfileModal) {
        setIsProfileModalOpen(false)
      }
    } catch (error) {
      console.error('Save profile failed details:', error)
      const errorMsg = error?.message || (typeof error === 'string' ? error : '알 수 없는 오류')
      setStatus(`프로필 저장에 실패했습니다: ${errorMsg}`)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleBackupToSheets() {
    if (!activeProfile || !dailySnapshot || !reportData || !report) return
    setIsBackingUp(true)
    try {
      const session = await getCurrentSession()
      const deviceId = getOrCreatePushDeviceId()
      const targetId = session?.user?.id || deviceId

      const rowData = [
        new Date().toISOString(),
        dailySnapshot.target_date || '',
        activeProfile.name || '',
        activeProfile.gender || '',
        activeProfile.birth_date || '',
        formatBirthTimeForDisplay(activeProfile.birth_time),
        reportData.summary || '',
        reportData.sections?.love || '',
        reportData.sections?.mind || '',
        reportData.sections?.work || '',
        reportData.sections?.money || '',
        reportData.sections?.health || '',
        reportData.sections?.relationships || '',
        Array.isArray(reportData.cautions) ? reportData.cautions.join(' / ') : '',
        reportData.action_tip || '',
        report.id || '',
        'gemini-engine-v1.2'
      ]

      await appendGoogleSheetsLog(targetId, 'fortune_report_logs', rowData, { spreadsheetType: 'saju' })
      setIsBackedUp(true)
      setStatus('오늘의 운세를 Google 시트에 기록했어요.')
    } catch (error) {
      console.error('Backup to sheets failed:', error)
      if (error.message?.includes('connected') || error.message?.includes('token')) {
        setStatus('Google 연동 후 다시 시도해 주세요.')
      } else {
        setStatus('Google 시트 기록에 실패했습니다.')
      }
    } finally {
      setIsBackingUp(false)
    }
  }

  async function handleOpenHistory() {
    if (!activeProfile) return
    setIsProfileModalOpen(false)
    setSelectedHistoryReport(null)
    setIsHistoryModalOpen(true)
    setIsHistoryLoading(true)
    try {
      const data = await getFortuneHistory(activeProfile.id, 30)
      setHistoryList(data)
    } catch (error) {
      console.error('Failed to load history:', error)
    } finally {
      setIsHistoryLoading(false)
    }
  }

  async function handleOpenHistoryDetail(reportId) {
    if (!reportId) return
    setIsHistoryDetailLoading(true)
    try {
      const data = await getFortuneReportById(reportId)
      setSelectedHistoryReport(data)
    } catch (error) {
      console.error('Failed to load history report detail:', error)
    } finally {
      setIsHistoryDetailLoading(false)
    }
  }

  function handleBackToHistoryList() {
    setSelectedHistoryReport(null)
  }

  function handleCloseHistoryModal() {
    setSelectedHistoryReport(null)
    setIsHistoryModalOpen(false)
  }

  function handleOpenProfileModal() {
    setProfileDraft(profileFromSaved(activeProfile) || profile)
    setIsHistoryModalOpen(false)
    setIsProfileModalOpen(true)
  }

  function handleCloseProfileModal() {
    setProfileDraft(profileFromSaved(activeProfile) || profile)
    setIsProfileModalOpen(false)
  }

  function handleSaveProfileDraft() {
    if (!canSubmitProfileDraft || isLoading) return
    handleSaveProfile(profileDraft, true)
  }

  async function handleConnectGoogle() {
    const session = await getCurrentSession()
    const deviceId = getOrCreatePushDeviceId()
    const targetId = session?.user?.id || deviceId
    connectGoogleCalendar(targetId, { returnPath: '/fortune' })
  }

  const reportData = report?.report_content
  const historyReportData = selectedHistoryReport?.report_content || {}
  const historySections = historyReportData.sections || {}
  const historyCautions = Array.isArray(historyReportData.cautions) ? historyReportData.cautions : []
  const profileSummary = activeProfile
    ? [
        activeProfile.name,
        activeProfile.birth_date,
        formatBirthTimeForDisplay(activeProfile.birth_time) || '시간 미입력',
        getGenderLabel(activeProfile.gender)
      ].filter(Boolean).join(' · ')
    : ''

  return (
    <div className="app-shell fortune-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">사주 기반 오늘의 운세</p>
          <h1>나의 일간과 오늘의 흐름을 정교하게 분석한 맞춤 리포트</h1>
        </div>
        <div className="fortune-header-actions">
          {activeProfile && (
            <>
              <button type="button" className="soft-button" onClick={handleOpenHistory}>
                히스토리
              </button>
              <button type="button" className="soft-button" onClick={handleOpenProfileModal}>
                정보 수정
              </button>
            </>
          )}
        </div>
      </header>

      {activeProfile ? (
        <section className="card fortune-profile-summary-card">
          <div className="fortune-profile-summary-content">
            <p className="section-kicker">사용자 정보</p>
            <p className="fortune-profile-summary">{profileSummary}</p>
          </div>
        </section>
      ) : (
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
              data-text="남성"
            >
              남성
            </button>
            <button
              type="button"
              className={`fortune-gender-button ${profile.gender === 'female' ? 'active' : ''}`}
              aria-pressed={profile.gender === 'female'}
              onClick={() => setProfile({...profile, gender: 'female'})}
              data-text="여성"
            >
              여성
            </button>
          </div>
          <button onClick={() => handleSaveProfile()} disabled={isLoading || !canSubmitProfile}>
            {isLoading ? '분석 중...' : activeProfile ? '정보 수정 및 다시 분석' : '오늘의 운세 보기'}
          </button>
        </div>
      </section>
      )}

      {status && <p className="status" style={{ textAlign: 'center', color: '#8b5e1a' }}>{status}</p>}

      {dailySnapshot && reportData && (
        <div className="fortune-result-container">
          <section className="card primary-home-card">
            <div className="card-header">
              <div>
                <p className="section-kicker">오늘의 총평</p>
              </div>
            </div>
            <div className="fortune-summary-content">
              {reportData.headline && (
                <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', lineHeight: 1.35, color: '#3f3426' }}>
                  {reportData.headline}
                </h2>
              )}
              <p className="fortune-summary-text">{reportData.summary}</p>
              {reportData.basis && (
                <p className="subtle" style={{ margin: '0.65rem 0 0', fontSize: '0.88rem', lineHeight: 1.55, color: '#7a6c5a' }}>
                  {reportData.basis}
                </p>
              )}
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

          <section className="fortune-backup-action">
            {isGoogleReady ? (
              <button
                type="button"
                className="soft-button"
                onClick={handleBackupToSheets}
                disabled={isBackingUp || isBackedUp}
              >
                {isBackingUp ? '기록 중...' : isBackedUp ? '기록 완료' : 'Google 시트에 기록하기'}
              </button>
            ) : (
              <button
                type="button"
                className="soft-button"
                onClick={handleConnectGoogle}
              >
                Google 연동하기
              </button>
            )}
            {dailySnapshot?.target_date && (
              <p className="fortune-backup-date-label">
                {formatReportDateForDisplay(dailySnapshot.target_date)} 운세 리포트
              </p>
            )}
          </section>
        </div>
      )}

      {isHistoryModalOpen && (
        <div className="scheduler-sheet-backdrop scheduler-modal-backdrop" onClick={handleCloseHistoryModal}>
          <div className="scheduler-modal" onClick={e => e.stopPropagation()}>
            {selectedHistoryReport ? (
              <div className="fortune-history-detail">
                <div className="fortune-modal-head">
                  <div>
                    <p className="section-kicker">과거 리포트</p>
                    <p className="fortune-history-detail-date">{selectedHistoryReport.report_date}</p>
                  </div>
                  <div className="fortune-modal-actions">
                    <button type="button" className="scheduler-modal-close" onClick={handleBackToHistoryList}>목록으로</button>
                    <button type="button" className="scheduler-modal-close" onClick={handleCloseHistoryModal}>닫기</button>
                  </div>
                </div>

                <div className="fortune-history-detail-scroll">
                  <section className="fortune-history-detail-card">
                    <p className="section-kicker">오늘의 총평</p>
                    {historyReportData.headline && (
                      <h3 style={{ margin: '0 0 0.45rem', fontSize: '1.05rem', lineHeight: 1.35, color: '#3f3426' }}>
                        {historyReportData.headline}
                      </h3>
                    )}
                    <p className="fortune-summary-text">{historyReportData.summary || selectedHistoryReport.summary || '저장된 총평이 없습니다.'}</p>
                    {historyReportData.basis && (
                      <p className="subtle" style={{ margin: '0.65rem 0 0', fontSize: '0.86rem', lineHeight: 1.55, color: '#7a6c5a' }}>
                        {historyReportData.basis}
                      </p>
                    )}
                  </section>

                  <section className="fortune-history-detail-card">
                    <p className="section-kicker">분야별 운세</p>
                    <div className="stack-form">
                      {Object.entries(historySections).length > 0 ? (
                        Object.entries(historySections).map(([key, text]) => (
                          <div key={key} className="fortune-category-item">
                            <strong className="fortune-category-label">
                              {getCategoryLabel(key)}
                            </strong>
                            <p className="fortune-category-text">{text}</p>
                          </div>
                        ))
                      ) : (
                        <p className="status" style={{ textAlign: 'center' }}>저장된 분야별 운세가 없습니다.</p>
                      )}
                    </div>
                  </section>

                  <section className="fortune-history-detail-card">
                    <p className="section-kicker">오늘의 주의점</p>
                    {historyCautions.length > 0 ? (
                      <ul className="fortune-list">
                        {historyCautions.map((caution, idx) => (
                          <li key={idx}>{caution}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="status" style={{ textAlign: 'center' }}>저장된 주의점이 없습니다.</p>
                    )}
                  </section>

                  <section className="fortune-history-detail-card fortune-action-card">
                    <p className="section-kicker">실천 팁</p>
                    <p className="fortune-action-tip">
                      {historyReportData.action_tip || '저장된 실천 팁이 없습니다.'}
                    </p>
                  </section>
                </div>
              </div>
            ) : (
              <>
                <div className="fortune-modal-head">
                  <p className="section-kicker">운세 히스토리</p>
                  <button type="button" className="scheduler-modal-close" onClick={handleCloseHistoryModal}>닫기</button>
                </div>

                <div className="fortune-history-list">
                  {isHistoryLoading || isHistoryDetailLoading ? (
                <p className="status" style={{ textAlign: 'center' }}>과거 기록을 불러오는 중입니다...</p>
              ) : historyList.length === 0 ? (
                <p className="status" style={{ textAlign: 'center' }}>저장된 운세 리포트가 없습니다.</p>
              ) : (
                <div className="stack-form">
                  {historyList.map(item => (
                    <button key={item.id} type="button" className="fortune-history-item card" onClick={() => handleOpenHistoryDetail(item.id)}>
                      <div className="fortune-history-item-header">
                        <span className="scheduler-count-pill">
                          {item.report_date}
                        </span>
                        <strong className="fortune-history-item-title">
                          {item.headline}
                        </strong>
                      </div>
                      <p className="subtle" style={{ margin: 0, fontSize: '0.86rem', color: '#6b6258' }}>
                        {item.summary}
                      </p>
                    </button>
                  ))}
                </div>
              )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {isProfileModalOpen && (
        <div className="scheduler-sheet-backdrop scheduler-modal-backdrop fortune-profile-backdrop" onClick={handleCloseProfileModal}>
          <div className="scheduler-modal fortune-profile-modal" onClick={e => e.stopPropagation()}>
            <div className="fortune-modal-head">
              <p className="section-kicker">사용자 정보 수정</p>
              <div className="fortune-modal-actions">
                <button type="button" className="scheduler-modal-close" onClick={resetProfileForm}>초기화</button>
                <button type="button" className="scheduler-modal-close" onClick={handleCloseProfileModal}>닫기</button>
              </div>
            </div>

            <div className="stack-form">
              <input
                placeholder="이름"
                value={profileDraft.name}
                onChange={e => setProfileDraft({...profileDraft, name: e.target.value})}
              />
              <div className="field-grid">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="bday"
                  placeholder="생년월일 YYYY-MM-DD"
                  value={profileDraft.birthDate}
                  onChange={e => setProfileDraft({...profileDraft, birthDate: formatBirthDateInput(e.target.value)})}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="태어난 시간 24시간제 HH:MM"
                  value={profileDraft.birthTime}
                  onChange={e => setProfileDraft({...profileDraft, birthTime: formatBirthTimeInput(e.target.value)})}
                />
              </div>
              <div className="fortune-gender-options" role="group" aria-label="성별 선택">
                <button
                  type="button"
                  className={`fortune-gender-button ${profileDraft.gender === 'male' ? 'active' : ''}`}
                  aria-pressed={profileDraft.gender === 'male'}
                  onClick={() => setProfileDraft({...profileDraft, gender: 'male'})}
                  data-text="남성"
                >
                  남성
                </button>
                <button
                  type="button"
                  className={`fortune-gender-button ${profileDraft.gender === 'female' ? 'active' : ''}`}
                  aria-pressed={profileDraft.gender === 'female'}
                  onClick={() => setProfileDraft({...profileDraft, gender: 'female'})}
                  data-text="여성"
                >
                  여성
                </button>
              </div>
              <button type="button" onClick={handleSaveProfileDraft} disabled={isLoading || !canSubmitProfileDraft}>
                {isLoading ? '분석 중...' : '저장하고 다시 분석'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getCategoryLabel(key) {
  const labels = { work: '일 / 커리어', money: '금전운', relationships: '인간관계', love: '연애 / 애정운', health: '건강', mind: '심리 상태' }
  return labels[key] || key
}
