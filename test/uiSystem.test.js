import assert from 'node:assert/strict'
import test from 'node:test'
import { checkUiSystem, scanUiSource } from '../scripts/check-ui-system.mjs'

test('UI system registry points to the current local design sources', async () => {
  const result = await checkUiSystem()
  assert.equal(result.pass, true, JSON.stringify(result.findings, null, 2))
  assert.equal(result.schemaVersion, 'softie-ui-system-v1')
  assert.ok(result.tokenCount >= 30)
  assert.ok(result.patternCount >= 8)
  assert.equal(result.legacyPreserveOnlyCount >= 5, true)
})

test('new UI source scan allows token references and catches drift-prone literals', () => {
  assert.deepEqual(scanUiSource('.card { color: var(--ag-text); gap: var(--scheduler-gap-md); }', 'src/feature/example.css'), [])

  const findings = scanUiSource([
    '.new-card {',
    '  color: #ffffff;',
    '  padding: 17px;',
    '}',
  ].join('\n'), 'src/feature/example.css')
  assert.deepEqual(findings.map(item => item.code), ['new_raw_color_literal', 'new_raw_dimension'])

  assert.deepEqual(
    scanUiSource('<div style={{ color: "#fff" }} />', 'src/feature/ExamplePage.jsx').map(item => item.code),
    ['new_raw_color_literal', 'new_inline_visual_style'],
  )
})

test('canonical runtime stylesheet is the allowed literal source', () => {
  assert.deepEqual(scanUiSource('.token { color: #fff; padding: 12px; }', 'src/styles.css'), [])
})
