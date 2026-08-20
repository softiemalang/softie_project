import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'

import {
  HISTORICAL_CHECKER_PATH,
  checkHistoricalArtifact,
} from '../scripts/check-saju-luna-deep-collation-adjudication-v4-historical.mjs'
import {
  ARTIFACT_PATH,
  PREDECESSOR_PATHS,
} from '../scripts/materialize-saju-luna-deep-collation-adjudication-v4.mjs'
import { verifyIntegritySidecar } from '../scripts/check-saju-five-classics-typed-readiness-contract-v0-historical.mjs'

const readJson = async filePath => JSON.parse(await readFile(filePath, 'utf8'))

test('Luna v4 historical replay preserves the stored snapshot and all six predecessor identities', async () => {
  const artifact = await readJson(ARTIFACT_PATH)
  const result = await checkHistoricalArtifact(artifact)
  assert.deepEqual(result.errors, [])
  assert.equal(result.historicalReplay, true)
  assert.equal(result.artifactSidecar.status, 'pass')
  for (const predecessorPath of PREDECESSOR_PATHS) {
    assert.equal(result.predecessors[predecessorPath].status, 'pass')
    assert.equal(result.predecessors[predecessorPath].historicalSnapshotMode, true)
  }
  assert.equal(result.predecessors['artifacts/saju-gemini-witness-dossier-adjudication-v1/complete.json'].historicalReplay, true)
  assert.equal(result.predecessors['artifacts/saju-gemini-witness-dossier-adjudication-v2/complete.json'].historicalReplay, true)
  assert.equal(result.predecessors['artifacts/saju-gemini-witness-dossier-adjudication-v3/complete.json'].historicalReplay, true)
  assert.equal(result.predecessors['artifacts/saju-five-classics-typed-readiness-contract-v0/complete.json'].historicalReplay, true)
  assert.equal(artifact.candidatePacket.trustBoundary, 'untrusted_candidate_only')
  assert.equal(artifact.readinessOverlay.parentVerified.availableForInterpretation, false)
  assert.equal(artifact.readinessOverlay.parentVerified.semanticAuthority, 'not_established')
  assert.equal(artifact.readinessOverlay.parentVerified.productionActivation, 'blocked')
  assert.deepEqual(artifact.readinessOverlay.parentVerified.promotionReadyClaimIds, [])
  assert.equal(artifact.promotion.canonicalEditionDeclared, false)
})

test('Luna v4 historical verification rejects snapshot and predecessor sidecar tampering', async () => {
  const artifactBytes = await readFile(ARTIFACT_PATH)
  const artifactIntegrity = await readJson(`${ARTIFACT_PATH}.integrity.json`)
  const artifactErrors = verifyIntegritySidecar({
    artifactPath: ARTIFACT_PATH,
    bytes: artifactBytes,
    integrity: { ...artifactIntegrity, artifactByteSha256: '0'.repeat(64) },
  })
  assert.ok(artifactErrors.includes(`integrity_artifact_byte_sha256:${ARTIFACT_PATH}`))

  for (const predecessorPath of PREDECESSOR_PATHS) {
    const predecessorBytes = await readFile(predecessorPath)
    const predecessorIntegrity = await readJson(`${predecessorPath}.integrity.json`)
    const predecessorErrors = verifyIntegritySidecar({
      artifactPath: predecessorPath,
      bytes: predecessorBytes,
      integrity: { ...predecessorIntegrity, artifactByteSha256: '0'.repeat(64) },
    })
    assert.ok(predecessorErrors.includes(`integrity_artifact_byte_sha256:${predecessorPath}`))
  }
})

test('Luna v4 historical verification rejects a predecessor identity drift', async () => {
  const artifact = await readJson(ARTIFACT_PATH)
  artifact.predecessorReferences[PREDECESSOR_PATHS[4]].artifactPayloadSha256 = '0'.repeat(64)
  const result = await checkHistoricalArtifact(artifact)
  assert.ok(result.errors.includes('candidate_file_mismatch'))
  assert.ok(result.errors.includes(`predecessor_identity:${PREDECESSOR_PATHS[4]}`))
  assert.ok(result.errors.includes('historical_replay_content'))
})

test('Luna v4 historical checker reports replay without external PDF or candidate packet access', () => {
  const output = execFileSync(process.execPath, [HISTORICAL_CHECKER_PATH], { encoding: 'utf8' })
  const result = JSON.parse(output)
  assert.equal(result.status, 'pass')
  assert.equal(result.mode, 'historical')
  assert.equal(result.historicalSnapshotMode, true)
  assert.equal(result.historicalReplay, true)
  assert.equal(result.externalPdfRead, false)
  assert.equal(result.externalCandidateRead, false)
  assert.deepEqual(result.errors, [])
})
