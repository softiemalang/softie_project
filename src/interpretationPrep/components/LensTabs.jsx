import React from 'react'

const TABS = [
  { id: 'saju', title: '사주', subtitle: '내면의 에너지 기질' },
  { id: 'ziwei', title: '자미두수', subtitle: '대외 환경과 관계 구조' },
  { id: 'astrology', title: '서양점성학', subtitle: '상징적 심리 패턴' },
]

export function LensTabs({ activeTab, onChangeTab }) {
  return (
    <div className="lens-tabs flex gap-2 mb-4 overflow-x-auto pb-1">
      {TABS.map((t) => {
        const isActive = activeTab === t.id
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChangeTab(t.id)}
            className={`flex-1 min-w-[130px] p-3 rounded-xl border text-left transition-all ${
              isActive
                ? 'bg-indigo-600/30 border-indigo-400/60 shadow-lg shadow-indigo-500/10'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-400'
            }`}
          >
            <div className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-300'}`}>{t.title}</div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">{t.subtitle}</div>
          </button>
        )
      })}
    </div>
  )
}
