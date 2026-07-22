import { SchedulerEventCard } from './SchedulerEventCard'


export function SchedulerEventSection({ title, items, emptyText, onToggleDone, pendingStatusId }) {
  const normalizedEmptyText = (() => {
    if (emptyText === '불러오는 중...') return emptyText
    if (title === '지금 처리할 일') return '처리할 작업 없음'
    if (title === '곧 다가오는 일정') return '다가오는 일정 없음'
    return emptyText
  })()
  const sectionClassName = [
    'scheduler-panel',
    'scheduler-event-section',
    title === '오늘 전체' ? 'is-primary' : '',
    items.length === 0 ? 'scheduler-panel-empty' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={sectionClassName}>
      <div className="scheduler-section-head">
        <div>
          <p className="scheduler-section-label">{title}</p>
        </div>
        <div className="scheduler-count-pill">{items.length}건</div>
      </div>

      {items.length === 0 ? (
        <p className="subtle scheduler-empty-note">{normalizedEmptyText}</p>
      ) : (
        <div className="scheduler-event-list">
          {items.map((item) => (
            <SchedulerEventCard
              key={item.id}
              item={item}
              isSaving={pendingStatusId === item.id}
              onToggleDone={onToggleDone}
            />
          ))}
        </div>
      )}
    </section>
  )
}
