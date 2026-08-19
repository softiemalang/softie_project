import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import test from 'node:test'

import {
  checkSajuFiveClassicsClaimAdjudication,
} from '../src/interpretationPrep/sajuFiveClassicsClaimAdjudication.js'
import {
  ARTIFACT_PATH,
  INTEGRITY_PATH,
  SCHEMA,
  VERSION,
} from '../scripts/materialize-saju-five-classics-claim-adjudication-v0.mjs'
import {
  assertStoredArtifactReference,
  readHistoricalJson,
  verifyHistoricalSnapshot,
} from './helpers/sajuHistoricalSnapshot.mjs'

const SOURCE_FRONTIER_PATH = 'artifacts/saju-five-classics-source-identity-frontier-v0/complete.json'
const ROOT = resolve(new URL('../', import.meta.url).pathname)

test('Five Classics claim adjudication historical snapshot replays stored hashes and promotion block', async () => {
  const { artifact } = await verifyHistoricalSnapshot({
    root: ROOT,
    artifactPath: ARTIFACT_PATH,
    integrityPath: INTEGRITY_PATH,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-five-classics-claim-adjudication-v0.mjs',
    materializerVersion: VERSION,
  })
  const sourceFrontier = await readHistoricalJson(ROOT, SOURCE_FRONTIER_PATH)

  assert.deepEqual(checkSajuFiveClassicsClaimAdjudication(artifact, { sourceFrontier }), [])
  assertStoredArtifactReference(artifact.sourceFrontier, sourceFrontier, {
    artifactPath: SOURCE_FRONTIER_PATH,
  })
  assert.equal(artifact.claims.length, 7)
  assert.equal(artifact.externalRecordObservations.length, 2)
  assert.equal(artifact.readiness.availableForInterpretation, false)
  assert.equal(artifact.readiness.productionActivation, 'blocked')
  assert.equal(artifact.readiness.semanticAuthority, 'not_established')
  assert.equal(artifact.readiness.stableClaimPromotionCount, 0)
  assert.deepEqual(artifact.adjudicationSummary.promotionReadyClaimIds, [])

  const output = execFileSync(process.execPath, [
    'scripts/check-saju-five-classics-claim-adjudication-v0.mjs',
    '--historical',
  ], { cwd: ROOT, encoding: 'utf8' })
  const report = JSON.parse(output)
  assert.equal(report.status, 'pass')
  assert.equal(report.historicalSnapshotMode, true)
  assert.equal(report.claimCount, 7)
  assert.equal(report.externalRecordCount, 2)
  assert.equal(report.readiness.availableForInterpretation, false)
  assert.deepEqual(report.adjudicationSummary.promotionReadyClaimIds, [])
})
