import { useState } from 'react'
import { buildChatHandoffPackage } from '../chatHandoffPackage.js'

const TOPIC_PRESETS = [
  { id: 'personality', label: '성향 / 내면 기질', question: '내면 기질과 오행의 흐름이 궁금해요.' },
  { id: 'career', label: '직업 / 커리어 방향', question: '이직 및 직업 적성과 사회생활의 흐름이 궁금해요.' },
  { id: 'relationship', label: '연애 / 대인관계', question: '인간관계와 연애에서 나타나는 반복 패턴이 궁금해요.' },
  { id: 'timing', label: '변화의 시기', question: '지금이 삶의 변화를 시도할 적절한 시기인지 궁금해요.' },
]

export function ChatHandoffCard({ unifiedContext = {}, onPrepare }) {
  const [questionText, setQuestionText] = useState('')
  const [topicCategory, setTopicCategory] = useState('general')
  const [handoffPackage, setHandoffPackage] = useState(null)
  const [copiedStatus, setCopiedStatus] = useState('')
  const [generationError, setGenerationError] = useState('')
  const [selectedCopyType, setSelectedCopyType] = useState('full')
  const [showPreview, setShowPreview] = useState(false)

  const handleGeneratePackage = (q = questionText, topic = topicCategory) => {
    try {
      const preparedContext = onPrepare ? onPrepare() : unifiedContext
      if (!preparedContext) return
      const pkg = buildChatHandoffPackage(preparedContext, q, topic)
      setHandoffPackage(pkg)
      setCopiedStatus('')
      setGenerationError('')
    } catch (error) {
      setHandoffPackage(null)
      setGenerationError(error.message || '출생정보를 확인한 뒤 다시 시도해 주세요.')
    }
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
        privacyMinimal: '개인정보 보호 복사',
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
      <p className="section-kicker">02 · CHAT HANDOFF</p>
      <div className="prep-handoff-header">
        <div className="prep-handoff-title-wrap">
          <h3>Chat에서 해석할 자료 만들기</h3>
        </div>
        <span className="prep-handoff-badge">
          SCHEMA v1.0
        </span>
      </div>

      <p className="prep-handoff-intro">
        현재 지원되는 사주 계산 근거와 불확실성 기준만 묶어 전달합니다. 자미두수·서양 점성학의 미지원 값은 추정하거나 포함하지 않습니다.
      </p>

      {/* Preset Topics */}
      <div className="prep-handoff-presets">
        {TOPIC_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handleSelectPreset(preset)}
            className={`prep-handoff-preset-btn ${topicCategory === preset.id ? 'is-active' : ''}`}
            aria-pressed={topicCategory === preset.id}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom Question Form */}
      <div className="prep-handoff-question-row">
        <div className="prep-handoff-input-group">
          <input
            id="prep-handoff-question"
            type="text"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="질문 또는 고민"
            aria-label="질문 또는 고민"
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
      </div>

      {generationError && (
        <p className="prep-form-error prep-handoff-error" role="alert">
          {generationError}
        </p>
      )}

      {/* Generated Handoff Package Options */}
      {handoffPackage && (
        <div className="prep-handoff-actions-wrap">
          <div className="prep-handoff-actions-head">
            <strong>복사할 자료 형식</strong>
            <div className="prep-handoff-copy-options" role="group" aria-label="복사할 자료 형식">
              <button
                type="button"
                onClick={() => handleCopy('full')}
                className={`prep-copy-mode-btn ${selectedCopyType === 'full' ? 'is-active' : ''}`}
                aria-label={`전체 자료 복사 (${handoffPackage?.characterCounts?.full || 0}자)`}
                aria-pressed={selectedCopyType === 'full'}
              >
                전체 {handoffPackage?.characterCounts?.full || 0}
              </button>

              <button
                type="button"
                onClick={() => handleCopy('quick')}
                className={`prep-copy-mode-btn ${selectedCopyType === 'quick' ? 'is-active' : ''}`}
                aria-label={`간편 자료 복사 (${handoffPackage?.characterCounts?.quick || 0}자)`}
                aria-pressed={selectedCopyType === 'quick'}
              >
                간편 {handoffPackage?.characterCounts?.quick || 0}
              </button>

              <button
                type="button"
                onClick={() => handleCopy('topicFocused')}
                className={`prep-copy-mode-btn ${selectedCopyType === 'topicFocused' ? 'is-active' : ''}`}
                aria-label={`질문 중심 자료 복사 (${handoffPackage?.characterCounts?.topicFocused || 0}자)`}
                aria-pressed={selectedCopyType === 'topicFocused'}
              >
                질문 {handoffPackage?.characterCounts?.topicFocused || 0}
              </button>

              <button
                type="button"
                onClick={() => handleCopy('privacyMinimal')}
                className={`prep-copy-mode-btn is-privacy ${selectedCopyType === 'privacyMinimal' ? 'is-active' : ''}`}
                aria-label={`개인정보 보호 익명 자료 복사 (${handoffPackage?.characterCounts?.privacyMinimal || 0}자)`}
                aria-pressed={selectedCopyType === 'privacyMinimal'}
              >
                익명 {handoffPackage?.characterCounts?.privacyMinimal || 0}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="prep-handoff-preview-toggle"
              aria-expanded={showPreview}
              aria-controls="prep-handoff-preview"
            >
              {showPreview ? '미리보기 닫기' : '미리보기 & 글자수 확인'} ({currentCharCount}자)
            </button>
          </div>


          {/* Text Preview Accordion */}
          {showPreview && (
            <div className="prep-preview-box" id="prep-handoff-preview">
              <div className="prep-preview-label">
                [{selectedCopyType.toUpperCase()}] TEXT PREVIEW ({currentCharCount} CHARACTERS):
              </div>
              <pre className="prep-handoff-preview-text">{currentPreviewText}</pre>
            </div>
          )}

          {copiedStatus && (
            <div className="prep-copied-alert" role="status" aria-live="polite">
              {copiedStatus}
            </div>
          )}

          {/* 5-Point Chat Quality Guidelines */}
          <div className="prep-quality-guide">
            <strong>Chat 대화 품질 체크포인트</strong>
            <ul>
              <li>제공되지 않은 자미두수·점성학 값을 새로 만들어내지 않는지 확인하세요.</li>
              <li>불확실성이나 경계 후보를 하나의 단정으로 덮지 않는지 확인하세요.</li>
              <li>대화가 판결이 아닌 성찰 질문으로 이어지는지 확인하세요.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
