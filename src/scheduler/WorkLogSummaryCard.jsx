import { getWeekRangeLabel, getWeekTitle } from './time'

export function WorkLogSummaryCard({ currentWeekStart, onOpen, onShare }) {
  return (
    <section className="scheduler-panel scheduler-work-log-card">
      <div className="scheduler-filter-summary-row">
        <div className="scheduler-filter-summary-copy">
          <p className="scheduler-section-label">근무 일지</p>
          <p className="subtle">
            {getWeekTitle(currentWeekStart)} · {getWeekRangeLabel(currentWeekStart)}
          </p>
        </div>
        <div className="scheduler-summary-actions">
          <button
            type="button"
            className="soft-button scheduler-summary-button"
            onClick={() => onShare(currentWeekStart)}
          >
            공유
          </button>
          <button type="button" className="soft-button scheduler-summary-button" onClick={onOpen}>
            보기
          </button>
        </div>
      </div>
    </section>
  )
}
