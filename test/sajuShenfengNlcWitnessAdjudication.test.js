import test from 'node:test'
import assert from 'node:assert/strict'

import {
  checkSajuShenfengNlcWitnessAdjudication,
} from '../src/interpretationPrep/sajuShenfengNlcWitnessAdjudication.js'
import { buildArtifact } from '../scripts/materialize-saju-shenfeng-nlc-witness-adjudication-v0.mjs'
import { checkArtifact } from '../scripts/check-saju-shenfeng-nlc-witness-adjudication-v0.mjs'
import { runNegativeChecks } from '../scripts/check-saju-shenfeng-nlc-witness-adjudication-negative-v0.mjs'

const witness = (artifact, witnessId) => artifact.witnesses.find(item => item.witnessId === witnessId)

test('NLC 神峰 successor replays and preserves blocked readiness', async () => {
  const artifact = await buildArtifact()
  assert.deepEqual(checkSajuShenfengNlcWitnessAdjudication(artifact), [])
  assert.deepEqual(await checkArtifact(artifact), [])
  assert.equal(artifact.summary.canonicalShenfengMaleFirstDaYunLiteral, '五歲運逆行')
  assert.equal(artifact.summary.canonicalShenfengMaleFollowingBranch, null)
  assert.equal(artifact.readiness.availableForInterpretation, false)
  assert.equal(artifact.readiness.productionActivation, 'blocked')
  assert.equal(artifact.readiness.semanticAuthority, 'not_established')
  assert.equal(artifact.promotion.stableClaimPromotionCount, 0)
})

test('1926 and 1929 target pages are item-specific and preserve literal variants', async () => {
  const artifact = await buildArtifact()
  const nlc1926 = witness(artifact, 'nlc-1926-12jh004266')
  const nlc1926Separate = witness(artifact, 'nlc-1926-13jh001619')
  const nlc1929 = witness(artifact, 'nlc-1929-027032013020556-v2')

  assert.equal(nlc1926.itemIdentity.fid, '12jh004266')
  assert.equal(nlc1926.itemIdentity.bid, '48929.0')
  assert.equal(nlc1926.pageAudit.actualPdfPage, 21)
  assert.equal(nlc1926.pageAudit.printedFolio, '二〇')
  assert.equal(nlc1926.pageAudit.maleExample.firstDaYunLiteral, '五歲運逆行')
  assert.equal(nlc1926.pageAudit.maleExample.followingBranch.value, null)
  assert.match(nlc1926.pageAudit.femaleExample.visibleText, /立春止。得九日三三單九。三歲運逆行。餘倣此。/)

  assert.equal(nlc1926Separate.itemIdentity.fid, '13jh001619')
  assert.equal(nlc1926Separate.pageAudit.targetPageStatus, 'not_admitted_at_inspected_locator')

  assert.equal(nlc1929.itemIdentity.fid, '027032013020556')
  assert.equal(nlc1929.itemIdentity.bid, '10361.0')
  assert.equal(nlc1929.pageAudit.actualPdfPage, 22)
  assert.equal(nlc1929.pageAudit.printedFolio, '二〇')
  assert.equal(nlc1929.pageAudit.maleExample.firstDaYunLiteral, '五歲運逆行')
  assert.doesNotMatch(nlc1929.pageAudit.femaleExample.visibleText, /立春止。/)
  assert.match(nlc1929.pageAudit.femaleExample.visibleText, /立春。得九日三三單九。三歲運逆行。餘倣此。/)

  assert.deepEqual(artifact.variantRelation.pageSpecificDifference.femaleDistanceClause, {
    'nlc-1926-12jh004266': '逆數至初一日立春止。',
    'nlc-1929-027032013020556-v2': '逆數至初一日立春。',
  })
  assert.equal(artifact.comparisonOnly.observedLiteral, '五三十五。五歲運逆行丁丑。')
  assert.equal(artifact.independenceReconciliation.overallState, 'unresolved')
  assert.equal(artifact.independenceReconciliation.canonicalEdges.length, 0)
})

test('parent conflict is superseded without rewriting the historical parent', async () => {
  const artifact = await buildArtifact()
  assert.equal(artifact.supersedingEvidence.predecessorArtifact.parentArtifactPreserved, true)
  assert.equal(artifact.predecessor.mutation, 'none')
  assert.equal(artifact.supersedingEvidence.decision, 'corrected_at_source_specific_literal_and_locator_scope')
  assert.equal(artifact.supersedingEvidence.canonicalShenfengRule.includes('五歲運逆行 with no appended 丁丑'), true)
  assert.deepEqual(artifact.blockers, [
    'physical_copy_or_catalogue_call_number_not_obtained_for_each_NLC_record',
    'original_title_page_colophon_and_imprint_not_page-inspected_for_the_target_copies',
    'NLC_reader_or_reproduction_permission_for_copy-level_collation_not_closed',
    'edition_and_textual_lineage_between_1926_and_1929_not_established',
  ])
})

test('unsafe literal, identity, lineage, readiness, and parent mutations reject', async () => {
  const results = await runNegativeChecks()
  assert.equal(results.length, 7)
  assert.ok(results.every(result => result.rejected), JSON.stringify(results))
})
