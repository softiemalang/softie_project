import { useEffect, useMemo, useState } from 'react'
import { navigate } from '../lib/router'
import { getSajuReportEvaluations } from './api'

function formatDateTime(value) {
  if (!value) return '-'

  try {
    return new Intl.DateTimeFormat('ko-KR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function getGradeLabel(grade) {
  if (grade === 'pass') return 'PASS'
  if (grade === 'watch') return 'WATCH'
  if (grade === 'fix') return 'FIX'
  return String(grade || 'UNKNOWN').toUpperCase()
}

function collectIssueTypes(issues) {
  if (!Array.isArray(issues)) return []
  return [...new Set(issues.map(issue => issue?.type).filter(Boolean))]
}

function collectSections(issues) {
  if (!Array.isArray(issues)) return []
  return [...new Set(issues.map(issue => issue?.section).filter(Boolean))]
}

function buildCopySummary(evaluations) {
  return evaluations
    .map((evaluation, index) => {
      const issues = Array.isArray(evaluation.issues) ? evaluation.issues : []
      const repeatAxis = evaluation.repeat_axis && typeof evaluation.repeat_axis === 'object'
        ? JSON.stringify(evaluation.repeat_axis, null, 2)
        : '{}'
      const issueLines = issues.length > 0
        ? issues.map((issue, issueIndex) => {
            const parts = [
              `#${issueIndex + 1}`,
              issue?.type ? `type=${issue.type}` : null,
              issue?.section ? `section=${issue.section}` : null,
              issue?.severity ? `severity=${issue.severity}` : null,
              issue?.problem ? `problem=${issue.problem}` : null,
              issue?.suggestion ? `suggestion=${issue.suggestion}` : null,
            ].filter(Boolean)

            return parts.join(' | ')
          }).join('\n')
        : '이슈 없음'

      return [
        `[${index + 1}] ${evaluation.report_date || '-'}`,
        `overall_grade: ${evaluation.overall_grade || '-'}`,
        'issues:',
        issueLines,
        'repeat_axis:',
        repeatAxis,
        'codex_prompt:',
        evaluation.codex_prompt || '-',
      ].join('\n')
    })
    .join('\n\n---\n\n')
}

export default function SajuEvaluationPage() {
  const [evaluations, setEvaluations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [expandedMap, setExpandedMap] = useState({})
  const [copyStatus, setCopyStatus] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadEvaluations() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const data = await getSajuReportEvaluations(20)
        if (!isMounted) return
        setEvaluations(data)
      } catch (error) {
        console.error('Failed to load saju evaluations:', error)
        if (!isMounted) return
        setErrorMessage('사주 리포트 평가 로그를 불러오지 못했어요. 잠시 후 다시 확인해 주세요.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadEvaluations()

    return () => {
      isMounted = false
    }
  }, [])

  const summary = useMemo(() => {
    const gradeCounts = { pass: 0, watch: 0, fix: 0 }
    const issueTypeCounts = {}

    for (const evaluation of evaluations) {
      if (evaluation?.overall_grade && evaluation.overall_grade in gradeCounts) {
        gradeCounts[evaluation.overall_grade] += 1
      }

      if (Array.isArray(evaluation?.issues)) {
        for (const issue of evaluation.issues) {
          if (!issue?.type) continue
          issueTypeCounts[issue.type] = (issueTypeCounts[issue.type] || 0) + 1
        }
      }
    }

    const topIssueType = Object.entries(issueTypeCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '-'

    return {
      total: evaluations.length,
      pass: gradeCounts.pass,
      watch: gradeCounts.watch,
      fix: gradeCounts.fix,
      topIssueType,
    }
  }, [evaluations])

  function toggleExpanded(id) {
    setExpandedMap(current => ({ ...current, [id]: !current[id] }))
  }

  async function handleCopySummary() {
    if (!evaluations.length) {
      setCopyStatus('복사할 평가 로그가 없어요.')
      return
    }

    if (!navigator?.clipboard?.writeText) {
      setCopyStatus('이 브라우저에서는 클립보드 복사를 지원하지 않아요.')
      return
    }

    try {
      await navigator.clipboard.writeText(buildCopySummary(evaluations))
      setCopyStatus('최근 평가 요약을 복사했어요.')
    } catch (error) {
      console.error('Failed to copy evaluation summary:', error)
      setCopyStatus('복사에 실패했어요. 브라우저 권한을 확인해 주세요.')
    }
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="eyebrow">SAJU EVALUATOR</p>
        <h1>사주 리포트 평가 로그</h1>
        <p className="subtle">
          매일 자동 평가된 사주 리포트 품질을 확인하고, 개선 포인트를 정리하기 위한 관리자용 조회 화면입니다.
        </p>
        <div className="saju-evaluation-hero-actions">
          <button type="button" className="soft-button" onClick={() => navigate('/')}>
            홈으로 돌아가기
          </button>
          <button type="button" className="soft-button" onClick={() => navigate('/fortune')}>
            운세 페이지
          </button>
          <button type="button" className="soft-button" onClick={handleCopySummary} disabled={isLoading || evaluations.length === 0}>
            최근 평가 요약 복사
          </button>
        </div>
        {copyStatus ? <p className="subtle saju-evaluation-copy-status">{copyStatus}</p> : null}
      </header>

      <section className="saju-evaluation-summary-grid">
        <article className="card saju-evaluation-stat-card">
          <p className="section-kicker">최근 평가</p>
          <strong>{summary.total}건</strong>
          <p className="subtle">현재 화면에 로드된 최신 평가 수입니다.</p>
        </article>
        <article className="card saju-evaluation-stat-card">
          <p className="section-kicker">등급 분포</p>
          <strong>{summary.pass} / {summary.watch} / {summary.fix}</strong>
          <p className="subtle">PASS / WATCH / FIX 순서로 집계했습니다.</p>
        </article>
        <article className="card saju-evaluation-stat-card">
          <p className="section-kicker">주요 이슈</p>
          <strong>{summary.topIssueType}</strong>
          <p className="subtle">최근 로그에서 가장 자주 나온 issue type입니다.</p>
        </article>
      </section>

      {errorMessage ? <p className="status">{errorMessage}</p> : null}

      <section className="saju-evaluation-list" aria-live="polite">
        {isLoading ? (
          <article className="card saju-evaluation-item">
            <p className="subtle">평가 로그를 불러오는 중입니다...</p>
          </article>
        ) : evaluations.length === 0 ? (
          <article className="card saju-evaluation-item">
            <p className="subtle">표시할 평가 로그가 아직 없어요.</p>
          </article>
        ) : (
          evaluations.map((evaluation) => {
            const issues = Array.isArray(evaluation.issues) ? evaluation.issues : []
            const issueTypes = collectIssueTypes(issues)
            const sections = collectSections(issues)
            const isExpanded = !!expandedMap[evaluation.id]

            return (
              <article key={evaluation.id} className="card saju-evaluation-item">
                <div className="saju-evaluation-item-head">
                  <div className="saju-evaluation-item-main">
                    <div className="saju-evaluation-item-topline">
                      <p className="section-kicker">{evaluation.report_date || '-'}</p>
                      <span className={`saju-evaluation-grade ${evaluation.overall_grade || ''}`}>
                        {getGradeLabel(evaluation.overall_grade)}
                      </span>
                    </div>
                    <div className="saju-evaluation-meta-grid">
                      <div>
                        <span className="saju-evaluation-meta-label">issue_count</span>
                        <strong>{issues.length}</strong>
                      </div>
                      <div>
                        <span className="saju-evaluation-meta-label">evaluated_at</span>
                        <strong>{formatDateTime(evaluation.evaluated_at)}</strong>
                      </div>
                      <div>
                        <span className="saju-evaluation-meta-label">model</span>
                        <strong>{evaluation.model_name || '-'}</strong>
                      </div>
                    </div>
                    <div className="saju-evaluation-chip-row">
                      {issueTypes.length > 0 ? issueTypes.map(type => (
                        <span key={type} className="saju-evaluation-chip">{type}</span>
                      )) : (
                        <span className="saju-evaluation-chip">issue 없음</span>
                      )}
                    </div>
                    <div className="saju-evaluation-chip-row">
                      {sections.length > 0 ? sections.map(section => (
                        <span key={section} className="saju-evaluation-chip soft">{section}</span>
                      )) : (
                        <span className="saju-evaluation-chip soft">section 없음</span>
                      )}
                    </div>
                  </div>
                  <button type="button" className="soft-button" onClick={() => toggleExpanded(evaluation.id)}>
                    {isExpanded ? '상세 접기' : '상세 보기'}
                  </button>
                </div>

                {isExpanded ? (
                  <div className="saju-evaluation-detail">
                    <section>
                      <div className="card-header">
                        <div>
                          <p className="section-kicker">Issues</p>
                          <h2>이슈 상세</h2>
                        </div>
                      </div>
                      {issues.length > 0 ? (
                        <div className="saju-evaluation-issue-list">
                          {issues.map((issue, index) => (
                            <article key={`${evaluation.id}-issue-${index}`} className="saju-evaluation-issue">
                              <div className="saju-evaluation-issue-tags">
                                {issue?.type ? <span className="saju-evaluation-chip">{issue.type}</span> : null}
                                {issue?.section ? <span className="saju-evaluation-chip soft">{issue.section}</span> : null}
                                {issue?.severity ? <span className="saju-evaluation-chip soft">{issue.severity}</span> : null}
                              </div>
                              <p><strong>problem</strong> {issue?.problem || '-'}</p>
                              <p><strong>evidence</strong> {issue?.evidence || '-'}</p>
                              <p><strong>suggestion</strong> {issue?.suggestion || '-'}</p>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <p className="subtle">등록된 이슈가 없습니다.</p>
                      )}
                    </section>

                    <section>
                      <p className="section-kicker">Repeat Axis</p>
                      <div className="saju-evaluation-repeat-grid">
                        {Object.entries(evaluation.repeat_axis || {}).length > 0 ? (
                          Object.entries(evaluation.repeat_axis || {}).map(([key, value]) => (
                            <div key={key} className="saju-evaluation-repeat-card">
                              <span className="saju-evaluation-meta-label">{key}</span>
                              <strong>{String(value)}</strong>
                            </div>
                          ))
                        ) : (
                          <p className="subtle">repeat_axis 데이터가 없습니다.</p>
                        )}
                      </div>
                    </section>

                    <section className="saju-evaluation-copy-block">
                      <p className="section-kicker">Codex Prompt</p>
                      <pre>{evaluation.codex_prompt || '-'}</pre>
                    </section>

                    {evaluation.warning ? (
                      <section className="saju-evaluation-copy-block">
                        <p className="section-kicker">Warning</p>
                        <pre>{evaluation.warning}</pre>
                      </section>
                    ) : null}

                    <details className="saju-evaluation-copy-block">
                      <summary>retrieved_chunks 보기</summary>
                      <pre>{JSON.stringify(evaluation.retrieved_chunks || [], null, 2)}</pre>
                    </details>
                  </div>
                ) : null}
              </article>
            )
          })
        )}
      </section>
    </div>
  )
}
