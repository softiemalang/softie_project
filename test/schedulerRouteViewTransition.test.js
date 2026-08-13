import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const schedulerApp = readFileSync(new URL('../src/scheduler/SchedulerApp.jsx', import.meta.url), 'utf8')
const schedulerEventCard = readFileSync(new URL('../src/scheduler/SchedulerEventCard.jsx', import.meta.url), 'utf8')
const reservationEditor = readFileSync(new URL('../src/scheduler/ReservationEditorPage.jsx', import.meta.url), 'utf8')

test('Scheduler entry routes explicitly opt into View Transition', () => {
  assert.match(
    schedulerApp,
    /navigate\(\s*`\/scheduler\/new\?date=\$\{encodeURIComponent\(schedulerViewState\.date \|\| toLocalDateInputValue\(\)\)\}`,\s*\{\s*viewTransition:\s*true,?\s*\},?\s*\)/,
    'reservation list -> create should use the route View Transition opt-in',
  )
  assert.match(
    schedulerEventCard,
    /navigate\(\s*`\/scheduler\/\$\{item\.reservation_id\}`,\s*\{\s*viewTransition:\s*true\s*\}\s*\)/,
    'reservation list -> edit should use the route View Transition opt-in',
  )
})

test('Scheduler View Transition boundary contains route content but not the fixed entry FAB', () => {
  assert.match(
    schedulerApp,
    /<div className="scheduler-route-content">\s*\{renderContent\(\)\}\s*<\/div>\s*\{showFab && \(/,
    'the named snapshot boundary should exclude the fixed FAB from route content',
  )
})

test('Scheduler editor exits return to Today without the full-root View Transition', () => {
  assert.equal(
    (reservationEditor.match(/navigate\(backPath\)/g) || []).length,
    2,
    'top back and delete should both use the existing immediate backPath navigation',
  )
  assert.doesNotMatch(
    reservationEditor,
    /navigate\(backPath,\s*\{\s*viewTransition:\s*true\s*\}\s*\)/,
    'editor -> Today returns must not capture the geometry-different full Scheduler snapshot',
  )
})
