import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'

import {
  HISTORICAL_CHECKER_PATH,
  RESEARCH_ARTIFACT_PATH,
  checkHistoricalArtifact,
  verifyIntegritySidecar,
} from '../scripts/check-saju-five-classics-typed-readiness-contract-v0-historical.mjs'
import { ARTIFACT_PATH } from '../scripts/materialize-saju-five-classics-typed-readiness-contract-v0.mjs'

const readJson = async path => JSON.parse(await readFile(path, 'utf8'))

test('typed readiness historical replay ignores current-head drift and preserves blocked state', async () => {
  const artifact = await readJson(ARTIFACT_PATH)
  const result = await checkHistoricalArtifact(artifact)
  assert.deepEqual(result.errors, [])
  assert.equal(result.historicalReplay, true)
  assert.equal(result.artifactSidecar.status, 'pass')
  assert.equal(result.researchArtifact.status, 'pass')
  assert.equal(result.researchArtifact.historicalReplay, true)
  assert.ok(result.predecessorSidecars.length >= 3)
  assert.ok(result.predecessorSidecars.every(entry => entry.status === 'pass'))
  assert.equal(artifact.readiness.availableForInterpretation, false)
  assert.equal(artifact.readiness.productionActivation, 'blocked')
  assert.equal(artifact.readiness.semanticAuthority, 'not_established')
  assert.deepEqual(artifact.readiness.promotionReadyClaimIds, [])
})

test('typed readiness historical verification rejects typed and predecessor sidecar tampering', async () => {
  const artifactBytes = await readFile(ARTIFACT_PATH)
  const artifactIntegrity = await readJson(`${ARTIFACT_PATH}.integrity.json`)
  const artifactErrors = verifyIntegritySidecar({
    artifactPath: ARTIFACT_PATH,
    bytes: artifactBytes,
    integrity: { ...artifactIntegrity, artifactByteSha256: '0'.repeat(64) },
  })
  assert.ok(artifactErrors.includes(`integrity_artifact_byte_sha256:${ARTIFACT_PATH}`))

  const predecessorBytes = await readFile(RESEARCH_ARTIFACT_PATH)
  const predecessorIntegrity = await readJson(`${RESEARCH_ARTIFACT_PATH}.integrity.json`)
  const predecessorErrors = verifyIntegritySidecar({
    artifactPath: RESEARCH_ARTIFACT_PATH,
    bytes: predecessorBytes,
    integrity: { ...predecessorIntegrity, artifactByteSha256: '0'.repeat(64) },
  })
  assert.ok(predecessorErrors.includes(`integrity_artifact_byte_sha256:${RESEARCH_ARTIFACT_PATH}`))
})

test('typed readiness historical verification rejects predecessor identity drift', async () => {
  const artifact = await readJson(ARTIFACT_PATH)
  artifact.predecessor.contentSha256 = '0'.repeat(64)
  const result = await checkHistoricalArtifact(artifact)
  assert.ok(result.errors.includes('candidate_file_mismatch'))
  assert.ok(result.errors.includes('predecessor_identity'))
  assert.ok(result.errors.includes('historical_replay_content'))
})

test('typed readiness historical checker CLI reports replay without external PDF access', () => {
  const output = execFileSync(process.execPath, [HISTORICAL_CHECKER_PATH], { encoding: 'utf8' })
  const result = JSON.parse(output)
  assert.equal(result.status, 'pass')
  assert.equal(result.mode, 'historical')
  assert.equal(result.historicalSnapshotMode, true)
  assert.equal(result.historicalReplay, true)
  assert.equal(result.externalPdfRead, false)
  assert.equal(result.errors.length, 0)
})
