import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const rehearsalPage = await readFile(new URL('../src/pages/RehearsalCalendarPage.jsx', import.meta.url), 'utf8')
const rehearsalStyles = await readFile(new URL('../src/rehearsals/rehearsals.css', import.meta.url), 'utf8')
const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8')
const prepPage = await readFile(new URL('../src/interpretationPrep/InterpretationPrepPage.jsx', import.meta.url), 'utf8')
const prepStyles = await readFile(new URL('../src/interpretationPrep/interpretationPrep.css', import.meta.url), 'utf8')
const bandPage = await readFile(new URL('../src/pages/BandGooglePage.jsx', import.meta.url), 'utf8')
const bandCompactPage = await readFile(new URL('../src/pages/BandGoogleCompactPage.jsx', import.meta.url), 'utf8')
const fortuneStyles = await readFile(new URL('../src/saju/fortune.css', import.meta.url), 'utf8')
const bandPolishStyles = await readFile(new URL('../public/band-polish.css', import.meta.url), 'utf8')
const bandHubAccountStyles = await readFile(new URL('../public/band-hub-account-actions.css', import.meta.url), 'utf8')

function sliceBetween(text, start, end) {
  const startIndex = text.indexOf(start)
  assert.notEqual(startIndex, -1, `missing start marker: ${start}`)
  const endIndex = text.indexOf(end, startIndex + start.length)
  assert.notEqual(endIndex, -1, `missing end marker: ${end}`)
  return text.slice(startIndex, endIndex)
}

function hoverRulesOutsideFinePointerMedia(css) {
  const stack = []
  const findings = []
  let segmentStart = 0
  for (let index = 0; index < css.length; index += 1) {
    if (css[index] === '{') {
      const prelude = css.slice(segmentStart, index).trim()
      const finePointer = stack.some((entry) => entry.finePointer)
        || (prelude.startsWith('@media') && prelude.includes('(hover: hover)') && prelude.includes('(pointer: fine)'))
      if (prelude.includes(':hover') && !finePointer) findings.push(prelude)
      stack.push({ finePointer })
      segmentStart = index + 1
    } else if (css[index] === '}') {
      stack.pop()
      segmentStart = index + 1
    }
  }
  return findings
}

test('Rehearsal month and date actions use native button semantics', () => {
  assert.match(rehearsalPage, /<button[\s\S]*?className="rehearsal-month-label"[\s\S]*?aria-label=\{`\$\{currentDate\.getFullYear\(\)\}년 \$\{currentDate\.getMonth\(\) \+ 1\}월, 오늘 날짜로 이동`\}/)
  assert.doesNotMatch(rehearsalPage, /<span className="rehearsal-month-label"[\s\S]*?onClick=/)
  assert.match(rehearsalPage, /<button[\s\S]*?type="button"[\s\S]*?className=\{`rehearsal-day[\s\S]*?aria-pressed=\{isSelected\}[\s\S]*?aria-current=\{isToday \? 'date' : undefined\}/)
  assert.match(rehearsalPage, /<span className="rehearsal-date-num">/)
  assert.doesNotMatch(rehearsalPage, /<div\s+key=\{dateStr\}\s+className=\{`rehearsal-day/)
})

test('Rehearsal keyboard focus and touch targets remain visible and at least 44px', () => {
  const focusRules = sliceBetween(
    rehearsalStyles,
    '.rehearsal-month-nav button:focus-visible,',
    '\n.rehearsal-calendar-grid {',
  )
  assert.match(focusRules, /outline:\s*3px solid/)
  assert.match(focusRules, /outline-offset:\s*2px/)

  const timeFocus = sliceBetween(
    rehearsalStyles,
    '.rehearsal-time-period-toggle button:focus-visible,',
    '\n.rehearsal-time-period-toggle button.is-selected,',
  )
  assert.match(timeFocus, /outline:\s*3px solid/)
  assert.doesNotMatch(timeFocus, /outline:\s*none/)
  assert.match(rehearsalStyles, /\.rehearsal-native-picker-shell:focus-within \.rehearsal-picker-field[\s\S]*?box-shadow:/)
  assert.match(rehearsalStyles, /\.rehearsal-sheet-header \.scheduler-modal-close[\s\S]*?min-height:\s*44px/)
  assert.match(rehearsalStyles, /\.rehearsal-action-btn[\s\S]*?min-height:\s*44px/)
  assert.match(rehearsalStyles, /\.soft-button\.small[\s\S]*?min-height:\s*44px/)
})

test('legacy selection controls expose native pressed button state without incomplete tab or radio roles', () => {
  assert.match(bandPage, /aria-pressed=\{Boolean\(availabilityMap\[key\]\)\}/)
  assert.equal((bandCompactPage.match(/aria-pressed=\{Boolean\(availabilityMap\[key\]\)\}/g) || []).length, 1)
  assert.match(bandCompactPage, /className="band-day-group-switch" role="group"/)
  assert.match(bandCompactPage, /className="band-tabbar" role="group"/)
  assert.doesNotMatch(bandCompactPage, /role="tablist"/)
  assert.match(bandCompactPage, /function TabButton[\s\S]*?aria-pressed=\{active\}/)
  assert.match(prepPage, /className="prep-gender-control" role="group"/)
  assert.equal((prepPage.match(/aria-pressed=\{input\.gender ===/g) || []).length, 2)
  assert.doesNotMatch(prepPage, /role="radiogroup"|role="radio"|aria-checked=/)
})

test('Scheduler glass controls and FAB avoid raw press transforms while reduced motion removes remaining movement', () => {
  const fabRule = sliceBetween(
    styles,
    '.scheduler-fab-button {',
    '\n.scheduler-fab-icon {',
  )
  assert.doesNotMatch(fabRule, /transition:[^;]*transform|transform:/)
  assert.doesNotMatch(styles, /\.scheduler-fab-button:active\s*\{[^}]*transform:/)

  const settingRule = sliceBetween(
    styles,
    '.scheduler-theme-shell .scheduler-setting-card {',
    '\n.scheduler-theme-shell .scheduler-auth-card {',
  )
  assert.match(settingRule, /backdrop-filter:/)
  assert.doesNotMatch(settingRule, /transition:[^;]*transform|:active\s*\{[^}]*transform:/)

  const statusRule = sliceBetween(
    styles,
    '.scheduler-theme-shell .scheduler-status-item {',
    '\n.scheduler-theme-shell .scheduler-status-item-label,',
  )
  assert.match(statusRule, /backdrop-filter:/)
  assert.doesNotMatch(statusRule, /:active\s*\{[^}]*transform:/)

  const globalReduced = sliceBetween(
    styles,
    '@media (prefers-reduced-motion: reduce) {\n  .home-shell.ag-shell .service-card:active',
    '\n}\n\n.scheduler-theme-shell .scheduler-sheet,',
  )
  for (const selector of [
    '.scheduler-theme-shell .scheduler-editor-page .scheduler-back-button:active:not(:disabled)',
    '.music-volume-step-btn:active:not(:disabled)',
  ]) assert.ok(globalReduced.includes(selector), selector)
  assert.match(globalReduced, /transform:\s*none !important/)
  assert.match(globalReduced, /\.music-progress-fill[\s\S]*?transition:\s*none/)

  const prepReduced = sliceBetween(
    prepStyles,
    '@media (prefers-reduced-motion: reduce) {',
    '\n@media (forced-colors: active) {',
  )
  assert.match(prepReduced, /\.prep-copy-actions button:active,[\s\S]*?transform:\s*none/)
  assert.match(prepReduced, /\.strength-meter-fill,[\s\S]*?transition:\s*none !important/)
})

test('audited CSS has no transition-all or undefined legacy transition token', () => {
  for (const css of [styles, rehearsalStyles, prepStyles, fortuneStyles, bandPolishStyles, bandHubAccountStyles]) {
    assert.doesNotMatch(css, /transition:\s*all\b/)
    assert.doesNotMatch(css, /transition:[^;]*box-shadow/)
    assert.doesNotMatch(css, /--ag-transition-(?:duration-fast|easing-standard)/)
  }
})

test('every remaining visual hover rule is capability-gated', () => {
  for (const [name, css] of Object.entries({ styles, prepStyles, fortuneStyles, bandPolishStyles, bandHubAccountStyles })) {
    assert.deepEqual(hoverRulesOutsideFinePointerMedia(css), [], name)
  }
})

test('Scheduler sync toast is static glass and keeps its 1800ms lifecycle out of motion CSS', () => {
  const toast = sliceBetween(
    styles,
    '.scheduler-theme-shell .scheduler-sync-toast {',
    '\n@media (prefers-reduced-motion: reduce) {',
  )
  assert.match(toast, /backdrop-filter:/)
  assert.match(toast, /transform:\s*translateX\(-50%\)/)
  assert.doesNotMatch(toast, /animation:|transition:/)
  assert.doesNotMatch(styles, /scheduler-sync-toast-in/)
})
