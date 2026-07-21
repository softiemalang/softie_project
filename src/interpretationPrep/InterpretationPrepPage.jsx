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
  STATUS_META,
  SYSTEMS,
  TOPICS,
} from './schema.js'
import './interpretationPrep.css'

const STORAGE_KEY = 'softie.interpretationPrep.draft.v1'

function loadSavedDraft() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')
    if (!saved) return null
    return {
      input: { ...DEFAULT_INPUT, ...saved.input },
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

function LabeledField({ label, hint, children }) {
  return (
    <label className="prep-field">
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
      <section className="prep-data-panel">
        <div className="prep-mini-head"><h4>입력 보정</h4><span>원본과 분리 저장</span></div>
        <dl className="prep-normalization-list">
          <div><dt>원본 입력</dt><dd>{result.inputNormalization.original}</dd></div>
          <div><dt>보정 시각</dt><dd>{result.inputNormalization.correctedSolarTime || '출생시각 미상 · 적용하지 않음'}</dd></div>
          <div><dt>보정량</dt><dd>{result.inputNormalization.correctionMinutes == null ? '적용하지 않음' : `${result.inputNormalization.correctionMinutes}분`}</dd></div>
        </dl>
      </section>
      <section className="prep-data-panel">
        <div className="prep-mini-head">
          <h4>오행 단순 분포</h4>
          <span>{result.raw.birthTimeUnknown ? '정오 기준 · 시주 제외' : '지장간·계절 가중 전'}</span>
        </div>
        <ElementDistribution counts={result.raw.elements.counts} />
      </section>
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
        <strong>검증 및 미지원 범위</strong>
        <ul>
          {[...result.warnings, ...result.unsupported].map((warning) => <li key={warning}>{warning}</li>)}
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
  const [input, setInput] = useState(savedDraft?.input || DEFAULT_INPUT)
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
    <main className="app-shell prep-shell">
      <header className="hero prep-hero">
        <div className="prep-hero-top">
          <button type="button" className="prep-ghost-button" onClick={() => navigate('/')}>홈</button>
          <span className="prep-version">SCHEMA 1.0</span>
        </div>
        <p className="eyebrow">INTERPRETATION PREP</p>
        <h1>해석 전, 근거부터 정리합니다.</h1>
        <p className="subtle">사주·자미두수·서양 점성학의 계산값과 불확실성을 분리해 대화형 모델에 전달하는 준비 도구입니다. 최종 성격이나 미래를 단정하지 않습니다.</p>
        <div className="prep-status-strip">
          {SYSTEMS.map((system) => (
            <div key={system.id}>
              <span>{system.label}</span>
              <StatusBadge status={system.id === 'saju' ? (result ? 'partial' : 'missing_input') : system.id === 'ziwei' ? 'needs_profile' : 'unsupported'} />
            </div>
          ))}
        </div>
      </header>

      <form onSubmit={handleCalculate}>
        <section className="card prep-card">
          <div className="card-header">
            <div>
              <p className="section-kicker">01 · INPUT LAYER</p>
              <h2>출생정보</h2>
            </div>
            <span className="prep-step-note">먼저 필요한 정보만</span>
          </div>
          <p className="subtle prep-section-intro">생년월일과 시간을 먼저 입력하세요. 시간대·좌표 같은 기술 정보는 기본값을 그대로 사용해도 됩니다.</p>
          <div className="prep-form-grid">
            <LabeledField label="이름">
              <input value={input.subjectName} onChange={(event) => updateInput('subjectName', event.target.value)} placeholder="예: 말랑이" />
            </LabeledField>
            <LabeledField label="출생일">
              <input type="date" min="1901-01-01" max="2100-12-31" required value={input.birthDate} onChange={(event) => updateInput('birthDate', event.target.value)} />
            </LabeledField>
            <LabeledField label="출생시각">
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
            <LabeledField label="출생 장소">
              <input required value={input.placeName} onChange={(event) => updateInput('placeName', event.target.value)} />
            </LabeledField>
          </div>
          <details className="prep-advanced-inputs">
            <summary>
              <span>세부 입력과 계산 환경</span>
              <small>성별 · 시간대 · 좌표 · 달력 기준 · 출처</small>
            </summary>
            <div className="prep-advanced-grid">
              <LabeledField label="성별">
                <select value={input.gender} onChange={(event) => updateInput('gender', event.target.value)}>
                  <option value="unspecified">지정하지 않음</option>
                  <option value="female">여성</option>
                  <option value="male">남성</option>
                  <option value="other">기타</option>
                </select>
              </LabeledField>
              <LabeledField label="달력 기준">
                <select value={input.calendar} onChange={(event) => updateInput('calendar', event.target.value)}>
                  <option value="solar">양력</option>
                  <option value="lunar">음력 · 미지원</option>
                </select>
              </LabeledField>
              <LabeledField label="시간대" hint="현재 Asia/Seoul만 검증됨">
                <select value={input.timezone} onChange={(event) => updateInput('timezone', event.target.value)}>
                  <option value="Asia/Seoul">Asia/Seoul (UTC+9)</option>
                  <option value="unsupported">다른 시간대 · 미지원</option>
                </select>
              </LabeledField>
              <LabeledField label="위도">
                <input type="number" min="-90" max="90" step="0.0001" required value={input.latitude} onChange={(event) => updateInput('latitude', event.target.value)} />
              </LabeledField>
              <LabeledField label="경도">
                <input type="number" min="-180" max="180" step="0.0001" required value={input.longitude} onChange={(event) => updateInput('longitude', event.target.value)} />
              </LabeledField>
              <LabeledField label="입력값 출처">
                <input value={input.source} onChange={(event) => updateInput('source', event.target.value)} />
              </LabeledField>
            </div>
            <p className="prep-advanced-note">장소와 좌표는 출력에 기록되지만, 현재 사주 엔진의 진태양시 보정에는 사용하지 않습니다.</p>
          </details>
          <label className="prep-save-toggle">
            <input type="checkbox" checked={saveLocally} onChange={(event) => handleSavePreference(event.target.checked)} />
            <span><strong>이 브라우저에 입력과 기준 저장</strong><small>클라우드로 전송하지 않으며, 계산 결과는 저장하지 않습니다.</small></span>
          </label>
        </section>

        <section className="card prep-card">
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
              <summary><span><strong>사주</strong><small>실제 계산 연결됨</small></span><StatusBadge status="partial" /></summary>
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
          <button type="submit" className="prep-calculate-button">사주 계산하고 자료 만들기</button>
        </section>
      </form>

      {result && (
        <>
          <section className="card prep-card prep-results-card">
            <div className="card-header">
              <div>
                <p className="section-kicker">03 · SYSTEM RESULTS</p>
                <h2>체계별 근거</h2>
              </div>
              <span className="prep-step-note">부분 성공 허용</span>
            </div>
            <div className="prep-system-tabs" role="tablist" aria-label="계산 체계">
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
            <div className="prep-view-switch" role="tablist" aria-label="결과 보기 방식">
              <button type="button" className={resultView === 'raw' ? 'is-active' : ''} onClick={() => setResultView('raw')}>원자료</button>
              <button type="button" className={resultView === 'features' ? 'is-active' : ''} onClick={() => setResultView('features')}>주요 특징</button>
            </div>
            <SystemResult result={currentSystem} view={resultView} />
          </section>

          <section className="card prep-card">
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

          <section className="card prep-card">
            <div className="card-header">
              <div>
                <p className="section-kicker">05 · EXPORT LAYER</p>
                <h2>해석 패키지 만들기</h2>
              </div>
              <span className="prep-step-note">AI 비종속 형식</span>
            </div>
            <div className="prep-export-switch">
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
              <button type="button" className="prep-secondary-button" onClick={() => handleCopy('json')}>JSON 복사</button>
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
