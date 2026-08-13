export function SyncConfirmationModal({ confirmation, onCancel, onConfirm, isBusy = false }) {
  const { candidate, overlapping } = confirmation

  return (
    <div className="scheduler-sheet-backdrop scheduler-modal-backdrop" onClick={onCancel}>
      <div
        className="scheduler-modal scheduler-sync-confirmation-modal"
        role="dialog"
        aria-modal="true"
        aria-label="근무 기록 변경 확인"
        aria-busy={isBusy}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="scheduler-section-head">
          <p className="scheduler-section-label">기록 확인</p>
        </div>
        <p className="scheduler-modal-text">기존 근무 기록과 시간이 겹쳐요.</p>

        <div className="scheduler-sync-diff">
          <div className="scheduler-sync-diff-side">
            <span className="subtle">기존 기록</span>
            {overlapping.map((log) => (
              <strong key={log.id}>{log.startTime}-{log.endTime}</strong>
            ))}
          </div>
          <div className="scheduler-sync-diff-arrow">→</div>
          <div className="scheduler-sync-diff-side">
            <span className="subtle">변경될 기록</span>
            <strong>{candidate.startTime}-{candidate.endTime}</strong>
          </div>
        </div>

        <p className="subtle scheduler-modal-hint">변경하면 기존 근무 기록이 새 시간으로 적용됩니다.</p>

        <div className="scheduler-form-actions scheduler-sync-confirmation-actions">
          <button type="button" className="soft-button scheduler-sync-cancel" onClick={onCancel} disabled={isBusy}>취소</button>
          <button type="button" className="primary scheduler-sync-primary" onClick={onConfirm} disabled={isBusy} aria-busy={isBusy}>
            {isBusy ? '변경 중...' : '변경하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
