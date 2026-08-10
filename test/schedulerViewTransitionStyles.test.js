import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')
const handoffBlock = styles.match(
  /\/\*\n \* Scheduler route-local Soft Page Handoff v0\.[\s\S]*?@media \(forced-colors: active\)/,
)?.[0]

test('scheduler View Transition timing is route-scoped and isolated from the fast token', () => {
  assert.ok(handoffBlock, 'scheduler Soft Page Handoff CSS should remain present')
  assert.match(styles, /--ag-duration-fast:\s*180ms;/)
  assert.match(styles, /--ag-scheduler-route-transition-duration:\s*230ms;/)
  assert.doesNotMatch(styles, /--ag-scheduler-route-transition-(old|new)-duration:/)
  assert.match(styles, /--ag-scheduler-route-transition-easing:\s*cubic-bezier\(0\.23, 1, 0\.32, 1\);/)
  assert.match(handoffBlock, /\.scheduler-auth-gated\s*\{[\s\S]*?view-transition-name:\s*scheduler-route;/)
  assert.match(
    handoffBlock,
    /@keyframes scheduler-route-old-handoff[\s\S]*?0%,[\s\S]*?35%[\s\S]*?opacity:\s*1;[\s\S]*?55%,[\s\S]*?100%[\s\S]*?opacity:\s*0;/,
  )
  assert.match(
    handoffBlock,
    /@keyframes scheduler-route-new-handoff[\s\S]*?0%,[\s\S]*?42%[\s\S]*?opacity:\s*0;[\s\S]*?65%[\s\S]*?opacity:\s*0\.94;[\s\S]*?100%[\s\S]*?opacity:\s*1;/,
  )
  assert.match(
    handoffBlock,
    /::view-transition-old\(scheduler-route\)[\s\S]*?animation-name:\s*scheduler-route-old-handoff;[\s\S]*?animation-duration:\s*var\(--ag-scheduler-route-transition-duration\);[\s\S]*?animation-timing-function:\s*var\(--ag-scheduler-route-transition-easing\);[\s\S]*?animation-fill-mode:\s*both;[\s\S]*?mix-blend-mode:\s*normal;/,
  )
  assert.match(
    handoffBlock,
    /::view-transition-new\(scheduler-route\)[\s\S]*?animation-name:\s*scheduler-route-new-handoff;[\s\S]*?animation-duration:\s*var\(--ag-scheduler-route-transition-duration\);[\s\S]*?animation-timing-function:\s*var\(--ag-scheduler-route-transition-easing\);[\s\S]*?animation-fill-mode:\s*both;[\s\S]*?mix-blend-mode:\s*normal;/,
  )
  assert.match(handoffBlock, /::view-transition-group\(scheduler-route\),[\s\S]*?animation:\s*none;/)
  assert.match(handoffBlock, /::view-transition-image-pair\(scheduler-route\)[\s\S]*?animation:\s*none;/)
  assert.doesNotMatch(handoffBlock, /var\(--ag-duration-fast\)/)
  assert.doesNotMatch(handoffBlock, /\b(transform|translate|scale|zoom|blur)\b/)
})

test('scheduler View Transition reduced-motion override remains explicit', () => {
  assert.ok(handoffBlock, 'scheduler Soft Page Handoff CSS should remain present')
  assert.match(
    handoffBlock,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?::view-transition-old\(scheduler-route\)[\s\S]*?animation-duration:\s*0\.01ms !important;/,
  )
})

test('scheduler Soft Page Handoff overlap stays within the 20-40ms contract', () => {
  const durationMs = Number(styles.match(/--ag-scheduler-route-transition-duration:\s*(\d+)ms;/)?.[1])
  const oldExitPercent = Number(handoffBlock.match(/@keyframes scheduler-route-old-handoff[\s\S]*?(\d+)%,\s*\n\s*100%[\s\S]*?opacity:\s*0;/)?.[1])
  const newStartPercent = Number(handoffBlock.match(/@keyframes scheduler-route-new-handoff[\s\S]*?0%,\s*\n\s*(\d+)%/)?.[1])
  const overlapMs = ((oldExitPercent - newStartPercent) / 100) * durationMs

  assert.equal(Number(overlapMs.toFixed(1)), 29.9)
  assert.ok(overlapMs >= 20 && overlapMs <= 40)
})
