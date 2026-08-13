import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')
const baselineBlock = styles.match(
  /\/\* Scheduler route continuity pilot: only explicit router opt-ins use this\. \*\/[\s\S]*?@media \(forced-colors: active\)/,
)?.[0]

test('scheduler View Transition uses the common 180ms baseline and initial pilot easing', () => {
  assert.ok(baselineBlock, 'scheduler View Transition baseline CSS should remain present')
  assert.match(styles, /--ag-duration-fast:\s*180ms;/)
  assert.match(styles, /--ag-scheduler-route-transition-easing:\s*cubic-bezier\(0\.23, 1, 0\.32, 1\);/)
  assert.doesNotMatch(styles, /--ag-scheduler-route-transition-(duration|old-duration|new-duration):/)
  assert.doesNotMatch(styles, /Soft Page Handoff v0|scheduler-route-(old|new)-handoff/)
  assert.match(baselineBlock, /\.scheduler-route-content\s*\{[\s\S]*?view-transition-name:\s*scheduler-route;/)
  assert.doesNotMatch(
    baselineBlock,
    /\.scheduler-auth-gated\s*\{[\s\S]*?view-transition-name:\s*scheduler-route;/,
    'the authenticated shell must stay outside the route snapshot boundary',
  )
  assert.match(
    baselineBlock,
    /::view-transition-old\(scheduler-route\)[\s\S]*?animation-duration:\s*var\(--ag-duration-fast\);[\s\S]*?animation-timing-function:\s*var\(--ag-scheduler-route-transition-easing\);/,
  )
  assert.match(
    baselineBlock,
    /::view-transition-new\(scheduler-route\)[\s\S]*?animation-duration:\s*var\(--ag-duration-fast\);[\s\S]*?animation-timing-function:\s*var\(--ag-scheduler-route-transition-easing\);/,
  )
  assert.match(baselineBlock, /::view-transition-group\(scheduler-route\),[\s\S]*?animation:\s*none;/)
  assert.match(baselineBlock, /::view-transition-image-pair\(scheduler-route\)[\s\S]*?animation:\s*none;/)
  assert.doesNotMatch(baselineBlock, /@keyframes|animation-name:|animation-fill-mode:|mix-blend-mode:/)
  assert.doesNotMatch(baselineBlock, /35%|42%|55%|65%|0\.94/)
  assert.doesNotMatch(baselineBlock, /\b(transform|translate|scale|zoom|blur)\b/)
})

test('scheduler View Transition reduced-motion override remains explicit', () => {
  assert.ok(baselineBlock, 'scheduler View Transition baseline CSS should remain present')
  assert.match(
    baselineBlock,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?::view-transition-old\(scheduler-route\)[\s\S]*?animation-duration:\s*0\.01ms !important;/,
  )
})
