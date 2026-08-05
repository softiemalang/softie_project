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

test('materializer requires explicit basis provenance and never falls back to current HEAD', () => {
  const result = spawnSync(process.execPath, [
    'scripts/materialize-ziwei-system-evidence-readiness-coverage-map-v0.mjs',
    '--basis-head',
    'd344e315a0e24d0a0a1a2dde5e7972d8e21a26f7',
    '--output-dir',
    '/private/tmp/ziwei-coverage-test-output',
  ], { encoding: 'utf8' })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const missing = spawnSync(process.execPath, ['scripts/materialize-ziwei-system-evidence-readiness-coverage-map-v0.mjs', '--output-dir', '/private/tmp/ziwei-coverage-test-output-missing'], { encoding: 'utf8' })
  assert.notEqual(missing.status, 0)
})
