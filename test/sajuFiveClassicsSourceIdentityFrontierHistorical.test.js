import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import test from 'node:test'

import { checkArtifact as checkSourceArtifact } from '../scripts/check-saju-five-classics-source-identity-frontier-v0.mjs'
import {
  ARTIFACT_PATH,
  SCHEMA,
  VERSION,
} from '../scripts/materialize-saju-five-classics-source-identity-frontier-v0.mjs'
import {
  SAJU_FIVE_CLASSICS_SOURCE_IDENTITY_SCHEMA,
  SAJU_FIVE_CLASSICS_SOURCE_IDENTITY_VERSION,
  checkSajuFiveClassicsSourceIdentityFrontier,
} from '../src/interpretationPrep/sajuFiveClassicsSourceIdentityFrontier.js'
import { verifyHistoricalSnapshot } from './helpers/sajuHistoricalSnapshot.mjs'

const ROOT = resolve(new URL('../', import.meta.url).pathname)
const CHECKER_PATH = 'scripts/check-saju-five-classics-source-identity-frontier-v0.mjs'

test('Five Classics source identity historical snapshot replays without external PDFs', async () => {
  const { artifact, integrity } = await verifyHistoricalSnapshot({
    root: ROOT,
    artifactPath: ARTIFACT_PATH,
    artifactId: SCHEMA,
    materializerPath: 'scripts/materialize-saju-five-classics-source-identity-frontier-v0.mjs',
    materializerVersion: VERSION,
    predecessorPaths: [
      'artifacts/saju-five-classics-grounding-v0/complete.json',
      'artifacts/saju-local-source-corpus-observation-v1/complete.json',
    ],
  })

  assert.deepEqual(checkSajuFiveClassicsSourceIdentityFrontier(artifact), [])
  assert.equal(artifact.schemaVersion, SAJU_FIVE_CLASSICS_SOURCE_IDENTITY_SCHEMA)
  assert.equal(artifact.version, SAJU_FIVE_CLASSICS_SOURCE_IDENTITY_VERSION)
  assert.equal(artifact.localCorpus.documents.length, 5)
  assert.equal(artifact.readiness.availableForInterpretation, false)
  assert.equal(artifact.readiness.productionActivation, 'blocked')
  assert.equal(artifact.readiness.semanticAuthority, 'not_established')
  assert.equal(artifact.readiness.stableClaimPromotionCount, 0)
  assert.equal(artifact.frontierConclusion.claimStatus, 'not_promoted')
  assert.equal(artifact.frontierConclusion.activationAllowed, false)
  assert.equal(integrity.artifactByteSha256.length, 64)

  const historicalErrors = await checkSourceArtifact(artifact, {
    historical: true,
    sourceRoot: '/private/tmp/saju-five-classics-source-profile-fixture-is-required',
  })
  assert.deepEqual(historicalErrors, [])

  const output = execFileSync(process.execPath, [CHECKER_PATH, '--historical'], {
    cwd: ROOT,
    encoding: 'utf8',
  })
  const report = JSON.parse(output)
  assert.equal(report.status, 'pass')
  assert.equal(report.historicalSnapshotMode, true)
  assert.equal(report.sourceProfile, false)
  assert.equal(report.externalPdfRead, false)
  assert.equal(report.sourceBytesReverified, false)
  assert.equal(report.sourceBytesRequiredForCurrentReplay, true)
  assert.equal(report.workCount, 5)
  assert.equal(report.sourceCount, 30)
  assert.equal(report.pageObservationCount, 144)
  assert.equal(report.blockerCount, 7)
  assert.equal(report.readiness.availableForInterpretation, false)
})
