import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')
const pilotBlock = styles.match(
  /\/\* Scheduler route continuity pilot: only explicit router opt-ins use this\. \*\/[\s\S]*?@media \(forced-colors: active\)/,
)?.[0]

test('scheduler View Transition timing is route-scoped and isolated from the fast token', () => {
  assert.ok(pilotBlock, 'scheduler View Transition pilot CSS should remain present')
  assert.match(styles, /--ag-duration-fast:\s*180ms;/)
  assert.match(styles, /--ag-scheduler-route-transition-duration:\s*220ms;/)
  assert.match(styles, /--ag-scheduler-route-transition-easing:\s*cubic-bezier\(0\.23, 1, 0\.32, 1\);/)
  assert.match(pilotBlock, /\.scheduler-auth-gated\s*\{[\s\S]*?view-transition-name:\s*scheduler-route;/)
  assert.match(pilotBlock, /animation-duration:\s*var\(--ag-scheduler-route-transition-duration\);/)
  assert.match(pilotBlock, /animation-timing-function:\s*var\(--ag-scheduler-route-transition-easing\);/)
  assert.doesNotMatch(pilotBlock, /var\(--ag-duration-fast\)/)
})

test('scheduler View Transition reduced-motion override remains explicit', () => {
  assert.ok(pilotBlock, 'scheduler View Transition pilot CSS should remain present')
  assert.match(
    pilotBlock,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?::view-transition-old\(scheduler-route\)[\s\S]*?animation-duration:\s*0\.01ms !important;/,
  )
})
