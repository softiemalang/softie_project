import test from 'node:test'
import assert from 'node:assert/strict'

import {
  checkSajuGeminiV7ParentAdjudication,
} from '../src/interpretationPrep/sajuGeminiV7ParentAdjudication.js'
import { buildArtifact } from '../scripts/materialize-saju-gemini-v7-parent-adjudication.mjs'
import { checkArtifact } from '../scripts/check-saju-gemini-v7-parent-adjudication.mjs'
import { runNegativeChecks } from '../scripts/check-saju-gemini-v7-parent-adjudication-negative-v0.mjs'

const claim = (artifact, claimId) => artifact.claims.find(item => item.claimId === claimId)
const observation = (artifact, observationId) => artifact.pageObservations.find(item => item.observationId === observationId)

test('v7 parent artifact replays with candidate-only boundary and closed readiness', async () => {
  const artifact = await buildArtifact()
  assert.deepEqual(checkSajuGeminiV7ParentAdjudication(artifact), [])
  assert.deepEqual(await checkArtifact(artifact), [])
  assert.equal(artifact.candidatePacket.trustBoundary, 'untrusted_candidate_only')
  assert.equal(artifact.candidatePacket.importedAsCanonicalEvidence, false)
  assert.deepEqual(artifact.candidatePacket.importedConclusionFields, [])
  assert.equal(artifact.readiness.availableForInterpretation, false)
  assert.equal(artifact.readiness.productionActivation, 'blocked')
  assert.equal(artifact.promotion.stableClaimPromotionCount, 0)
})

test('Unit A preserves source-specific 大運 chains, Shenfeng context, and literal boundaries', async () => {
  const artifact = await buildArtifact()
  assert.deepEqual(observation(artifact, 'obs.A.nlc99036-乙丑男-p51').chain, {
    birthCondition: '乙丑年; 男命; 初一立春後十五日生',
    direction: '陰男陽女逆運',
    selectedJie: '初一立春',
    distance: '十五日',
    conversion: '五三十五',
    startAge: '五歲',
    firstDaYun: '丁丑; 逆行',
  })
  assert.deepEqual(observation(artifact, 'obs.A.nlc99036-甲子女-p51').chain, {
    birthCondition: '甲子年; 女命; 初一立春後十日生; 節距九日表記',
    direction: '陰男陽女逆運',
    selectedJie: '初一立春',
    distance: '得九日',
    conversion: '三三單九 (literal variant observed)',
    startAge: '三歲',
    firstDaYun: '乙丑; 逆行',
  })
  const shenfeng = observation(artifact, 'obs.A.shenfeng-page22-layout')
  assert.deepEqual(shenfeng.targetExampleOrder, ['乙丑男', '甲子女'])
  assert.deepEqual(shenfeng.exactVariantObservations, ['五三十五', '三三單九', '餘皆倣此'])
  assert.equal(shenfeng.omissionAddition.notNormalizedAgainstNlc, true)
  assert.equal(claim(artifact, 'claim.A.shenfeng-standard-fixture').status, 'rejected')
  assert.equal(claim(artifact, 'claim.A.same-worked-example-independent-corroboration').status, 'rejected')
  assert.equal(claim(artifact, 'claim.A.sanming-rule-family').status, 'corrected')
  assert.equal(claim(artifact, 'claim.A.sanming-literal-one-day-four-month').status, 'corrected')
  assert.equal(claim(artifact, 'claim.A.sanming-literal-time-unit-ten-day').status, 'unresolved')
  assert.equal(claim(artifact, 'claim.A.wuxingjingji-same-procedure-auto-merge').status, 'rejected')
})

test('Units B–F keep metadata, dating, Waseda, candidate, and edition boundaries typed', async () => {
  const artifact = await buildArtifact()
  assert.equal(claim(artifact, 'claim.B.anu-42211-item-identity').status, 'rejected')
  assert.equal(claim(artifact, 'claim.B.anu-206524-item-identity').status, 'kept')
  assert.equal(claim(artifact, 'claim.B.anu-12juan-metadata').status, 'kept')
  assert.equal(claim(artifact, 'claim.B.anu-current-original-v1-v12').status, 'kept')
  assert.equal(claim(artifact, 'claim.B.anu-catalog-extent-to-public-count').status, 'rejected')
  assert.equal(artifact.metadataRegressionAudit.currentFirstParty.currentApiPdfCount, 12)
  assert.deepEqual(artifact.metadataRegressionAudit.baseline.parentConfirmedPublicPdfNames, [
    'b22343921_v.1.pdf', 'b22343921_v.2.pdf', 'b22343921_v.3.pdf', 'b22343921_v.4.pdf', 'b22343921_v.5.pdf',
  ])
  assert.equal(artifact.metadataRegressionAudit.disposition.publicVolumeContentAndPrintedFolioCrosswalk, 'unresolved')

  assert.equal(claim(artifact, 'claim.C.gengcun-seal-provenance-candidate').status, 'kept')
  assert.equal(claim(artifact, 'claim.C.gengcun-seal-owner-equals-dating').status, 'corrected')
  assert.equal(claim(artifact, 'claim.C.gengcun-TAQ-1843').status, 'rejected')
  assert.equal(claim(artifact, 'claim.C.gengcun-TPQ-1578').status, 'rejected')
  assert.equal(claim(artifact, 'claim.C.gengcun-dating-gate').status, 'unresolved')

  assert.equal(claim(artifact, 'claim.D.waseda-direct-record').status, 'kept')
  assert.equal(claim(artifact, 'claim.D.waseda-seasonal-pages').status, 'kept')
  assert.equal(claim(artifact, 'claim.D.waseda-cover-to-physical-date').status, 'rejected')
  assert.equal(claim(artifact, 'claim.D.full-genealogy-directly-supported').status, 'corrected')
  assert.equal(claim(artifact, 'claim.E.mingli-yueyan-direct-observation').status, 'unresolved')
  assert.equal(artifact.newCandidateAudit.status, 'P0_acquisition_lead_only')
  assert.equal(artifact.newCandidateAudit.firstPartyInstitutionalItemAndActualPage, false)

  assert.equal(claim(artifact, 'claim.F.1895-baohui-first-party-item').status, 'unresolved')
  assert.equal(claim(artifact, 'claim.F.1923-yuxin-first-party-item').status, 'unresolved')
  assert.equal(claim(artifact, 'claim.F.hukun-1773').status, 'rejected')
  assert.equal(claim(artifact, 'claim.F.hukun-1776-first-party').status, 'unresolved')
  assert.equal(claim(artifact, 'claim.F.hukun-1776-secondary-reading').status, 'corrected')
})

test('lineage decontamination and typed readiness do not promote independence', async () => {
  const artifact = await buildArtifact()
  assert.equal(artifact.lineageGraph.canonicalEdges.length, 0)
  assert.equal(artifact.lineageGraph.edges.length, 7)
  for (const item of artifact.lineageGraph.edges) assert.equal(item.canonicalGraphIncluded, false)
  assert.deepEqual(artifact.typedReadinessRecalculation.before, artifact.typedReadinessRecalculation.after)
  assert.deepEqual(artifact.typedReadinessRecalculation.changedGateStates, [])
  assert.equal(artifact.typedReadinessRecalculation.baselineClaimCount, 13)
  assert.equal(artifact.typedReadinessRecalculation.stableClaimPromotionCount, 0)
  assert.deepEqual(artifact.typedReadinessRecalculation.promotionReadyClaimIds, [])
  for (const item of artifact.independenceReconciliation.axes) assert.equal(item.countedAsIndependent, false)
  for (const item of artifact.claims) for (const axis of Object.values(item.independence.axes)) assert.equal(axis.countedAsIndependent, false)
})

test('all required negative checks reject unsafe v7 promotions', async () => {
  const results = await runNegativeChecks()
  assert.equal(results.length, 10)
  assert.ok(results.every(result => result.rejected), JSON.stringify(results))
})
