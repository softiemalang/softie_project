import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  checkSajuFiveClassicsTypedReadinessContract,
} from '../src/interpretationPrep/sajuFiveClassicsTypedReadinessContract.js'
import {
  buildArtifact,
} from '../scripts/materialize-saju-five-classics-typed-readiness-contract-v0.mjs'

const researchContinuation = JSON.parse(await readFile('artifacts/saju-five-classics-research-continuation-v1/complete.json', 'utf8'))

test('typed readiness dry-run classifies all 13 claims without promotion', async () => {
  const artifact = await buildArtifact()
  assert.deepEqual(checkSajuFiveClassicsTypedReadinessContract(artifact, { researchContinuation }), [])
  assert.equal(artifact.claims.length, 13)
  assert.equal(artifact.readiness.availableForInterpretation, false)
  assert.equal(artifact.readiness.productionActivation, 'blocked')
  assert.equal(artifact.readiness.semanticAuthority, 'not_established')
  assert.deepEqual(artifact.readiness.promotionReadyClaimIds, [])
  assert.equal(artifact.summary.claimTypeCounts.bibliographic_editorial, 1)
  assert.equal(artifact.summary.claimTypeCounts.historical_textual, 1)
  assert.equal(artifact.summary.claimTypeCounts.local_source_derived, 1)
  assert.equal(artifact.summary.claimTypeCounts.cross_lineage_semantic, 3)
  assert.equal(artifact.summary.claimTypeCounts.implementation_grounding, 7)
  assert.equal(artifact.summary.promotionNearClaimIds.length, 11)
  assert.equal(artifact.externalEvidenceRequirements.length, 14)
  assert.equal(artifact.ziweiImpactAnalysis.onlyAnalysis, true)
  assert.equal(artifact.ziweiImpactAnalysis.productionChanged, false)
  assert.equal(artifact.ziweiImpactAnalysis.readinessRecomputed, false)
  assert.equal(artifact.ziweiImpactAnalysis.authorityChanged, false)

  for (const claim of artifact.claims.filter(item => item.promotionNear)) {
    assert.ok(claim.externalEvidencePlan.length > 0)
    assert.deepEqual(
      claim.externalEvidencePlan.map(item => item.requirementId).sort(),
      [...claim.externalEvidenceRequirementIds].sort(),
    )
    for (const plan of claim.externalEvidencePlan) {
      assert.equal(plan.currentState.status, 'blocked')
      assert.equal(plan.currentState.claimType, claim.claimType)
      assert.equal(plan.currentState.currentStabilityLevel, claim.currentStabilityLevel)
      assert.equal(plan.currentState.promotionTarget, claim.promotionTarget)
      assert.deepEqual([...plan.currentState.missingEdges].sort(), [...claim.promotion.blockingEdges].sort())
    }
  }

  const editorial = artifact.claims.find(claim => claim.claimId === 'claim.yuanhai-editorial-responsibility')
  assert.equal(editorial.gates.L.requirement, 'not_applicable')
  assert.equal(editorial.gates.L.notApplicableProof.proofType, 'claim_scope_exclusion')
  assert.equal(editorial.gates.S.requirement, 'not_applicable')
  assert.equal(editorial.gates.I.state, 'unresolved')

  const xiangshen = artifact.claims.find(claim => claim.claimId === 'claim.ziping-xiangshen')
  assert.equal(xiangshen.gates.S.state, 'conflicted')
  assert.equal(xiangshen.gates.P.state, 'conflicted')
  assert.equal(xiangshen.promotion.status, 'blocked')
  const xiangshenCauseRequirement = artifact.externalEvidenceRequirements.find(item => item.requirementId === 'external.ziping-xiangshen-conflict-cause')
  assert.ok(xiangshenCauseRequirement.exactAcquisition.some(item => /NLC 35296 p\.39/.test(item)))
  assert.ok(xiangshenCauseRequirement.acceptanceCriteria.some(item => /phrase presence alone/.test(item)))
  const xiangshenIndependentRequirement = artifact.externalEvidenceRequirements.find(item => item.requirementId === 'external.ziping-xiangshen-independent-witness')
  assert.ok(xiangshenIndependentRequirement.exactAcquisition.some(item => /耕寸集/.test(item)))
  assert.ok(xiangshenIndependentRequirement.acceptanceCriteria.some(item => /not promoted to independent textual witnesses/.test(item)))

  for (const claim of artifact.claims) {
    assert.equal(claim.promotion.ready, false)
    assert.equal(claim.promotion.status, 'blocked')
    assert.equal(claim.stabilityAssessment.implementationSafeGrounding, 'not_established')
    assert.ok(Array.isArray(claim.blockerAssessment.falseBlockers))
    assert.ok(Array.isArray(claim.blockerAssessment.realBlockers))
  }
})

test('negative checks reject a missing required gate', async () => {
  const artifact = await buildArtifact()
  delete artifact.claims.find(claim => claim.claimId === 'claim.ziping-yongshin').gates.H
  const errors = checkSajuFiveClassicsTypedReadinessContract(artifact, { researchContinuation })
  assert.ok(errors.includes('claim:claim.ziping-yongshin:gate:H:missing'))
})

test('negative checks reject a missing promotion-near external evidence plan', async () => {
  const artifact = await buildArtifact()
  const claim = artifact.claims.find(item => item.claimId === 'claim.ziping-xingyun')
  delete claim.externalEvidencePlan
  const errors = checkSajuFiveClassicsTypedReadinessContract(artifact, { researchContinuation })
  assert.ok(errors.includes(`external_plan_required:${claim.claimId}`))
})

test('negative checks reject an unsupported not_applicable override', async () => {
  const artifact = await buildArtifact()
  const claim = artifact.claims.find(item => item.claimId === 'claim.ziping-yongshin')
  claim.gates.L.requirement = 'not_applicable'
  delete claim.gates.L.notApplicableProof
  const errors = checkSajuFiveClassicsTypedReadinessContract(artifact, { researchContinuation })
  assert.ok(errors.includes('claim:claim.ziping-yongshin:gate:L:na_proof_required'))
})

test('negative checks reject same-lineage evidence counted as independent', async () => {
  const artifact = await buildArtifact()
  const claim = artifact.claims.find(item => item.claimId === 'claim.ziping-yongshin')
  for (const source of [claim.gates.I.axes, claim.independence.axes]) {
    source['semantic-corroboration'].countedAsIndependent = true
    source['semantic-corroboration'].state = 'satisfied'
    source['semantic-corroboration'].missingEdges = []
  }
  const errors = checkSajuFiveClassicsTypedReadinessContract(artifact, { researchContinuation })
  assert.ok(errors.includes('claim:claim.ziping-yongshin:axis:semantic-corroboration:same_lineage_counted_as_independent'))
})

test('negative checks reject lower-level stability promoted to implementation authority', async () => {
  const artifact = await buildArtifact()
  const claim = artifact.claims.find(item => item.claimId === 'claim.sanming-dayun-distance-conversion')
  claim.stabilityAssessment.implementationSafeGrounding = 'satisfied'
  const errors = checkSajuFiveClassicsTypedReadinessContract(artifact, { researchContinuation })
  assert.ok(errors.includes(`lower_stability_promoted:${claim.claimId}`))
})

test('negative checks reject promotion across a scoped semantic conflict', async () => {
  const artifact = await buildArtifact()
  const claim = artifact.claims.find(item => item.claimId === 'claim.ziping-xiangshen')
  claim.gates.S.state = 'satisfied'
  claim.gates.S.missingEdges = []
  const errors = checkSajuFiveClassicsTypedReadinessContract(artifact, { researchContinuation })
  assert.ok(errors.includes(`semantic_conflict_gate_missing:${claim.claimId}`))
})
