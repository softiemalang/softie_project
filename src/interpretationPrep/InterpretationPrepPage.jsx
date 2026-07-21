import { useEffect, useMemo, useState } from 'react'
import { navigate } from '../lib/router'
import {
  buildExportPayload,
  exportPayloadToMarkdown,
  prepareInterpretationData,
} from './prepare.js'
import {
  DEFAULT_INPUT,
  DEFAULT_PROFILES,
  getKoreaReferenceCity,
  INTERPRETATION_PREP_SCHEMA_VERSION,
  KOREA_REFERENCE_CITIES,
  STATUS_META,
  SYSTEMS,
  TOPICS,
} from './schema.js'
import './interpretationPrep.css'

const STORAGE_KEY = 'softie.interpretationPrep.draft.v1'

function todayInKorea() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  return ['year', 'month', 'day']
    .map((type) => parts.find((part) => part.type === type)?.value)
    .join('-')
}

function loadSavedDraft() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')
    if (!saved) return null
    const { source: _legacySource, ...savedInput } = saved.input || {}
    const referenceCity = getKoreaReferenceCity(savedInput.referenceCity)
    return {
      input: {
        ...DEFAULT_INPUT,
        ...savedInput,
        targetDate: savedInput.targetDate || todayInKorea(),
        placeName: DEFAULT_INPUT.placeName,
        gender: ['female', 'male'].includes(savedInput.gender) ? savedInput.gender : DEFAULT_INPUT.gender,
        referenceCity: referenceCity.id,
        latitude: String(referenceCity.latitude),
        longitude: String(referenceCity.longitude),
      },
      profiles: {
        // Calculation rules are engine-owned; keep saved input without reviving stale rule versions.
        saju: { ...saved.profiles?.saju, ...DEFAULT_PROFILES.saju },
        ziwei: { ...DEFAULT_PROFILES.ziwei, ...saved.profiles?.ziwei },
        astrology: { ...DEFAULT_PROFILES.astrology, ...saved.profiles?.astrology },
      },
    }
  } catch (error) {
    console.warn('[InterpretationPrep] Failed to load local draft.', error)
    return null
  }
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.unsupported
  return <span className={`prep-status-badge is-${meta.tone}`}>{meta.label}</span>
}

function LabeledField({ label, hint, className = '', children }) {
  return (
    <label className={`prep-field ${className}`.trim()}>
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  )
}

function ProfileRows({ profile }) {
  return (
    <dl className="prep-profile-list">
      {Object.entries(profile).map(([key, value]) => (
        <div key={key}>
          <dt>{key}</dt>
          <dd>{String(value)}</dd>
        </div>
      ))}
    </dl>
  )
}

function PillarGrid({ pillars }) {
  return (
    <div className="prep-pillar-grid" aria-label="사주 원국 네 기둥">
      {Object.values(pillars).map((pillar) => (
        <div className={`prep-pillar is-${pillar.status || 'calculated'}`} key={pillar.label}>
          <span>{pillar.label}</span>
          <strong>{pillar.value || '미상'}</strong>
          <small>
            {pillar.status === 'unknown'
              ? '계산 제외'
              : pillar.status === 'time_sensitive'
                ? '출생시각에 따라 달라짐'
                : pillar.status === 'solar_term_sensitive'
                  ? '절기 경계 후보 · 확정 전'
                  : pillar.status === 'historical_time_sensitive'
                    ? '서머타임 환산 후보 · 검증 필요'
                    : pillar.status === 'domestic_location_sensitive'
                      ? '국내 지역 보정 후보 · 검증 필요'
                      : `${pillar.stemElement} · ${pillar.branchElement}`}
          </small>
        </div>
      ))}
    </div>
  )
}

function ElementDistribution({ counts }) {
  const max = Math.max(...Object.values(counts), 1)
  return (
    <div className="prep-element-list">
      {Object.entries(counts).map(([element, count]) => (
        <div className="prep-element-row" key={element}>
          <span>{element}</span>
          <div className="prep-element-track"><i style={{ width: `${(count / max) * 100}%` }} /></div>
          <strong>{count}</strong>
        </div>
      ))}
    </div>
  )
}

function SupportScope({ scope }) {
  if (!scope) return null
  return (
    <section className="prep-data-panel prep-support-panel">
      <div className="prep-mini-head"><h4>현재 지원 범위</h4><span>계산과 판정 분리</span></div>
      <p>{scope.summary}</p>
      <div className="prep-support-grid">
        <div>
          <strong>재현 가능하게 계산됨</strong>
          <ul>
            {scope.supported.map(({ item, basis }) => (
              <li key={item}><b>{item}</b><span>{basis}</span></li>
            ))}
          </ul>
        </div>
        <div>
          <strong>아직 완전 지원하지 않는 이유</strong>
          <div className="prep-support-limitations">
            {scope.limitations.map(({ item, reason }) => (
              <details key={item}>
                <summary>{item}</summary>
                <p>{reason}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function TimingSummary({ timing }) {
  if (!timing) return null
  const activeCycle = timing.daYun.status === 'calculated'
    ? timing.daYun.cycles.find((cycle) => cycle.isActive)
    : null
  const positionLabels = { year: '년주', month: '월주', day: '일주', hour: '시주' }

  return (
    <section className="prep-data-panel prep-timing-panel">
      <div className="prep-mini-head"><h4>운 흐름 기준값</h4><span>{timing.targetDate} · 길흉 판단 전</span></div>
      <div className="prep-period-grid">
        {Object.values(timing.periods).map((period) => {
          const periodCandidates = period.candidates || [period]
          return (
            <article className={period.status === 'candidate_required' ? 'is-candidate' : ''} key={period.label}>
              <span>{period.label}</span>
              <strong>{[...new Set(periodCandidates.map((candidate) => candidate.value))].join(' / ')}</strong>
              {period.status === 'candidate_required'
                ? <small>후보 {periodCandidates.map((candidate) => `${candidate.dayMaster}일간: ${candidate.stemTenGod}·${candidate.branchTenGod}·${candidate.twelveStage}`).join(' / ')}</small>
                : <small>{period.stemTenGod} · 본기 {period.branchMainStem || '-'}({period.branchTenGod}) · {period.twelveStage}</small>}
              <small>{period.status === 'candidate_required'
                ? '경계 또는 일간 후보 확인 필요'
                : period.branchRelations.items.length > 0
                  ? period.branchRelations.items.map((item) => item.relation).join(' · ')
                  : '원국 지지 관계 없음'}</small>
            </article>
          )
        })}
      </div>
      <div className="prep-twelve-stage-row">
        {Object.entries(timing.natalTwelveStages).map(([position, item]) => (
          <span className={item.status === 'candidate_required' ? 'is-candidate' : ''} key={position}>
            <b>{positionLabels[position]}</b>
            {(item.candidates || [item]).length > 1
              ? (item.candidates || [item]).map((candidate) => `${candidate.dayMaster}일간 ${candidate.branch || '미상'}·${candidate.stage || '미상'}`).join(' / ')
              : item.branch ? `${item.branch} · ${item.stage}` : '미상'}
          </span>
        ))}
      </div>
      <div className="prep-dayun-head">
        <div>
          <strong>대운</strong>
          {['calculated', 'candidate_required'].includes(timing.daYun.status)
            ? <small>{timing.daYun.directionLabel} · {timing.daYun.startAge.years}년 {timing.daYun.startAge.months}개월 {timing.daYun.startAge.days}일 기산</small>
            : <small>{timing.daYun.reason}</small>}
        </div>
        {activeCycle && <span>기준일 해당 · {activeCycle.value}</span>}
      </div>
      {timing.daYun.status === 'candidate_required' && (
        <div className="prep-timing-candidates">
          <strong>대운 후보 확인 필요</strong>
          {(timing.daYun.candidates || []).map((candidate) => (
            <span key={`${candidate.sourceLabel}-${candidate.firstStartDate}-${candidate.monthPillar}`}>
              {candidate.sourceLabel}: {candidate.directionLabel} · {candidate.monthPillar} 기준 · 첫 대운 {candidate.cycles[0]?.value} · 현재 {candidate.cycles.find((cycle) => cycle.isActive)?.value || '해당 없음'}
            </span>
          ))}
        </div>
      )}
      {timing.daYun.status === 'calculated' && timing.daYun.startDateRange && (
        <p className="prep-timing-inline-warning">기산일 후보 {timing.daYun.startDateRange.join('~')} · 기준일의 현재 대운은 동일</p>
      )}
      {timing.daYun.cycles.length > 0 && (
        <div className="prep-dayun-grid">
          {timing.daYun.cycles.map((cycle) => (
            <div className={timing.daYun.status === 'calculated' && cycle.isActive ? 'is-active' : ''} key={cycle.index}>
              <span>{cycle.startAgeYears}세</span>
              <strong>{cycle.value}</strong>
              <small>{cycle.startDate}</small>
            </div>
          ))}
        </div>
      )}
      {timing.crossPeriodRelations?.status === 'calculated' && (
        <div className="prep-cross-relations">
          <strong>기간 간 지지 관계</strong>
          <span>{timing.crossPeriodRelations.items.length > 0
            ? timing.crossPeriodRelations.items.map((item) => `${item.labels.join('↔')} ${item.relation}`).join(' · ')
            : '조회된 관계 없음'}</span>
        </div>
      )}
      <p className="prep-timing-note">{timing.interpretationScope}</p>
    </section>
  )
}

function SystemResult({ result, view }) {
  if (!result.raw) {
    return (
      <div className="prep-empty-state">
        <StatusBadge status={result.status} />
        <h3>아직 계산값을 만들지 않습니다.</h3>
        <p>{result.warnings[0]}</p>
        {result.engine?.profile && <ProfileRows profile={result.engine.profile} />}
      </div>
    )
  }

  if (view === 'features') {
    return (
      <div className="prep-feature-list">
        {result.features.map((item) => (
          <article className="prep-feature" key={item.id}>
            <div className="prep-feature-head">
              <div>
                <span className="prep-feature-category">{item.category}</span>
                <h3>{item.title}</h3>
              </div>
              <span className="prep-confidence">{item.confidence}</span>
            </div>
            <p>{item.statement}</p>
            <div className="prep-meter" aria-label={`강도 ${item.strength}`}>
              <i style={{ width: `${item.strength * 100}%` }} />
            </div>
            <details>
              <summary>근거 {item.evidence.length}개 보기</summary>
              <ul>
                {item.evidence.map((evidence) => (
                  <li key={evidence.reference}>
                    <code>{evidence.reference}</code> = {JSON.stringify(evidence.value)}
                  </li>
                ))}
              </ul>
            </details>
          </article>
        ))}
      </div>
    )
  }

  return (
    <div className="prep-raw-stack">
      <div className="prep-result-heading">
        <div>
          <p className="section-kicker">RAW CALCULATION</p>
          <h3>
            {result.raw.dayMaster.candidates?.length > 1
              ? `일간 후보 ${result.raw.dayMaster.candidates.join(' · ')}`
              : `${result.raw.dayMaster.stem}${result.raw.dayMaster.element} 일간`}
          </h3>
        </div>
        <StatusBadge status={result.status} />
      </div>
      <PillarGrid pillars={result.raw.pillars} />
      <TimingSummary timing={result.raw.timing} />
      <section className="prep-data-panel">
        <div className="prep-mini-head"><h4>입력 보정</h4><span>원본과 분리 저장</span></div>
        <dl className="prep-normalization-list">
          <div><dt>원본 입력</dt><dd>{result.inputNormalization.original}</dd></div>
          <div><dt>기준 도시</dt><dd>{result.inputNormalization.referenceCity}</dd></div>
          <div><dt>진태양시</dt><dd>{result.inputNormalization.correctedSolarTime || '출생시각 미상 · 적용하지 않음'}</dd></div>
          <div><dt>경도 보정</dt><dd>{result.inputNormalization.meanSolarCorrectionMinutes == null ? '적용하지 않음' : `${result.inputNormalization.meanSolarCorrectionMinutes}분`}</dd></div>
          <div><dt>균시차</dt><dd>{result.inputNormalization.equationOfTimeMinutes == null ? '적용하지 않음' : `${result.inputNormalization.equationOfTimeMinutes}분`}</dd></div>
          <div><dt>총 보정</dt><dd>{result.inputNormalization.correctionMinutes == null ? '적용하지 않음' : `${result.inputNormalization.correctionMinutes}분`}</dd></div>
          <div><dt>자시 구분</dt><dd>{result.inputNormalization.ziPeriodLabel || '출생시각 미상 · 판정하지 않음'}</dd></div>
          <div><dt>일주 기준일</dt><dd>{result.inputNormalization.dayBoundaryDate || '출생시각 미상 · 후보로 저장'}</dd></div>
          <div><dt>국내 후보</dt><dd>{result.inputNormalization.domesticCorrectionRangeMinutes == null ? '적용하지 않음' : `${result.inputNormalization.domesticCorrectionRangeMinutes.join('~')}분`}</dd></div>
        </dl>
      </section>
      <section className="prep-data-panel">
        <div className="prep-mini-head">
          <h4>오행 단순 분포</h4>
          <span>{result.raw.birthTimeUnknown ? '정오 기준 · 시주 제외' : '지장간·계절 가중 전'}</span>
        </div>
        <ElementDistribution counts={result.raw.elements.counts} />
      </section>
      <SupportScope scope={result.supportScope} />
      <section className="prep-data-panel">
        <div className="prep-mini-head"><h4>계산 추적</h4><span>{result.engine.sourceEngine}</span></div>
        <ol className="prep-trace-list">
          {result.raw.calculationTrace.map((line) => <li key={line}>{line}</li>)}
        </ol>
      </section>
      <details className="prep-json-details">
        <summary>검증용 원자료 JSON 보기</summary>
        <pre>{JSON.stringify(result.raw, null, 2)}</pre>
      </details>
      <div className="prep-warning-box">
        <strong>검증 알림</strong>
        <ul>
          {result.warnings.map((warning) => <li key={warning}>{warning}</li>)}
        </ul>
      </div>
    </div>
  )
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()
  if (!copied) throw new Error('copy_failed')
}

export default function InterpretationPrepPage() {
  const savedDraft = useMemo(loadSavedDraft, [])
  const [input, setInput] = useState(savedDraft?.input || { ...DEFAULT_INPUT, targetDate: todayInKorea() })
  const [profiles, setProfiles] = useState(savedDraft?.profiles || DEFAULT_PROFILES)
  const [saveLocally, setSaveLocally] = useState(Boolean(savedDraft))
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [activeSystem, setActiveSystem] = useState('saju')
  const [resultView, setResultView] = useState('raw')
  const [exportType, setExportType] = useState('conversation')
  const [topicId, setTopicId] = useState('overall')
  const [question, setQuestion] = useState('')
  const [copyStatus, setCopyStatus] = useState('')
  const selectedReferenceCity = getKoreaReferenceCity(input.referenceCity)

  useEffect(() => {
    if (!saveLocally) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ input, profiles }))
    } catch (storageError) {
      console.warn('[InterpretationPrep] Failed to save local draft.', storageError)
    }
  }, [input, profiles, saveLocally])

  const exportPayload = useMemo(() => {
    if (!result) return null
    return buildExportPayload(result, {
      type: exportType,
      topicId,
      question,
      generatedAt: new Date().toISOString(),
    })
  }, [result, exportType, topicId, question])

  const markdown = useMemo(
    () => exportPayload ? exportPayloadToMarkdown(exportPayload) : '',
    [exportPayload],
  )

  function updateInput(key, value) {
    setInput((current) => ({ ...current, [key]: value }))
    setError('')
    setCopyStatus('')
  }

  function toggleUnknownBirthTime() {
    setInput((current) => ({
      ...current,
      birthTime: '',
      timeAccuracy: current.timeAccuracy === 'unknown' ? 'exact' : 'unknown',
    }))
    setError('')
    setCopyStatus('')
  }

  function updateReferenceCity(cityId) {
    const city = getKoreaReferenceCity(cityId)
    setInput((current) => ({
      ...current,
      referenceCity: city.id,
      latitude: String(city.latitude),
      longitude: String(city.longitude),
    }))
    setError('')
    setCopyStatus('')
  }

  function updateAstrologyProfile(key, value) {
    setProfiles((current) => ({
      ...current,
      astrology: { ...current.astrology, [key]: value },
    }))
  }

  function handleSavePreference(checked) {
    setSaveLocally(checked)
    if (!checked) {
      try {
        window.localStorage.removeItem(STORAGE_KEY)
      } catch (storageError) {
        console.warn('[InterpretationPrep] Failed to clear local draft.', storageError)
      }
    }
  }

  function handleCalculate(event) {
    event.preventDefault()
    try {
      const nextResult = prepareInterpretationData(input, profiles)
      setResult(nextResult)
      setError('')
      setActiveSystem('saju')
      setResultView('raw')
      setCopyStatus('계산값과 파생 특징을 새로 만들었습니다.')
    } catch (calculationError) {
      setResult(null)
      setError(calculationError.message || '계산 중 오류가 발생했습니다.')
    }
  }

  async function handleCopy(format) {
    if (!exportPayload) return
    try {
      await copyText(format === 'markdown' ? markdown : JSON.stringify(exportPayload, null, 2))
      setCopyStatus(format === 'markdown' ? 'Markdown을 복사했습니다.' : 'JSON을 복사했습니다.')
    } catch (copyError) {
      console.error('[InterpretationPrep] Copy failed.', copyError)
      setCopyStatus('복사에 실패했습니다. 아래 미리보기에서 직접 선택해 주세요.')
    }
  }

  const currentSystem = result?.systems[activeSystem]

  return (
    <main className="app-shell ag-shell prep-shell" data-design-theme="atmospheric">
      <header className="hero prep-hero ag-glass">
        <div className="prep-hero-top">
          <button type="button" className="prep-ghost-button" onClick={() => navigate('/')}>홈</button>
          <span className="prep-version">SCHEMA {INTERPRETATION_PREP_SCHEMA_VERSION}</span>
        </div>
        <div className="prep-hero-body">
          <div className="prep-hero-copy">
            <p className="eyebrow">INTERPRETATION PREP</p>
            <h1>해석 전, 근거부터 정리합니다.</h1>
            <p className="subtle">사주·자미두수·서양 점성학의 계산값과 불확실성을 분리해 대화형 모델에 전달하는 준비 도구입니다. 최종 성격이나 미래를 단정하지 않습니다.</p>
          </div>
          <div className="prep-status-strip" aria-label="계산 체계별 준비 상태">
            {SYSTEMS.map((system) => (
              <div key={system.id}>
                <span>{system.label}</span>
                <StatusBadge status={result?.systems?.[system.id]?.status || (system.id === 'saju' ? 'missing_input' : system.id === 'ziwei' ? 'needs_profile' : 'unsupported')} />
              </div>
            ))}
          </div>
        </div>
      </header>

      <form className="prep-workspace" onSubmit={handleCalculate}>
        <section className="card prep-card ag-glass">
          <div className="card-header">
            <div>
              <p className="section-kicker">01 · INPUT LAYER</p>
              <h2>출생정보</h2>
            </div>
            <span className="prep-step-note">대한민국 출생 기준</span>
          </div>
          <p className="subtle prep-section-intro">생년월일·시각과 성별, 달력 기준을 입력하세요. 국내 지역 차이는 결과가 달라지는 경계 시각에만 자동으로 알려드립니다.</p>
          <div className="prep-form-grid">
            <LabeledField label="이름">
              <input value={input.subjectName} onChange={(event) => updateInput('subjectName', event.target.value)} placeholder="예: 말랑이" />
            </LabeledField>
            <div className="prep-field">
              <span id="prep-gender-label">성별</span>
              <div className="prep-gender-control" role="radiogroup" aria-labelledby="prep-gender-label">
                <button
                  type="button"
                  role="radio"
                  aria-checked={input.gender === 'male'}
                  className={`prep-gender-option ${input.gender === 'male' ? 'is-active' : ''}`}
                  onClick={() => updateInput('gender', 'male')}
                >
                  남성
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={input.gender === 'female'}
                  className={`prep-gender-option ${input.gender === 'female' ? 'is-active' : ''}`}
                  onClick={() => updateInput('gender', 'female')}
                >
                  여성
                </button>
              </div>
            </div>
            <LabeledField label="출생일">
              <input type="date" min="1901-01-01" max="2100-12-31" required value={input.birthDate} onChange={(event) => updateInput('birthDate', event.target.value)} />
            </LabeledField>
            <LabeledField label="달력 기준">
              <select value={input.calendar} onChange={(event) => updateInput('calendar', event.target.value)}>
                <option value="solar">양력</option>
                <option value="lunar">음력 · 미지원</option>
              </select>
            </LabeledField>
            <LabeledField label="출생시각" className="prep-field-wide">
              <div className="prep-time-control">
                <input
                  type="time"
                  required={input.timeAccuracy !== 'unknown'}
                  disabled={input.timeAccuracy === 'unknown'}
                  value={input.birthTime}
                  onChange={(event) => {
                    updateInput('birthTime', event.target.value)
                    updateInput('timeAccuracy', 'exact')
                  }}
                />
                <button
                  type="button"
                  aria-pressed={input.timeAccuracy === 'unknown'}
                  className={`prep-time-unknown ${input.timeAccuracy === 'unknown' ? 'is-active' : ''}`}
                  onClick={toggleUnknownBirthTime}
                >
                  모름
                </button>
              </div>
            </LabeledField>
            <LabeledField label="운 흐름 기준일" hint="대운·세운·월운·일진을 이 날짜 기준으로 계산" className="prep-field-wide">
              <input type="date" min="1901-01-01" max="2100-12-31" required value={input.targetDate} onChange={(event) => updateInput('targetDate', event.target.value)} />
            </LabeledField>
          </div>
          <details className="prep-advanced-inputs">
            <summary>
              <span>세부 입력과 계산 환경</span>
              <small>기준 도시 · 시간대 · 좌표</small>
            </summary>
            <div className="prep-advanced-grid">
              <LabeledField label="기준 도시" hint="기본값 서울 · 선택한 경도 보정 적용">
                <select value={selectedReferenceCity.id} onChange={(event) => updateReferenceCity(event.target.value)}>
                  {KOREA_REFERENCE_CITIES.map((city) => (
                    <option value={city.id} key={city.id}>{city.label}{city.id === 'seoul' ? ' (기본)' : ''}</option>
                  ))}
                </select>
              </LabeledField>
              <LabeledField label="시간대">
                <output className="prep-readonly-value">Asia/Seoul (UTC+9)</output>
              </LabeledField>
              <LabeledField label="기준 위도">
                <output className="prep-readonly-value">{selectedReferenceCity.latitude.toFixed(2)}°N</output>
              </LabeledField>
              <LabeledField label="기준 경도">
                <output className="prep-readonly-value">{selectedReferenceCity.longitude.toFixed(2)}°E</output>
              </LabeledField>
            </div>
            <p className="prep-advanced-note">국내 시간대는 모두 Asia/Seoul로 동일합니다. 선택한 기준 도시의 경도 보정을 계산에 적용하며, 주요 도시 후보에서 기둥이 달라지는 경계 시각은 검증 필요로 표시합니다.</p>
          </details>
          <label className="prep-save-toggle">
            <input type="checkbox" checked={saveLocally} onChange={(event) => handleSavePreference(event.target.checked)} />
            <span><strong>이 브라우저에 입력과 기준 저장</strong><small>클라우드로 전송하지 않으며, 계산 결과는 저장하지 않습니다.</small></span>
          </label>
        </section>

        <section className="card prep-card ag-glass">
          <div className="card-header">
            <div>
              <p className="section-kicker">02 · CALCULATION PROFILE</p>
              <h2>계산 기준</h2>
            </div>
            <span className="prep-step-note">결과와 함께 출력</span>
          </div>
          <p className="subtle prep-section-intro">현재 연결된 계산 범위를 확인하고, 필요한 경우에만 상세 규칙을 펼쳐보세요.</p>
          <div className="prep-profile-stack">
            <details>
              <summary><span><strong>사주</strong><small>핵심 원국 계산 · 일부 판정 규칙 미지원</small></span><StatusBadge status={result?.systems?.saju?.status || 'partial'} /></summary>
              <ProfileRows profile={profiles.saju} />
            </details>
            <details>
              <summary><span><strong>자미두수</strong><small>판본과 배치 규칙 미확정</small></span><StatusBadge status="needs_profile" /></summary>
              <p>판본과 핵심 배치 규칙이 정해지기 전에는 계산값을 생성하지 않습니다.</p>
              <ProfileRows profile={profiles.ziwei} />
            </details>
            <details>
              <summary><span><strong>서양 점성학</strong><small>천문력 어댑터 미연결</small></span><StatusBadge status="unsupported" /></summary>
              <div className="prep-inline-settings">
                <LabeledField label="황도">
                  <select value={profiles.astrology.zodiac} onChange={(event) => updateAstrologyProfile('zodiac', event.target.value)}>
                    <option value="tropical">열대황도</option>
                    <option value="sidereal">항성황도</option>
                  </select>
                </LabeledField>
                <LabeledField label="하우스 시스템">
                  <select value={profiles.astrology.houseSystem} onChange={(event) => updateAstrologyProfile('houseSystem', event.target.value)}>
                    <option value="placidus">Placidus</option>
                    <option value="whole-sign">Whole Sign</option>
                    <option value="equal">Equal</option>
                  </select>
                </LabeledField>
                <LabeledField label="노드">
                  <select value={profiles.astrology.nodeType} onChange={(event) => updateAstrologyProfile('nodeType', event.target.value)}>
                    <option value="true">True Node</option>
                    <option value="mean">Mean Node</option>
                  </select>
                </LabeledField>
              </div>
              <p>선택값은 프로필에 저장되지만, 검증된 천문력 어댑터가 없어 아직 차트를 계산하지 않습니다.</p>
            </details>
          </div>
          {error && <p className="prep-form-error" role="alert">{error}</p>}
          <button type="submit" className="prep-calculate-button ag-primary-action">사주와 운 흐름 계산하고 자료 만들기</button>
        </section>
      </form>

      {result && (
        <>
          <section className="card prep-card prep-results-card ag-glass">
            <div className="card-header">
              <div>
                <p className="section-kicker">03 · SYSTEM RESULTS</p>
                <h2>체계별 근거</h2>
              </div>
              <span className="prep-step-note">지원 범위와 한계 분리</span>
            </div>
            <div className="prep-system-tabs ag-segmented" role="tablist" aria-label="계산 체계">
              {SYSTEMS.map((system) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeSystem === system.id}
                  className={activeSystem === system.id ? 'is-active' : ''}
                  key={system.id}
                  onClick={() => setActiveSystem(system.id)}
                >
                  <span>{system.shortLabel}</span>{system.label}
                </button>
              ))}
            </div>
            <div className="prep-view-switch ag-segmented" role="tablist" aria-label="결과 보기 방식">
              <button type="button" className={resultView === 'raw' ? 'is-active' : ''} onClick={() => setResultView('raw')}>원자료</button>
              <button type="button" className={resultView === 'features' ? 'is-active' : ''} onClick={() => setResultView('features')}>주요 특징</button>
            </div>
            <SystemResult result={currentSystem} view={resultView} />
          </section>

          <section className="card prep-card ag-glass">
            <div className="card-header">
              <div>
                <p className="section-kicker">04 · SYNTHESIS LAYER</p>
                <h2>통합 구조</h2>
              </div>
              <StatusBadge status="needs_verification" />
            </div>
            <div className="prep-synthesis-grid">
              {[
                ['Agreement', '공통점', result.synthesis.agreements],
                ['Complementary', '보완점', result.synthesis.complementary],
                ['Tension', '긴장점', result.synthesis.tensions],
                ['Uncertainty', '미확정', result.synthesis.uncertainties],
              ].map(([key, label, items]) => (
                <article className={`prep-synthesis-item is-${key.toLowerCase()}`} key={key}>
                  <span>{key}</span>
                  <h3>{label}</h3>
                  <p>{items.length > 0 ? items[0].summary : '비교 가능한 체계가 2개 이상일 때 근거 기반으로 생성합니다.'}</p>
                  <strong>{items.length}</strong>
                </article>
              ))}
            </div>
          </section>

          <section className="card prep-card ag-glass">
            <div className="card-header">
              <div>
                <p className="section-kicker">05 · EXPORT LAYER</p>
                <h2>해석 패키지 만들기</h2>
              </div>
              <span className="prep-step-note">AI 비종속 형식</span>
            </div>
            <div className="prep-export-switch ag-segmented">
              <button type="button" className={exportType === 'conversation' ? 'is-active' : ''} onClick={() => setExportType('conversation')}>대화용 요약</button>
              <button type="button" className={exportType === 'verification' ? 'is-active' : ''} onClick={() => setExportType('verification')}>검증용 상세</button>
            </div>
            {exportType === 'conversation' && (
              <div className="prep-export-fields">
                <LabeledField label="질문 주제">
                  <select value={topicId} onChange={(event) => setTopicId(event.target.value)}>
                    {TOPICS.map((topic) => <option value={topic.id} key={topic.id}>{topic.label}</option>)}
                  </select>
                </LabeledField>
                <LabeledField label="구체적인 질문" hint="선택 입력 · 계산값이 아니라 대화의 방향만 지정합니다.">
                  <textarea rows="3" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="예: 올해 이직 고민을 어떤 근거부터 살펴보면 좋을까?" />
                </LabeledField>
              </div>
            )}
            <div className="prep-copy-actions">
              <button type="button" onClick={() => handleCopy('markdown')}>Markdown 복사</button>
              <button type="button" className="prep-secondary-button ag-secondary-action" onClick={() => handleCopy('json')}>JSON 복사</button>
            </div>
            {copyStatus && <p className="prep-copy-status" aria-live="polite">{copyStatus}</p>}
            <details className="prep-export-preview">
              <summary>출력 미리보기</summary>
              <pre>{exportType === 'conversation' ? markdown : JSON.stringify(exportPayload, null, 2)}</pre>
            </details>
          </section>
        </>
      )}
    </main>
  )
}
