import test from 'node:test'
import assert from 'node:assert/strict'

import {
  SOURCE_CATEGORIES,
  checkSajuGeminiWitnessDossierAdjudicationV2,
} from '../src/interpretationPrep/sajuGeminiWitnessDossierAdjudicationV2.js'
import { buildArtifact } from '../scripts/materialize-saju-gemini-witness-dossier-adjudication-v2.mjs'

const claim = (artifact, claimId) => artifact.claims.find(item => item.claimId === claimId)

test('v2 keeps the Gemini packet untrusted and all promotion closed', async () => {
  const artifact = await buildArtifact()
  assert.deepEqual(checkSajuGeminiWitnessDossierAdjudicationV2(artifact), [])
  assert.equal(artifact.candidatePacket.modelClaimedByUser, 'Gemini 3.7 Flash High v3')
  assert.equal(artifact.candidatePacket.trustBoundary, 'untrusted_candidate_only')
  assert.equal(artifact.candidatePacket.importedAsCanonicalEvidence, false)
  assert.deepEqual(artifact.scope.sourceCategories, SOURCE_CATEGORIES)
  assert.deepEqual(artifact.readinessOverlay.parentVerified.promotionReadyClaimIds, [])
  assert.equal(artifact.readinessOverlay.parentVerified.stableClaimPromotionCount, 0)
  assert.equal(artifact.readinessOverlay.parentVerified.availableForInterpretation, false)
  assert.equal(artifact.readinessOverlay.parentVerified.semanticAuthority, 'not_established')
  assert.equal(artifact.readinessOverlay.parentVerified.implementationSafeGrounding, 'not_established')
  assert.equal(artifact.readinessOverlay.parentVerified.productionActivation, 'blocked')
})

test('Unit A records the corrected NLC volume and separates physical from textual independence', async () => {
  const artifact = await buildArtifact()
  assert.equal(claim(artifact, 'claim.A.jangseogak-vol33-target-passage').status, 'partially_supported')
  assert.equal(claim(artifact, 'claim.A.nlc-vol4-route-correction').status, 'supported')
  assert.equal(claim(artifact, 'claim.A.second-physical-scan-not-textual-independence').status, 'partially_supported')
  assert.equal(claim(artifact, 'claim.A.kyujanggak-vol33-scan-access').status, 'unresolved')
  const comparison = artifact.pageObservations.find(item => item.observationId === 'obs.A.cross-scan-bounded-comparison')
  assert.equal(comparison.independenceAssessment.editionTextualLineage, 'unresolved')
  assert.equal(comparison.textVariant, undefined)
  const nlc = artifact.externalEvidence.find(item => item.evidenceId === 'ev.A.nlc-vol4-derivative-scan')
  assert.equal(nlc.physicalVolume, '第4卷; Commons description: 卷25–33')
})

test('Units B–D preserve provenance, bibliography, and date boundaries', async () => {
  const artifact = await buildArtifact()
  assert.equal(claim(artifact, 'claim.B.gengcun-seal-provenance-candidate').status, 'partially_supported')
  assert.equal(claim(artifact, 'claim.B.taq-1843-from-seal').status, 'unsupported')
  assert.equal(claim(artifact, 'claim.C.1895-bibliographic-witness-only').status, 'supported')
  assert.equal(claim(artifact, 'claim.C.1895-item-level-witness').status, 'unresolved')
  assert.equal(claim(artifact, 'claim.C.1923-item-level-witness').status, 'unresolved')
  assert.equal(claim(artifact, 'claim.C.two-dated-witnesses-establish-two-lineages').status, 'unsupported')
  assert.equal(claim(artifact, 'claim.D.waseda-seasonal-headings').status, 'supported')
  assert.equal(claim(artifact, 'claim.D.preface-date').status, 'unresolved')
  assert.equal(claim(artifact, 'claim.D.current-copy-1886').status, 'unsupported')
})

test('negative checks reject source-category drift, canonical admission, independence inflation, and promotion', async () => {
  const category = structuredClone(await buildArtifact())
  category.externalEvidence[0].sourceCategory = 'DIRECT_OFFICIAL_RECORD'
  assert.ok(checkSajuGeminiWitnessDossierAdjudicationV2(category).includes('evidence:ev.A.jangseogak-record:source_category'))

  const canonical = structuredClone(await buildArtifact())
  canonical.externalEvidence.find(item => item.evidenceId === 'ev.A.nlc-vol4-derivative-scan').canonicalTextAdmitted = true
  assert.ok(checkSajuGeminiWitnessDossierAdjudicationV2(canonical).includes('evidence:ev.A.nlc-vol4-derivative-scan:canonical_text_admitted'))

  const independent = structuredClone(await buildArtifact())
  independent.claims.find(item => item.claimId === 'claim.A.second-physical-scan-not-textual-independence').independence['physical-item'].countedAsIndependent = true
  assert.ok(checkSajuGeminiWitnessDossierAdjudicationV2(independent).includes('claim:claim.A.second-physical-scan-not-textual-independence:axis:physical-item:counted_as_independent'))

  const promoted = structuredClone(await buildArtifact())
  promoted.claims.find(item => item.claimId === 'claim.A.jangseogak-vol33-target-passage').promotion.ready = true
  assert.ok(checkSajuGeminiWitnessDossierAdjudicationV2(promoted).includes('claim:claim.A.jangseogak-vol33-target-passage:promotion_not_blocked'))
})
