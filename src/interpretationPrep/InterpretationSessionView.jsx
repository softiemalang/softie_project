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
    const astrologyFactual = unifiedContext.astrologyContext?.astrologyContextSnapshot?.factualSigns || {}

    const userProvidedCtx = sessionState.userProvidedContext || []
    const latestUserContext = userProvidedCtx.length > 0 ? userProvidedCtx[userProvidedCtx.length - 1] : ''

    const isFollowup = turnIndex > 1

    return createStructuredSessionResponse({
      sessionId: sessionState.sessionId,
      topic: sessionState.currentTopic?.primary || 'general',
      confidenceSummary: unifiedContext.unifiedConfidence?.overallConfidence || 'high',
      statusType: 'complete',
      summary: {
        title: isFollowup
          ? `[Turn ${turnIndex}] 경험과 나누는 심층 3-System 관점`
          : `[${sessionState.currentTopic?.primary.toUpperCase()}] 함께 살펴본 3-System 관점`,
        coreMessage: isFollowup
          ? `내담자님의 경험("${latestUserContext}")과 결합하여 3대 체계가 더욱 정교한 조명을 제공합니다.`
          : `사주, 자미두수, 점성학 3대 체계가 "${sessionState.currentQuestion}"라는 고민에 대해 함께 비춰본 관점입니다.`,
      },
      perspectives: {
        saju: {
          label: '사주 렌즈 (내면 오행 기질)',
          insight: sajuFactual.dayMaster
            ? `일간 ${sajuFactual.dayMaster} 중심의 내면 오행 기질과 수양 역량을 나타냅니다.`
            : '사주는 내면의 오행 축적과 에너지 조화에 주목합니다.',
          evidence: [sajuFactual.dayMaster ? `일간 ${sajuFactual.dayMaster} 오행 생극제화` : '일간 중심 내부 기질'],
        },
        ziwei: {
          label: '자미두수 렌즈 (대외 환경·관계)',
          insight: ziweiFactual.mingGongBranch
            ? `${ziweiFactual.mingGongBranch}宮 명궁 중심의 사회적 관계망과 대외 무대 흐름을 보여줍니다.`
            : '자미두수는 삼방사정 중심의 환경적 표현에 주목합니다.',
          evidence: [ziweiFactual.mingGongBranch ? `${ziweiFactual.mingGongBranch}宮 삼방사정 배치` : '명궁 삼방사정 체계'],
        },
        astrology: {
          label: '서양점성학 렌즈 (원형적 심리·시간선)',
          insight: astrologyFactual.sunSign
            ? `${astrologyFactual.sunSign} 태양 및 상승궁 중심의 심리 원형과 발전 여정을 비춥니다.`
            : '점성학은 원형적 심리 역동과 상징적 시간선에 주목합니다.',
          evidence: [
            astrologyFactual.sunSign ? `Sun in ${astrologyFactual.sunSign}` : '태양/달/상승궁 원형',
            astrologyFactual.ascendantSign ? `Ascendant in ${astrologyFmarketSign || 'Ascendant'}` : 'ASC 하우스 축',
          ],
        },
      },
      synthesis: {
        sharedThemes: [
          {
            theme: '주체적 역량 발휘와 삶의 방향',
            description: '세 체계는 사주의 내면 동력, 자미두수의 환경 무대, 점성학의 심리 원형이라는 다른 층위에서 같은 주제를 보여줍니다.',
          },
        ],
        differentPerspectives: [
          '사주는 내면 오행, 자미두수는 사회적 인연망, 점성학은 심리적 상징 시간선을 입체적으로 비춥니다.',
        ],
      },
      reflectionQuestions: isFollowup
        ? ['새롭게 조명된 이 관점들이 현재 상황에 어떤 힌트를 주나요?']
        : [
            '최근 자신의 경험 속에서 세 관점 중 가장 공감되는 모습이 있으셨나요?',
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

        const primaryLens = sessionInstance.sessionState.lensPriority?.primary?.[0] || 'saju'
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
              <LensTabs activeTab={activeTab} onChangeTab={setActiveTab} />
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

