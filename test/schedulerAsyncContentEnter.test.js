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
const design = readFileSync(new URL('../DESIGN.md', import.meta.url), 'utf8')

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
  assert.match(todayPage, /eventsRequestSequenceRef\.current !== requestSequence\) return[\s\S]*?setEvents\(rows\)\s*pendingInitialSuccessRef\.current = true\s*setStatus\(''\)/)
  assert.match(todayPage, /initialAsyncContentEnterStateRef = useRef\(createSchedulerAsyncContentEnterState\(\)\)/)
  assert.match(todayPage, /useLayoutEffect\(\(\) => \{[\s\S]*?pendingInitialSuccessRef\.current = false[\s\S]*?settleInitialAsyncContentEnter\(grouped\.allToday\.length > 0\)/)
  assert.doesNotMatch(todayPage, /scheduler-async-content--initial-enter/)
  assert.match(todayPage, /title="오늘 전체"[\s\S]*?initialArrival=\{shouldAnimateInitialContent\}[\s\S]*?onInitialArrivalAnimationEnd=\{handleInitialCardArrivalAnimationEnd\}/)
  assert.match(todayPage, /function handleInitialCardArrivalAnimationEnd\(event\)[\s\S]*?scheduler-card-arrival-settle[\s\S]*?setShouldAnimateInitialContent\(false\)/)
})

test('Today reserves a four-card floor only for the first empty loading request', () => {
  assert.match(todayPage, /const initialEventsLoadFinishedRef = useRef\(false\)/)
  assert.match(
    todayPage,
    /if \(eventsRequestSequenceRef\.current === requestSequence\) \{\s*initialEventsLoadFinishedRef\.current = true\s*setIsLoading\(false\)/,
  )
  assert.match(
    todayPage,
    /const shouldReserveInitialLoadingFloor =\s*isLoading &&\s*events\.length === 0 &&\s*!status &&\s*!initialEventsLoadFinishedRef\.current &&\s*eventsRequestSequenceRef\.current === 1/,
  )

  const eventSections = [...todayPage.matchAll(/<SchedulerEventSection[\s\S]*?\/>/g)].map(([match]) => match)
  assert.equal(eventSections.length, 3)
  assert.doesNotMatch(eventSections[0], /initialLoadingLayout/)
  assert.doesNotMatch(eventSections[1], /initialLoadingLayout/)
  assert.match(eventSections[2], /title="오늘 전체"[\s\S]*?initialLoadingLayout=\{shouldReserveInitialLoadingFloor\}/)
  assert.match(
    eventSections[2],
    /initialLoadingMessage=\{shouldReserveInitialLoadingFloor \? '일정 준비 중…' : null\}/,
  )
  assert.doesNotMatch(eventSections[0], /일정 준비 중…/)
  assert.doesNotMatch(eventSections[1], /일정 준비 중…/)
  assert.doesNotMatch(todayPage, /차곡차곡 일정 채우는 중…/)

  assert.match(eventSection, /initialLoadingLayout = false/)
  assert.match(eventSection, /initialLoadingLayout && items\.length === 0 \? 'scheduler-event-content--initial-loading' : ''/)
  assert.match(
    eventSection,
    /initialLoadingLayout && items\.length === 0 && initialLoadingMessage \?\s*\(\s*<p className="subtle scheduler-loading-floor-note">\{initialLoadingMessage\}<\/p>\s*\)\s*: null/,
  )
  assert.doesNotMatch(eventSection, /scheduler-loading-floor-note[\s\S]*?aria-live|scheduler-loading-floor-note[\s\S]*?role="status"/)
  assert.match(eventSection, /className=\{eventListClassName\}[\s\S]*?items\.map/)

  const floorRecipe = styles.match(
    /\/\* First Today fetch only: reserve four compact event-card slots without rendering placeholders\. \*\/[\s\S]*?\.scheduler-theme-shell \.scheduler-today-page \.scheduler-event-section > \.scheduler-event-content--initial-loading\s*\{[\s\S]*?\n\}/,
  )?.[0]
  assert.ok(floorRecipe, 'initial loading floor should remain an explicit CSS recipe')
  assert.equal((floorRecipe.match(/var\(--scheduler-initial-event-card-floor-height\)/g) || []).length, 4)
  assert.equal((floorRecipe.match(/var\(--scheduler-initial-event-list-floor-gap\)/g) || []).length, 3)
  assert.match(floorRecipe, /min-height:\s*calc\(/)
  assert.match(floorRecipe, /24px[\s\S]*?var\(--scheduler-control-min-h\)[\s\S]*?0\.3rem[\s\S]*?0\.55rem/)
  assert.doesNotMatch(floorRecipe, /animation|background|backdrop-filter|transform|scale|skeleton|shimmer|spinner/)
  assert.match(styles, /--scheduler-initial-event-card-floor-height:\s*calc\([\s\S]*?0\.2rem[\s\S]*?0\.42rem[\s\S]*?-\s*3px[\s\S]*?\);/)
  assert.match(styles, /--scheduler-initial-event-list-floor-gap:\s*var\(--scheduler-gap-sm\);/)
  const loadingNoteRule = styles.match(
    /\.scheduler-theme-shell \.scheduler-today-page \.scheduler-loading-floor-note\s*\{[\s\S]*?\n\}/,
  )?.[0]
  assert.ok(loadingNoteRule, 'loading copy should have a Scheduler-scoped alignment rule')
  assert.match(loadingNoteRule, /position:\s*absolute/)
  assert.match(loadingNoteRule, /inset:\s*0/)
  assert.match(loadingNoteRule, /display:\s*block/)
  assert.match(loadingNoteRule, /padding-top:\s*var\(--scheduler-gap-sm\)/)
  assert.match(loadingNoteRule, /padding-left:\s*var\(--scheduler-event-card-content-start\)/)
  assert.match(loadingNoteRule, /font-size:\s*var\(--scheduler-type-body-size\)/)
  assert.match(loadingNoteRule, /font-weight:\s*var\(--scheduler-type-body-weight\)/)
  assert.match(loadingNoteRule, /color:\s*var\(--ag-text-tertiary\)/)
  assert.match(loadingNoteRule, /line-height:\s*1\.25/)
  assert.match(loadingNoteRule, /text-align:\s*left/)
  assert.doesNotMatch(loadingNoteRule, /place-items|text-align:\s*center/)
  assert.match(loadingNoteRule, /white-space:\s*nowrap/)
  assert.doesNotMatch(loadingNoteRule, /animation|transition|transform|delay/)
  assert.doesNotMatch(loadingNoteRule, /(?:^|\n)\s*(?:height|min-height)\s*:/)
  assert.match(
    styles,
    /--scheduler-event-card-content-start:\s*calc\([\s\S]*?var\(--scheduler-event-card-border-left-width\)[\s\S]*?var\(--scheduler-event-card-pad-x\)[\s\S]*?var\(--scheduler-content-inset\)[\s\S]*?\);/,
  )
  assert.match(styles, /border-left:\s*var\(--scheduler-event-card-border-left-width\)\s+solid/)
  assert.match(styles, /padding:\s*0\.28rem\s+var\(--scheduler-event-card-pad-x\)\s+0\.48rem/)
  assert.match(styles, /--scheduler-event-card-pad-x:\s*0\.68rem/)
})

test('event lists stay stable while the glass section shell remains outside the animation target', () => {
  assert.match(eventSection, /<section className=\{sectionClassName\}>[\s\S]*?<div className=\{sectionContentClassName\}>[\s\S]*?className=\{eventListClassName\}[\s\S]*?items\.map/)
  const animationRule = styles.match(
    /\.scheduler-theme-shell \.scheduler-async-content--initial-enter \.scheduler-event-list\s*\{[\s\S]*?\n\}/,
  )?.[0]
  const localAnimationRule = styles.slice(
    styles.indexOf('/* Scheduler Today local validated pilot'),
    styles.indexOf('.scheduler-theme-shell .scheduler-event-section.is-primary'),
  )
  const sectionGlassRule = styles.match(
    /\.scheduler-theme-shell \.scheduler-event-section\s*\{[\s\S]*?\n\}/,
  )?.[0]

  assert.ok(animationRule, 'animation should target the stable event list node')
  assert.ok(localAnimationRule, 'Scheduler-local arrival recipe should remain explicit')
  assert.ok(sectionGlassRule, 'event section glass rule should remain explicit')
  assert.match(sectionGlassRule, /backdrop-filter/)
  assert.doesNotMatch(sectionGlassRule, /animation/)
  assert.doesNotMatch(styles, /\.scheduler-theme-shell \.scheduler-async-content--initial-enter\s*\{\s*animation:/)
  assert.doesNotMatch(animationRule, /backdrop-filter|-webkit-backdrop-filter|transform|filter/)
  assert.match(localAnimationRule, /scheduler-event-list--initial-arrival \.scheduler-event-card/)
  assert.match(localAnimationRule, /240ms/)
  assert.match(localAnimationRule, /isolation:\s*isolate/)
  assert.match(localAnimationRule, /will-change:\s*transform, opacity/)
  assert.doesNotMatch(localAnimationRule, /backdrop-filter|-webkit-backdrop-filter|filter|width|height|margin|padding|top|left|stagger|delay/)
})

test('global async enter remains a 200ms opacity-only default while Today uses the scoped 240ms Settle pilot', () => {
  assert.match(styles, /--ag-scheduler-async-content-enter-duration:\s*200ms;/)
  assert.match(styles, /--ag-scheduler-async-content-enter-easing:\s*cubic-bezier\(0\.23, 1, 0\.32, 1\);/)
  assert.doesNotMatch(styles, /--ag-scheduler-async-content-enter-duration:\s*240ms/)
  const recipe = styles.slice(
    styles.indexOf('/* Global conditional content enter baseline'),
    styles.indexOf('/* Scheduler Today local validated pilot'),
  )

  assert.ok(recipe, 'global async content enter recipe should remain a contiguous audited block')
  assert.match(recipe, /animation:\s*scheduler-async-content-enter[\s\S]*?var\(--ag-scheduler-async-content-enter-duration\)[\s\S]*?var\(--ag-scheduler-async-content-enter-easing\)/)
  assert.match(recipe, /from\s*\{\s*opacity:\s*0;\s*\}[\s\S]*?to\s*\{\s*opacity:\s*1;\s*\}/)
  assert.doesNotMatch(recipe, /transform|translate|scale|blur|clip-path|width|height|margin|padding|top|left|stagger|delay/)
  assert.match(recipe, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.scheduler-theme-shell \.scheduler-async-content--initial-enter \.scheduler-event-list[\s\S]*?animation:\s*none;/)
  assert.match(styles, /@keyframes scheduler-card-arrival-settle[\s\S]*?translateY\(6px\) scale\(0\.97\)[\s\S]*?translateY\(0\) scale\(1\)/)
  assert.match(styles, /@keyframes scheduler-card-arrival-reduced[\s\S]*?transform:\s*none[\s\S]*?opacity:\s*1/)
  assert.match(styles, /scheduler-event-list--initial-arrival \.scheduler-event-card[\s\S]*?animation:\s*scheduler-card-arrival-reduced[\s\S]*?var\(--ag-duration-fast\)/)
  assert.match(design, /Scheduler-local validated pilot[\s\S]*?240ms` Settle[\s\S]*?전역 `200ms` opacity-only 기본값/)
})
