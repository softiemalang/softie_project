import test from 'node:test'
import assert from 'node:assert/strict'

import {
  checkSajuGeminiV6ParentAdjudication,
} from '../src/interpretationPrep/sajuGeminiV6ParentAdjudication.js'
import { buildArtifact } from '../scripts/materialize-saju-gemini-v6-parent-adjudication.mjs'
import { checkArtifact } from '../scripts/check-saju-gemini-v6-parent-adjudication.mjs'

const claim = (artifact, claimId) => artifact.claims.find(item => item.claimId === claimId)

test('v6 parent artifact replays with candidate-only boundary and closed readiness', async () => {
  const artifact = await buildArtifact()
  assert.deepEqual(checkSajuGeminiV6ParentAdjudication(artifact), [])
  assert.deepEqual(await checkArtifact(artifact), [])
  assert.equal(artifact.candidatePacket.trustBoundary, 'untrusted_candidate_only')
  assert.equal(artifact.candidatePacket.packetAvailability, 'not_available_in_current_workspace')
  assert.deepEqual(artifact.candidatePacket.importedConclusionFields, [])
  assert.equal(artifact.readiness.availableForInterpretation, false)
  assert.equal(artifact.readiness.semanticAuthority, 'not_established')
  assert.equal(artifact.readiness.productionActivation, 'blocked')
  assert.equal(artifact.promotion.stableClaimPromotionCount, 0)
})

test('Unit A preserves the exact bounded worked-example chains and separates abstract Sanming rule', async () => {
  const artifact = await buildArtifact()
  const female = claim(artifact, 'claim.A.yuanhai-甲子女逆-chain')
  const male = claim(artifact, 'claim.A.yuanhai-乙丑男逆-chain')
  const femalePage = artifact.pageObservations.find(item => item.observationId === 'obs.A.yuanhai-甲子-chain-p51')
  const malePage = artifact.pageObservations.find(item => item.observationId === 'obs.A.yuanhai-乙丑-chain-p51')
  assert.equal(female.status, 'kept')
  assert.equal(male.status, 'kept')
  assert.deepEqual(femalePage.chain, {
    birthCondition: '甲子年; 女命; 初一立春後十日生; 節距九日表記',
    direction: '陰男陽女逆運',
    selectedJie: '初一立春',
    distance: '得九日',
    conversion: '三三單九 (literal variant observed)',
    startAge: '三歲',
    firstDaYun: '乙丑; 逆行',
  })
  assert.deepEqual(malePage.chain, {
    birthCondition: '乙丑年; 男命; 初一立春後十五日生',
    direction: '陰男陽女逆運',
    selectedJie: '初一立春',
    distance: '十五日',
    conversion: '五三十五',
    startAge: '五歲',
    firstDaYun: '丁丑; 逆行',
  })
  assert.equal(claim(artifact, 'claim.A.shenfeng-same-worked-examples').status, 'kept')
  assert.equal(claim(artifact, 'claim.A.same-worked-example-independent-lineage').status, 'rejected')
  assert.equal(claim(artifact, 'claim.A.sanming-abstract-conversion-direction-jie').status, 'corrected')
  assert.equal(claim(artifact, 'claim.A.sanming-literal-restatement-equals-worked-example').status, 'rejected')
})

test('Units B–E preserve conflict, dating, Waseda, and contamination boundaries', async () => {
  const artifact = await buildArtifact()
  assert.equal(claim(artifact, 'claim.B.hukun-1773').status, 'rejected')
  assert.equal(claim(artifact, 'claim.B.hukun-1776').status, 'corrected')
  assert.equal(claim(artifact, 'claim.B.1895-baohui-first-party-item').status, 'unresolved')
  assert.equal(claim(artifact, 'claim.B.1923-yuxin-first-party-item').status, 'unresolved')
  assert.equal(claim(artifact, 'claim.C.gengcun-seal-provenance-candidate').status, 'kept')
  assert.equal(claim(artifact, 'claim.C.gengcun-TAQ-1843').status, 'rejected')
  assert.equal(claim(artifact, 'claim.C.gengcun-TPQ-1578').status, 'rejected')
  assert.equal(claim(artifact, 'claim.D.waseda-official-metadata').status, 'kept')
  assert.equal(claim(artifact, 'claim.D.waseda-seasonal-pages').status, 'kept')
  assert.equal(claim(artifact, 'claim.D.waseda-lineage-narrative').status, 'corrected')
  const contamination = claim(artifact, 'claim.E.gengcun-seasonal-block')
  assert.equal(contamination.status, 'rejected')
  assert.equal(contamination.contaminationClassification, 'CROSS_TEXT_CONTAMINATION')
  assert.ok(artifact.contaminationAudit.removedFromCanonicalGraph.includes(contamination.claimId))
})

test('typed readiness is recomputed unchanged and no independence axis is inflated', async () => {
  const artifact = await buildArtifact()
  assert.deepEqual(artifact.typedReadinessRecalculation.before, artifact.typedReadinessRecalculation.after)
  assert.deepEqual(artifact.typedReadinessRecalculation.changedGateStates, [])
  assert.equal(artifact.typedReadinessRecalculation.baselineClaimCount, 13)
  assert.equal(artifact.typedReadinessRecalculation.stableClaimPromotionCount, 0)
  assert.deepEqual(artifact.typedReadinessRecalculation.promotionReadyClaimIds, [])
  for (const item of artifact.independenceReconciliation.axes) assert.equal(item.countedAsIndependent, false)
  for (const item of artifact.claims) for (const axis of Object.values(item.independence.axes)) assert.equal(axis.countedAsIndependent, false)
})

test('negative checks reject candidate import, canonical admission, stale reintroduction, and independence inflation', async () => {
  const base = await buildArtifact()

  const imported = structuredClone(base)
  imported.candidatePacket.importedConclusionFields = ['claim.A.yuanhai-甲子女逆-chain']
  assert.ok(checkSajuGeminiV6ParentAdjudication(imported).includes('candidate_conclusions_imported'))

  const canonical = structuredClone(base)
  canonical.pageObservations[0].canonicalTextObserved = true
  assert.ok(checkSajuGeminiV6ParentAdjudication(canonical).some(error => error.includes('canonical_text_observed')))

  const stale = structuredClone(base)
  stale.candidatePacket.staleParentRejectedClaimsReintroduced = true
  assert.ok(checkSajuGeminiV6ParentAdjudication(stale).includes('stale_parent_reintroduction'))

  const independent = structuredClone(base)
  independent.claims[0].independence.axes['edition/textual-lineage'].countedAsIndependent = true
  assert.ok(checkSajuGeminiV6ParentAdjudication(independent).some(error => error.includes('counted_as_independent')))
})
