import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { canonicalIdentityJson } from '../src/artifactIdentity.js'
import { ARTIFACT_DIR, CACHE_ENV, buildBundle, materializeBundle } from '../scripts/materialize-ziwei-p0-toyo-1646-extended-observation-v0.mjs'
import { checkArtifact, ROOT } from '../scripts/check-ziwei-p0-toyo-1646-extended-observation-v0.mjs'

const CACHE_DIR = '/private/tmp'
const MATERIALIZER_ROOT = ROOT
const withCache = { ...process.env, [CACHE_ENV]: CACHE_DIR }

test('TOYO_1646 extended observation is actual-byte bound and fail-closed', () => {
  const first = buildBundle(MATERIALIZER_ROOT, { cacheDir: CACHE_DIR })
  const second = buildBundle(MATERIALIZER_ROOT, { cacheDir: CACHE_DIR })
  assert.equal(canonicalIdentityJson(first), canonicalIdentityJson(second))
  assert.equal(first.externalEvidence.imageCount, 23)
  assert.equal(first.externalEvidence.predecessorImageCount, 15)
  assert.equal(first.externalEvidence.newImageCount, 8)
  assert.deepEqual(first.externalEvidence.historicalHashReconciliation.map(item => item.leaf), ['0085'])
  assert.equal(first.observations.length, 8)
  assert.equal(first.relations.length, 8)
  assert.deepEqual(first.impact.blockersClosed, [])
  assert.equal(first.impact.stableClaimCount, 0)
  assert.equal(first.impact.semanticAuthorityCount, 0)
  assert.equal(first.impact.independentWitnessesAdmitted, 0)
  assert.deepEqual(checkArtifact(ROOT, resolve(ROOT, `${ARTIFACT_DIR}/complete.json`), { cacheDir: CACHE_DIR }), [])
})

test('TOYO_1646 extended materialization is byte-identical on repeated writes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ziwei-toyo-extended-deterministic-'))
  try {
    const target = join(directory, 'complete.json')
    await materializeBundle(target, { cacheDir: CACHE_DIR })
    const firstBody = await readFile(target)
    const firstIntegrity = await readFile(`${target}.integrity.json`)
    await materializeBundle(target, { cacheDir: CACHE_DIR })
    assert.deepEqual(await readFile(target), firstBody)
    assert.deepEqual(await readFile(`${target}.integrity.json`), firstIntegrity)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('TOYO_1646 extended negative checker rejects promotion shortcuts', () => {
  const output = execFileSync('node', ['scripts/check-ziwei-p0-toyo-1646-extended-observation-v0-negative-v0.mjs'], { cwd: MATERIALIZER_ROOT, env: withCache, encoding: 'utf8' })
  const result = JSON.parse(output)
  assert.equal(result.mutationCount, 10)
  assert.equal(result.allRejected, true)
  assert.ok(result.results.every(item => item.rejected))
})
