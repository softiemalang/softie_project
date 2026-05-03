import { useEffect, useState } from 'react'
import { navigate } from '../lib/router'
import {
  getSajuProfile,
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

function formatBirthTimeForDisplay(value) {
  if (!value) return ''
  const [hour = '', minute = ''] = String(value).split(':')
  if (!hour || !minute) return ''
  return `${hour.padStart(2, '0').slice(-2)}:${minute.padStart(2, '0').slice(0, 2)}`
}

function formatReportDateForDisplay(value) {
  if (!value) return ''
  return String(value).replace(/-/g, '.')
}

export default function SoftieFortunePage() {
  const [profile, setProfile] = useState(EMPTY_PROFILE)
  const [profileDraft, setProfileDraft] = useState(EMPTY_PROFILE)
  const [activeProfile, setActiveProfile] = useState(null)
  const [dailySnapshot, setDailySnapshot] = useState(null)
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isBackedUp, setIsBackedUp] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [historyList, setHistoryList] = useState([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [selectedHistoryReport, setSelectedHistoryReport] = useState(null)
  const [isHistoryDetailLoading, setIsHistoryDetailLoading] = useState(false)
  const [isGoogleReady, setIsGoogleReady] = useState(false)
  const [isForceRefreshing, setIsForceRefreshing] = useState(false)

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
    }, 60000)

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

  async function loadDailyFortune(targetProfile, options = {}) {
    const currentTodayStr = getKstDateString()
    const force = options.force === true
    try {
      let snapshot = null

      if (!force) {
        snapshot = await getDailySnapshot(targetProfile.id, currentTodayStr)

        const computed = snapshot?.computed_data
        const isValidSnapshot = computed?.engine_version === '2.2' &&
          computed?.love &&
          computed?.periodContext?.year &&
          computed?.periodContext?.month &&
          computed?.periodContext?.day &&
          computed?.dayType?.type &&
          computed?.dailyBalance?.orientation &&
          Array.isArray(computed?.sectionPriority?.primary) &&
          computed?.longerCycleContext?.todayPosition &&
          computed?.debugSummary?.engineVersion === '2.2' &&
          computed?.interpretationTrace?.primaryNarrative &&
          (
            Boolean(computed?.interpretationProfile?.dailyBalanceHint) ||
            Boolean(computed?.interpretationProfile?.dailyBalanceActionHint)
          ) &&
          (
            Boolean(computed?.interpretationProfile?.natalProfileSummary) ||
            (Array.isArray(computed?.interpretationProfile?.personalContextHints) &&
              computed.interpretationProfile.personalContextHints.length > 0)
          ) &&
          (
            (Array.isArray(computed?.interpretationProfile?.longerCycleHints) &&
              computed.interpretationProfile.longerCycleHints.length > 0) ||
            Boolean(computed?.interpretationProfile?.todayFlowPositionHint)
          ) &&
          (
            (Array.isArray(computed?.interpretationProfile?.supportiveElementHints) &&
              computed.interpretationProfile.supportiveElementHints.length > 0) ||
            (Array.isArray(computed?.interpretationProfile?.balancingContextHints) &&
              computed.interpretationProfile.balancingContextHints.length > 0)
          ) &&
          computed?.interpretationProfile?.fieldNarratives?.love &&
          (
            Boolean(String(computed?.interpretationProfile?.basisHint || '').trim()) ||
            Object.keys(computed?.interpretationProfile?.fieldReasonHints || {}).length > 0
          )

        if (snapshot && !isValidSnapshot) {
          snapshot = null
        }
      }

      if (!snapshot) {
        setStatus(force ? '오늘의 기운을 다시 작성하는 중입니다...' : '오늘의 기운을 분석 중입니다...')
        let natal = await getNatalSnapshot(targetProfile.id)
        if (natal && natal.natal_data?.engine_version !== '2.2') {
          natal = null
        }

        if (!natal) {
          const newNatal = generateNatalSnapshot(targetProfile)
          natal = await createNatalSnapshot({ ...newNatal, profile_id: targetProfile.id })
        }

        const newDaily = generateDailySnapshot(natal, currentTodayStr)
        snapshot = await createDailySnapshot({ ...newDaily, profile_id: targetProfile.id })
      }

      setDailySnapshot(snapshot)

      setStatus('심층 운세 리포트를 작성하는 중입니다...')
      const finalReport = await getOrGenerateReport(targetProfile.id, snapshot, { force })
      setReport(finalReport)
      setStatus('')
    } catch (error) {
      console.error('Failed to generate daily fortune:', error)
      setStatus('운세 분석 중 오류가 발생했습니다.')
    }
  }

  async function handleRefreshTodayReport() {
    if (!activeProfile || isLoading) return
    const confirmed = window.confirm('오늘 리포트를 최신 기준으로 다시 작성할까요?')
    if (!confirmed) return

    setIsForceRefreshing(true)
    setReport(null)
    setDailySnapshot(null)
    setIsBackedUp(false)
    setStatus('오늘 리포트를 다시 준비하는 중입니다...')

    try {
      await loadDailyFortune(activeProfile, { force: true })
    } finally {
      setIsForceRefreshing(false)
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
        report?.report_version || dailySnapshot?.computed_data?.engine_version || 'fortune-report-v1.3'
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

  async function handleConnectGoogle() {
    const session = await getCurrentSession()
    const deviceId = getOrCreatePushDeviceId()
    const targetId = session?.user?.id || deviceId
    connectGoogleCalendar(targetId, { returnPath: '/softie-fortune' })
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
          <p className="eyebrow">Softie 전용 운세</p>
          <h1>저장된 사주 프로필로 오늘의 흐름을 조용하고 깊게 살펴보는 전용 리포트</h1>
        </div>
        <div className="fortune-header-actions">
          {activeProfile && (
            <>
              <button type="button" className="soft-button" onClick={handleOpenHistory}>
                히스토리
              </button>
              <button
                type="button"
                className="soft-button"
                onClick={handleRefreshTodayReport}
                disabled={isLoading || isForceRefreshing}
              >
                {isForceRefreshing ? '다시 작성 중...' : '오늘 리포트 다시 작성'}
              </button>
            </>
          )}
        </div>
      </header>

      {activeProfile ? (
        <section className="card fortune-profile-summary-card">
          <div className="fortune-profile-summary-content">
            <p className="section-kicker">저장된 프로필</p>
            <p className="fortune-profile-summary">{profileSummary}</p>
          </div>
        </section>
      ) : (
        <section className="card">
          <div className="card-header">
            <div>
              <p className="section-kicker">안내</p>
              <h2>아직 저장된 사주 프로필이 없어요.</h2>
            </div>
          </div>
          <div className="stack-form">
            <p className="subtle" style={{ margin: 0 }}>
              먼저 기본 운세 페이지에서 프로필을 한 번 저장하면, 이 전용 페이지에서 자동으로 불러올게요.
            </p>
            <button type="button" className="soft-button" onClick={() => navigate('/fortune')}>
              기본 운세 페이지로 이동
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
    </div>
  )
}

function getCategoryLabel(key) {
  const labels = { work: '일 / 커리어', money: '금전운', relationships: '인간관계', love: '연애 / 애정운', health: '건강', mind: '심리 상태' }
  return labels[key] || key
}
