import { useEffect, useMemo, useState } from 'react'
import { navigate } from '../lib/router'
import { ChatHandoffCard } from './components/ChatHandoffCard.jsx'
import { prepareThreeSystemInterpretationData } from './threeSystemPrepPipeline.js'

import {
  DEFAULT_INPUT,
  DEFAULT_PROFILES,
  getKoreaReferenceCity,
  INTERPRETATION_PREP_SCHEMA_VERSION,
  KOREA_REFERENCE_CITIES,
  STATUS_META,
} from './schema.js'
import './interpretationPrep.css'

const STORAGE_KEY = 'softie.interpretationPrep.draft.v1'

function EpistemicMetadataViewer({ metadata, title = '분석 상태 및 근거 상세' }) {
  if (!metadata) return null

  const statusLabels = {
    derived: '파생 결과',
    candidate: '검토 후보',
    fact: '확정 계산',
    notable: '주목 포인트',
    open: '열린 쟁점',
  }

  const confidenceLabels = {
    high: '확신도 높음',
    medium: '확신도 중간',
    low: '추가 검토 필요',
  }

  const statusText = statusLabels[metadata.epistemicStatus] || metadata.epistemicStatus || '파생 결과'
  const confidenceText = confidenceLabels[metadata.confidence] || (metadata.confidence ? `확신도 ${metadata.confidence}` : '')

  return (
    <div className="epistemic-metadata-container">
      <div className="epistemic-badges">
        <span className={`epistemic-badge status-${metadata.epistemicStatus || 'derived'}`}>
          {statusText}
        </span>
        {confidenceText && (
          <span className={`epistemic-badge confidence-${metadata.confidence || 'medium'}`}>
            {confidenceText}
          </span>
        )}
      </div>

      <details className="epistemic-details">
        <summary className="epistemic-summary">{title}</summary>
        <div className="epistemic-content">
          {metadata.method?.label && (
            <div className="epistemic-row">
              <strong className="epistemic-label">분석 방법</strong>
              <span className="epistemic-val">{metadata.method.label}</span>
            </div>
          )}

          {metadata.reviewNotes && (
            <div className="epistemic-row">
              <strong className="epistemic-label">검토 메모</strong>
              <p className="epistemic-val epistemic-notes">{metadata.reviewNotes}</p>
            </div>
          )}

          {Array.isArray(metadata.evidence) && metadata.evidence.length > 0 && (
            <div className="epistemic-row">
              <strong className="epistemic-label">근거 요소</strong>
              <ul className="epistemic-list">
                {metadata.evidence.map((ev, idx) => (
                  <li key={idx}>
                    {ev.role ? <span><b>{ev.role}</b>: </span> : null}
                    <span>{ev.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(metadata.alternatives) && metadata.alternatives.length > 0 && (
            <div className="epistemic-row">
              <strong className="epistemic-label">다른 가능성</strong>
              <div className="epistemic-chips">
                {metadata.alternatives.map((alt, idx) => (
                  <span key={idx} className="epistemic-chip">{alt}</span>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(metadata.limitations) && metadata.limitations.length > 0 && (
            <div className="epistemic-row">
              <strong className="epistemic-label">제약 및 유의사항</strong>
              <ul className="epistemic-list">
                {metadata.limitations.map((lim, idx) => (
                  <li key={idx}>{lim}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </details>
    </div>
  )
}

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

function digitsOnly(value, maxLength) {
  return String(value || '').replace(/\D/g, '').slice(0, maxLength)
}

function formatDateDraft(value) {
  const digits = digitsOnly(value, 8)
  if (digits.length <= 4) return digits
  if (digits.length <= 6) return `${digits.slice(0, 4)}.${digits.slice(4)}`
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`
}

function formatDateValue(value) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return value.replaceAll('-', '.')
  return formatDateDraft(value)
}

function normalizeDateDraft(value) {
  const digits = digitsOnly(value, 8)
  if (digits.length !== 8) return ''

  const year = Number(digits.slice(0, 4))
  const month = Number(digits.slice(4, 6))
  const day = Number(digits.slice(6, 8))
  const candidate = new Date(Date.UTC(year, month - 1, day))
  const isValidDate = candidate.getUTCFullYear() === year
    && candidate.getUTCMonth() === month - 1
    && candidate.getUTCDate() === day

  if (!isValidDate || year < 1901 || year > 2100) return ''
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
}

function formatTimeDraft(value) {
  const digits = digitsOnly(value, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

function formatTimeValue(value) {
  if (/^\d{2}:\d{2}$/.test(value || '')) return value
  return formatTimeDraft(value)
}

function normalizeTimeDraft(value) {
  const digits = digitsOnly(value, 4)
  if (digits.length !== 4) return ''

  const hour = Number(digits.slice(0, 2))
  const minute = Number(digits.slice(2, 4))
  if (hour > 23 || minute > 59) return ''
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`
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
        // The timing reference is fixed when the user creates Chat materials.
        targetDate: todayInKorea(),
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
          {scope.experimental?.length > 0 && (
            <>
              <strong className="prep-support-experimental-label">실험적 파생 판정 (Experimental)</strong>
              <ul>
                {scope.experimental.map(({ item, basis }) => (
                  <li key={item}><b>{item}</b><span>{basis}</span></li>
                ))}
              </ul>
            </>
          )}
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
                <span className="prep-feature-category">{item.category === 'experimental' ? '검토 중' : item.category}</span>
                <h3>{item.title.replace('[실험적 분석]', '[검토 중]')}</h3>
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
          <h3>
            {result.raw.dayMaster.candidates?.length > 1
              ? `일간 후보 ${result.raw.dayMaster.candidates.join(' · ')}`
              : `${result.raw.dayMaster.stem}${result.raw.dayMaster.element} 일간`}
          </h3>
        </div>
        <StatusBadge status={result.status} />
      </div>
      <PillarGrid pillars={result.raw.pillars} />



      {result.raw.experimental?.status === 'candidate_required' && (
        <section className="prep-data-panel prep-profile-panel">
          <p className="prep-experimental-warning">
            {result.raw.experimental.description} 후보 명식과 근거를 먼저 확인한 뒤 강약·격국·용신·신살을 비교해 주세요.
          </p>
        </section>
      )}

      {(() => {
        const primaryCandidates = result.raw.candidates || []
        const displayCandidates = primaryCandidates.length > 1
          ? primaryCandidates
          : (primaryCandidates[0]?.sourceCandidates?.length > 1 ? primaryCandidates[0].sourceCandidates : [])
        if (displayCandidates.length <= 1) return null

        return (
          <section className="prep-data-panel prep-profile-panel">
            <div className="prep-mini-head">
              <h4>해석 후보 목록 (Candidates A/B)</h4>
              <span>{displayCandidates.length}개 해석 후보 · 단정 없이 묶음으로 검토</span>
            </div>
            <div className="prep-profile-list">
              {displayCandidates.map((candidate, idx) => (
                <div key={candidate.id || candidate.candidateId || idx} className="candidate-card-item">
                  <div className="candidate-card-header">
                    <strong>후보 {String.fromCharCode(65 + idx)}: {candidate.label}</strong>
                    {candidate.status && <span className="prep-badge warning">{candidate.status}</span>}
                  </div>
                  {candidate.inputAssumption && (
                    <p className="candidate-assumption">가정: {candidate.inputAssumption}</p>
                  )}
                  {candidate.utcDateTime && (
                    <p className="candidate-utc">UTC: <code>{candidate.utcDateTime}</code> ({candidate.timezoneRuleVersion || '표준 시간대 규칙'})</p>
                  )}
                  <div className="candidate-pillars-row">
                    명식: {candidate.pillars ? ['year', 'month', 'day', 'hour'].map((key) => `${candidate.pillars[key]?.label || key}: ${candidate.pillars[key]?.value || '미상'}`).join(' · ') : '동일 명식'}
                  </div>
                  <div className="candidate-derived-row">
                    <span>일간: <strong>{candidate.dayMaster || '미상'}</strong></span>
                    <span>첫 대운: {candidate.timing?.daYun?.startAge ? `${candidate.timing.daYun.startAge.years}세` : '미상'}</span>
                    <span>강약: {candidate.experimental?.strength?.level || '미산출'}</span>
                    <span>격국: {candidate.experimental?.gyeokguk?.name || '미산출'}</span>
                    <span>용신: {candidate.experimental?.yongShin?.primaryYongShinElement || '미산출'}</span>
                  </div>
                </div>
              ))}
            </div>

          {result.raw.candidateComparison && (
            <div className="candidate-comparison-block">
              <h5>후보 간 비교 (Structured Diff)</h5>
              {result.raw.candidateComparison.status === 'equivalent_pillars' && (
                <p className="candidate-eq-notice">
                  ※ 두 실제 시각의 사주팔자(명식)는 동일하지만, UTC 시각 및 시간 기반 파생 결과가 다릅니다.
                </p>
              )}

              {result.raw.candidateComparison.equivalentFields?.length > 0 && (
                <div className="comparison-eq-list">
                  <strong>동일 항목:</strong>{' '}
                  {result.raw.candidateComparison.equivalentFields.map((eq) => `${eq.label || eq.field} (${eq.value})`).join(' · ')}
                </div>
              )}

              {result.raw.candidateComparison.differences?.length > 0 ? (
                <ul className="comparison-diff-list">
                  {result.raw.candidateComparison.differences.map((diff, idx) => (
                    <li key={idx}>
                      <strong>{diff.label || diff.field}:</strong> Candidate A (<code>{diff.candidateA}</code>) vs Candidate B (<code>{diff.candidateB}</code>)
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="prep-timing-note">달라지는 주요 항목이 없습니다.</p>
              )}
            </div>
          )}
        </section>
      )})()}

      {/* 1. 사주 학파 표준 프로필 패널 */}
      {result.raw.experimental?.strength && result.raw.experimental?.status !== 'candidate_required' && (
        <section className="prep-data-panel prep-profile-panel">
          <div className="prep-mini-head">
            <h4>사주 분석 프로필</h4>
            <span>정량적 원국 심층 분석</span>
          </div>

          <p className="prep-experimental-warning">
            강약·격국·용신·신살은 현재 검토 중인 분석 결과입니다. 최종 판정이 아닌 해석 준비용 참고 자료로 사용해 주세요.
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
                <EpistemicMetadataViewer
                  metadata={result.raw.experimental?.strength?.epistemicMetadata}
                  title="일간 강도 평가 근거 및 유의사항 보기"
                />
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
                    <EpistemicMetadataViewer
                      metadata={result.raw.experimental.gyeokguk.specialStructureCandidate.epistemicMetadata}
                      title="특수격 후보 검토 근거 보기"
                    />
                  </div>
                )}
              </div>
              <div className="profile-section-item profile-box ag-glass">
                <strong className="profile-sub-label text-green">용희신 (YongShin & HeeShin)</strong>
                <h5>
                  용신: {result.raw.experimental?.yongShin?.primaryYongShinElement || '불명'} 오행 / 희신: {result.raw.experimental?.yongShin?.heeShinElement || '불명'} 오행
                </h5>
                <span className="profile-meta-text">
                  판단 신뢰도: {
                    result.raw.experimental?.yongShin?.confidence === 'high'
                      ? '높음'
                      : result.raw.experimental?.yongShin?.confidence === 'medium'
                        ? '보통'
                        : '추가 검토 필요 (낮음)'
                  }
                </span>
                <p className="profile-desc-text">
                  {result.raw.experimental?.yongShin?.statement || ''} {result.raw.experimental?.yongShin?.chohu ? `(조후 보완: ${result.raw.experimental.yongShin.chohu.statement})` : ''}
                </p>
                <EpistemicMetadataViewer
                  metadata={result.raw.experimental?.yongShin?.epistemicMetadata}
                  title="희용신 분석 상태 및 근거 상세"
                />
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
        <div className="prep-mini-head">
          <h4>오행 단순 분포</h4>
          <span>{result.raw.birthTimeUnknown ? '정오 기준 · 시주 제외' : '지장간·계절 가중 전'}</span>
        </div>
        <ElementDistribution counts={result.raw.elements.counts} />
      </section>
      <div className="prep-warning-box">
        <strong>검증 알림</strong>
        <ul>
          {result.warnings.map((warning) => <li key={warning}>{warning}</li>)}
        </ul>
      </div>
    </div>
  )
}

export default function InterpretationPrepPage() {
  const savedDraft = useMemo(loadSavedDraft, [])
  const [input, setInput] = useState(savedDraft?.input || { ...DEFAULT_INPUT, targetDate: todayInKorea() })
  const [textDrafts, setTextDrafts] = useState(() => ({
    birthDate: formatDateValue(savedDraft?.input?.birthDate || ''),
    birthTime: formatTimeValue(savedDraft?.input?.birthTime || ''),
  }))
  const [profiles, setProfiles] = useState(savedDraft?.profiles || DEFAULT_PROFILES)
  const [saveLocally, setSaveLocally] = useState(Boolean(savedDraft))
  const [error, setError] = useState('')
  const selectedReferenceCity = getKoreaReferenceCity(input.referenceCity)

  useEffect(() => {
    if (!saveLocally) return
    try {
      const { targetDate: _targetDate, ...draftInput } = input
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ input: draftInput, profiles }))
    } catch (storageError) {
      console.warn('[InterpretationPrep] Failed to save local draft.', storageError)
    }
  }, [input, profiles, saveLocally])

  function updateInput(key, value) {
    setInput((current) => ({ ...current, [key]: value }))
    setError('')
  }

  function updateDateDraft(key, value) {
    const formatted = formatDateDraft(value)
    setTextDrafts((current) => ({ ...current, [key]: formatted }))
    updateInput(key, normalizeDateDraft(formatted))
  }

  function updateTimeDraft(value) {
    const formatted = formatTimeDraft(value)
    const normalized = normalizeTimeDraft(formatted)
    setTextDrafts((current) => ({ ...current, birthTime: formatted }))
    setInput((current) => ({
      ...current,
      birthTime: normalized,
      timeAccuracy: 'exact',
    }))
    setError('')
  }

  function setTimeAccuracyMode(mode) {
    if (mode === 'unknown') {
      setTextDrafts((current) => ({ ...current, birthTime: '12:00' }))
      setInput((current) => ({
        ...current,
        birthTime: '12:00',
        timeAccuracy: 'unknown',
      }))
    } else if (mode === 'range') {

      setInput((current) => ({
        ...current,
        timeAccuracy: 'range',
        birthTimeStart: current.birthTimeStart || '13:00',
        birthTimeEnd: current.birthTimeEnd || '15:00',
      }))
    } else {
      setInput((current) => ({
        ...current,
        timeAccuracy: 'exact',
      }))
    }
    setError('')
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

  function prepareForChat() {
    try {
      const nextResult = prepareThreeSystemInterpretationData({
        ...input,
        targetDate: todayInKorea(),
      }, profiles)
      setError('')
      return nextResult
    } catch (calculationError) {
      setError(calculationError.message || '출생정보를 확인한 뒤 다시 시도해 주세요.')
      throw calculationError
    }
  }


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
            <p className="subtle">현재 지원되는 사주 계산값과 불확실성을 분리해 대화형 모델에 전달하는 준비 도구입니다. 최종 성격이나 미래를 단정하지 않습니다.</p>
          </div>
        </div>
      </header>

      <div className="prep-workspace">
        <section className="card prep-card ag-glass" id="prep-input" aria-labelledby="prep-input-title">
          <div className="card-header">
            <div>
              <p className="section-kicker">01 · INPUT LAYER</p>
              <h2 id="prep-input-title">출생정보</h2>
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
              <div className="prep-gender-control" role="group" aria-labelledby="prep-gender-label">
                <button
                  type="button"
                  aria-pressed={input.gender === 'male'}
                  className={`prep-gender-option ${input.gender === 'male' ? 'is-active' : ''}`}
                  onClick={() => updateInput('gender', 'male')}
                >
                  남성
                </button>
                <button
                  type="button"
                  aria-pressed={input.gender === 'female'}
                  className={`prep-gender-option ${input.gender === 'female' ? 'is-active' : ''}`}
                  onClick={() => updateInput('gender', 'female')}
                >
                  여성
                </button>
              </div>
            </div>
            <LabeledField label="출생일">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="bday"
                placeholder="YYYY.MM.DD"
                maxLength={10}
                pattern="[0-9.]*"
                required
                value={textDrafts.birthDate}
                onChange={(event) => updateDateDraft('birthDate', event.target.value)}
              />
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
              <div className="prep-time-row">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="HH:MM (예: 14:40)"
                  maxLength={5}
                  pattern="[0-9:]*"
                  value={input.timeAccuracy === 'unknown' ? '12:00' : textDrafts.birthTime}
                  onChange={(event) => {
                    if (input.timeAccuracy === 'unknown') {
                      setTimeAccuracyMode('exact')
                    }
                    updateTimeDraft(event.target.value)
                  }}
                  onClick={() => {
                    if (input.timeAccuracy === 'unknown') {
                      setTimeAccuracyMode('exact')
                    }
                  }}
                />
                <button
                  type="button"
                  className={`prep-time-unknown-toggle ${input.timeAccuracy === 'unknown' ? 'is-active' : ''}`}
                  aria-pressed={input.timeAccuracy === 'unknown'}
                  onClick={() => {
                    if (input.timeAccuracy === 'unknown') {
                      setTimeAccuracyMode('exact')
                    } else {
                      setTimeAccuracyMode('unknown')
                    }
                  }}
                >
                  모름
                </button>

              </div>
              {input.timeAccuracy === 'unknown' && (
                <p className="prep-field-hint prep-time-unknown-hint">
                  정오 12:00를 대표 시각으로 사용하되, 시주와 하우스의 불확실성은 그대로 보존합니다.
                </p>
              )}
            </LabeledField>


          </div>
          <details className="prep-advanced-inputs">
            <summary>
              <span>세부 입력과 계산 환경</span>
              <small>도시 · 시간대 · 좌표</small>
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
            <p className="prep-advanced-note">운 흐름 기준일은 자료 생성 시점의 한국 날짜로 고정합니다. 국내 시간대는 모두 Asia/Seoul로 동일하며, 선택한 기준 도시의 경도 보정을 적용합니다. 주요 도시 후보에서 기둥이 달라지는 경계 시각은 검증 필요로 표시합니다.</p>
          </details>
          <label className="prep-save-toggle">
            <input type="checkbox" checked={saveLocally} onChange={(event) => handleSavePreference(event.target.checked)} />
            <span><strong>이 브라우저에 입력 저장</strong><small>클라우드로 전송하지 않으며, 계산 결과는 저장하지 않습니다.</small></span>
          </label>
          {error && <p className="prep-form-error" role="alert">{error}</p>}
        </section>
      </div>

      <section className="prep-handoff-section" id="prep-handoff" aria-label="Chat 전달 자료 만들기">
        <ChatHandoffCard onPrepare={prepareForChat} />
      </section>
    </main>
  )
}
