import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  createSchedulerAsyncContentEnterState,
  settleSchedulerAsyncContentEnter,
} from '../src/scheduler/schedulerAsyncContentEnter.js'

const todayPage = readFileSync(new URL('../src/scheduler/TodaySchedulerPage.jsx', import.meta.url), 'utf8')
const eventSection = readFileSync(new URL('../src/scheduler/SchedulerEventSection.jsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')

test('initial successful content settles once and refetches do not re-arm the guard', () => {
  const initial = createSchedulerAsyncContentEnterState()
  const firstSuccess = settleSchedulerAsyncContentEnter(initial, { status: 'success', hasContent: true })
  const refetchSuccess = settleSchedulerAsyncContentEnter(firstSuccess, { status: 'success', hasContent: true })

  assert.deepEqual(firstSuccess, {
    hasSuccessfullySettled: true,
    shouldAnimateInitialContent: true,
  })
  assert.strictEqual(refetchSuccess, firstSuccess)
})
test('an initial error leaves the guard pending, so the first retry success can enter once', () => {
  const initial = createSchedulerAsyncContentEnterState()
  const afterError = settleSchedulerAsyncContentEnter(initial, { status: 'error', hasContent: false })
  const retrySuccess = settleSchedulerAsyncContentEnter(afterError, { status: 'success', hasContent: true })

  assert.strictEqual(afterError, initial)
  assert.equal(retrySuccess.hasSuccessfullySettled, true)
  assert.equal(retrySuccess.shouldAnimateInitialContent, true)
})

test('an empty successful result settles the first fetch without arming a later reveal', () => {
  const initial = createSchedulerAsyncContentEnterState()
  const emptySuccess = settleSchedulerAsyncContentEnter(initial, { status: 'success', hasContent: false })
  const laterSuccess = settleSchedulerAsyncContentEnter(emptySuccess, { status: 'success', hasContent: true })

  assert.deepEqual(emptySuccess, {
    hasSuccessfullySettled: true,
    shouldAnimateInitialContent: false,
  })
  assert.strictEqual(laterSuccess, emptySuccess)
})

test('loading and error outcomes are no-ops and the guard is idempotent for StrictMode effect re-entry', () => {
  const initial = createSchedulerAsyncContentEnterState()
  const loading = settleSchedulerAsyncContentEnter(initial, { status: 'loading', hasContent: false })
  const error = settleSchedulerAsyncContentEnter(loading, { status: 'error', hasContent: false })
  const firstSuccess = settleSchedulerAsyncContentEnter(error, { status: 'success', hasContent: true })
  const strictModeSecondSuccess = settleSchedulerAsyncContentEnter(firstSuccess, { status: 'success', hasContent: true })

  assert.strictEqual(loading, initial)
  assert.strictEqual(error, initial)
  assert.strictEqual(strictModeSecondSuccess, firstSuccess)
})

test('Today page arms the UI-local guard only after the latest successful fetch commits data', () => {
  assert.match(todayPage, /eventsRequestSequenceRef\.current !== requestSequence\) return[\s\S]*?setEvents\(rows\)[\s\S]*?settleSchedulerAsyncContentEnter\(/)
  assert.match(todayPage, /initialAsyncContentEnterStateRef = useRef\(createSchedulerAsyncContentEnterState\(\)\)/)
  assert.match(todayPage, /scheduler-async-content--initial-enter/)
  assert.doesNotMatch(todayPage, /setShouldAnimateInitialContent\([^)]*\)\s*;[\s\S]*?loadEvents\(\)/)
})

test('event lists stay stable while the glass section shell remains outside the animation target', () => {
  assert.match(eventSection, /<section className=\{sectionClassName\}>[\s\S]*?<div className=\{sectionContentClassName\}>[\s\S]*?<div className="scheduler-event-list">[\s\S]*?items\.map/)
  const animationRule = styles.match(
    /\.scheduler-theme-shell \.scheduler-async-content--initial-enter \.scheduler-event-list\s*\{[\s\S]*?\n\}/,
  )?.[0]
  const sectionGlassRule = styles.match(
    /\.scheduler-theme-shell \.scheduler-event-section\s*\{[\s\S]*?\n\}/,
  )?.[0]

  assert.ok(animationRule, 'animation should target the stable event list node')
  assert.ok(sectionGlassRule, 'event section glass rule should remain explicit')
  assert.match(sectionGlassRule, /backdrop-filter/)
  assert.doesNotMatch(sectionGlassRule, /animation/)
  assert.doesNotMatch(styles, /\.scheduler-theme-shell \.scheduler-async-content--initial-enter\s*\{\s*animation:/)
  assert.doesNotMatch(animationRule, /backdrop-filter|-webkit-backdrop-filter|transform|filter/)
})

test('async enter recipe is a single 200ms opacity-only rule with an explicit reduced-motion stop', () => {
  assert.match(styles, /--ag-scheduler-async-content-enter-duration:\s*200ms;/)
  assert.match(styles, /--ag-scheduler-async-content-enter-easing:\s*cubic-bezier\(0\.23, 1, 0\.32, 1\);/)
  const recipe = styles.match(
    /\/\* First successful Today event fetch only; section shells stay static and event content uses opacity only\. \*\/[\s\S]*?@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\n\}/,
  )?.[0]

  assert.ok(recipe, 'async content enter recipe should remain a contiguous audited block')
  assert.match(recipe, /animation:\s*scheduler-async-content-enter[\s\S]*?var\(--ag-scheduler-async-content-enter-duration\)[\s\S]*?var\(--ag-scheduler-async-content-enter-easing\)/)
  assert.match(recipe, /from\s*\{\s*opacity:\s*0;\s*\}[\s\S]*?to\s*\{\s*opacity:\s*1;\s*\}/)
  assert.doesNotMatch(recipe, /transform|translate|scale|blur|clip-path|width|height|margin|padding|top|left|stagger|delay/)
  assert.match(recipe, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.scheduler-theme-shell \.scheduler-async-content--initial-enter \.scheduler-event-list[\s\S]*?animation:\s*none;/)
})
