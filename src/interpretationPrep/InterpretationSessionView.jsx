/**
 * LAB ONLY — preserved Session/Conversation prototype.
 * InterpretationPrepPage does not import or render this component.
 */
import React, { useState } from 'react'
import { QuestionStarter } from './components/QuestionStarter'
import { LensPriorityCard } from './components/LensPriorityCard'
import { LensTabs } from './components/LensTabs'
import { PerspectiveCard } from './components/PerspectiveCard'
import { SynthesisCard } from './components/SynthesisCard'
import { ReflectionCard, PracticalSuggestionCard } from './components/ReflectionCard'

import { createInterpretationSession, continueSession } from './interpretationSession'
import { createStructuredSessionResponse } from './sessionResponseSchema'

export function InterpretationSessionView({ sajuContext = {}, ziweiContext = {}, astrologyContext = {} }) {
  const [sessionStatus, setSessionStatus] = useState('idle') // idle | analyzing | completed | error
  const [currentSessionInstance, setCurrentSessionInstance] = useState(null)
  const [conversationHistory, setConversationHistory] = useState([]) // Stores turns
  const [activeTab, setActiveTab] = useState('saju')

  const generateTurnResponse = (sessionInstance, turnIndex = 1) => {
    const { sessionState, unifiedContext } = sessionInstance
    const sajuFactual = unifiedContext.sajuContext?.candidateSetConsensus?.factual || {}
    const ziweiFactual = unifiedContext.ziweiContext?.candidateSetConsensus?.factual || {}
    const availableSystems = unifiedContext.availableSystems || []

    const userProvidedCtx = sessionState.userProvidedContext || []
    const latestUserContext = userProvidedCtx.length > 0 ? userProvidedCtx[userProvidedCtx.length - 1] : ''

    const isFollowup = turnIndex > 1

    const perspectives = {}
    if (availableSystems.includes('saju')) {
      perspectives.saju = {
        label: '사주 렌즈',
        insight: sajuFactual.dayMaster
          ? `일간 ${sajuFactual.dayMaster} 중심의 계산 근거를 확인합니다.`
          : '제공된 사주 계산 Context를 확인합니다.',
        evidence: sajuFactual.dayMaster ? [`일간 ${sajuFactual.dayMaster}`] : [],
      }
    }
    if (availableSystems.includes('ziwei')) {
      perspectives.ziwei = {
        label: '자미두수 렌즈 (Experimental)',
        insight: ziweiFactual.mingGongBranch
          ? `명궁 ${ziweiFactual.mingGongBranch}宮의 고정 RuleSet 계산 근거를 확인합니다.`
          : '제공된 자미두수 계산 Context를 확인합니다.',
        evidence: ziweiFactual.mingGongBranch ? [`명궁 ${ziweiFactual.mingGongBranch}宮`] : [],
      }
    }

    return createStructuredSessionResponse({
      sessionId: sessionState.sessionId,
      topic: sessionState.currentTopic?.primary || 'general',
      confidenceSummary: unifiedContext.unifiedConfidence?.overallConfidence || 'high',
      statusType: availableSystems.length > 0 ? 'partial' : 'insufficient_data',
      warnings: unifiedContext.warnings || [],
      summary: {
        title: isFollowup
          ? `[Turn ${turnIndex}] 경험과 나누는 사용 가능 관점`
          : `[${sessionState.currentTopic?.primary.toUpperCase()}] 사용 가능한 계산 관점`,
        coreMessage: isFollowup
          ? `내담자님의 경험("${latestUserContext}")과 사용 가능한 계산 근거를 함께 확인합니다.`
          : `"${sessionState.currentQuestion}"라는 고민을 사용 가능한 계산 근거 안에서 살펴봅니다.`,
      },
      perspectives,
      synthesis: {
        sharedThemes: unifiedContext.sharedThemes || [],
        differentPerspectives: unifiedContext.differentPerspectives || [],
      },
      reflectionQuestions: isFollowup
        ? ['새롭게 조명된 이 관점들이 현재 상황에 어떤 힌트를 주나요?']
        : [
            '최근 자신의 경험 속에서 제공된 계산 관점과 맞닿는 모습이 있으셨나요?',
            '실제 삶에서 주변 환경과의 관계를 어떻게 조화시키고 계신가요?',
          ],
      practicalSuggestions: [
        '내면 기질과 대외 환경의 결이 맞는 방향으로 작은 실천을 시도해보세요.',
      ],
    })
  }

  const handleAskQuestion = (questionText) => {
    setSessionStatus('analyzing')

    setTimeout(() => {
      try {
        const sessionInstance = createInterpretationSession({
          userQuestion: questionText,
          sajuContext,
          ziweiContext,
          astrologyContext,
        })

        const firstResponse = generateTurnResponse(sessionInstance, 1)

        setCurrentSessionInstance(sessionInstance)
        setConversationHistory([{ turn: 1, question: questionText, response: firstResponse }])
        setSessionStatus('completed')

        const availableSystems = sessionInstance.unifiedContext.availableSystems || []
        const primaryLens = sessionInstance.sessionState.lensPriority?.primary
          ?.find((system) => availableSystems.includes(system))
          || availableSystems[0]
          || 'saju'
        setActiveTab(primaryLens)
      } catch (err) {
        console.error(err)
        setSessionStatus('error')
      }
    }, 600)
  }

  const handleContinueSession = (userResponse) => {
    if (!currentSessionInstance) return
    setSessionStatus('analyzing')

    setTimeout(() => {
      try {
        const updatedSessionInstance = continueSession({
          currentSession: currentSessionInstance,
          userResponse,
        })

        const nextTurnIndex = conversationHistory.length + 1
        const nextResponse = generateTurnResponse(updatedSessionInstance, nextTurnIndex)

        setCurrentSessionInstance(updatedSessionInstance)
        setConversationHistory((prev) => [
          ...prev,
          { turn: nextTurnIndex, question: userResponse, response: nextResponse },
        ])
        setSessionStatus('completed')
      } catch (err) {
        console.error(err)
        setSessionStatus('error')
      }
    }, 500)
  }

  return (
    <div className="interpretation-session-view max-w-4xl mx-auto">
      {/* 1. Question Starter */}
      <QuestionStarter onSubmitQuestion={handleAskQuestion} disabled={sessionStatus === 'analyzing'} />

      {/* 2. Loading State */}
      {sessionStatus === 'analyzing' && (
        <div className="card prep-card ag-glass text-center my-6 p-6 animate-pulse" style={{ background: 'var(--surface-glass)', borderColor: 'var(--line-strong)' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔮</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.25rem' }}>대화 맥락과 3대 점술 렌즈를 조율 중입니다...</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>사주·자미두수·점성학 Context를 교차 반영하고 있습니다.</div>
        </div>
      )}

      {/* 3. Error State */}
      {sessionStatus === 'error' && (
        <div style={{ background: 'var(--danger-soft)', borderColor: 'var(--danger)', color: 'var(--text)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-control)', textAlign: 'center', fontSize: '0.8rem', margin: '1rem 0' }}>
          세션 처리 중 오류가 발생했습니다. 다시 시도해주세요.
        </div>
      )}

      {/* 4. Multi-Turn Conversation History */}
      {conversationHistory.length > 0 && currentSessionInstance && (
        <div className="session-output-container animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Lens Priority Indicator Card */}
          <LensPriorityCard lensPriority={currentSessionInstance.sessionState.lensPriority} />

          {conversationHistory.map((item) => (
            <div key={item.turn} className="turn-container" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '1.5rem' }}>
              {/* User Question / Response Banner */}
              <div style={{ background: 'rgba(17, 17, 14, 0.45)', padding: '0.65rem 0.95rem', borderRadius: 'var(--radius-control)', border: '1px solid var(--line)', marginBottom: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--brand)' }}>Turn {item.turn} · 내담자:</span>
                <span>"{item.question}"</span>
              </div>

              {/* Core Summary Card */}
              <div className="card prep-card ag-glass" style={{ padding: '1.25rem 1.4rem', borderRadius: 'var(--radius-card)', background: 'var(--surface-glass)', border: '1px solid var(--line-liquid)', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--brand)', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>TOGETHER VIEWED PERSPECTIVES</div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.45rem' }}>{item.response.summary.title}</h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{item.response.summary.coreMessage}</p>
              </div>

              {/* 3-System Perspective Tabs */}
              <LensTabs
                activeTab={activeTab}
                onChangeTab={setActiveTab}
                availableSystems={currentSessionInstance.unifiedContext.availableSystems}
              />
              <PerspectiveCard perspectiveData={item.response.perspectives[activeTab]} />

              {/* Multi-Lens Synthesis Card */}
              <SynthesisCard synthesisData={item.response.synthesis} />

              {/* Reflection Questions Card (Latest Turn gets active input form) */}
              {item.turn === conversationHistory.length ? (
                <ReflectionCard
                  questions={item.response.reflectionQuestions}
                  onContinueSession={handleContinueSession}
                  disabled={sessionStatus === 'analyzing'}
                />
              ) : (
                <ReflectionCard questions={item.response.reflectionQuestions} />
              )}

              {/* Practical Suggestions Card */}
              <PracticalSuggestionCard suggestions={item.response.practicalSuggestions} />
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
