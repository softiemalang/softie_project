import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import test from 'node:test'

import { checkSajuTimingAuthorityFrontier } from '../src/interpretationPrep/sajuTimingAuthorityFrontier.js'
import {
  ARTIFACT_PATH,
  INTEGRITY_PATH,
} from '../scripts/materialize-saju-timing-authority-frontier-v0.mjs'
import {
  verifyHistoricalSnapshot,
} from './helpers/sajuHistoricalSnapshot.mjs'

const SCHEMA = 'saju-timing-authority-frontier-v0'
const VERSION = '0.1.0'
const PREDECESSOR_PATH = 'artifacts/saju-five-classics-grounding-v0/complete.json'
const ROOT = resolve(new URL('../', import.meta.url).pathname)

test('Saju timing authority frontier historical snapshot replays stored hashes and blocked frontier payload', async () => {
  const { artifact } = await verifyHistoricalSnapshot({
    root: ROOT,
    artifactPath: ARTIFACT_PATH,
    integrityPath: INTEGRITY_PATH,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-timing-authority-frontier-v0.mjs',
    materializerVersion: VERSION,
    predecessorPaths: [PREDECESSOR_PATH],
  })

  assert.deepEqual(checkSajuTimingAuthorityFrontier(artifact), [])
  assert.equal(artifact.frontiers.length, 4)
  assert.equal(artifact.sources.length, 13)
  assert.equal(artifact.observations.length, 20)
  assert.equal(artifact.claims.length, 15)
  assert.equal(artifact.blockers.length, 8)
  assert.equal(artifact.readiness.availableForInterpretation, false)
  assert.equal(artifact.frontierConclusion.activationAllowed, false)
  assert.equal(artifact.scope.historicalArtifactRewrite, false)
  assert.equal(artifact.scope.readinessMutation, false)
  assert.equal(artifact.scope.claimPromotion, false)
  assert.equal(artifact.scope.localArtifactByteIdentitiesReused, true)

  const output = execFileSync(process.execPath, [
    'scripts/check-saju-timing-authority-frontier-v0.mjs',
    '--historical',
  ], { cwd: ROOT, encoding: 'utf8' })
  const report = JSON.parse(output)
  assert.equal(report.status, 'pass')
  assert.equal(report.historicalSnapshotMode, true)
  assert.equal(report.sourceCount, 13)
  assert.equal(report.observationCount, 20)
  assert.equal(report.claimCount, 15)
  assert.equal(report.blockerCount, 8)
  assert.equal(report.readiness.availableForInterpretation, false)
})
