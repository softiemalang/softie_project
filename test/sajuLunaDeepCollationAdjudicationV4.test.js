import test from 'node:test'
import assert from 'node:assert/strict'

import {
  INDEPENDENCE_AXES,
  VARIANT_ADJUDICATION,
  buildSajuLunaDeepCollationAdjudicationV4,
  checkSajuLunaDeepCollationAdjudicationV4,
} from '../src/interpretationPrep/sajuLunaDeepCollationAdjudicationV4.js'
import {
  buildArtifact,
  verifyCandidatePacketFiles,
} from '../scripts/materialize-saju-luna-deep-collation-adjudication-v4.mjs'

test('v4 direct variant and readiness boundaries are fail-closed', async () => {
  const artifact = await buildArtifact()
  assert.deepEqual(checkSajuLunaDeepCollationAdjudicationV4(artifact), [])
  assert.equal(artifact.candidatePacket.trustBoundary, 'untrusted_candidate_only')
  assert.equal(artifact.candidatePacket.importedAsCanonicalEvidence, false)
  assert.deepEqual(artifact.candidatePacket.importedConclusionFields, [])

  assert.equal(VARIANT_ADJUDICATION.length, 6)
  assert.deepEqual(
    VARIANT_ADJUDICATION.map(item => [item.variantId, item.status]),
    [['VAR-01', 'verified'], ['VAR-02', 'corrected'], ['VAR-03', 'corrected'], ['VAR-04', 'corrected'], ['VAR-05', 'corrected'], ['VAR-06', 'corrected']],
  )
  assert.equal(artifact.variantAdjudication.find(item => item.variantId === 'VAR-01').directReading.nlc, '是月二十九日立春')
  assert.equal(artifact.variantAdjudication.find(item => item.variantId === 'VAR-03').directReading.nlc, '乃是一歲奇九月之大運')
  assert.equal(artifact.variantAdjudication.find(item => item.variantId === 'VAR-04').directReading.nlc, '為四箇月之數')
  assert.equal(artifact.variantAdjudication.find(item => item.variantId === 'VAR-05').directReading.nlc, '一時辰得十日之數')
  assert.match(artifact.variantAdjudication.find(item => item.variantId === 'VAR-06').directReading.nlc, /今人行運多用約法/)

  assert.deepEqual(Object.keys(artifact.independenceAdjudication.after).filter(key => INDEPENDENCE_AXES.includes(key)), INDEPENDENCE_AXES)
  assert.equal(artifact.independenceAdjudication.after['physical-item'].state, 'satisfied')
  assert.equal(artifact.independenceAdjudication.after['digital-derivation'].state, 'satisfied')
  assert.equal(artifact.independenceAdjudication.after['edition/textual-lineage'].state, 'unresolved')
  assert.equal(artifact.independenceAdjudication.after['semantic-corroboration'].state, 'unresolved')
  assert.equal(artifact.independenceAdjudication.after.overall, 'unresolved')
  assert.equal(artifact.independenceAdjudication.after.scopeLimitedCorrespondence.state, 'satisfied')

  assert.deepEqual(artifact.typedReadinessReconciliation.promotionDecision, 'promotion_0_normal')
  assert.equal(artifact.typedReadinessReconciliation.after.availableForInterpretation, false)
  assert.equal(artifact.typedReadinessReconciliation.after.productionActivation, 'blocked')
  assert.equal(artifact.readinessOverlay.parentVerified.stableClaimPromotionCount, 0)
  assert.deepEqual(artifact.readinessOverlay.parentVerified.promotionReadyClaimIds, [])
  assert.equal(artifact.promotion.canonicalEditionDeclared, false)
})

test('v4 candidate packet byte identities are present and unchanged', async () => {
  const result = await verifyCandidatePacketFiles()
  assert.deepEqual(result.errors, [])
  assert.equal(result.observations.length, 4)
})

test('v4 checker rejects candidate import, independence inflation, and readiness promotion', () => {
  const base = buildSajuLunaDeepCollationAdjudicationV4({ basisHead: '0'.repeat(40) })

  const imported = structuredClone(base)
  imported.candidatePacket.importedAsCanonicalEvidence = true
  assert.ok(checkSajuLunaDeepCollationAdjudicationV4(imported).includes('candidate_import_boundary'))

  const inflated = structuredClone(base)
  inflated.independenceAdjudication.after['edition/textual-lineage'].state = 'satisfied'
  assert.ok(checkSajuLunaDeepCollationAdjudicationV4(inflated).includes('independence_boundary'))

  const promoted = structuredClone(base)
  promoted.readinessOverlay.parentVerified.availableForInterpretation = true
  assert.ok(checkSajuLunaDeepCollationAdjudicationV4(promoted).includes('readiness_available'))

  const counted = structuredClone(base)
  counted.claims[0].independence['physical-item'].countedAsIndependent = true
  assert.ok(checkSajuLunaDeepCollationAdjudicationV4(counted).some(error => error.includes('counted_as_independent')))
})
