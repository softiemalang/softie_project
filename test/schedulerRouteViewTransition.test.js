import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const schedulerApp = readFileSync(new URL('../src/scheduler/SchedulerApp.jsx', import.meta.url), 'utf8')
const schedulerEventCard = readFileSync(new URL('../src/scheduler/SchedulerEventCard.jsx', import.meta.url), 'utf8')
const reservationEditor = readFileSync(new URL('../src/scheduler/ReservationEditorPage.jsx', import.meta.url), 'utf8')

test('Scheduler list/create/edit route directions explicitly opt into View Transition', () => {
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
  assert.match(
    reservationEditor,
    /function handleBack\(\)[\s\S]*?navigate\(backPath,\s*\{\s*viewTransition:\s*true\s*\}\s*\)/,
    'create/edit editor -> reservation list should use the route View Transition opt-in',
  )
})
