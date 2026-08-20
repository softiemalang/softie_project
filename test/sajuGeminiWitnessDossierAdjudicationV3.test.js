import test from 'node:test'
import assert from 'node:assert/strict'

import {
  CANDIDATE_PACKET_FILES,
  checkSajuGeminiWitnessDossierAdjudicationV3,
} from '../src/interpretationPrep/sajuGeminiWitnessDossierAdjudicationV3.js'
import { SOURCE_CATEGORIES } from '../src/interpretationPrep/sajuGeminiWitnessDossierAdjudicationV2.js'
import { buildArtifact } from '../scripts/materialize-saju-gemini-witness-dossier-adjudication-v3.mjs'

const claim = (artifact, claimId) => artifact.claims.find(item => item.claimId === claimId)

test('v3 identifies the actual packet bytes without importing packet conclusions', async () => {
  const artifact = await buildArtifact()
  assert.deepEqual(checkSajuGeminiWitnessDossierAdjudicationV3(artifact), [])
  assert.equal(artifact.candidatePacket.campaign, 'LUNA-P0-EVIDENCE-ACQUISITION-V3')
  assert.equal(artifact.candidatePacket.modelClaimedByUser, 'Gemini 3.7 Flash High v3')
  assert.equal(artifact.candidatePacket.trustBoundary, 'untrusted_candidate_only')
  assert.equal(artifact.candidatePacket.actualModelRuntimeVerified, false)
  assert.deepEqual(artifact.candidatePacket.packetFiles, CANDIDATE_PACKET_FILES)
  assert.deepEqual(artifact.scope.sourceCategories, SOURCE_CATEGORIES)
  assert.deepEqual(artifact.readinessOverlay.parentVerified.promotionReadyClaimIds, [])
  assert.equal(artifact.readinessOverlay.parentVerified.availableForInterpretation, false)
  assert.equal(artifact.readinessOverlay.parentVerified.semanticAuthority, 'not_established')
  assert.equal(artifact.readinessOverlay.parentVerified.productionActivation, 'blocked')
})

test('Unit A records leaf/layout structure and preserves the observed wording difference', async () => {
  const artifact = await buildArtifact()
  assert.equal(claim(artifact, 'claim.A.second-physical-scan-not-textual-independence').status, 'partially_supported')
  assert.equal(claim(artifact, 'claim.A.sonkeikaku-34-volume-witness').status, 'unresolved')
  const comparison = artifact.pageObservations.find(item => item.observationId === 'obs.A.leaf-level-layout-and-text-variation')
  assert.equal(comparison.layoutObservation.nlcDerivative.pageModel, 'photographic two-page spreads with central gutter')
  assert.equal(comparison.boundedTextVariants[0].jangseogak, '二十九日申時立春')
  assert.equal(comparison.boundedTextVariants[0].nlcDerivative, '二十九日立春')
  assert.equal(comparison.canonicalTextObserved, false)
})

test('Units C–E retain the first-party, date, and runtime boundaries', async () => {
  const artifact = await buildArtifact()
  assert.equal(claim(artifact, 'claim.C.shanghai-1052-first-party-record').status, 'unresolved')
  assert.equal(claim(artifact, 'claim.C.1895-item-level-witness').status, 'unresolved')
  assert.equal(claim(artifact, 'claim.D.preface-date').status, 'unresolved')
  assert.equal(claim(artifact, 'claim.E.princeton-1937-direct-witness').status, 'unresolved')
  assert.equal(claim(artifact, 'claim.E.gemini-all-units-resolved').status, 'unsupported')
  const search = artifact.externalEvidence.find(item => item.evidenceId === 'ev.C.shanghai-v3-bounded-official-search')
  assert.equal(search.queries[0].resultCount, 5)
  assert.equal(search.queries[1].resultCount, 0)
  const opening = artifact.pageObservations.find(item => item.observationId === 'obs.D.waseda-opening-pages-v3')
  assert.deepEqual(opening.renderedPages, [1, 2, 3, 4, 5])
})

test('negative checks reject packet identity drift, canonical admission, independence inflation, and promotion', async () => {
  const base = await buildArtifact()

  const packet = structuredClone(base)
  packet.candidatePacket.packetFiles[0].byteSha256 = '0'.repeat(64)
  assert.ok(checkSajuGeminiWitnessDossierAdjudicationV3(packet).includes('candidate_file_identity:packet'))

  const canonical = structuredClone(base)
  canonical.pageObservations.find(item => item.observationId === 'obs.A.leaf-level-layout-and-text-variation').canonicalTextObserved = true
  assert.ok(checkSajuGeminiWitnessDossierAdjudicationV3(canonical).includes('observation:obs.A.leaf-level-layout-and-text-variation:canonical_text_observed'))

  const independent = structuredClone(base)
  independent.claims.find(item => item.claimId === 'claim.A.second-physical-scan-not-textual-independence').independence['physical-item'].countedAsIndependent = true
  assert.ok(checkSajuGeminiWitnessDossierAdjudicationV3(independent).includes('claim:claim.A.second-physical-scan-not-textual-independence:axis:physical-item:counted_as_independent'))

  const promoted = structuredClone(base)
  promoted.claims.find(item => item.claimId === 'claim.A.sonkeikaku-34-volume-witness').promotion.ready = true
  assert.ok(checkSajuGeminiWitnessDossierAdjudicationV3(promoted).includes('claim:claim.A.sonkeikaku-34-volume-witness:promotion_not_blocked'))
})
