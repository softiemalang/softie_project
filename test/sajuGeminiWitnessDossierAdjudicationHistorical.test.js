import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'

import {
  HISTORICAL_CHECKER_PATH,
  checkHistoricalArtifact,
} from '../scripts/check-saju-gemini-witness-dossier-adjudication-v1-historical.mjs'
import { ARTIFACT_PATH, PREDECESSOR_PATH } from '../scripts/materialize-saju-gemini-witness-dossier-adjudication-v1.mjs'
import { verifyIntegritySidecar } from '../scripts/check-saju-five-classics-typed-readiness-contract-v0-historical.mjs'

const readJson = async path => JSON.parse(await readFile(path, 'utf8'))

test('Dossier v1 historical replay preserves stored bytes and Typed readiness predecessor state', async () => {
  const artifact = await readJson(ARTIFACT_PATH)
  const result = await checkHistoricalArtifact(artifact)
  assert.deepEqual(result.errors, [])
  assert.equal(result.historicalReplay, true)
  assert.equal(result.artifactSidecar.status, 'pass')
  assert.equal(result.typedPredecessor.status, 'pass')
  assert.equal(result.typedPredecessor.historicalReplay, true)
  assert.equal(artifact.candidatePacket.trustBoundary, 'untrusted_candidate_only')
  assert.equal(artifact.readinessOverlay.parentVerified.availableForInterpretation, false)
  assert.equal(artifact.readinessOverlay.parentVerified.semanticAuthority, 'not_established')
  assert.equal(artifact.readinessOverlay.parentVerified.productionActivation, 'blocked')
  assert.deepEqual(artifact.readinessOverlay.parentVerified.promotionReadyClaimIds, [])
})

test('Dossier v1 historical verification rejects Dossier and Typed predecessor sidecar tampering', async () => {
  const artifactBytes = await readFile(ARTIFACT_PATH)
  const artifactIntegrity = await readJson(`${ARTIFACT_PATH}.integrity.json`)
  const artifactErrors = verifyIntegritySidecar({
    artifactPath: ARTIFACT_PATH,
    bytes: artifactBytes,
    integrity: { ...artifactIntegrity, artifactByteSha256: '0'.repeat(64) },
  })
  assert.ok(artifactErrors.includes(`integrity_artifact_byte_sha256:${ARTIFACT_PATH}`))

  const predecessorBytes = await readFile(PREDECESSOR_PATH)
  const predecessorIntegrity = await readJson(`${PREDECESSOR_PATH}.integrity.json`)
  const predecessorErrors = verifyIntegritySidecar({
    artifactPath: PREDECESSOR_PATH,
    bytes: predecessorBytes,
    integrity: { ...predecessorIntegrity, artifactByteSha256: '0'.repeat(64) },
  })
  assert.ok(predecessorErrors.includes(`integrity_artifact_byte_sha256:${PREDECESSOR_PATH}`))
})

test('Dossier v1 historical verification rejects Typed readiness predecessor identity drift', async () => {
  const artifact = await readJson(ARTIFACT_PATH)
  artifact.predecessorReadinessReference.contentSha256 = '0'.repeat(64)
  const result = await checkHistoricalArtifact(artifact)
  assert.ok(result.errors.includes('candidate_file_mismatch'))
  assert.ok(result.errors.includes('predecessor_identity'))
  assert.ok(result.errors.includes('historical_replay_content'))
})

test('Dossier v1 historical checker CLI reports replay without external PDF access', () => {
  const output = execFileSync(process.execPath, [HISTORICAL_CHECKER_PATH], { encoding: 'utf8' })
  const result = JSON.parse(output)
  assert.equal(result.status, 'pass')
  assert.equal(result.mode, 'historical')
  assert.equal(result.historicalSnapshotMode, true)
  assert.equal(result.historicalReplay, true)
  assert.equal(result.externalPdfRead, false)
  assert.equal(result.errors.length, 0)
})
