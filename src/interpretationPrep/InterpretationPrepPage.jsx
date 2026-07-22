import { useEffect, useMemo, useState } from 'react'
import { navigate } from '../lib/router'
import {
  buildExportPayload,
  exportPayloadToMarkdown,
  prepareInterpretationData,
  exportValidationReportToMarkdown,
} from './prepare.js'
import { sajuValidationFixtures } from './fixtures/sajuValidationFixtures.js'
import { runSajuValidationSuite } from './sajuValidationRunner.js'
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
          <div className={`prep-element-track w-level-${Math.round((count / max) * 10)}`}><i /></div>
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
              <i className={`prep-strength-bar val-${Math.min(Math.max(Math.round(item.strength * 10), 0), 12)}`} />
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

      {/* 1. 사주 학파 표준 프로필 패널 */}
      {result.raw.experimental?.strength && (
        <section className="prep-data-panel prep-profile-panel">
          <div className="prep-mini-head">
            <div className="prep-mini-title-group">
              <h4>Experimental 사주 분석 프로필</h4>
              <span className="prep-experimental-badge">Experimental</span>
            </div>
            <span>정량적 원국 심층 분석</span>
          </div>

          <p className="prep-experimental-warning">
            {result.raw.experimental?.description || '강약·격국·용신·신살은 검증단계(Experimental) 분석 결과입니다. 학술 참고용으로 사용하세요.'}
          </p>

          <div className="profile-analysis-card">
            {/* 신강약 점수 시각화 */}
            <div className="profile-section-item">
              <strong className="profile-sub-label">표면 생조 기반 휴리스틱 강약 ({result.raw.experimental?.strength?.level || '미정'})</strong>
              <div className="strength-score-container">
                <div className="strength-labels">
                  <span>극신약 (0)</span>
                  <span>중화 (50)</span>
                  <span>극신강 (100)</span>
                </div>
                <div className={`strength-meter-track val-step-${Math.min(Math.max(Math.round((result.raw.experimental?.strength?.score || 0) / 5) * 5, 0), 100)}`}>
                  <i className={result.raw.experimental?.strength?.isStrong ? 'is-strong' : 'is-weak'} />
                </div>
                <div className="strength-score-text">
                  {result.raw.experimental?.strength?.score || 0}점 · 득령 {result.raw.experimental?.strength?.deungRyeong ? '성공' : '실패'} · 득지 {result.raw.experimental?.strength?.deungJi ? '성공' : '실패'}
                </div>
                {/* 별도 독립 통근 정보 명시 */}
                <div className="strength-tonggeun-note">
                  <small>
                    ※ <b>통근(TongGeun) 정보 (별도 참고)</b>:
                    {result.raw.experimental?.strength?.tongGeunPillars && result.raw.experimental.strength.tongGeunPillars.length > 0 ? (
                      ` 일간이 지지 지장간에 뿌리를 내린 기둥: ${result.raw.experimental.strength.tongGeunPillars.map(p => {
                        const labels = { year: '연지', month: '월지', day: '일지', hour: '시지' }
                        return labels[p] || p
                      }).join(', ')}`
                    ) : ' 일간이 지지에 뿌리를 내린 기둥(통근)이 없습니다.'}
                    <br />
                    (본 정량 스코어는 단순 오행 표면 생조 가치 합산이며 지장간 통근 정보는 스코어와 무관한 참고용 정보입니다.)
                  </small>
                </div>
              </div>
            </div>

            {/* 격국 및 용신 판단 */}
            <div className="profile-grid-two-cols">
              <div className="profile-section-item profile-box ag-glass">
                <strong className="profile-sub-label text-purple">격국 (Gyeokguk)</strong>
                <h5>{result.raw.experimental?.gyeokguk?.name || '분석 불능'}</h5>
                <span className="profile-meta-text">분류: {result.raw.experimental?.gyeokguk?.type || '불명'}</span>
                <p className="profile-desc-text">{result.raw.experimental?.gyeokguk?.reason || ''}</p>
                {/* 특수격 후보가 존재할 경우 참고 정보로 출력 */}
                {result.raw.experimental?.gyeokguk?.specialStructureCandidate && (
                  <div className="special-structure-note">
                    <strong>[참고] {result.raw.experimental.gyeokguk.specialStructureCandidate.name}</strong>
                    <p>{result.raw.experimental.gyeokguk.specialStructureCandidate.reason}</p>
                  </div>
                )}
              </div>
              <div className="profile-section-item profile-box ag-glass">
                <strong className="profile-sub-label text-green">용희신 (YongShin & HeeShin)</strong>
                <h5>
                  용신: {result.raw.experimental?.yongShin?.primaryYongShinElement || '불명'} 오행 / 희신: {result.raw.experimental?.yongShin?.heeShinElement || '불명'} 오행
                </h5>
                <span className="profile-meta-text">판단 신뢰도: {result.raw.experimental?.yongShin?.confidence === 'high' ? '높음' : '보통'}</span>
                <p className="profile-desc-text">
                  {result.raw.experimental?.yongShin?.statement || ''} {result.raw.experimental?.yongShin?.chohu ? `(조후 보완: ${result.raw.experimental.yongShin.chohu.statement})` : ''}
                </p>
              </div>
            </div>

            {/* 6대 핵심 신살 조회 */}
            <div className="profile-section-item">
              <strong className="profile-sub-label">원국 6대 핵심 신살 (6 Core Shinsal)</strong>
              {result.raw.experimental?.shinsal && result.raw.experimental.shinsal.length > 0 ? (
                <div className="shinsal-chip-wrapper">
                  {result.raw.experimental.shinsal.map((shinsal, sIdx) => {
                    const pillarNames = { year: '연지', month: '월지', day: '일지', hour: '시지' }
                    return (
                      <div key={sIdx} className="shinsal-chip ag-glass">
                        <span className="shinsal-name">{shinsal.name}</span>
                        <span className="shinsal-position">
                          위치: {pillarNames[shinsal.position] || shinsal.position} ({shinsal.branch})
                        </span>
                        <span className="shinsal-formula">
                          수식: {shinsal.formula}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="profile-empty-info">원국 지지에서 검출된 주요 6대 신살이 없습니다.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 2. 천간/지지 세부 관계 분석 패널 */}
      {result.raw.stemRelations && (
        <section className="prep-data-panel prep-relations-panel">
          <div className="prep-mini-head">
            <h4>천간 및 지지 관계 평가</h4>
            <span>존재(presence) · 성립(establishment) · 합화(transmutation) 정밀 연산</span>
          </div>
          <div className="relations-analysis-card">
            {/* 천간 관계 */}
            <div className="relations-section-col ag-glass">
              <strong className="relations-col-title text-blue">천간 관계 (Heavenly Stem Relations)</strong>
              {result.raw.stemRelations.items && result.raw.stemRelations.items.length > 0 ? (
                <ul className="relations-list">
                  {result.raw.stemRelations.items.map((item, idx) => (
                    <li key={idx}>
                      <span className="relation-item-title">[{item.relation}] {item.stems.join('·')}</span>
                      <div className="relation-item-status">
                        {item.relation === '천간합' ? (
                          <>
                            합화성립: {item.assessment.transmutation ? (
                              <span className="text-success-soft">성공 (변환오행: {item.assessment.transformedElement})</span>
                            ) : (
                              <span className="text-danger-soft">{item.assessment.establishment ? '실패 (합반 묶임)' : '무력 (원격 격리)'}</span>
                            )}
                          </>
                        ) : item.relation === '천간충' ? (
                          <span className="text-warning-soft">천간충 성립</span>
                        ) : (
                          <span>관계 성립</span>
                        )}
                      </div>
                      <p className="relation-item-desc">{item.assessment.description}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="profile-empty-info">천간에 특이 합/충 관계가 없습니다.</p>
              )}
            </div>

            {/* 지지 관계 */}
            <div className="relations-section-col ag-glass">
              <strong className="relations-col-title text-orange">지지 관계 (Earthly Branch Relations)</strong>
              {result.raw.branchRelations.items && result.raw.branchRelations.items.length > 0 ? (
                <ul className="relations-list">
                  {result.raw.branchRelations.items.map((item, idx) => (
                    <li key={idx}>
                      <span className="relation-item-title">[{item.relation}] {item.branches.join('·')}</span>
                      <div className="relation-item-status">
                        존재: {item.assessment?.presence ? '예' : '아니오'} · 성립: {item.assessment?.establishment ? <span className="text-success-soft">성공</span> : <span className="text-danger-soft">실패</span>}
                        {item.assessment?.transmutation && (
                          <span> · 합화: <span className="text-success-soft">성공 (변환: {item.assessment.transformedElement})</span></span>
                        )}
                      </div>
                      <p className="relation-item-desc">{item.assessment?.description || '고정 규칙 조회됨'}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="profile-empty-info">지지에 특이 합/형/충/파/해 관계가 없습니다.</p>
              )}
            </div>
          </div>
        </section>
      )}

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

  // 검증 센터 전용 State 및 핸들러
  const [validationSummary, setValidationSummary] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [developerCopiedStatus, setDeveloperCopiedStatus] = useState('')

  const handleRunValidation = () => {
    const summary = runSajuValidationSuite(sajuValidationFixtures, prepareInterpretationData)
    setValidationSummary(summary)
  }

  const handleCopyDevReport = async () => {
    try {
      const mdReport = exportValidationReportToMarkdown()
      await copyTextToClipboard(mdReport)
      setDeveloperCopiedStatus('검증 보고서가 클립보드에 복사되었습니다!')
      setTimeout(() => setDeveloperCopiedStatus(''), 3000)
    } catch (err) {
      setDeveloperCopiedStatus('복사에 실패했습니다.')
    }
  }

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
                <option value="lunar">음력</option>
              </select>
            </LabeledField>
            {input.calendar === 'lunar' && (
              <LabeledField label="윤달 여부">
                <select value={input.isLeapMonth ? 'true' : 'false'} onChange={(event) => updateInput('isLeapMonth', event.target.value === 'true')}>
                  <option value="false">평달 (평월)</option>
                  <option value="true">윤달 (윤월)</option>
                </select>
              </LabeledField>
            )}
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

          {/* 개발자 전용 사주 계산 검증 센터 */}
          <section className="card prep-card ag-glass prep-validation-section">
            <details className="prep-validation-details" onToggle={(e) => { if (e.target.open && !validationSummary) handleRunValidation() }}>
              <summary className="prep-validation-summary-toggle">
                <span>⚙️ 사주 계산 검증 센터 (개발자 검증용)</span>
                <small>골든 픽스처 기반 회귀 & 신뢰성 수치 대시보드 (개방 시 또는 새로고침 클릭 시에만 지연 연산 시작)</small>
              </summary>

              <div className="prep-validation-center-content">
                <div className="prep-validation-top-actions">
                  <button type="button" className="prep-validation-btn ag-primary-action" onClick={handleRunValidation}>검증 새로고침</button>
                  <button type="button" className="prep-validation-btn prep-secondary-button ag-secondary-action" onClick={handleCopyDevReport}>검증 보고서(MD) 복사</button>
                  {developerCopiedStatus && <span className="prep-dev-copied-msg">{developerCopiedStatus}</span>}
                </div>

                {validationSummary ? (
                  <>
                    {/* 통계 요약 보드 */}
                    <div className="prep-validation-stats-grid">
                      <div className="prep-val-stat-card">
                        <span>전체 Fixtures 수</span>
                        <strong>{validationSummary.statistics.total} 개</strong>
                      </div>
                      <div className="prep-val-stat-card is-verified">
                        <span>외부 검증 완료 (Verified)</span>
                        <strong>{validationSummary.statistics.verified.passed} / {validationSummary.statistics.verified.total}</strong>
                        <small>정통 천문력 대조 성공율</small>
                      </div>
                      <div className="prep-val-stat-card is-regression">
                        <span>회귀 검증 전용 (Regression)</span>
                        <strong>{validationSummary.statistics.regressionOnly.passed} / {validationSummary.statistics.regressionOnly.total}</strong>
                        <small>엔진 사법 동작 고정율</small>
                      </div>
                      <div className="prep-val-stat-card is-pending">
                        <span>대기 및 예외 항목 (Pending/Invalid)</span>
                        <strong>{validationSummary.statistics.pending + validationSummary.statistics.invalid} 개</strong>
                        <small>학술 추가 검토 대상</small>
                      </div>
                    </div>

                    {/* 필터 패널 */}
                    <div className="prep-validation-filters">
                      <LabeledField label="카테고리 필터">
                        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                          <option value="all">전체 보기 (All Categories)</option>
                          {Object.keys(validationSummary.categoryStats).map(cat => (
                            <option value={cat} key={cat}>{cat}</option>
                          ))}
                        </select>
                      </LabeledField>

                      <LabeledField label="신뢰 수준 필터">
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                          <option value="all">전체 보기 (All Statuses)</option>
                          <option value="verified">외부 검증 완료 (Verified)</option>
                          <option value="regression_only">회귀 검증 전용 (Regression Only)</option>
                          <option value="pending_external_verification">외부 검증 대기 (Pending)</option>
                        </select>
                      </LabeledField>
                    </div>

                    {/* Fixtures 세부 리스트 */}
                    <div className="prep-validation-fixtures-list">
                      {validationSummary.results
                        .filter(res => {
                          const itemFixture = sajuValidationFixtures.find(f => f.id === res.fixtureId)
                          if (!itemFixture) return true

                          const matchesCategory = categoryFilter === 'all' || res.category === categoryFilter
                          const matchesStatus = statusFilter === 'all' || res.verificationStatus === statusFilter
                          return matchesCategory && matchesStatus
                        })
                        .map(res => {
                          const itemFixture = sajuValidationFixtures.find(f => f.id === res.fixtureId) || {}
                          const statusClass = res.status === 'passed' ? 'is-passed' : res.status === 'pending' ? 'is-pending' : 'is-failed'
                          const statusLabel = res.status === 'passed' ? '계산 결과 일치' : res.status === 'pending' ? '외부 검증 대기' : '계산 결과 불일치'

                          const vStatusLabel = res.verificationStatus === 'verified' ? '외부 검증 완료'
                            : res.verificationStatus === 'regression_only' ? '회귀 검증 전용' : '외부 검증 대기'

                          return (
                            <article className={`prep-validation-item ${statusClass}`} key={res.fixtureId}>
                              <header className="prep-val-item-header">
                                <div>
                                  <span className={`prep-val-badge ${res.verificationStatus}`}>{vStatusLabel}</span>
                                  <h4>{res.title} <small>({res.fixtureId})</small></h4>
                                </div>
                                <span className={`prep-val-result-badge ${res.status}`}>{statusLabel}</span>
                              </header>

                              <p className="prep-val-desc">{itemFixture.description}</p>

                              {/* Mismatches Detail Diff View */}
                              {res.mismatches && res.mismatches.length > 0 && (
                                <div className="prep-val-mismatches-box">
                                  <h5>⚠️ 발견된 불일치 경로 (Mismatch Diff)</h5>
                                  <table className="prep-val-diff-table">
                                    <thead>
                                      <tr>
                                        <th>데이터 경로 (Dot Path)</th>
                                        <th>기대값 (Expected)</th>
                                        <th>실제값 (Actual)</th>
                                        <th>불일치 사유</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {res.mismatches.map((mis, idx) => (
                                        <tr key={idx}>
                                          <td><code>{mis.path}</code></td>
                                          <td><span className="val-expected">{String(mis.expected)}</span></td>
                                          <td><span className="val-actual">{String(mis.actual)}</span></td>
                                          <td><em>{mis.reason}</em></td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              <footer className="prep-val-item-footer">
                                {itemFixture.source && (
                                  <div>
                                    <span><b>검증 출처:</b> {itemFixture.source}</span>
                                  </div>
                                )}
                                {itemFixture.notes && (
                                  <div className="prep-val-notes">
                                    <span><b>학술 메모:</b> {itemFixture.notes}</span>
                                  </div>
                                )}
                              </footer>
                            </article>
                          )
                        })}
                    </div>
                  </>
                ) : (
                  <p className="prep-val-loading-placeholder">데이터를 분석하는 데 시간이 걸립니다. [검증 새로고침] 버튼을 눌러 실행을 시작하십시오.</p>
                )}
              </div>
            </details>
          </section>
        </>
      )}
    </main>
  )
}
