import React, { useState } from 'react'

export function PerspectiveCard({ perspectiveData = {} }) {
  const [showEvidence, setShowEvidence] = useState(false)
  const { label = '', insight = '', evidence = [] } = perspectiveData

  return (
    <div className="perspective-card glass-panel p-5 rounded-2xl border border-white/10 mb-6 backdrop-blur-md">
      <div className="flex justify-between items-start mb-3">
        <h4 className="text-base font-bold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
          {label}
        </h4>
      </div>

      <p className="text-sm text-slate-200 leading-relaxed mb-4">{insight}</p>

      {/* Progressive Disclosure Toggle */}
      {evidence && evidence.length > 0 && (
        <div className="border-t border-white/10 pt-3 mt-2">
          <button
            type="button"
            onClick={() => setShowEvidence(!showEvidence)}
            className="text-xs text-indigo-300 hover:text-indigo-200 font-medium flex items-center gap-1 transition-colors"
          >
            <span>왜 이런 해석이 나왔나요?</span>
            <span className="text-[10px]">{showEvidence ? '▲' : '▼'}</span>
          </button>

          {showEvidence && (
            <div className="mt-2.5 bg-black/40 p-3 rounded-xl border border-white/5 space-y-1 animate-fadeIn">
              <div className="text-[11px] font-semibold text-slate-400 mb-1">상세 구조적 근거:</div>
              {evidence.map((ev, idx) => (
                <div key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span>{ev}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
