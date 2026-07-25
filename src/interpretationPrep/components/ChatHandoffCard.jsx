import React, { useState } from 'react'
import { buildChatHandoffPackage } from '../chatHandoffPackage.js'

const TOPIC_PRESETS = [
  { id: 'personality', label: '성향 / 내면 기질', question: '내면 기질과 오행, 심리 원형의 조화가 궁금해요.' },
  { id: 'career', label: '직업 / 커리어 방향', question: '이직 및 직업 적성, 대외 사회적 무대 환경이 궁금해요.' },
  { id: 'relationship', label: '연애 / 대인관계', question: '인간관계와 연애에서 나타나는 반복 패턴이 궁금해요.' },
  { id: 'timing', label: '변화의 시기', question: '지금이 삶의 변화를 시도할 적절한 시기인지 궁금해요.' },
]

export function ChatHandoffCard({ unifiedContext = {} }) {
  const [questionText, setQuestionText] = useState('')
  const [topicCategory, setTopicCategory] = useState('general')
  const [handoffPackage, setHandoffPackage] = useState(null)
  const [copiedStatus, setCopiedStatus] = useState('')
  const [selectedCopyType, setSelectedCopyType] = useState('full')
  const [showPreview, setShowPreview] = useState(false)

  const handleGeneratePackage = (q = questionText, topic = topicCategory) => {
    const pkg = buildChatHandoffPackage(unifiedContext, q, topic)
    setHandoffPackage(pkg)
    setCopiedStatus('')
  }

  const handleSelectPreset = (preset) => {
    setQuestionText(preset.question)
    setTopicCategory(preset.id)
    handleGeneratePackage(preset.question, preset.id)
  }

  const handleCopy = async (type) => {
    if (!handoffPackage) return
    setSelectedCopyType(type)
    const textToCopy = handoffPackage.copies[type] || handoffPackage.copies.full
    try {
      await navigator.clipboard.writeText(textToCopy)
      const labels = {
        full: '전체 복사',
        quick: '간편 복사',
        topicFocused: '질문 중심 복사',
        privacyMinimal: '🔒 개인정보 보호 복사',
      }
      setCopiedStatus(`자료를 ${labels[type] || '복사'}했어요! Chat 모드에 붙여넣은 뒤 자유롭게 이야기를 이어가세요.`)
    } catch (err) {
      console.error(err)
      setCopiedStatus('복사에 실패했습니다. 아래 미리보기 텍스트를 직접 선택해 복사해 주세요.')
    }
  }

  const currentPreviewText = handoffPackage?.copies[selectedCopyType] || handoffPackage?.copies.full || ''
  const currentCharCount = handoffPackage?.characterCounts[selectedCopyType] || currentPreviewText.length

  return (
    <div className="prep-handoff-card">
      <div className="prep-handoff-header">
        <div className="prep-handoff-title-wrap">
          <span style={{ fontSize: '1.25rem' }}>💬</span>
          <h3>Chat에서 해석할 자료 만들기</h3>
        </div>
        <span className="prep-handoff-badge">
          SCHEMA v1.0
        </span>
      </div>

      <p className="prep-handoff-intro">
        서비스는 명식을 단정하지 않습니다. 3대 체계의 정교한 계산 근거와 불확실성 기준을 패키지로 만들어 Chat 모드에서 입체적인 대화를 시작하세요.
      </p>

      {/* Preset Topics */}
      <div className="prep-handoff-presets">
        {TOPIC_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handleSelectPreset(preset)}
            className={`prep-handoff-preset-btn ${topicCategory === preset.id ? 'is-active' : ''}`}
          >
            ✦ {preset.label}
          </button>
        ))}
      </div>

      {/* Custom Question Form */}
      <div className="prep-handoff-input-group">
        <input
          type="text"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="궁금한 질문이나 고민을 입력하세요 (예: 커리어 이직 방향)..."
          className="prep-handoff-input"
        />
        <button
          type="button"
          onClick={() => handleGeneratePackage(questionText, topicCategory)}
          className="prep-handoff-generate-btn"
        >
          자료 생성
        </button>
      </div>

      {/* Generated Handoff Package Options */}
      {handoffPackage && (
        <div className="prep-handoff-actions-wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 650, color: 'var(--brand)' }}>복사할 자료 포맷 선택:</div>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {showPreview ? '미리보기 닫기' : '미리보기 & 글자수 확인'} ({currentCharCount}자)
            </button>
          </div>

          <div className="prep-handoff-copy-options">
            <button
              type="button"
              onClick={() => handleCopy('full')}
              className={`prep-copy-mode-btn ${selectedCopyType === 'full' ? 'is-active' : ''}`}
            >
              <span>📋</span> 전체 복사 ({handoffPackage.characterCounts.full}자)
            </button>

            <button
              type="button"
              onClick={() => handleCopy('quick')}
              className={`prep-copy-mode-btn ${selectedCopyType === 'quick' ? 'is-active' : ''}`}
            >
              <span>⚡</span> 간편 복사 ({handoffPackage.characterCounts.quick}자)
            </button>

            <button
              type="button"
              onClick={() => handleCopy('topicFocused')}
              className={`prep-copy-mode-btn ${selectedCopyType === 'topicFocused' ? 'is-active' : ''}`}
            >
              <span>🎯</span> 질문 중심 복사 ({handoffPackage.characterCounts.topicFocused}자)
            </button>

            <button
              type="button"
              onClick={() => handleCopy('privacyMinimal')}
              className={`prep-copy-mode-btn is-privacy ${selectedCopyType === 'privacyMinimal' ? 'is-active' : ''}`}
            >
              <span>🔒</span> 개인정보 보호 익명 복사 ({handoffPackage.characterCounts.privacyMinimal}자)
            </button>
          </div>

          {/* Text Preview Accordion */}
          {showPreview && (
            <div className="prep-preview-box">
              <div className="prep-preview-label">
                [{selectedCopyType.toUpperCase()}] TEXT PREVIEW ({currentCharCount} CHARACTERS):
              </div>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{currentPreviewText}</pre>
            </div>
          )}

          {copiedStatus && (
            <div className="prep-copied-alert">
              <span style={{ color: 'var(--success)' }}>✓</span>
              <span>{copiedStatus}</span>
            </div>
          )}

          {/* 5-Point Chat Quality Guidelines */}
          <div className="prep-quality-guide">
            <div><strong>💡 Chat 대화 품질 체크포인트:</strong></div>
            <div>• 세 체계 용어(오행/궁위/행성)를 억지로 인과관계로 섞지 않는지 관찰하세요.</div>
            <div>• 불확실성 요소나 경계 후보를 한 단정으로 덮지 않는지 확인하세요.</div>
            <div>• 붙여넣은 후 대화가 판결이 아닌 성찰 질문으로 이어진다면 대화가 잘 진행된 것입니다.</div>
          </div>
        </div>
      )}
    </div>
  )
}
