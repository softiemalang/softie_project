import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'

import {
  SAJU_FIVE_CLASSICS_ADJUDICATION_STATUSES,
  SAJU_FIVE_CLASSICS_CLAIM_ADJUDICATION_SCHEMA,
  SAJU_FIVE_CLASSICS_CLAIM_ADJUDICATION_VERSION,
  SAJU_FIVE_CLASSICS_READINESS_KEYS,
  checkSajuFiveClassicsClaimAdjudication,
} from '../src/interpretationPrep/sajuFiveClassicsClaimAdjudication.js'

const root = resolve(new URL('../', import.meta.url).pathname)
const artifact = JSON.parse(readFileSync(resolve(root, 'artifacts/saju-five-classics-claim-adjudication-v0/complete.json'), 'utf8'))
const sourceFrontier = JSON.parse(readFileSync(resolve(root, 'artifacts/saju-five-classics-source-identity-frontier-v0/complete.json'), 'utf8'))

test('claim adjudication preserves dossier, witness, readiness, and activation boundaries', () => {
  assert.equal(artifact.schemaVersion, SAJU_FIVE_CLASSICS_CLAIM_ADJUDICATION_SCHEMA)
  assert.equal(artifact.version, SAJU_FIVE_CLASSICS_CLAIM_ADJUDICATION_VERSION)
  assert.equal(artifact.claims.length, 7)
  assert.equal(artifact.externalRecordObservations.length, 2)
  assert.equal(artifact.researchDossierBoundary.canonicalImport, false)
  assert.equal(artifact.researchDossierBoundary.independenceImport, false)
  assert.equal(artifact.readiness.availableForInterpretation, false)
  assert.equal(artifact.readiness.productionActivation, 'blocked')
  assert.equal(artifact.readiness.semanticAuthority, 'not_established')
  assert.equal(artifact.readiness.stableClaimPromotionCount, 0)
  assert.deepEqual(checkSajuFiveClassicsClaimAdjudication(artifact, { sourceFrontier }), [])
  assert.ok(artifact.claims.every(claim => SAJU_FIVE_CLASSICS_ADJUDICATION_STATUSES.includes(claim.adjudicationStatus)))
  assert.ok(artifact.claims.every(claim => SAJU_FIVE_CLASSICS_READINESS_KEYS.every(key => typeof claim.readiness[key] === 'boolean')))
  assert.ok(artifact.claims.every(claim => claim.readiness.promotion_ready === false))
  assert.ok(artifact.claims.every(claim => claim.semanticAuthorityStatus === 'not_established'))
})

test('the strongest bounded collations remain explicitly unresolved at lineage or independence gates', () => {
  const yuanhaiResponsibility = artifact.claims.find(claim => claim.claimId === 'claim.yuanhai-editorial-responsibility')
  assert.equal(yuanhaiResponsibility.adjudicationStatus, 'local_lineage_unresolved')
  assert.equal(yuanhaiResponsibility.readiness.edition_collated, true)
  assert.equal(yuanhaiResponsibility.readiness.semantic_equivalence_checked, false)
  assert.equal(yuanhaiResponsibility.witnesses.length, 3)
  assert.deepEqual(yuanhaiResponsibility.sourceFrontierEvidence.pageObservationIds, ['page.tianyige.yuanhai.ming-chongzhen.scan-5007.leaf-3', 'page.commons.yuanhai.ssid-13003376.leaf-3-responsibility', 'page.commons.yuanhai.ssid-13003376.leaf-3-title'])
  assert.match(yuanhaiResponsibility.collation.rawSequence.join(' '), /徐升編.*楊淙增校.*福建余氏鐫梓/)
  assert.match(yuanhaiResponsibility.collation.observedComparison, /SSID-13003376 and Tianyi Pavilion/)

  const zipingYongshin = artifact.claims.find(claim => claim.claimId === 'claim.ziping-yongshin')
  assert.equal(zipingYongshin.readiness.edition_collated, true)
  assert.equal(zipingYongshin.readiness.semantic_equivalence_checked, true)
  assert.equal(zipingYongshin.readiness.local_lineage_resolved, false)
  assert.equal(zipingYongshin.readiness.independence_resolved, false)
  assert.match(zipingYongshin.collation.semanticEquivalenceResult, /semantic authority not established/)

  const zipingXingyun = artifact.claims.find(claim => claim.claimId === 'claim.ziping-xingyun')
  assert.equal(zipingXingyun.adjudicationStatus, 'independence_unresolved')
  assert.equal(zipingXingyun.readiness.edition_collated, true)
  assert.equal(zipingXingyun.readiness.semantic_equivalence_checked, true)
  assert.equal(zipingXingyun.readiness.local_lineage_resolved, false)
  assert.deepEqual(zipingXingyun.sourceFrontierEvidence.pageObservationIds, ['page.local.ziping.p15-xingyun', 'page.commons.nlc.ziping.35296.page-56-dayun', 'page.nlc.ziping.v2.leaf-43-xingyun', 'page.nlc.ziping.v2.leaf-44-xingyun-continuation', 'page.ntl.ziping.v2.leaf-131-xingyun', 'page.ntl.ziping.v2.leaf-132-xingyun-continuation'])
  assert.equal(zipingXingyun.witnesses.length, 4)
  assert.match(zipingXingyun.collation.observedComparison, /NLC 1926 and NTL page pairs agree/)

  const qiongtong = artifact.claims.find(claim => claim.claimId === 'claim.qiongtong-spring-jia-wood')
  assert.equal(qiongtong.readiness.historical_witness_observed, true)
  assert.equal(qiongtong.readiness.independence_resolved, false)
  assert.ok(qiongtong.sourceFrontierEvidence.pageObservationIds.includes('page.waseda.qiongtong.undated.scan-f0111.leaf-9-zhengyue-jia-mu'))
  assert.ok(qiongtong.sourceFrontierEvidence.pageObservationIds.includes('page.waseda.qiongtong.undated.scan-f0111.leaf-10-eryue-jia-mu'))
  assert.ok(qiongtong.sourceFrontierEvidence.pageObservationIds.includes('page.waseda.qiongtong.undated.scan-f0111.leaf-11-sanyue-jia-mu'))
  assert.match(qiongtong.collation.observedComparison, /Waseda leaves 9–11/)

  const xiangshen = artifact.claims.find(claim => claim.claimId === 'claim.ziping-xiangshen')
  assert.equal(xiangshen.adjudicationStatus, 'semantic_conflict')
  assert.equal(xiangshen.readiness.historical_witness_observed, true)
  assert.equal(xiangshen.readiness.edition_collated, true)
  assert.equal(xiangshen.readiness.semantic_equivalence_checked, true)
  assert.equal(xiangshen.researchDossierBoundary.canonicalEvidenceImported, false)
  assert.equal(xiangshen.witnesses.length, 4)
  assert.match(xiangshen.collation.semanticEquivalenceResult, /edition_variant.*semantic equivalence not established/)
  assert.deepEqual(xiangshen.sourceFrontierEvidence.pageObservationIds, ['page.local.ziping.p10-xiangshen', 'page.local.ziping.p11-xiangshen-continuation', 'page.nlc.ziping.v2.leaf-32-xiangshen', 'page.nlc.ziping.v2.leaf-33-xiangshen-continuation', 'page.ntl.ziping.v2.leaf-120-xiangshen', 'page.ntl.ziping.v2.leaf-121-xiangshen-continuation', 'page.commons.nlc.ziping.35296.page-39-xiangshen', 'page.commons.nlc.ziping.35296.page-40-xiangshen-continuation', 'page.commons.nlc.ziping.35296.page-45-next-heading'])
  assert.match(xiangshen.collation.observedComparison, /NLC and NTL agree across the checked continuation/)
  assert.match(xiangshen.collation.observedComparison, /NLC 35296 independently confirms phrase-level presence/)
  assert.deepEqual(xiangshen.collation.witnessScopedObservations.nlc35296.observedPhrases, ['輔我用神者是也', '財旺生官'])
  assert.equal(xiangshen.collation.witnessScopedObservations.nlc35296.roleClauseAfterCaiWangShengGuan.text, null)
  assert.equal(xiangshen.researchDossierBoundary.catalogCandidate.textualWitness, 'unresolved')
  assert.equal(xiangshen.researchDossierBoundary.catalogCandidate.exactDateStatus, 'unresolved_below_清')
  assert.equal(xiangshen.collation.orderingDifferences.length, 1)
})

test('negative checks reject an unverified full NLC 35296 role-clause transcription and conflict promotion', () => {
  const roleOverclaim = structuredClone(artifact)
  roleOverclaim.claims.find(claim => claim.claimId === 'claim.ziping-xiangshen').collation.witnessScopedObservations.nlc35296.roleClauseAfterCaiWangShengGuan.text = '則財為用，官為相'
  assert.ok(checkSajuFiveClassicsClaimAdjudication(roleOverclaim, { sourceFrontier }).includes('xiangshen_role_clause_overclaim'))

  const promotedConflict = structuredClone(artifact)
  const xiangshen = promotedConflict.claims.find(claim => claim.claimId === 'claim.ziping-xiangshen')
  xiangshen.semanticAuthorityStatus = 'established'
  assert.ok(checkSajuFiveClassicsClaimAdjudication(promotedConflict, { sourceFrontier }).includes('xiangshen_conflict_promoted'))
})
