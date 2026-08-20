import test from 'node:test'
import assert from 'node:assert/strict'

import {
  checkSajuLunaP0EvidenceAcquisitionV2,
} from '../src/interpretationPrep/sajuLunaP0EvidenceAcquisitionV2.js'
import { buildArtifact } from '../scripts/materialize-saju-luna-p0-evidence-acquisition-v2.mjs'

const claim = (artifact, claimId) => artifact.claims.find(item => item.claimId === claimId)

test('v2 keeps the candidate packet untrusted and readiness closed', async () => {
  const artifact = await buildArtifact()
  assert.deepEqual(checkSajuLunaP0EvidenceAcquisitionV2(artifact), [])
  assert.equal(artifact.candidatePacket.trustBoundary, 'untrusted_candidate_only')
  assert.equal(artifact.candidatePacket.importedAsCanonicalEvidence, false)
  assert.deepEqual(artifact.readinessOverlay.parentVerified.promotionReadyClaimIds, [])
  assert.equal(artifact.readinessOverlay.parentVerified.stableClaimPromotionCount, 0)
  assert.equal(artifact.readinessOverlay.parentVerified.availableForInterpretation, false)
  assert.equal(artifact.readinessOverlay.parentVerified.semanticAuthority, 'not_established')
  assert.equal(artifact.readinessOverlay.parentVerified.implementationSafeGrounding, 'not_established')
  assert.equal(artifact.readinessOverlay.parentVerified.productionActivation, 'blocked')
  assert.equal(artifact.promotion.status, 'blocked')
})

test('A and B preserve corrected page and volume boundaries', async () => {
  const artifact = await buildArtifact()
  assert.equal(claim(artifact, 'claim.P0-A.target-passages-corrected-locators').status, 'partially_supported')
  assert.equal(claim(artifact, 'claim.P0-A.candidate-locator-accuracy').status, 'unsupported')
  assert.equal(claim(artifact, 'claim.P0-A.pre-1776-early-witness').status, 'unsupported')
  assert.equal(claim(artifact, 'claim.P0-B.candidate-114453-vol33-route').status, 'unsupported')
  assert.equal(claim(artifact, 'claim.P0-B.corrected-vol33-heading-and-section').status, 'partially_supported')
  assert.equal(claim(artifact, 'claim.P0-B.six-stage-chain').status, 'partially_supported')
  assert.equal(claim(artifact, 'claim.P0-B.worked-example').status, 'partially_supported')
  assert.equal(claim(artifact, 'claim.P0-B.implementation-safe-conversion').status, 'unsupported')
  const chain = artifact.pageObservations.find(item => item.observationId === 'obs.P0-B.six-stage-chain')
  assert.equal(chain.sourceLayer, 'DIRECT_DERIVATIVE_SCAN')
  assert.equal(chain.contiguous, true)
  assert.equal(chain.verbatimFragments.length, 6)
  assert.ok(chain.verbatimFragments.every(item => item.arithmeticRestatement))
})

test('C, D, and E keep metadata, date, and independence separate', async () => {
  const artifact = await buildArtifact()
  assert.equal(claim(artifact, 'claim.P0-C.1895-baohuicaotang-witness').status, 'unresolved')
  assert.equal(claim(artifact, 'claim.P0-C.1923-yuxin-witness').status, 'unresolved')
  assert.equal(claim(artifact, 'claim.P0-C.two-independent-pre1926-witnesses').status, 'unsupported')
  assert.equal(claim(artifact, 'claim.P0-D.seasonal-headings').status, 'supported')
  assert.equal(claim(artifact, 'claim.P0-D.preface-date').status, 'unresolved')
  assert.equal(claim(artifact, 'claim.P0-D.current-copy-date').status, 'unsupported')
  assert.equal(claim(artifact, 'claim.P0-E.princeton-official-record').status, 'supported')
  assert.equal(claim(artifact, 'claim.P0-E.reprint-lineage').status, 'unresolved')
  assert.equal(claim(artifact, 'claim.P0-E.negative-independence-from-access-absence').status, 'unsupported')
})

test('negative checks reject canonical-text, independence, and promotion inflation', async () => {
  const candidateImport = structuredClone(await buildArtifact())
  candidateImport.candidatePacket.importedAsCanonicalEvidence = true
  assert.ok(checkSajuLunaP0EvidenceAcquisitionV2(candidateImport).includes('candidate_import_boundary'))

  const canonicalText = structuredClone(await buildArtifact())
  canonicalText.externalEvidence.find(item => item.evidenceId === 'ev.nlc.b.vol4-derivative-scan').canonicalTextAdmitted = true
  assert.ok(checkSajuLunaP0EvidenceAcquisitionV2(canonicalText).includes('evidence:ev.nlc.b.vol4-derivative-scan:canonical_text_admitted'))

  const independent = structuredClone(await buildArtifact())
  independent.claims.find(item => item.claimId === 'claim.P0-B.six-stage-chain').independence['digital-derivation'].countedAsIndependent = true
  assert.ok(checkSajuLunaP0EvidenceAcquisitionV2(independent).includes('claim:claim.P0-B.six-stage-chain:axis:digital-derivation:counted_as_independent'))

  const promoted = structuredClone(await buildArtifact())
  promoted.claims.find(item => item.claimId === 'claim.P0-B.worked-example').promotion.ready = true
  assert.ok(checkSajuLunaP0EvidenceAcquisitionV2(promoted).includes('claim:claim.P0-B.worked-example:promotion_not_blocked'))
})
