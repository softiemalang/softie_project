import test from 'node:test'
import assert from 'node:assert/strict'

import {
  checkSajuGeminiWitnessDossierAdjudication,
} from '../src/interpretationPrep/sajuGeminiWitnessDossierAdjudication.js'
import { buildArtifact } from '../scripts/materialize-saju-gemini-witness-dossier-adjudication-v1.mjs'

test('parent adjudication keeps the candidate packet untrusted and promotion closed', async () => {
  const artifact = await buildArtifact()
  assert.deepEqual(checkSajuGeminiWitnessDossierAdjudication(artifact), [])
  assert.equal(artifact.candidatePacket.trustBoundary, 'untrusted_candidate_only')
  assert.equal(artifact.candidatePacket.importedAsCanonicalEvidence, false)
  assert.deepEqual(artifact.promotion.promotionReadyClaimIds, [])
  assert.equal(artifact.readinessOverlay.parentVerified.availableForInterpretation, false)
  assert.equal(artifact.readinessOverlay.parentVerified.semanticAuthority, 'not_established')
  assert.equal(artifact.readinessOverlay.parentVerified.productionActivation, 'blocked')
  assert.equal(artifact.readinessOverlay.parentVerified.implementationSafeGrounding, 'not_established')
  assert.equal(artifact.summary.statusCounts.supported, 5)
  assert.equal(artifact.summary.statusCounts.partially_supported, 1)
  assert.equal(artifact.summary.statusCounts.unresolved, 11)
  assert.equal(artifact.summary.statusCounts.unsupported, 6)
})

test('A, B, C, and Waseda boundaries retain the exact blockers', async () => {
  const artifact = await buildArtifact()
  const claim = id => artifact.claims.find(item => item.claimId === id)
  assert.equal(claim('claim.unit-a.ncl-record-identity').status, 'supported')
  assert.equal(claim('claim.unit-a.ncl-target-folios-and-passages').status, 'unresolved')
  assert.equal(claim('claim.unit-b.two-independent-pre-1926-witnesses').status, 'unsupported')
  assert.equal(claim('claim.unit-c.complete-worked-example').status, 'unresolved')
  assert.equal(claim('claim.unit-d.implementation-safe-conversion').status, 'unsupported')
  assert.equal(claim('claim.unit-f.seasonal-headings').status, 'supported')
  assert.equal(claim('claim.unit-f.preface-date').status, 'unresolved')
  assert.equal(claim('claim.unit-f.current-copy-date').status, 'unsupported')
  assert.ok(claim('claim.unit-a.ncl-target-folios-and-passages').blockerAssessment.realBlockers.some(item => item.blockerId === 'blocker.ncl.gengcun.target-folio-bytes'))
  assert.ok(claim('claim.unit-b.1895-baohuicaotang-witness').blockerAssessment.realBlockers.some(item => item.blockerId === 'blocker.ziping.pre-1926.first-party-records'))
})

test('negative checks reject candidate promotion and independence inflation', async () => {
  const artifact = await buildArtifact()
  artifact.claims.find(claim => claim.claimId === 'claim.unit-c.complete-worked-example').promotion.ready = true
  assert.ok(checkSajuGeminiWitnessDossierAdjudication(artifact).includes('claim:claim.unit-c.complete-worked-example:promotion_not_blocked'))

  const clean = await buildArtifact()
  clean.claims.find(claim => claim.claimId === 'claim.unit-f.seasonal-headings').independence['digital-derivation'].countedAsIndependent = true
  assert.ok(checkSajuGeminiWitnessDossierAdjudication(clean).includes('claim:claim.unit-f.seasonal-headings:axis:digital-derivation:counted_as_independent'))
})
