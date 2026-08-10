import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { canonicalIdentityJson } from '../src/artifactIdentity.js'
import { ARTIFACT_DIR, buildBundle, materializeBundle } from '../scripts/materialize-ziwei-p0-claim-source-identity-frontier-v1.mjs'
import { ROOT, checkArtifact } from '../scripts/check-ziwei-p0-claim-source-identity-frontier-v1.mjs'

test('Ziwei P0 claim-source identity frontier is deterministic, exhaustive at scope, and fail-closed', () => {
  const first = buildBundle(ROOT)
  const second = buildBundle(ROOT)
  assert.equal(canonicalIdentityJson(first.artifact), canonicalIdentityJson(second.artifact))
  for (const name of Object.keys(first.files)) assert.equal(canonicalIdentityJson(first.files[name]), canonicalIdentityJson(second.files[name]), name)

  assert.equal(first.artifact.coverage.claimCount, 30)
  assert.equal(first.artifact.coverage.sourceCount, 13)
  assert.equal(first.artifact.coverage.observationCount, 26)
  assert.equal(first.artifact.coverage.relationCount, 116)
  assert.equal(first.artifact.coverage.blockerCount, 11)
  assert.equal(first.artifact.coverage.researchUnitCount, 7)
  assert.equal(first.artifact.researchUnits.length, 7)
  assert.equal(first.artifact.coverage.claimStatusDistribution.unsupported, 1)
  assert.equal(first.artifact.claimBoundary.stableClaimCount, 0)
  assert.equal(first.artifact.claimBoundary.semanticAuthorityCount, 0)
  assert.equal(first.artifact.claimBoundary.rotation06, 'representation_only')
  assert.equal(first.artifact.readinessImpact.readiness, 'not_safe_to_start')
  assert.equal(first.artifact.protectedChanges.sourcePdfOrImageStoredInGit, false)
  assert.equal(first.files['source-lineage-inventory.json'].sources.find((item) => item.sourceId === 'src-nara-4468520').independence, 'not_independent_same_record_volume_pair')
  assert.equal(first.files['source-lineage-inventory.json'].sources.find((item) => item.sourceId === 'src-toyo-1646').independence, 'independent_physical_witness_candidate_not_admitted_as_independent_oracle')
  assert.equal(first.files['observations.json'].observations.filter((item) => item.sourceId === 'src-toyo-1646').length, 15)
  assert.deepEqual(checkArtifact(ROOT), [])
})

test('Ziwei P0 negative mutations are rejected', () => {
  const output = execFileSync('node', [resolve(ROOT, 'scripts/check-ziwei-p0-claim-source-identity-frontier-negative-v1.mjs')], { cwd: ROOT, encoding: 'utf8' })
  const result = JSON.parse(output)
  assert.equal(result.mutationCount, 10)
  assert.equal(result.allRejected, true)
  assert.ok(result.results.every((item) => item.rejected))
  assert.ok(resolve(ROOT, ARTIFACT_DIR))
})

test('Ziwei P0 materializer output is byte-identical on repeated writes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ziwei-p0-materialize-'))
  const target = join(directory, 'complete.json')
  const names = ['complete.json', 'complete.json.integrity.json', 'claim-source-matrix.json', 'claim-source-matrix.json.integrity.json', 'source-lineage-inventory.json', 'source-lineage-inventory.json.integrity.json', 'observations.json', 'observations.json.integrity.json', 'relations.json', 'relations.json.integrity.json', 'blockers.json', 'blockers.json.integrity.json']
  try {
    await materializeBundle(target)
    const first = await Promise.all(names.map(async (name) => [name, await readFile(join(directory, name))]))
    await materializeBundle(target)
    for (const [name, bytes] of first) assert.deepEqual(await readFile(join(directory, name)), bytes, name)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
