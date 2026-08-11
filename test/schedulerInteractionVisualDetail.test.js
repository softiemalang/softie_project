import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const today = read('src/scheduler/TodaySchedulerPage.jsx')
const section = read('src/scheduler/SchedulerEventSection.jsx')
const card = read('src/scheduler/SchedulerEventCard.jsx')
const editor = read('src/scheduler/ReservationEditorPage.jsx')
const workLogDetail = read('src/scheduler/WorkLogDetailView.jsx')

test('Today initial loading stays visually quiet while preserving busy, empty, and error meanings', () => {
  assert.match(today, /setStatus\(''\)\s*\n\s*setIsLoading\(true\)/)
  assert.match(today, /setEvents\(rows\)\s*\n\s*pendingInitialSuccessRef\.current = true\s*\n\s*setStatus\(''\)/)
  assert.match(today, /useLayoutEffect\(\(\) => \{[\s\S]*?settleInitialAsyncContentEnter\(grouped\.allToday\.length > 0\)/)
  assert.match(today, /setEvents\(\[\]\)\s*\n\s*setStatus\(error instanceof Error \? error\.message : '오늘 일정을 불러오지 못했어요\. 잠시 후 다시 시도해 주세요\.'\)/)
  assert.match(today, /\{status \? <p className="status scheduler-load-status" role="alert">\{status\}<\/p> : null\}/)
  assert.match(today, /role="status" aria-live="polite" aria-atomic="true"\s*>\s*\{filterSummary\}/)
  assert.doesNotMatch(today, /일정 불러오는 중/)
  assert.match(today, /className="scheduler-async-content"[\s\S]*?aria-busy=\{isLoading\}/)
  assert.match(today, /initialEventsLoadFinishedRef = useRef\(false\)/)
  assert.match(today, /shouldReserveInitialLoadingFloor =\s*isLoading[\s\S]*?eventsRequestSequenceRef\.current === 1/)
  assert.match(today, /title="오늘 전체"[\s\S]*?hideEmptyText=\{isLoading \|\| Boolean\(status\)\}/)
  assert.match(today, /title="오늘 전체"[\s\S]*?initialLoadingLayout=\{shouldReserveInitialLoadingFloor\}/)
  assert.match(today, /const eventEmptyText = events\.length > 0 && filteredEvents\.length === 0\s*\n\s*\? '현재 조건에 맞는 일정이 없어요\.'\s*\n\s*: '오늘 일정이 없어요\.'/)
  assert.doesNotMatch(today, /일정을 표시할 수 없어요/)
  assert.match(section, /initialLoadingLayout = false/)
  assert.match(section, /scheduler-event-content--initial-loading/)
  assert.doesNotMatch(section, /skeleton|shimmer|spinner/)
})

test('status actions synchronously exclude duplicate row mutations and release their lock', () => {
  assert.match(
    today,
    /async function handleToggleDone\(eventRow\) \{\s*if \(pendingStatusIdsRef\.current\.has\(eventRow\.id\)\) return[\s\S]*?setStatus\(''\)[\s\S]*?updateWorkEventStatus\(eventRow\.id, nextStatus, effectiveOwnerKey\)/,
  )
  assert.match(today, /catch \(error\) \{\s*setStatus\(error\.message\)/)
  assert.match(today, /finally \{[\s\S]*?remainingPendingStatusIds\.delete\(eventRow\.id\)[\s\S]*?setPendingStatusIds\(remainingPendingStatusIds\)/)
  assert.match(section, /isSaving=\{pendingStatusIds\.has\(item\.id\)\}/)
})

test('event completion has a stable toggle name and exposes pending state', () => {
  assert.match(card, /aria-label="완료"\s*\n\s*aria-pressed=\{isDone\}\s*\n\s*aria-busy=\{isSaving\}/)
  assert.doesNotMatch(card, /aria-label=\{isSaving \? `\$\{statusActionLabel\}/)
})

test('filter and push feedback expose named grouping, live status, and busy state', () => {
  assert.match(today, /scheduler-filter-mode-row" role="group" aria-label="보기 설정"/)
  assert.match(today, /aria-busy=\{isPushBusy \|\| isPushPreferencesBusy\}/)
  assert.match(today, /className="scheduler-push-summary">\{pushSummary\}/)
  assert.match(today, /if \(pushActionLockRef\.current \|\| pushPreferencesLockRef\.current\) return[\s\S]*?pushActionLockRef\.current = true/)
  assert.match(today, /if \(pushPreferencesLockRef\.current \|\| pushActionLockRef\.current\) return false[\s\S]*?pushPreferencesLockRef\.current = true/)
  assert.match(today, /function openWebPushModal\(\) \{\s*setPushStatus\(''\)/)
  assert.match(today, /function closeWebPushModal\(\) \{[\s\S]*?setIsWebPushModalOpen\(false\)[\s\S]*?setPushStatus\(''\)/)
  assert.match(today, /className=\{`scheduler-push-status-note is-\$\{pushStatusMeta\.tone\}`\}[\s\S]*?role=\{pushStatusMeta\.tone === 'error' \? 'alert' : 'status'\}[\s\S]*?\{pushStatusMeta\.text\}/)
})

test('work-log deletion confirms exact context, locks per row, and announces its result', () => {
  assert.match(today, /if \(!log\?\.id \|\| pendingWorkLogDeleteIdsRef\.current\.has\(log\.id\)\) return/)
  assert.match(today, /window\.confirm\(`\$\{log\.date\} \$\{log\.startTime\}-\$\{log\.endTime\} 근무 기록을 삭제할까요\?`\)/)
  assert.match(today, /finally \{[\s\S]*?remainingPendingIds\.delete\(log\.id\)[\s\S]*?setPendingWorkLogDeleteIds\(remainingPendingIds\)/)
  assert.match(today, /setWorkLogStatus\(\{ tone: 'success', text: '근무 기록을 삭제했어요\.' \}\)/)
  assert.match(today, /setWorkLogStatus\(\{ tone: 'error', text: '기록 삭제 중 오류가 발생했습니다\.' \}\)/)
  assert.match(workLogDetail, /disabled=\{isDeleting\}[\s\S]*?aria-busy=\{isDeleting\}/)
  assert.match(workLogDetail, /role=\{status\.tone === 'error' \? 'alert' : 'status'\}/)
})

test('representative hierarchy pilot emphasizes action-now instead of the duplicated all-day aggregate', () => {
  assert.match(section, /title === '지금 처리할 일' \? 'is-primary' : ''/)
  assert.doesNotMatch(section, /title === '오늘 전체' \? 'is-primary' : ''/)
})

test('reservation create result scroll is immediate and does not add unbounded motion', () => {
  const autoScrolls = editor.match(/window\.scrollTo\(\{ top: 0, left: 0, behavior: 'auto' \}\)/g) || []
  assert.equal(autoScrolls.length, 3)
  assert.doesNotMatch(editor, /behavior: 'smooth'/)
})

test('reservation delete returns through the preserved immediate backPath route', () => {
  assert.match(editor, /await deleteReservation\(reservationId, effectiveOwnerKey\)\s*navigate\(backPath\)/)
  assert.doesNotMatch(editor, /await deleteReservation\(reservationId, effectiveOwnerKey\)\s*navigate\(backPath, \{ viewTransition: true \}\)/)
})
