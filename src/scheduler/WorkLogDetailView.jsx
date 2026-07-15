import { getWeekRangeLabel, getWeekTitle } from './time'

export function WorkLogDetailView({ viewingWeekStart, logs, onClose, onNavigate, onCopy, onDelete, copyFeedback }) {
  const weekLogs = logs.filter((log) => log.weekStartDate === viewingWeekStart)
  const sortedLogs = [...weekLogs].sort((a, b) => a.date.localeCompare(b.date))
  const totalMinutes = weekLogs.reduce((acc, log) => acc + log.durationMinutes, 0)
  const totalHours = totalMinutes / 60

  return (
    <div className="scheduler-sheet-backdrop scheduler-modal-backdrop" onClick={onClose}>
      <div
        className="scheduler-modal scheduler-work-log-modal"
        role="dialog"
        aria-modal="true"
        aria-label="근무 일지 상세"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="scheduler-section-head" style={{ marginBottom: '0.65rem' }}>
          <p className="scheduler-section-label">근무 일지</p>
          <button type="button" className="scheduler-modal-close" onClick={onClose}>닫기</button>
        </div>

        <div className="scheduler-work-log-nav">
          <button type="button" className="soft-button scheduler-work-log-nav-btn" onClick={() => onNavigate('prev')}>이전 주</button>
          <div className="scheduler-work-log-title">
            <strong>{getWeekTitle(viewingWeekStart)}</strong>
            <p className="subtle">{getWeekRangeLabel(viewingWeekStart)}</p>
          </div>
          <button type="button" className="soft-button scheduler-work-log-nav-btn" onClick={() => onNavigate('next')}>다음 주</button>
        </div>

        <div className="scheduler-work-log-content">
          {sortedLogs.length === 0 ? (
            <div className="scheduler-work-log-empty">
              <p className="subtle scheduler-empty-note">이번 주 근무 기록이 아직 없어요.</p>
            </div>
          ) : (
            <div className="scheduler-work-log-list">
              {sortedLogs.map((log) => {
                const date = new Date(log.date)
                return (
                  <div key={log.id || log.syncKey} className="scheduler-work-log-item">
                    <div className="scheduler-work-log-item-info">
                      <strong>{date.getMonth() + 1}/{date.getDate()}</strong>
                      <p>{log.startTime}-{log.endTime} ({log.durationMinutes / 60}h)</p>
                    </div>
                    <button
                      type="button"
                      className="scheduler-log-delete-btn"
                      onClick={() => onDelete(log.id)}
                      aria-label="기록 삭제"
                    >
                      삭제
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <div className="scheduler-work-log-total">
            <span>주간 총계</span>
            <strong className={totalHours > 0 ? 'active' : 'empty'}>{totalHours}시간</strong>
          </div>
        </div>

        <div className="scheduler-modal-actions stack" style={{ marginTop: '1.2rem' }}>
          <button
            type="button"
            className="scheduler-modal-btn"
            onClick={() => onCopy(viewingWeekStart)}
            disabled={sortedLogs.length === 0}
          >
            {copyFeedback || '주간 기록 복사'}
          </button>
        </div>
      </div>
    </div>
  )
}
