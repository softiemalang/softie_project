import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8')
const rehearsalStyles = await readFile(new URL('../src/rehearsals/rehearsals.css', import.meta.url), 'utf8')
const design = await readFile(new URL('../DESIGN.md', import.meta.url), 'utf8')

function sliceBetween(text, start, end) {
  const startIndex = text.indexOf(start)
  assert.notEqual(startIndex, -1, `missing start marker: ${start}`)
  const endIndex = text.indexOf(end, startIndex + start.length)
  assert.notEqual(endIndex, -1, `missing end marker: ${end}`)
  return text.slice(startIndex, endIndex)
}

test('common Atmospheric and Home hover effects are capability-gated without changing their visual values', () => {
  const commonHover = sliceBetween(
    styles,
    '@media (hover: hover) and (pointer: fine) {\n  .ag-primary-action:hover',
    '\n.ag-segmented {',
  )
  assert.match(commonHover, /\.ag-primary-action:hover[\s\S]*?var\(--ag-brand-hover\)/)
  assert.match(commonHover, /\.ag-secondary-action:hover[\s\S]*?var\(--ag-line-strong\)/)

  const homeHover = sliceBetween(
    styles,
    '@media (hover: hover) and (pointer: fine) {\n  .home-shell.ag-shell .service-card:hover',
    '\n.service-card:active {',
  )
  assert.match(homeHover, /translateY\(-1px\)/)
  assert.match(homeHover, /translateY\(-3px\)/)

  const outsideCommon = styles.replace(commonHover, '').replace(homeHover, '')
  assert.doesNotMatch(outsideCommon, /\.ag-(?:primary|secondary)-action:hover/)
  assert.doesNotMatch(outsideCommon, /\.service-card:hover/)
})

test('Scheduler press pilot retains exact scoped ingredients and reduced motion removes scale while preserving feedback', () => {
  const pressRule = sliceBetween(
    styles,
    '.scheduler-theme-shell .scheduler-action-button {',
    '\n.scheduler-theme-shell .scheduler-action-button:disabled',
  )
  assert.match(pressRule, /touch-action:\s*manipulation/)
  assert.match(pressRule, /transform 160ms cubic-bezier\(0\.23, 1, 0\.32, 1\)/)
  assert.match(pressRule, /:active:not\(:disabled\)[\s\S]*?transform:\s*scale\(0\.97\)/)

  const reduced = sliceBetween(
    styles,
    '@media (prefers-reduced-motion: reduce) {\n  .home-shell.ag-shell .service-card:active',
    '\n  .scheduler-theme-shell .scheduler-sync-toast',
  )
  assert.match(reduced, /\.service-card:active[\s\S]*?transform:\s*none/)
  assert.match(reduced, /\.scheduler-action-button:active:not\(:disabled\)[\s\S]*?transform:\s*none/)
  assert.match(reduced, /\.scheduler-action-button-visual[\s\S]*?opacity:\s*0\.86/)
})

test('Rehearsal modal reduced-motion state is visible and centered with its transform animation stopped', () => {
  const modalRule = sliceBetween(rehearsalStyles, '.rehearsal-modal {', '\n.rehearsal-add-modal-sheet')
  assert.match(modalRule, /animation:\s*modalCenterIn 0\.3s forwards ease-out/)
  assert.doesNotMatch(modalRule, /backdrop-filter|filter:/)

  const reduced = sliceBetween(
    rehearsalStyles,
    '@media (prefers-reduced-motion: reduce) {\n  .rehearsal-modal {',
    '\n.rehearsal-sheet-header {',
  )
  assert.match(reduced, /animation:\s*none/)
  assert.match(reduced, /transform:\s*translate\(-50%, -50%\)/)
  assert.match(reduced, /opacity:\s*1/)
})

test('Home Memo glass surfaces remain static and overlay motion stays on hold', () => {
  const backdropRule = sliceBetween(styles, '.home-memo-backdrop {', '\n.home-memo-sheet {')
  const sheetRule = sliceBetween(styles, '.home-memo-sheet {', '\n.ios27-selective-touch-target {')
  const selectiveSheetRule = sliceBetween(styles, '.home-memo-sheet.ios27-selective-sheet {', '\n.home-memo-header {')
  assert.match(backdropRule, /backdrop-filter:/)
  assert.match(sheetRule, /backdrop-filter:/)
  assert.doesNotMatch(backdropRule, /animation:|transition:/)
  assert.doesNotMatch(sheetRule, /animation:|transition:/)
  assert.doesNotMatch(selectiveSheetRule, /animation:|transition:/)
})

test('DESIGN promotes role separation without generalizing async 200ms or exact press values', () => {
  assert.match(design, /version:\s*2\.8\.0/)
  assert.match(design, /모든 interaction role의 보편 duration\/easing이 아닙니다/)
  assert.match(design, /숫자가 같아도 자동으로 하나의 token에 합치지 않습니다/)
  assert.match(design, /product\/device 검증 없이 추정하거나 승격하지 않습니다/)
  assert.match(design, /@media \(hover: hover\) and \(pointer: fine\)/)
  assert.match(design, /다른 interaction 유형의 전역 duration 기본값이 아닙니다/)
})
