import { navigate } from '../lib/router'
import { getTagMeta } from './helpers'

export function SchedulerEventCard({ item, onToggleDone, isSaving }) {
  const reservation = item.reservation || {}
  const urgencyText = item.status === 'done' || item.relativeTimingEnabled === false
    ? ''
    : item.isOverdue
      ? `${Math.abs(item.minutesAway)}분 지남`
      : item.minutesAway <= 60
        ? `${item.minutesAway}분 후`
        : ''
  const cardClassName = [
    'scheduler-event-card',
    `event-${item.event_type}`,
    item.memo_snapshot ? 'has-note' : '',
    item.status === 'done' ? 'done' : '',
    item.isOverdue ? 'overdue' : '',
    item.isUpcomingSoon ? 'upcoming' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article className={cardClassName}>
      <div className="scheduler-event-summary">
        <div className="scheduler-event-time-block">
          <strong>{item.timeLabel}</strong>
        </div>
        <span className={`scheduler-event-type ${item.meta?.tone || ''}`}>{item.meta?.label}</span>
        <strong className="scheduler-event-location">{reservation.branch} · {reservation.room}</strong>
        <p className="scheduler-event-customer">{reservation.customer_name}</p>
        {urgencyText ? <span className="scheduler-event-urgency scheduler-event-urgency-inline">{urgencyText}</span> : null}
      </div>

      {item.memo_snapshot ? <p className="scheduler-event-note">{item.memo_snapshot}</p> : null}

      <div className="scheduler-event-actions">
        <div className="scheduler-event-meta">
          <span className={`scheduler-status-badge status-${item.status}`}>{item.statusMeta?.label}</span>
          {(item.tags_snapshot || []).map((tag) => (
            <span key={tag} className="scheduler-tag-badge">
              {getTagMeta(tag).shortLabel}
            </span>
          ))}
        </div>
        <div className="scheduler-event-action-buttons">
          <button
            type="button"
            className={item.status === 'done' ? 'scheduler-action-button secondary' : 'scheduler-action-button'}
            disabled={isSaving}
            onClick={() => onToggleDone(item)}
          >
            {item.status === 'done' ? '완료 취소' : '완료'}
          </button>
          <button
            type="button"
            className="scheduler-action-button secondary"
            onClick={() => navigate(`/scheduler/${item.reservation_id}`)}
          >
            예약 수정
          </button>
        </div>
      </div>
    </article>
  )
}
