import React, { useState } from 'react'

const PRESET_QUESTIONS = [
  { id: 'personality', label: '나는 어떤 사람일까?', question: '요즘 내가 어떤 사람인지, 내면 기질과 성향이 궁금해요.' },
  { id: 'career', label: '직업/커리어 방향', question: '요즘 이직이나 커리어를 고민 중인데 제 적성과 대외 환경이 궁금해요.' },
  { id: 'relationship', label: '연애/관계 패턴', question: '사람들과 관계를 맺을 때 왜 일정한 패턴이 반복되는지 궁금해요.' },
  { id: 'timing', label: '요즘 변화의 시기', question: '지금이 변화를 시도할 타이밍인지 시기적 흐름이 궁금해요.' },
]

export function QuestionStarter({ onSubmitQuestion, disabled = false }) {
  const [customText, setCustomText] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!customText.trim() || disabled) return
    onSubmitQuestion(customText.trim())
  }

  const handleSelectPreset = (preset) => {
    if (disabled) return
    setCustomText(preset.question)
    onSubmitQuestion(preset.question)
  }

  return (
    <div className="question-starter-card glass-panel p-6 rounded-2xl border border-white/10 mb-6">
      <h3 className="text-xl font-bold text-white mb-2">어떤 고민이나 질문이 있으신가요?</h3>
      <p className="text-sm text-slate-300 mb-4">
        3대 점술 체계(사주·자미두수·서양점성학)가 다차원 렌즈가 되어 당신의 삶의 주제를 함께 비춰줍니다.
      </p>

      {/* Preset Chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {PRESET_QUESTIONS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            disabled={disabled}
            onClick={() => handleSelectPreset(preset)}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs text-slate-200 hover:text-white transition-all text-left font-medium disabled:opacity-50"
          >
            ✦ {preset.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="예: 요즘 고민되는 직업 방향이나 마음 상태를 편하게 적어주세요..."
          disabled={disabled}
          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400/50 transition-all"
        />
        <button
          type="submit"
          disabled={disabled || !customText.trim()}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all"
        >
          질문하기
        </button>
      </form>
    </div>
  )
}
