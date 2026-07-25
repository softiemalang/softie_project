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

  const [selectedCopyType, setSelectedCopyType] = useState('full')
  const [showPreview, setShowPreview] = useState(false)

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
    <div className="chat-handoff-card glass-panel p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-black/50 backdrop-blur-md mb-8">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">💬</span>
          <h3 className="text-lg font-bold text-white">Chat에서 해석할 자료 만들기</h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          SCHEMA v1.0
        </span>
      </div>
      <p className="text-xs text-slate-300 mb-4 leading-relaxed">
        서비스는 명식을 단정하지 않습니다. 3대 체계의 정교한 계산 근거와 불확실성 기준을 패키지로 만들어 Chat 모드에서 입체적인 대화를 시작하세요.
      </p>

      {/* Preset Topics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {TOPIC_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handleSelectPreset(preset)}
            className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
              topicCategory === preset.id
                ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-md'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
            }`}
          >
            ✦ {preset.label}
          </button>
        ))}
      </div>

      {/* Custom Question Form */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="궁금한 질문이나 고민을 입력하세요 (예: 커리어 이직 방향)..."
          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400/50"
        />
        <button
          type="button"
          onClick={() => handleGeneratePackage(questionText, topicCategory)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20"
        >
          자료 생성
        </button>
      </div>

      {/* Generated Handoff Package Options */}
      {handoffPackage && (
        <div className="handoff-actions-container pt-4 border-t border-white/10 animate-fadeIn">
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs font-bold text-indigo-300">복사할 자료 포맷 선택:</div>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-[11px] text-slate-400 hover:text-white underline flex items-center gap-1"
            >
              <span>{showPreview ? '미리보기 닫기' : '미리보기 & 글자수 확인'}</span>
              <span>({currentCharCount}자)</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              onClick={() => handleCopy('full')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all ${
                selectedCopyType === 'full'
                  ? 'bg-indigo-600 text-white border border-indigo-400'
                  : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              <span>📋</span> 전체 복사 ({handoffPackage.characterCounts.full}자)
            </button>

            <button
              type="button"
              onClick={() => handleCopy('quick')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                selectedCopyType === 'quick'
                  ? 'bg-purple-600 text-white border border-purple-400'
                  : 'bg-purple-950/40 border border-purple-500/20 text-purple-200 hover:bg-purple-900/40'
              }`}
            >
              <span>⚡</span> 간편 복사 ({handoffPackage.characterCounts.quick}자)
            </button>

            <button
              type="button"
              onClick={() => handleCopy('topicFocused')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                selectedCopyType === 'topicFocused'
                  ? 'bg-emerald-600 text-white border border-emerald-400'
                  : 'bg-emerald-950/40 border border-emerald-500/20 text-emerald-200 hover:bg-emerald-900/40'
              }`}
            >
              <span>🎯</span> 질문 중심 복사 ({handoffPackage.characterCounts.topicFocused}자)
            </button>

            <button
              type="button"
              onClick={() => handleCopy('privacyMinimal')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                selectedCopyType === 'privacyMinimal'
                  ? 'bg-amber-600 text-white border border-amber-400'
                  : 'bg-amber-950/40 border border-amber-500/20 text-amber-200 hover:bg-amber-900/40'
              }`}
            >
              <span>🔒</span> 개인정보 보호 익명 복사 ({handoffPackage.characterCounts.privacyMinimal}자)
            </button>
          </div>

          {/* Text Preview Accordion */}
          {showPreview && (
            <div className="preview-box bg-black/60 p-3.5 rounded-xl border border-white/10 mb-3 text-xs text-slate-300 font-mono leading-relaxed max-h-48 overflow-y-auto animate-fadeIn">
              <div className="text-[10px] text-indigo-400 font-bold mb-1">
                [{selectedCopyType.toUpperCase()}] TEXT PREVIEW ({currentCharCount} CHARACTERS):
              </div>
              <pre className="whitespace-pre-wrap font-mono text-[11px] text-slate-300">{currentPreviewText}</pre>
            </div>
          )}

          {copiedStatus && (
            <div className="p-3 bg-indigo-950/60 border border-indigo-400/30 rounded-xl text-xs text-indigo-200 font-medium flex items-center gap-2 mb-3">
              <span className="text-emerald-400 text-sm">✓</span>
              <span>{copiedStatus}</span>
            </div>
          )}

          {/* 5-Point Chat Quality Guidelines */}
          <div className="text-[11px] text-slate-400 bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
            <div className="font-bold text-slate-300">💡 Chat 대화 품질 체크포인트:</div>
            <div>• 세 체계 용어(오행/궁위/행성)를 억지로 인과관계로 섞지 않는지 관찰하세요.</div>
            <div>• 불확실성 요소나 경계 후보를 한 단정으로 덮지 않는지 확인하세요.</div>
            <div>• 붙여넣은 후 대화가 판결이 아닌 성찰 질문으로 이어진다면 대화가 잘 진행된 것입니다.</div>
          </div>
        </div>
      )}
    </div>
  )
}

