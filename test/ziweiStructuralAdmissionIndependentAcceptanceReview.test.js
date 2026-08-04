import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { buildIndependentAcceptanceReview } from '../scripts/materialize-ziwei-structural-admission-independent-acceptance-review-v0.mjs'
import { checkIndependentAcceptanceReview } from '../scripts/check-ziwei-structural-admission-independent-acceptance-review-v0.mjs'

const root = process.cwd()
const materializer = 'scripts/materialize-ziwei-structural-admission-independent-acceptance-review-v0.mjs'
const checker = 'scripts/check-ziwei-structural-admission-independent-acceptance-review-v0.mjs'
const negative = 'scripts/check-ziwei-structural-admission-independent-acceptance-review-negative-v0.mjs'

test('independent review covers exactly four candidates and records bypasses', async () => {
  const artifact = await buildIndependentAcceptanceReview()
  assert.match(artifact.basisHead, /^[0-9a-f]{40}$/)
  assert.deepEqual(artifact.candidateIds, ['ziwei-occ-2260aba6ed2163e3', 'ziwei-occ-a09e10a5495186b8', 'ziwei-occ-a72bdf60ef809b58', 'ziwei-occ-e73f469c5e35e072'])
  assert.deepEqual(artifact.findingDistribution, { accepted: 11, accepted_with_declared_limit: 5, gap: 0, violation: 0, not_applicable: 0 })
  assert.equal(artifact.decision.groundingSubsetStart, 'blocked')
  assert.equal(artifact.freshness.aligned, true)
  assert.deepEqual(await checkIndependentAcceptanceReview(artifact), [])
})

test('independent review materialization is byte deterministic', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ziwei-independent-review-'))
  try {
    const a = join(dir, 'a.json'); const b = join(dir, 'b.json')
    assert.equal(spawnSync(process.execPath, [materializer, a], { cwd: root, encoding: 'utf8' }).status, 0)
    assert.equal(spawnSync(process.execPath, [materializer, b], { cwd: root, encoding: 'utf8' }).status, 0)
    assert.deepEqual(await readFile(a), await readFile(b))
    const checked = spawnSync(process.execPath, [checker, a], { cwd: root, encoding: 'utf8' })
    assert.equal(checked.status, 0, checked.stdout + checked.stderr)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('independent negative fixture detects every declared bypass', () => {
  const result = spawnSync(process.execPath, [negative], { cwd: root, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.equal(JSON.parse(result.stdout).findings.length, 14)
})
