import React from 'react'

export function SynthesisCard({ synthesisData = {} }) {
  const { sharedThemes = [], differentPerspectives = [] } = synthesisData

  return (
    <div className="synthesis-card glass-panel p-5 rounded-2xl border border-purple-500/20 bg-purple-950/20 mb-6 backdrop-blur-md">
      <h4 className="text-base font-bold text-purple-200 mb-3 flex items-center gap-2">
        <span>✨</span> 세 관점이 함께 비추는 공통 테마
      </h4>

      {sharedThemes.map((st, idx) => (
        <div key={idx} className="mb-3 last:mb-0">
          <div className="text-sm font-semibold text-white mb-1">{st.theme}</div>
          <p className="text-xs text-slate-300 leading-relaxed">{st.description}</p>
        </div>
      ))}

      {differentPerspectives.length > 0 && (
        <div className="mt-4 pt-3 border-t border-purple-500/20 text-xs text-slate-400">
          <span className="font-semibold text-purple-300">관점의 입체적 차이: </span>
          {differentPerspectives.join(' / ')}
        </div>
      )}
    </div>
  )
}
