import React from 'react'

const LENS_LABELS = {
  saju: '사주 (내면 오행)',
  ziwei: '자미두수 (대외 환경·관계)',
  astrology: '서양점성학 (원형 심리)',
}

export function LensPriorityCard({ lensPriority = {} }) {
  const primary = lensPriority.primary || []
  const secondary = lensPriority.secondary || []
  const contextual = lensPriority.contextual || []

  return (
    <div className="lens-priority-card bg-indigo-950/30 border border-indigo-500/20 rounded-2xl p-4 mb-6 backdrop-blur-md">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-indigo-400 text-base">🔍</span>
        <h4 className="text-sm font-semibold text-indigo-200">이번 질문의 렌즈 참조 안내</h4>
      </div>
      <p className="text-xs text-slate-300 mb-3">{lensPriority.rationale}</p>

      <div className="flex flex-wrap gap-4 text-xs">
        {primary.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 font-bold text-[10px]">주요 관점</span>
            <span className="text-white font-medium">{primary.map((l) => LENS_LABELS[l] || l).join(' · ')}</span>
          </div>
        )}

        {secondary.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold text-[10px]">보완 관점</span>
            <span className="text-slate-300">{secondary.map((l) => LENS_LABELS[l] || l).join(' · ')}</span>
          </div>
        )}

        {contextual.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-400 font-bold text-[10px]">배경 관점</span>
            <span className="text-slate-400">{contextual.map((l) => LENS_LABELS[l] || l).join(' · ')}</span>
          </div>
        )}
      </div>
    </div>
  )
}
