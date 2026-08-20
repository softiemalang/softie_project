import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import test from 'node:test'

import {
  P0_FIELDS,
  checkSajuMingliYueyanFirstPartyInspection,
} from '../src/interpretationPrep/sajuMingliYueyanFirstPartyInspection.js'
import {
  ARTIFACT_PATH,
  INTEGRITY_PATH,
  PREDECESSOR_PATHS,
  ROOT,
  SCHEMA,
  VERSION,
} from '../scripts/materialize-saju-mingli-yueyan-first-party-inspection-v0.mjs'
import {
  assertStoredArtifactReference,
  readHistoricalJson,
  verifyHistoricalSnapshot,
} from './helpers/sajuHistoricalSnapshot.mjs'

test('命理約言 historical snapshot replays stored identity and blocked target-page payload', async () => {
  const { artifact } = await verifyHistoricalSnapshot({
    root: ROOT,
    artifactPath: ARTIFACT_PATH,
    integrityPath: INTEGRITY_PATH,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-mingli-yueyan-first-party-inspection-v0.mjs',
    materializerVersion: VERSION,
    predecessorPaths: PREDECESSOR_PATHS,
  })
  assert.deepEqual(checkSajuMingliYueyanFirstPartyInspection(artifact), [])

  const parent = await readHistoricalJson(ROOT, PREDECESSOR_PATHS[0])
  assertStoredArtifactReference(artifact.sourceClaimReconciliation.parentArtifact, parent, {
    artifactPath: PREDECESSOR_PATHS[0],
  })
  assert.equal(artifact.sourceClaimReconciliation.parentArtifact.unchanged, true)
  assert.equal(artifact.sourceClaimReconciliation.statusMutation, false)
  assert.equal(artifact.summary.firstPartyItemIdentityConfirmed, true)
  assert.equal(artifact.summary.firstPartyTargetPageObtained, false)
  assert.equal(artifact.summary.directTargetPageObservationCount, 0)
  assert.equal(artifact.summary.directTimingObservationCount, 0)
  assert.equal(artifact.summary.unresolvedP0FieldCount, P0_FIELDS.length)
  assert.ok(artifact.targetPageReconciliation.fields.every(field => field.status === 'unresolved_target_page_access_blocked'))
  assert.equal(artifact.promotion.stableClaimPromotionCount, 0)
  assert.equal(artifact.readiness.availableForInterpretation, false)
  assert.equal(artifact.readiness.productionActivation, 'blocked')

  const output = execFileSync(process.execPath, [
    'scripts/check-saju-mingli-yueyan-first-party-inspection-v0.mjs',
    '--historical',
  ], { cwd: ROOT, encoding: 'utf8' })
  const report = JSON.parse(output)
  assert.equal(report.status, 'pass')
  assert.equal(report.historicalSnapshotMode, true)
  assert.equal(report.firstPartyItemIdentityConfirmed, true)
  assert.equal(report.firstPartyTargetPageObtained, false)
  assert.equal(report.unresolvedP0FieldCount, P0_FIELDS.length)
})
