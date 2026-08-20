import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import test from 'node:test'

import {
  P0_FIELDS,
  checkSajuMingliYueyanDirectWitnessAdjudication,
} from '../src/interpretationPrep/sajuMingliYueyanDirectWitnessAdjudicationV1.js'
import {
  ARTIFACT_PATH,
  INTEGRITY_PATH,
  PREDECESSOR_PATHS,
  ROOT,
  SCHEMA,
  VERSION,
} from '../scripts/materialize-saju-mingli-yueyan-direct-witness-adjudication-v1.mjs'
import {
  assertStoredArtifactReference,
  readHistoricalJson,
  verifyHistoricalSnapshot,
} from './helpers/sajuHistoricalSnapshot.mjs'

test('Mingli direct witness v1 historical snapshot preserves predecessor and bounded blocker payload', async () => {
  const { artifact } = await verifyHistoricalSnapshot({
    root: ROOT,
    artifactPath: ARTIFACT_PATH,
    integrityPath: INTEGRITY_PATH,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-mingli-yueyan-direct-witness-adjudication-v1.mjs',
    materializerVersion: VERSION,
    predecessorPaths: PREDECESSOR_PATHS,
  })
  assert.deepEqual(checkSajuMingliYueyanDirectWitnessAdjudication(artifact), [])

  const predecessor = await readHistoricalJson(ROOT, PREDECESSOR_PATHS[0])
  const parent = await readHistoricalJson(ROOT, PREDECESSOR_PATHS[1])
  assertStoredArtifactReference(artifact.predecessor, predecessor, { artifactPath: PREDECESSOR_PATHS[0] })
  assertStoredArtifactReference(artifact.sourceClaimReconciliation.parentArtifact, parent, { artifactPath: PREDECESSOR_PATHS[1] })
  assert.equal(artifact.predecessor.preserved, true)
  assert.equal(artifact.sourceClaimReconciliation.statusMutation, false)
  assert.equal(artifact.summary.directTargetPageObservationCount, 3)
  assert.equal(artifact.summary.directlyObservedP0FieldCount, 4)
  assert.equal(artifact.summary.completeP0FieldClosureCount, 0)
  assert.equal(artifact.summary.unresolvedP0FieldCount, P0_FIELDS.length)
  assert.equal(artifact.summary.promotionCount, 0)
  assert.equal(artifact.readiness.availableForInterpretation, false)
  assert.equal(artifact.readiness.productionActivation, 'blocked')

  const output = execFileSync(process.execPath, [
    'scripts/check-saju-mingli-yueyan-direct-witness-adjudication-v1.mjs',
    '--historical',
  ], { cwd: ROOT, encoding: 'utf8' })
  const report = JSON.parse(output)
  assert.equal(report.status, 'pass')
  assert.equal(report.historicalSnapshotMode, true)
  assert.equal(report.directTargetPageObservationCount, 3)
  assert.equal(report.directlyObservedP0FieldCount, 4)
  assert.equal(report.completeP0FieldClosureCount, 0)
  assert.equal(report.unresolvedP0FieldCount, P0_FIELDS.length)
})
