import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'

import { canonicalIdentityJson } from '../src/artifactIdentity.js'
import {
  checkSajuShenfengNlcWitnessBackMatterAdjudication,
} from '../src/interpretationPrep/sajuShenfengNlcWitnessBackMatterAdjudicationV1.js'
import {
  ARTIFACT_PATH,
  buildArtifact,
} from '../scripts/materialize-saju-shenfeng-nlc-witness-back-matter-adjudication-v1.mjs'
import { checkArtifact } from '../scripts/check-saju-shenfeng-nlc-witness-back-matter-adjudication-v1.mjs'

test('Shenfeng back-matter successor records new pages without closing blockers', async () => {
  const artifact = await buildArtifact()
  assert.deepEqual(checkSajuShenfengNlcWitnessBackMatterAdjudication(artifact), [])
  assert.equal(artifact.newEvidence.directObservationCount, 2)
  assert.equal(artifact.summary.rawPdfIdentityVerifiedCount, 2)
  assert.equal(artifact.summary.blockerReductionCount, 0)
  assert.equal(artifact.summary.promotionCount, 0)
  assert.equal(artifact.newEvidence.observations[0].officialPdf.pdfPage, 166)
  assert.equal(artifact.newEvidence.observations[1].officialPdf.pdfPage, 167)
  assert.equal(artifact.newEvidence.observations[1].observedMarks[0], '上海图书馆藏书')
  assert.equal(artifact.readiness.availableForInterpretation, false)
  assert.equal(artifact.readiness.semanticAuthority, 'not_established')
  assert.equal(artifact.readiness.productionActivation, 'blocked')
  assert.deepEqual(artifact.lineageGraph.canonicalEdges, [])
})

test('Shenfeng back-matter materialization is deterministic and rejects promotion shortcuts', async () => {
  const first = await buildArtifact()
  const second = await buildArtifact()
  assert.equal(canonicalIdentityJson(first), canonicalIdentityJson(second))
  const negative = spawnSync(process.execPath, ['scripts/check-saju-shenfeng-nlc-witness-back-matter-adjudication-negative-v1.mjs'], { encoding: 'utf8' })
  assert.equal(negative.status, 0, negative.stderr || negative.stdout)
  const report = JSON.parse(negative.stdout)
  assert.equal(report.status, 'pass')
  assert.equal(report.requiredCount, 6)
  assert.equal(report.rejectedCount, 6)
})

test('stored Shenfeng back-matter successor preserves its v0 predecessor in historical mode', async () => {
  const artifact = JSON.parse(await readFile(ARTIFACT_PATH, 'utf8'))
  assert.deepEqual(checkSajuShenfengNlcWitnessBackMatterAdjudication(artifact), [])
  assert.deepEqual(await checkArtifact(artifact, { historical: true }), [])
  assert.equal(artifact.predecessor.preserved, true)
  assert.equal(artifact.predecessor.mutation, 'none')
  assert.equal(artifact.blockerReassessment.every(item => item.currentStatus === 'unresolved'), true)
})
