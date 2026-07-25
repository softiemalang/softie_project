import React, { useState } from 'react'

export function ReflectionCard({ questions = [], onContinueSession, disabled = false }) {
  const [selectedQuestion, setSelectedQuestion] = useState('')
  const [userText, setUserText] = useState('')

  if (!questions || questions.length === 0) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!userText.trim() || disabled) return
    const fullResponse = selectedQuestion
      ? `[성찰 질문: "${selectedQuestion}"] -> 답변: ${userText.trim()}`
      : userText.trim()

    onContinueSession?.(fullResponse)
    setUserText('')
    setSelectedQuestion('')
  }

  return (
    <div className="reflection-card glass-panel p-5 rounded-2xl border border-indigo-500/20 bg-indigo-950/20 mb-6 backdrop-blur-md">
      <h4 className="text-base font-bold text-indigo-200 mb-2 flex items-center gap-2">
        <span>💬</span> 나에게 묻는 성찰 질문
      </h4>
      <p className="text-xs text-slate-300 mb-3">해석은 확정된 판결이 아닙니다. 실제 내 경험과 연결해보며 이어서 이야기해보세요.</p>

      <div className="space-y-2 mb-4">
        {questions.map((q, idx) => {
          const isSelected = selectedQuestion === q
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedQuestion(isSelected ? '' : q)}
              className={`w-full text-left p-3 rounded-xl border transition-all text-xs font-medium ${
                isSelected
                  ? 'bg-indigo-600/30 border-indigo-400/60 text-white shadow-md'
                  : 'bg-black/30 border-white/5 hover:border-white/20 text-indigo-100'
              }`}
            >
              "{q}"
            </button>
          )
        })}
      </div>

      {/* Conversation Loop Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={userText}
          onChange={(e) => setUserText(e.target.value)}
          placeholder={
            selectedQuestion
              ? `"${selectedQuestion.slice(0, 20)}..."에 대한 내 경험 적기`
              : '자신의 경험이나 생각을 편하게 적어 대화를 이어나가세요...'
          }
          disabled={disabled}
          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400/50"
        />
        <button
          type="submit"
          disabled={disabled || !userText.trim()}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50 transition-all flex items-center gap-1"
        >
          <span>이어서 이야기하기</span>
          <span>→</span>
        </button>
      </form>
    </div>
  )
}


export function PracticalSuggestionCard({ suggestions = [] }) {
  if (!suggestions || suggestions.length === 0) return null

  return (
    <div className="practical-suggestion-card glass-panel p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 mb-6 backdrop-blur-md">
      <h4 className="text-base font-bold text-emerald-200 mb-2 flex items-center gap-2">
        <span>🌱</span> 현실에서의 실천 제안
      </h4>

      <div className="space-y-1.5">
        {suggestions.map((s, idx) => (
          <div key={idx} className="text-xs text-slate-200 flex items-start gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <span>{s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
