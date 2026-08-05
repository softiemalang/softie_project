import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

test('Ziwei system evidence/readiness coverage map and negative checker pass', () => {
  const checks = [
    'scripts/check-ziwei-system-evidence-readiness-coverage-map-v0.mjs',
    'scripts/check-ziwei-system-evidence-readiness-coverage-map-negative-v0.mjs',
  ]
  for (const script of checks) {
    const result = spawnSync(process.execPath, [script], { encoding: 'utf8' })
    assert.equal(result.status, 0, `${script}\n${result.stdout}\n${result.stderr}`)
  }
})
