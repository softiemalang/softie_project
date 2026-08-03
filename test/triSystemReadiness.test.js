import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

test('tri-system readiness inventory is internally consistent at current HEAD', () => {
  const output = execFileSync(process.execPath, ['scripts/check-tri-system-readiness.mjs'], { encoding: 'utf8' })
  const result = JSON.parse(output)
  assert.equal(result.pass, true)
  assert.equal(result.verdictToken, 'tri_system_preparation_baseline_partial')
  assert.equal(result.systemStatuses.saju.overallStatus, 'partial')
  assert.equal(result.systemStatuses.ziwei.overallStatus, 'partial')
  assert.equal(result.systemStatuses.astrology.activation, 'blocked')
})

test('tri-system readiness materialization is deterministic at the pinned HEAD', () => {
  const run = () => execFileSync(process.execPath, ['scripts/materialize-tri-system-readiness.mjs'], { encoding: 'utf8' })
  assert.equal(run(), run())
  const emitted = execFileSync(process.execPath, ['scripts/materialize-tri-system-readiness.mjs', '--emit-inventory'], { encoding: 'utf8' })
  assert.equal(emitted, readFileSync('artifacts/tri-system-readiness-v1/inventory.json', 'utf8'))
})
