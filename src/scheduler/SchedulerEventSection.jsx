import { SchedulerEventCard } from './SchedulerEventCard'


export function SchedulerEventSection({
  title,
  items,
  emptyText,
  onToggleDone,
  pendingStatusIds,
  hideEmptyText = false,
  initialLoadingLayout = false,
  initialLoadingMessage = null,
}) {
  const normalizedEmptyText = (() => {
    if (emptyText === '불러오는 중...') return emptyText
    if (title === '지금 처리할 일') return '처리할 작업 없음'
    if (title === '곧 다가오는 일정') return '다가오는 일정 없음'
    return emptyText
  })()
  const sectionClassName = [
    'scheduler-panel',
    'scheduler-event-section',
    title === '지금 처리할 일' ? 'is-primary' : '',
    items.length === 0 ? 'scheduler-panel-empty' : '',
  ]
    .filter(Boolean)
    .join(' ')
  const sectionContentClassName = [
    'scheduler-event-content',
    items.length === 0 && !shouldRenderEmptyText() ? 'scheduler-event-content--empty' : '',
    initialLoadingLayout && items.length === 0 ? 'scheduler-event-content--initial-loading' : '',
  ]
    .filter(Boolean)
    .join(' ')


  function shouldRenderEmptyText() {
    return items.length === 0 && (
      normalizedEmptyText === '불러오는 중...' || !hideEmptyText
    )
  }
  return (
    <section className={sectionClassName}>
      <div className="scheduler-section-head">
        <div>
          <p className="scheduler-section-label">{title}</p>
        </div>
        <div className="scheduler-count-pill">{items.length}건</div>
      </div>
      <div className={sectionContentClassName}>
        {shouldRenderEmptyText() ? <p className="subtle scheduler-empty-note">{normalizedEmptyText}</p> : null}
        <div className="scheduler-event-list">
          {items.map((item) => (
            <SchedulerEventCard
              key={item.id}
              item={item}
              isSaving={pendingStatusIds.has(item.id)}
              onToggleDone={onToggleDone}
            />
          ))}
        </div>
        {initialLoadingLayout && items.length === 0 && initialLoadingMessage ? (
          <p className="subtle scheduler-loading-floor-note">{initialLoadingMessage}</p>
        ) : null}
      </div>
    </section>
  )
}
