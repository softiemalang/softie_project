import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'

const artifact = 'artifacts/astrology-verified-readiness-v1.json'
const integrity = 'artifacts/astrology-verified-readiness-v1.integrity.json'

test('readiness materialization is byte-stable and uses explicit hash scopes', async () => {
  execFileSync(process.execPath, ['scripts/materialize-verified-astrology-readiness.mjs'], { stdio: 'pipe' })
  const first = await readFile(artifact)
  const firstIntegrity = await readFile(integrity)
  execFileSync(process.execPath, ['scripts/materialize-verified-astrology-readiness.mjs'], { stdio: 'pipe' })
  assert.deepEqual(await readFile(artifact), first)
  assert.deepEqual(await readFile(integrity), firstIntegrity)
  const parsed = JSON.parse(first)
  assert.equal(typeof parsed.payloadCanonicalSha256, 'string')
  assert.equal('evidenceSha256' in parsed, false)
  assert.equal(parsed.serviceActivation, 'blocked')
})

test('readiness artifact inventory is derived and preserves both positive boundary cases', async () => {
  const parsed = JSON.parse(await readFile(artifact))
  const counts = {
    total: parsed.cases.length,
    ready: parsed.cases.filter(item => item.assessment.readiness === 'ready').length,
    blocked: parsed.cases.filter(item => item.assessment.readiness === 'blocked').length,
    expectedReasonPresent: parsed.cases.filter(item => item.expectedReason).length,
    expectedReasonMissing: parsed.cases.filter(item => !item.expectedReason).length,
  }
  assert.deepEqual(counts, { total: 30, ready: 2, blocked: 28, expectedReasonPresent: 28, expectedReasonMissing: 2 })
  assert.equal(parsed.cases.find(item => item.id === 'all-valid-calculation-ready').assessment.readiness, 'ready')
  assert.equal(parsed.cases.find(item => item.id === 'coverage-boundary-in').assessment.readiness, 'ready')
})
