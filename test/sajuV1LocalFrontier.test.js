import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { resolve } from 'node:path'
import { buildArtifact } from '../scripts/materialize-saju-v1-local-frontier-v0.mjs'
import { checkSajuV1LocalFrontier, canonicalSajuV1LocalFrontierJson } from '../src/interpretationPrep/sajuV1LocalFrontier.js'

const root = resolve(new URL('../', import.meta.url).pathname)
const provenance = JSON.parse(fs.readFileSync(resolve(root, 'artifacts/saju-claim-provenance-v0.json'), 'utf8'))
const artifact = JSON.parse(fs.readFileSync(resolve(root, 'artifacts/saju-v1-local-frontier-v0/complete.json'), 'utf8'))

test('Saju v1 local frontier preserves all canonical claims and taxonomy boundaries', () => {
  assert.deepEqual(checkSajuV1LocalFrontier(artifact, provenance), [])
  assert.equal(artifact.claims.length, 43)
  assert.equal(artifact.scope.canonicalOccurrenceCount, 126)
  assert.deepEqual(artifact.taxonomy.distribution, {
    locally_supported: 0,
    partially_supported: 1,
    source_unresolved: 36,
    implementation_policy_only: 2,
    interpretation_noncanonical: 4,
  })
  assert.ok(artifact.claims.every(claim => claim.classicalVerification === 'not_established'))
  assert.ok(artifact.acquisitionPackets.every(packet => packet.locatorStatus === 'not_observed' && packet.sourceBytesObserved === false))
})

test('Saju v1 local frontier materialization is byte-stable and rejects promotion', () => {
  const first = buildArtifact()
  const second = buildArtifact()
  assert.equal(canonicalSajuV1LocalFrontierJson(first), canonicalSajuV1LocalFrontierJson(second))
  const promoted = structuredClone(artifact)
  promoted.claims[0].classicalVerification = 'verified'
  assert.ok(checkSajuV1LocalFrontier(promoted, provenance).includes('claim promotion or taxonomy violation'))
})

test('historical Saju v1 frontier snapshot is accepted without current-HEAD rewriting', () => {
  const output = execFileSync(process.execPath, ['scripts/check-saju-v1-local-frontier-v0.mjs'], { cwd: root, encoding: 'utf8' })
  const result = JSON.parse(output)
  assert.equal(result.status, 'pass')
  assert.equal(result.historicalSnapshotAccepted, true)
  assert.equal(result.claimCount, 43)
})
