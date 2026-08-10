import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { canonicalIdentityJson } from '../src/artifactIdentity.js'
import {
  ARTIFACT_DIR,
  buildBundle,
  materializeBundle,
} from '../scripts/materialize-ziwei-p0-local-frontier-reconciliation-v1.mjs'
import {
  checkArtifact,
  ROOT,
} from '../scripts/check-ziwei-p0-local-frontier-reconciliation-v1.mjs'

const SOURCE_PATHS = {
  nanbei: process.env.PDF_SOURCE_NANBEI_PATH,
  nanyangtang: process.env.PDF_SOURCE_NANYANGTANG_PATH,
}
const MATERIALIZER_ROOT = ROOT
const WITH_SOURCES = { ...process.env, ...Object.fromEntries(
  Object.entries(SOURCE_PATHS).map(([key, value]) => [
    key === 'nanbei' ? 'PDF_SOURCE_NANBEI_PATH' : 'PDF_SOURCE_NANYANGTANG_PATH',
    value,
  ]),
) }
const OPTIONS = { sourcePaths: SOURCE_PATHS }

test('local Ziwei P0 frontier reconciliation is deterministic and fail-closed', () => {
  const first = buildBundle(MATERIALIZER_ROOT, OPTIONS)
  const second = buildBundle(MATERIALIZER_ROOT, OPTIONS)
  assert.equal(canonicalIdentityJson(first), canonicalIdentityJson(second))
  assert.deepEqual(first.graphImpact.successor, {
    claimCount: 30,
    sourceCount: 13,
    observationCount: 40,
    relationCount: 130,
    blockerCount: 11,
  })
  assert.equal(first.sourceIdentity.sources.length, 2)
  assert.equal(first.sourceIdentity.independentWitnessesAdmitted, 0)
  assert.equal(first.sourceIdentity.sourceAuthorityPromoted, false)
  assert.equal(first.localEvidence.fourTransformations.nanbei.comparableCount, 40)
  assert.equal(first.localEvidence.fourTransformations.ming.blockedCount, 36)
  assert.equal(first.localEvidence.lifeBodyRulers.sourceEditionRulers.shenZhuCanonicalBlocked, 24)
  assert.equal(first.localEvidence.tianfu.rotation06MatchCount, 150)
  assert.equal(first.readinessImpact.readiness, 'not_safe_to_start')
  assert.deepEqual(checkArtifact(
    ROOT,
    resolve(ROOT, `${ARTIFACT_DIR}/complete.json`),
    OPTIONS,
  ), [])
})

test('local Ziwei P0 frontier materialization is byte-identical on repeated writes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ziwei-p0-local-frontier-deterministic-'))
  try {
    const target = join(directory, 'complete.json')
    await materializeBundle(target, OPTIONS)
    const firstBody = await readFile(target)
    const firstIntegrity = await readFile(`${target}.integrity.json`)
    await materializeBundle(target, OPTIONS)
    assert.deepEqual(await readFile(target), firstBody)
    assert.deepEqual(await readFile(`${target}.integrity.json`), firstIntegrity)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('local Ziwei P0 frontier negative checker rejects promotion shortcuts', () => {
  const output = execFileSync(
    'node',
    ['scripts/check-ziwei-p0-local-frontier-reconciliation-v1-negative-v0.mjs'],
    { cwd: MATERIALIZER_ROOT, env: WITH_SOURCES, encoding: 'utf8' },
  )
  const result = JSON.parse(output)
  assert.equal(result.mutationCount, 12)
  assert.equal(result.allRejected, true)
  assert.ok(result.results.every(item => item.rejected))
})
