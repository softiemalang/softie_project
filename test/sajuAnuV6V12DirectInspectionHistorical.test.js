import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import test from 'node:test'

import { checkSajuAnuV6V12DirectInspection } from '../src/interpretationPrep/sajuAnuV6V12DirectInspection.js'
import {
  HISTORICAL_CHECKER_PATH,
  checkHistoricalArtifact,
} from '../scripts/check-saju-anu-v6-v12-direct-inspection-v0-historical.mjs'
import {
  ARTIFACT_PATH,
  INTEGRITY_PATH,
  PREDECESSOR_PATHS,
  ROOT,
  SCHEMA,
  VERSION,
} from '../scripts/materialize-saju-anu-v6-v12-direct-inspection-v0.mjs'
import {
  assertStoredArtifactReference,
  readHistoricalJson,
  verifyHistoricalSnapshot,
} from './helpers/sajuHistoricalSnapshot.mjs'

test('ANU v6-v12 historical snapshot replays stored identity and blocked semantic payload', async () => {
  const { artifact } = await verifyHistoricalSnapshot({
    root: ROOT,
    artifactPath: ARTIFACT_PATH,
    integrityPath: INTEGRITY_PATH,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-anu-v6-v12-direct-inspection-v0.mjs',
    materializerVersion: VERSION,
    predecessorPaths: PREDECESSOR_PATHS,
  })
  assert.deepEqual(checkSajuAnuV6V12DirectInspection(artifact), [])

  const parent = await readHistoricalJson(ROOT, PREDECESSOR_PATHS[0])
  assertStoredArtifactReference(artifact.sourceClaimReconciliation.parentArtifact, parent, {
    artifactPath: PREDECESSOR_PATHS[0],
  })
  assert.equal(artifact.sourceClaimReconciliation.parentArtifact.unchanged, true)
  assert.equal(artifact.sourceClaimReconciliation.statusMutation, false)
  assert.equal(artifact.typedReadinessRecalculation.sourceArtifact, PREDECESSOR_PATHS[1])
  assert.equal(artifact.typedReadinessRecalculation.availableForInterpretation, false)
  assert.equal(artifact.typedReadinessRecalculation.productionActivation, 'blocked')
  assert.equal(artifact.typedReadinessRecalculation.stableClaimPromotionCount, 0)
  assert.equal(artifact.promotion.stableClaimPromotionCount, 0)
  assert.equal(artifact.readiness.availableForInterpretation, false)

  const result = await checkHistoricalArtifact(artifact)
  assert.deepEqual(result.errors, [])
  assert.equal(result.historicalReplay, true)
  assert.equal(result.artifactSidecar.status, 'pass')
  for (const predecessorPath of PREDECESSOR_PATHS) {
    assert.equal(result.predecessors[predecessorPath].status, 'pass')
    assert.equal(result.predecessors[predecessorPath].historicalSnapshotMode, true)
  }
  const output = execFileSync(process.execPath, [
    HISTORICAL_CHECKER_PATH,
  ], { cwd: ROOT, encoding: 'utf8' })
  const report = JSON.parse(output)
  assert.equal(report.status, 'pass')
  assert.equal(report.mode, 'historical')
  assert.equal(report.historicalSnapshotMode, true)
  assert.equal(report.historicalReplay, true)
  assert.equal(report.externalPdfRead, false)
  assert.equal(report.externalCandidateRead, false)
  assert.equal(report.directVolumeCount, 7)
  assert.equal(report.directTimingObservationCount, 2)
  assert.equal(report.readiness.availableForInterpretation, false)
})

test('ANU v6-v12 historical verification rejects predecessor identity drift', async () => {
  const artifact = await readHistoricalJson(ROOT, ARTIFACT_PATH)
  artifact.sourceClaimReconciliation.parentArtifact.artifactPayloadSha256 = '0'.repeat(64)
  const result = await checkHistoricalArtifact(artifact)
  assert.ok(result.errors.includes('candidate_file_mismatch'))
  assert.ok(result.errors.includes(`predecessor:predecessor_identity:${PREDECESSOR_PATHS[0]}`))
  assert.ok(result.errors.includes('historical_replay_content'))
})
